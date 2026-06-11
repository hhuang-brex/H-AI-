---
id: schema-vs-validator
type: concept
tags: [llm, output, schema, validation, design-choice]
related:
  - [[llm-output-design]]
  - [[forced-tool-call-output]]
  - [[output-surface-taxonomy]]
  - [[streaming-vs-structured]]
status: living
created: 2026-06-07
summary: "schema-enforced output vs. free-text + post-hoc validator."
---

# Schema vs. Validator

Two mechanisms for keeping LLM output well-formed. They are not interchangeable; they trade different things.

| | Schema-enforced (forced tool-call) | Free-text + validator |
|---|---|---|
| Failure mode prevented | Structural — missing field, wrong shape | Content — banned phrasing, format violation, regex fail |
| Where the gate runs | Inside generation (constrained decode / tool-call API) | After generation (Python/TS check) |
| Failure recovery | Model retries inside the same call | Detect → retry / repair / reject in app code |
| Streaming UX | Awkward — object only complete at end | Native — partial tokens render as they arrive |
| Flexibility | Bounded by schema; novel cases need new fields | Unbounded; any string passes if it clears the validator |
| Cost to add | Prompt rewrite + eval retuning + downstream renderer | Add a function; usually contained |
| Cost to remove | High — downstream now depends on object shape | Low — just delete the function |

## Picking between them

| Situation | Mechanism |
|---|---|
| Output goes to an irrevocable, structured surface (SMS, webhook, email) | Schema |
| Output is conversational, mid-dialogue, open-ended | Validator |
| Model is unfamiliar with the schema; eval shows quality regression | Validator (and revisit schema later) |
| Streaming token-by-token UX is part of the product | Validator (see [streaming-vs-structured](streaming-vs-structured.md)) |
| Failure is "ugly but recoverable" | Validator |
| Failure is "customer-visible, irreversible, ticket-cascading" | Schema |

## Common mistake: false dichotomy

These layer. A robust agent uses both:

- Schema gates **structural** failures (the field exists, types match).
- Validator gates **content** failures (no banned phrasing, no PII leak, length within bound).

Neither catches the other's class. A schema can guarantee `merchant_name: string` is present and still let the model put a 50-word essay in it. A regex validator on free-text can guarantee no PII and still let the model produce a malformed message that crashes a downstream parser.

## Anti-patterns

- **Schema as content gate.** Adding `length_must_be_under_160_chars: bool` to the schema and trusting the model to set it correctly. The schema enforces presence, not truth — use a validator.
- **Validator as structure gate.** Regex-parsing free-text to reconstruct fields. Brittle, redundant, defers the inevitable schema migration.
- **Choosing for the whole agent.** Mechanism is per-surface. See [output-surface-taxonomy](output-surface-taxonomy.md).
