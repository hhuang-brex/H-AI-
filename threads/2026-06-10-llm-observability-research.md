---
id: 2026-06-10-llm-observability-research
type: thread
tags: [observability, debugging, audit, otel, research, thread]
related:
  - [[llm-observability]]
  - [[decision-audit-trail]]
  - [[native-thinking-vs-prompted-reasoning]]
  - [[cost-aware-eval]]
  - [[prod-shadow-replay]]
status: archived
created: 2026-06-10
summary: "deep-research on \"why did the model respond this way?\" debugging workflow."
---

# Thread — LLM Observability Research (2026-06-10)

Conversation goal: a developer asks "why did the model respond this way?" — what's the current best practice for capturing, storing, and investigating model reasoning + decision traces in production agentic systems? Focus on the practical day-1 instrumentation plan, not just theory.

## Method

Ran the deep-research workflow:

- **7 angles**: lab API access patterns, observability platforms, OTel GenAI conventions, trace correlation, replay-with-newer-model, faithfulness limits, anti-patterns.
- **5 parallel web-search agents**.
- **Sources fetched & verified**: Anthropic extended-thinking docs, OpenAI reasoning guide, DeepSeek reasoning model API, Gemini thinking docs, OTel GenAI spec + spans page + release history, LangSmith OTel mapping, Datadog LLM Observability landing + terms, Arize Phoenix LLM traces, W&B Weave Anthropic integration.
- **3-vote adversarial verification** on every claim. One claim refuted (1–2): a specific OTel attribute interpretation about reasoning tokens.

Stats: 106 subagents · ~2.47M subagent tokens · ~11 min wall time.

## Outputs

- [llm-observability](../nodes/concepts/llm-observability.md) — new concept node. Honest framing: "read the LLM's reasoning" is a leaky abstraction at every layer. Tables for: what each lab returns (raw/summary/opaque), platform capture surfaces, OTel state. Plus day-1 instrumentation plan.

## Three corrections to my prior framing

The research surfaced three things I'd been representing too optimistically in earlier nodes:

1. **"Read the native trace from the API" was too optimistic.** Anthropic Claude 4 / Fable 5 default returns *summaries from a separate summarizer model*, not raw thinking. Raw is sales-gated. OpenAI explicitly does NOT expose raw reasoning tokens — only opt-in summaries. DeepSeek is the outlier with verbatim `reasoning_content`. Gemini also returns only summaries.

2. **Hidden-billing pitfall.** You're billed for the *full raw reasoning tokens* but only see summaries. Token-count dashboards based on visible content under-attribute by 2–10×. Always read the lab's `usage` object, never count from visible content.

3. **Multi-turn continuity is a real footgun.** Anthropic `signature`, OpenAI `previous_response_id` or full item list, DeepSeek strip-before-resend. Each lab has its own protocol; getting it wrong loses reasoning across the agent loop.

## Key insights

- **OTel GenAI is in Development status** with breaking changes ongoing (v1.36 → v1.37 chat-history revamp → v1.41 tool-call rename). Only `error.type`, `server.address`, `server.port` are stable; all `gen_ai.*` attributes are experimental.
- **Content capture is opt-in per spec.** `gen_ai.input.messages` etc. are Opt-In; instrumentations *"SHOULD NOT capture them by default."* Inline content capture across an agent fleet without an external content store will overwhelm the trace backend or leak PII.
- **Observability platforms capture what the API returns.** They don't synthesize raw reasoning the API didn't expose. Their headline differences are in agent-trajectory replay, dataset promotion from prod, and search UX.
- **Datadog's "natively supports OTel GenAI" claim** is linked from a blog rather than enumerated as supported attributes inline. Marketing-adjacent until verified against current attribute inventory.
- **Replay-with-newer-model gives clean output + cost diffs but noisy reasoning diffs.** Encrypted continuity (Anthropic signature, OpenAI encrypted_content) ties to the original model+request; replays produce new reasoning, not replayed reasoning.
- **Faithfulness limits acknowledged implicitly.** Summarizer model disclosure (Anthropic), no-raw-tokens disclosure (OpenAI) — neither lab makes a formal faithfulness claim about what's returned. The trace is best-signal-available, not ground truth.

## Refuted (do not cite)

- 1–2 vote: claim about a specific gen_ai.usage.reasoning.output_tokens attribute and whether reasoning tokens are counted within or in addition to gen_ai.usage.output_tokens. Spec evolved — pin to a version before citing this.

## Time-sensitive caveats

- OTel GenAI conventions explicitly Development; any attribute name in the report (especially `gen_ai.system` → `gen_ai.provider.name`) should be re-verified before instrumenting.
- Anthropic `display: summarized` vs `omitted` documented for current Claude 4 / Fable 5 / Mythos 5; older Claude 3.7 differs and is out of scope.
- Faithfulness research wasn't 3-0 verified; both labs implicitly concede the gap (separate summarizer, opaque encrypted reasoning) but neither publishes formal bounds.
- Replay patterns from production teams (Intercom Fin, Klarna, Notion) didn't surface as primary-source claims in the input set; the report deliberately omits speculation.
- Anti-pattern claims from production teams ("we logged everything but couldn't search it" etc.) didn't survive verification; the closest verified guardrail is the OTel spec's opt-in / external-storage recommendation.
- Phoenix capture-surface claim is medium-confidence (2-1 vote) — absence of doc isn't absence of capability; verify against your specific OpenInference instrumentation.
- Vendor primary-source claims attest feature *existence*; they say nothing about quality, scale, or production-blocker quirks under load.

## Connection to existing graph

- The new node is the developer-debug-workflow companion to [decision-audit-trail](../nodes/concepts/decision-audit-trail.md) — the audit trail says *what* to store; this node says *what's actually capturable* and *how* to use it.
- Corrects [native-thinking-vs-prompted-reasoning](../nodes/concepts/native-thinking-vs-prompted-reasoning.md)'s implicit framing that developers "read the thinking blocks." The reality on Anthropic 4+ is they read *summaries*; raw is sales-gated. Worth a small follow-up edit there.
- Hidden-billing fact ties to [cost-aware-eval](../nodes/concepts/cost-aware-eval.md) — token-budget assertions must use lab-reported usage, not visible tokens.
- Encrypted continuity payloads (Anthropic signature, OpenAI encrypted_content) belong in [decision-audit-trail](../nodes/concepts/decision-audit-trail.md)'s required fields list as preserved-opaque entries.

## Open follow-ups

- Replay-with-newer-model production case studies (Intercom Fin, Klarna, Notion engineering blogs) — primary sources didn't surface; worth a future research pass.
- Phoenix's actual reasoning-capture capability via OpenInference — needs empirical test, not just doc inspection.
- Specific Datadog LLM Observability OTel attribute support — claim is marketing-adjacent; verify before depending.
- "Anthropic raw thinking sales-gated" mechanics — what's actually offered, to which customers, with what API surface? Out of scope for public sources; could become a project node if your team negotiates access.
