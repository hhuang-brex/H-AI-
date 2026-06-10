---
id: forced-tool-call-output
type: concept
tags: [llm, output, schema, structured-output, tool-use]
related:
  - [[llm-output-design]]
  - [[output-surface-taxonomy]]
  - [[schema-vs-validator]]
  - [[streaming-vs-structured]]
  - [[hard-surface-irrevocability]]
  - [[template-rendered-output]]
  - [[layered-defense-pipeline]]
  - [[agent-trajectory-eval]]
status: living
created: 2026-06-07
---

# Forced Tool-Call as Output Channel

Force the LLM to emit user-facing output through a tool-call with a fixed schema instead of generating free-text. Also called *structured output enforcement*, *tool-as-output-channel*, *constrained generation as a wire contract*.

## The failure mode this addresses

The dominant production failure for chatbots is not hallucination — it's the **almost-right sentence**. The bot writes something that sounds correct, scores reasonable on faithfulness evals, and gets through casual review, but is wrong on a detail that matters: signs as a person; promises a time; reassures incorrectly. Standard evals miss it because the prose looks fine.

Forced tool-call removes the model's ability to *write* the failing class of sentences, instead of trying to *catch* them after generation.

## Stronger variant: template-rendered output

Schema enforcement still lets the LLM write prose inside string fields. For the strictest hard surfaces, a stronger pattern exists: **the LLM never writes the user-facing string at all** — it picks one tool from a closed palette (a classifier output) and code-owned templates render the actual reply. See [template-rendered-output](template-rendered-output.md). This is the right level when the failure cost truly dominates and the templates are enumerable (typically 8–12 per agent).

The two patterns are points on a spectrum, not alternatives:

| Discipline | Model writes | Used when |
|---|---|---|
| Free-text + validator (see [schema-vs-validator](schema-vs-validator.md)) | Free prose | Conversational, mid-dialogue |
| **Forced tool-call (this node)** | **Structured object with string fields** | **Hard surface; structure enumerable; some content flexibility wanted** |
| Template-rendered ([template-rendered-output](template-rendered-output.md)) | Enum/classifier output, no prose | Hard surface; almost-right is unacceptable; 8–12 templates cover all cases |

## Mental model

A typed RPC for LLM output. The model still chooses content; the schema chooses shape. Stylistic flexibility lives inside string fields (`merchant_name`, `question_text`); structural failures (missing field, 200-word essay) become impossible at the output layer.

## When to use it

Strongest signal is when **all three** of these hold:

| Property | Test |
|---|---|
| Hard output surface | Is the output irrevocable on send? See [hard-surface-irrevocability](hard-surface-irrevocability.md). |
| Enumerable structure | Can you list the templates / shapes? Usually 5–10 covers all real cases. |
| Failure cost ≫ rigidity cost | If the model wrote a slightly more boring sentence, who cares? If it wrote a wrong one, what breaks? |

If all three are present, schema enforcement is almost certainly correct.

## When *not* to use it

1. **Open-ended conversational turns where flexibility is the product.** Mid-conversation Q&A; the user can ask anything; you can't enumerate. Force-schema here = picking a schema that anticipates every question. You can't.
2. **Genuinely emergent structure.** If you find yourself adding `escape_hatch_freetext: string` and routing logic on it, you're ramming open-ended work into a closed-form gate. Schema is illusion of safety. Use [schema-vs-validator](schema-vs-validator.md) free-text path instead.
3. **Downstream consumer is human, not wire.** Draft UI, internal scratchpad, debug output — the human is the validator; schema is friction with no payoff.
4. **Model is bad at *your* schema.** Modern frontier models are well-tuned for tool-use, but novel field names or deeply nested objects can degrade output quality. Run the eval before committing.
5. **Streaming token-by-token UX is required.** See [streaming-vs-structured](streaming-vs-structured.md).

## Layered design within one feature

A single feature often has multiple turn types — the right answer is to split mechanisms:

| Turn type | Surface | Mechanism |
|---|---|---|
| First-touch transactional notification | Irrevocable (SMS, email, push) | Forced tool-call |
| Follow-up conversational turns | Same surface | Free-text + validator |
| Internal tool inputs / scratchpad | Wire to other tools | Already structured |

Forcing schema everywhere kills conversational UX; forcing free-text everywhere lets shaped failures reach customers. The mechanism is per-turn, not per-feature.

## Why it's emerging as best practice

- Tool-use APIs only became reliable around mid-2024; before that, forced JSON was unreliable enough that free-text + validation was the safer default.
- Early LLM apps inherited a "smart text generator" mental model and a free-text default that was never re-examined.
- Once a team has been bitten — a malformed customer message, a wrong webhook payload — the asymmetry of failure cost vs. rigidity cost becomes obvious in retrospect.

## Cost of adoption

Conceptually different from a prompt fix. Migrating a "produce text matching this rubric" skill to "produce a structured object with these fields" cycles through prompt rewrite, eval-case retuning, downstream renderer (the code that turns the object into the user-visible string), and schema versioning. Two-week project, not a two-day patch.

## Hard constraint: extended thinking on Anthropic

Worth knowing before you design: **Anthropic extended thinking does NOT support `tool_choice: "any"` or named tools** — only `auto` or `none`. Forcing tool use with extended thinking returns an error. An agent that wants both this pattern AND native reasoning has to drop one per turn. Common resolutions:

- Use forced tool-call only on first-touch / hard-surface turns; conversational turns use `auto` + thinking.
- Run reasoning in a separate pass; render via forced tool-call without thinking.
- On OpenAI / DeepSeek the constraint is different — check current docs.

See [native-thinking-vs-prompted-reasoning](native-thinking-vs-prompted-reasoning.md) for the broader trade-off and replacement patterns.

## See also

- [output-surface-taxonomy](output-surface-taxonomy.md) — the prerequisite practice; you can't decide *when* to force schema until you've enumerated *which surfaces exist*.
- [template-rendered-output](template-rendered-output.md) — the stricter variant: classifier + code-owned templates, no model prose at all.
- [layered-defense-pipeline](layered-defense-pipeline.md) — the runtime architecture (regex → forced tool → templates → heterogeneous recheck) that makes this safe in production.
- [operator-trust-injection](operator-trust-injection.md) — adjacent but distinct: when the failure is *operator-message echo* rather than free-text drift, schema enforcement isn't the right tool. Use the wrapper-tag + recency-reinforcement pattern instead.
- [native-thinking-vs-prompted-reasoning](native-thinking-vs-prompted-reasoning.md) — the forced-tool-choice + extended-thinking incompatibility above; broader reasoning-mode trade-off.
- [agent-trajectory-eval](agent-trajectory-eval.md) — once schema is enforced, mechanical evals can pin tool-call shape (`input.equals`, schema-validity) and demote LLM-judges to where they belong.
- [decision-engine-contract](decision-engine-contract.md) — the contract IS a forced-tool-call output. Names the specific shape decision engines need.
