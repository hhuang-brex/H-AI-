---
id: template-rendered-output
type: concept
tags: [chatbot, output, schema, templates, classifier, deterministic]
related:
  - [[llm-output-design]]
  - [[forced-tool-call-output]]
  - [[schema-vs-validator]]
  - [[layered-defense-pipeline]]
  - [[hard-surface-irrevocability]]
  - [[output-surface-taxonomy]]
  - [[persona-tone-compliance]]
status: living
created: 2026-06-09
summary: "stricter sibling: classifier picks a tool, code-owned templates render the reply."
---

# Template-Rendered Output

The strongest-discipline variant of [forced-tool-call-output](forced-tool-call-output.md): the LLM never writes the user-facing string at all. It picks one tool from a closed palette; deterministic templates in code render the actual reply.

## The spectrum

| Approach | What the model produces | What reaches the user |
|---|---|---|
| Free-text + validator ([schema-vs-validator](schema-vs-validator.md)) | Free prose | The model's prose, post-checked |
| Schema-enforced ([forced-tool-call-output](forced-tool-call-output.md)) | Structured object with string fields | The model's strings, inside a fixed shape |
| **Template-rendered (this node)** | **An enum / classifier output, no prose** | **A string from a code-owned template, parametrized** |

Each step takes more flexibility off the table in exchange for a smaller failure surface. Template-rendered is the strictest: *the set of strings the user can receive is finite and committed.*

## When this is the right level of strictness

The free-text and schema-enforced layers leave one failure mode wide open: the **almost-right sentence**. The model writes something that "even sounds correct to a casual reviewer" and "scores reasonable on faithfulness," but is wrong on a detail that matters (signs as a person; promises a time; invents a phone number; reassures incorrectly). Standard evals miss it.

Template-rendered output makes this failure mode *structurally impossible* — the model can't write a wrong sentence because it can't write any sentence.

Right level when:
- The output is on a [[hard-surface-irrevocability|hard surface]] (SMS, email, push, voice).
- The replies have **stable, enumerable structure** — usually 8–12 distinct templates per agent cover all real cases.
- **Failure cost ≫ rigidity cost.** Tone variety is invisible; a wrong sentence is a customer-trust event.
- You've already tried prompt-only fixes and watched them leak.

## What the LLM is for, in this pattern

Two things only:

1. **Pick a tool** (= classify the situation into one of N templates).
2. **Fill structured arguments** for that template (= time slot, document type, redirect target — nothing free-text).

That's it. Anthropic's `tool_choice: { type: 'any' }` enforces "exactly one tool call, no free text." The model is now a multi-class classifier whose output is rendered by code.

## Tool palette discipline

The palette *is* the design contract. Ikki's documented production-tested rules:

| Rule | Rationale |
|---|---|
| Distinguish "respond" / "escalate" / "stay silent" as **separate tools**, not as a string arg | If routing is encoded as an arg, the LLM mis-routes; if it's a tool choice, the schema forces commitment |
| **One tool per response template** | Tools don't overlap; the classifier has crisp boundaries |
| **Non-overlapping tool descriptions** | Overlapping descriptions cause week-to-week drift in tool choice |
| **≤15 tools per agent** | Beyond that, classifier accuracy degrades; use **two-stage routing** (meta-tool then specific tool) |
| Typical palette: **8–12 tools** | Sweet spot in practice |

## Templates live in code, not in the prompt

Templates are functions, organized by `toolName.category.sub_type` (or similar). Five free benefits when prose is in code, not in prompt:

1. **Versioning** via git.
2. **Reviewability** by non-engineers (legal, comms, product).
3. **A/B testing** with full control.
4. **i18n** as a per-locale lookup.
5. **Structural impossibility of hallucination** in the rendered string.

Throw `TemplateNotFound` when the LLM's choice doesn't resolve — log it, escalate, never silently fall back.

## Cost of adoption

This is more work than schema enforcement. From Ikki's documented project sizing (1.5–3 weeks for a non-trivial agent):

- Tool palette + arg schemas: 2–4 days.
- Templates (writing, stakeholder review, i18n): 3–7 days — usually the biggest item.
- Two-layer pipeline + safety re-check: 1–2 days. See [layered-defense-pipeline](layered-defense-pipeline.md).
- Eval set for tool-selection accuracy: 1–2 days.
- Observability wiring: half a day.

Worth it specifically when "a wrong sentence is expensive."

## Anti-patterns

- **Single tool with a `response_text: string` arg.** Defeats the entire point — you're back to free-text generation through a structured wrapper.
- **Overlapping tool descriptions.** Manifests as drift: same input picks different tools across model versions / temperatures.
- **More than ~15 tools without two-stage routing.** Classifier accuracy degrades.
- **Templates in the system prompt.** Loses the five free benefits and re-introduces drift.
- **Prompt rules as the substitute.** "Asking the model nicely not to write a wrong sentence is not a control." The model has been trained on millions of confident sentences; the only structural fix is to remove its ability to write one.

## When *not* to use this pattern

- **Pure information chat with no consequences** (docs assistant, internal Q&A).
- **Creative writing** (the rigidity defeats the purpose).
- **Demos and prototypes** — over-engineered.
- **Single-turn classifiers that don't reply to users** — already structured.

## Eval

- **Tool-selection accuracy** — labeled inputs → expected tool. Per-tool precision/recall, not just aggregate.
- **No-free-text assertion** — every outbound message resolves to exactly one template ID. Mechanical.
- **Template-coverage assertion** — every defined template has at least one test case; orphans flagged.
- **Adversarial palette drift** — same input across model upgrades; assert tool choice is stable. Catches the silent-drift failure mode.

## See also

- [forced-tool-call-output](forced-tool-call-output.md) — the weaker form; this is its stronger sibling.
- [layered-defense-pipeline](layered-defense-pipeline.md) — the runtime architecture this slots into.
- [schema-vs-validator](schema-vs-validator.md) — the spectrum of mechanisms; template-rendered is the strict end.
- [persona-tone-compliance](persona-tone-compliance.md) — templates are how compliance language becomes a hard contract instead of a prompt-level wish.
- [decision-engine-contract](decision-engine-contract.md) and [engine-vs-conversation-routing](engine-vs-conversation-routing.md) — templates render decisions and next-actions in the task-agent pattern.
