---
id: tool-schema-design
type: concept
tags: [agent, tool-use, schema, function-calling, design]
summary: "writing tool definitions the model can reliably pick and call — names, descriptions, parameter shapes, and the errors they return."
related:
  - [[references-task-agent-design]]
  - [[tool-use-design]]
  - [[tool-selection-and-routing]]
  - [[tool-result-grounding]]
  - [[forced-tool-call-output]]
  - [[schema-vs-validator]]
status: living
created: 2026-06-11
---

# Tool Schema Design

A tool definition is a prompt. The name, the description, and the parameter schema are the only things the model sees when deciding whether and how to call it. Most "the agent called the wrong tool / passed garbage args" bugs are schema bugs, not model bugs.

## What the model actually reads

| Element | The model uses it to… | Design rule |
|---|---|---|
| **Name** | Decide relevance at a glance | Verb-first, specific: `refund_charge`, not `handler2` |
| **Description** | Decide *when* to use vs. a sibling tool | State when to use AND when NOT to; name the nearest alternative |
| **Parameters** | Construct the call | Minimal, typed, with descriptions; required vs. optional explicit |
| **Returns / errors** | Know what it'll get back | Document the result shape and the failure modes |

## Design rules that move the needle

- **Disambiguate siblings in the description.** If two tools could plausibly fire for the same intent, each description must say what distinguishes it ("use `search_expenses` for fuzzy queries; use `get_expense` when you have the ID"). This is the single biggest lever on selection accuracy — see [tool-selection-and-routing](tool-selection-and-routing.md).
- **Parameters mirror how the model thinks, not how the API is built.** If the underlying API wants a compound ID but the model has a name, accept the name and resolve internally. Don't make the model do your join.
- **Make illegal calls unrepresentable.** Enums over free strings; required fields required. This is [forced-tool-call-output](forced-tool-call-output.md) discipline applied to tool inputs — the schema removes the failure class instead of validating after.
- **Errors are part of the contract.** A tool that returns a bare `"error"` teaches the model nothing. Return *actionable* errors ("expense not found: no expense with id X" vs. "invalid") so the next loop iteration can correct rather than retry blindly.

## Argument value design: every arg is a choice, not a sentence

The args are the model's only channel for saying *which specific instance* of the action — `refund_charge` is the verb, `{charge_id, reason_code, amount}` is the binding. The discipline is making each arg a **closed, typed value** so the model selects from a constrained domain instead of writing.

The failure that matters: **a free `string` arg is a back door for prose generation.** If `confirm_appointment` takes `note: string`, the model can write a wrong, unreviewed sentence into `note` — the almost-right-sentence failure you removed at the tool-choice layer walks straight back in through the args. (This is the exact escape hatch [template-rendered-output](template-rendered-output.md) forbids.)

| Arg value type | Safe? | Why |
|---|---|---|
| `enum` / closed set | safest | Model picks from a list; can't invent |
| `date`, `int`, `bool`, ID reference | yes | Typed, validatable, no prose |
| bounded `string` used as a *key* (a name to resolve) | ok if resolved/validated | Becomes a lookup key, not content |
| free `string` carrying a *message* or prose `reason` | no | Re-opens free-text generation |

**Litmus test:** could this arg value ship to a user as-is? If yes, it's prose in disguise — replace it with an enum the model selects, and let code render the sentence. A `reason: string` becomes `reason_code: enum`; the user-facing wording lives in a template, not in the arg.

Corollary to "mirror how the model thinks": when an arg *must* be a string (a merchant name to look up), accept the natural value and resolve it in code — don't make the model emit a wire-format compound ID, which is where malformed args come from.

## Schema enforcement vs. post-hoc validation

You can constrain tool args at generation (schema-enforced function calling) or accept free-form and validate after. The trade-off is the same as [schema-vs-validator](schema-vs-validator.md): enforcement removes the error class but is rigid; validation is flexible but lets bad calls through to be caught later. For action tools (irreversible side effects), prefer enforcement.

## Pitfalls

- **Too many tools.** 40 tools in context degrade selection sharply. If you have many, route to a subset first — see [tool-selection-and-routing](tool-selection-and-routing.md).
- **Overlapping tools with identical descriptions.** Guarantees the model coin-flips between them.
- **Kitchen-sink parameters.** A tool with 15 optional params is really several tools; split it.
- **Undocumented result shape.** The model can't ground a result it can't predict the shape of — see [tool-result-grounding](tool-result-grounding.md).

## References

Selection ([tool-selection-and-routing](tool-selection-and-routing.md)) and grounding ([tool-result-grounding](tool-result-grounding.md)) are the two halves of the call that schema design sits between.
