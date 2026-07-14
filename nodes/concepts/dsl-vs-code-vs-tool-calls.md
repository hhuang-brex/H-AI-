---
id: dsl-vs-code-vs-tool-calls
type: concept
tags: [agent, action-space, dsl, code-generation, constrained-decoding, tool-use, output-design]
summary: "what LANGUAGE an agent emits to act — template → typed tool-call → DSL → general code — is a dial trading expressivity for verifiability; but generation accuracy is gated by the language's training-data coverage, so a DSL is best-fit only when verifiability/safety dominate AND the DSL stays close to a well-represented language."
related:
  - [[tool-use-design]]
  - [[forced-tool-call-output]]
  - [[schema-vs-validator]]
  - [[template-rendered-output]]
  - [[decision-engine-contract]]
  - [[tool-schema-design]]
  - [[code-execution-sandbox-pattern]]
  - [[text-to-sql-retrieval]]
  - [[llm-as-autoformalizer-plus-solver]]
status: living
created: 2026-07-13
---

# DSL vs Code vs Tool-Calls (the action-language choice)

Before an agent can act, you choose the **language it emits** — and that choice, not the model, often sets reliability. It's one axis, most-to-least constrained:

**template** → **typed tool-call (JSON)** → **domain-specific language** → **general-purpose code**

Each step trades **verifiability/safety** for **expressivity** — *and* changes how accurately the LLM can generate it. This node owns that action-language decision; it sits *above* the enforcement mechanism ([forced-tool-call-output](forced-tool-call-output.md), [schema-vs-validator](schema-vs-validator.md)) and above the DSL *instances* the graph already has ([text-to-sql-retrieval](text-to-sql-retrieval.md), [llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md)).

## The four points

| Point | Expressivity | Verifiability | Owning node |
|---|---|---|---|
| **Template** (classifier picks, code renders) | lowest | highest (code owns output) | [template-rendered-output](template-rendered-output.md) |
| **Typed tool-call / JSON** | low–mid | schema-checkable | [tool-schema-design](tool-schema-design.md), [forced-tool-call-output](forced-tool-call-output.md), [decision-engine-contract](decision-engine-contract.md) |
| **DSL** (SQL, PDDL, a bespoke grammar) | mid | statically checkable / soundly executable | [text-to-sql-retrieval](text-to-sql-retrieval.md), [llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md) |
| **General code** (Python/bash) | highest | runtime *isolation* only (not static) | [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) |

## The two forces that decide it

**1. Expressivity vs verifiability (the obvious dial).** A restricted grammar is by-construction checkable: SQL `SELECT`-only blocks writes; a total (non-Turing-complete) DSL admits static analysis; PDDL/ASP hand a *sound solver* the problem. General code can express anything but its only safety is a sandbox — the general-code point buys safety via runtime **isolation**, not static verification (*note: an "accidentally Turing-complete" DSL collapses to the general-code point — an engineering inference, not a measured PL result*).

