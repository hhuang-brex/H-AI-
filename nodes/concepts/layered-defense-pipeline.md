---
id: layered-defense-pipeline
type: concept
tags: [chatbot, architecture, defense-in-depth, classifier, safety]
related:
  - [[template-rendered-output]]
  - [[forced-tool-call-output]]
  - [[llm-as-judge]]
  - [[escalation-handoff]]
  - [[safety-rails-domain-specific]]
  - [[cost-aware-eval]]
status: living
created: 2026-06-09
---

# Layered-Defense Pipeline

The runtime architecture that makes [template-rendered-output](template-rendered-output.md) reliable in production. Defense in depth for chatbot replies: cheap deterministic gates first, frontier-model classifier in the middle, code-owned rendering, and a heterogeneous-model safety recheck on the highest-risk path.

## The pipeline (Ikki, May 2026)

```
inbound message
     │
     ▼
┌──────────────────────────────────┐
│ 1. Regex acknowledgment gate     │  1ms · catches 15–25% of msgs
│    short "ok" / "merci" / 👍     │  cap ~30 chars (avoid swallowing signals)
└────────────┬─────────────────────┘
             │ no match
             ▼
┌──────────────────────────────────┐
│ 2. Forced tool calling           │  700–1200ms (Sonnet)
│    tool_choice: 'any'            │  classifier picks 1 of 8–12 tools
│    cache_control: ephemeral      │  75–90% prompt-cache hit in steady state
└────────────┬─────────────────────┘
             │ tool selected
             ▼
┌──────────────────────────────────┐
│ 3. Code-owned templates          │  ~0ms · deterministic prose
│    toolName.category.sub_type    │  TemplateNotFound → log + escalate
└────────────┬─────────────────────┘
             │
             ▼     (only if tool was silent_acknowledge)
        ┌────────────────────────────────────┐
        │ 4. Heterogeneous safety recheck    │  300ms (Haiku — different family)
        │    Haiku 4.5 with same input       │  catches 0.5–2% of silent decisions
        │    actionable && conf > 0.6 →      │
        │    override to escalation          │
        └────────────────────────────────────┘
```

## Why each layer is its own layer

| Layer | What it cheap-defends against | Why a later layer can't replace it |
|---|---|---|
| Regex gate | Trivial acks consuming LLM cost | LLM at 700–1200ms is 700× slower for the same answer |
| Forced tool | Free-text generation, almost-right sentences | Schemas in prompt rules leak; only `tool_choice: any` is structural |
| Templates | Hallucinated content inside string fields | A schema can guarantee a field exists; can't guarantee its content |
| Safety recheck (different model) | Confident silent-route mistakes | Same model would re-render the same mistake — that's not a check |

The core insight: **each layer fails in different ways, and combining them combines coverage**. A wrong-tool selection by the Sonnet classifier is *not* corrected by the templates (which trust the choice) — it's caught by the Haiku recheck on the silent path.

## The heterogeneous-model recheck

The most overlooked layer. When the classifier picks `silent_acknowledge`, run a *different* model (Haiku — different family, ~10× cheaper, ~300ms) on the same input asking: "is there an actionable signal here?" If yes with confidence > 0.6, override to escalation.

Why a different model — not multi-vote with the same one:

- **Same model = same blind spots.** Re-rendering with Sonnet just pays twice for the same mistake.
- **Different family = uncorrelated errors.** Haiku misses different things than Sonnet does. Where their failure modes don't overlap, you catch what either alone would miss.
- **Cheap by design.** Recheck only fires on silent paths (~most traffic), and Haiku is ~10× cheaper than Sonnet — the recheck cost is rounding error.

This is distinct from the multi-vote / cascading-judge patterns in [llm-as-judge](llm-as-judge.md) — those reduce *judge* variance on quality scoring. Heterogeneous safety recheck reduces *runtime* variance on a specific high-risk decision (silent vs. escalate).

## Where each layer's cost goes

From Ikki's documented production deployment:

| Layer | Latency | Catches | Cost shape |
|---|---|---|---|
| Regex | 1ms | 15–25% of inbound | Effectively free |
| Sonnet classifier | 700–1200ms | Routes the rest | Bulk of cost; offset by 75–90% cache hit |
| Templates | ~0ms | Renders 100% | Free at runtime |
| Haiku recheck | 300ms | 0.5–2% silent overrides | ~10× cheaper than Sonnet, fires only on silent path |

**Cache hit on the classifier prompt is the cost-control story.** With `cache_control: ephemeral` and a stable system-prompt + tools section, 75–90% of the input tokens are prompt-cache hits — the *full* token cost only applies to the small variable portion (the inbound message + recent history).

## Observability

Every decision emits a structured event. Track:

- **Tool-selection drift** — same inputs producing different tool choices across days/weeks (model upgrades, prompt edits, palette changes).
- **Cache hit rate** — drops mean prompt-cache invalidation; investigate.
- **Silent override rate** — Haiku recheck overriding silent_acknowledge to escalation. Drift up or down both matter (drift up = classifier mis-routing more silently; drift down = recheck miscalibrated).
- **Latency budget per layer.**
- **Cost per decision** — total spend ÷ decision count, tracked over time.

## Anti-patterns

- **Skip the regex gate "because it's hacky."** It catches 15–25% at 1ms — leaving the LLM to handle them is paying 700× the latency for the same answer.
- **Same-model recheck.** Pays twice for one mistake.
- **Recheck on every path, not just silent.** Burns cost on paths the classifier already routes well; doesn't proportionate to risk.
- **Templates inline in the system prompt.** Loses the [template-rendered-output](template-rendered-output.md) benefits *and* invalidates the prompt cache constantly.
- **No drift dashboard.** Tool selection drift is silent until users complain; observable in event data, invisible without a dashboard.
- **Aggressive regex acknowledgment patterns.** False positives drop real signals silently — cap at ~30 chars; only match unambiguous acks.

## Eval

- **Layer-attribution** — for every test case, assert which layer should fire. Catches regex-too-aggressive (signals dropped at layer 1) and silent-override-too-loose (Haiku overriding correct silents).
- **Recheck-correctness** — labeled actionable-vs-not silent inputs; measure Haiku recheck precision/recall.
- **End-to-end tool-selection** — labeled inbounds → expected tool. Per-tool, not just aggregate.
- **Cost-budget assertion** — tracked cost per decision under a budget. Tied to [cost-aware-eval](cost-aware-eval.md).

## See also

- [template-rendered-output](template-rendered-output.md) — the output-side discipline this pipeline exists to make safe in production.
- [forced-tool-call-output](forced-tool-call-output.md) — the schema-enforcement principle layer 2 implements.
- [llm-as-judge](llm-as-judge.md) — heterogeneous recheck is adjacent but distinct from judge-calibration patterns.
- [escalation-handoff](escalation-handoff.md) — the recheck override path lands here when it fires.
- [operator-trust-injection](operator-trust-injection.md) — the output-filter layer of *that* pattern is the same defense-in-depth principle as the recheck layer here.