**2. Generation accuracy is gated by training-data coverage (the force builders forget).** The LLM writes what it has seen. **CodeAct** (Wang et al., ICML 2024, [arXiv:2402.01030](https://arxiv.org/abs/2402.01030)) shows *executable Python as the action space* beats JSON/text actions by up to ~21pp (74.4% vs 53.7% text / 52.4% JSON on M3ToolEval, gpt-4-1106) — Python is *maximally* trained-on. But it wins on only 12/17 models and is **strongly capability-dependent** (best open-source 13.4% vs 74.4% closed). A **bespoke DSL is a low-resource-language problem**: Grammar Prompting (Wang et al., NeurIPS 2023, [arXiv:2305.19234](https://arxiv.org/abs/2305.19234)) finds LLMs can't generalize a niche grammar from a few exemplars — mitigation is *predict a minimal BNF in-context, then generate to it*. Language frequency-vs-accuracy is a measured axis (MultiPL-E [arXiv:2208.08227](https://arxiv.org/abs/2208.08227); MultiPL-T [arXiv:2308.09895](https://arxiv.org/abs/2308.09895) fine-tunes to lift low-resource languages).

## Constraining generation: what it buys and costs

**Grammar-constrained decoding** (Outlines, [arXiv:2307.09702](https://arxiv.org/abs/2307.09702) — FSM over the vocabulary, little overhead; GCD, [arXiv:2305.13971](https://arxiv.org/abs/2305.13971) — can beat task-finetuned models) *guarantees the output parses* — **syntax only**. OpenAI Structured Outputs reports **100%** schema conformance (vs 93% unconstrained, <40% on old models) — but **validity ≠ correctness**: a schema-valid value can still be wrong. The often-cited "constraint tanks reasoning" claim is **contested**: "Let Me Speak Freely?" ([arXiv:2408.02442](https://arxiv.org/abs/2408.02442)) reports large GSM8K drops under JSON, but the Outlines rebuttal shows *true* constrained decoding matches or beats free-form and the drop was a prompt-only "JSON-mode" + schema-ordering artifact. The durable, uncontested lesson: much of the "tax" is an **implementation artifact** (subword misalignment — DOMINO [arXiv:2403.06988] restores accuracy *and* ~2× speed; ASAp [arXiv:2405.21047] fixes distribution distortion), and the safe mitigation is to **emit a free-text reasoning field *before* the constrained answer field**.

## When a DSL is the best fit

- **Yes — a DSL wins** when (a) **verifiability/safety dominates** (you must statically check or soundly execute what the agent emits), **and** (b) the DSL is **close to a well-represented language** (SQL, a JSON-ish config) *or* you invest in few-shot-grammar / fine-tuning. Prefer **autoformalize-to-an-existing-formal-language + a sound solver** over a homegrown DSL when soundness is the goal (Logic-LM [arXiv:2305.12295](https://arxiv.org/abs/2305.12295): +18–39% — but the NL→formal translation is the load-bearing weakness, owned by [llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md)).
- **No — general code + sandbox wins** when expressivity matters and the task is open-ended: the model writes Python far more accurately than any niche DSL, and safety comes from [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) isolation.
- **No — a typed tool-call/contract wins** when the action space is small and enumerable: [forced-tool-call-output](forced-tool-call-output.md) + [decision-engine-contract](decision-engine-contract.md) give schema-checkable actions without a custom grammar.

**Builder heuristic:** don't invent a bespoke DSL for the *verifiability* if it costs you *generation accuracy* — reach first for an existing well-trained formal language (SQL/PDDL) + its checker/solver, or general code in a sandbox; mint a custom DSL only when no well-represented language fits *and* static guarantees are non-negotiable, and then teach its grammar (in-context BNF or fine-tune).

## Pitfalls

- **Choosing a DSL for safety, forgetting the accuracy tax.** A rare grammar the model fumbles trades one failure mode for another.
- **Assuming constrained decoding = correct.** It guarantees *parse*, not *truth*; pair with validation/grounding.
- **Answer-before-reason schemas.** Put the reasoning field first, or you induce the reported reasoning drop.
- **A "restricted" DSL that's actually Turing-complete.** You lose the static guarantee that justified it.

## References

Sits under [tool-use-design](../topics/tool-use-design.md) (the action side). DSL instances: [text-to-sql-retrieval](text-to-sql-retrieval.md), [llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md). Verified anchors: CodeAct [arXiv:2402.01030](https://arxiv.org/abs/2402.01030), Grammar Prompting [arXiv:2305.19234](https://arxiv.org/abs/2305.19234), Outlines [arXiv:2307.09702](https://arxiv.org/abs/2307.09702), GCD [arXiv:2305.13971](https://arxiv.org/abs/2305.13971), the constrained-reasoning debate ([arXiv:2408.02442](https://arxiv.org/abs/2408.02442) vs the Outlines rebuttal — contested magnitude), DOMINO [arXiv:2403.06988], MultiPL-E/T.
