---
id: output-surface-taxonomy
type: concept
tags: [llm, output, design, taxonomy, system-design]
related:
  - [[llm-output-design]]
  - [[forced-tool-call-output]]
  - [[schema-vs-validator]]
  - [[hard-surface-irrevocability]]
status: living
created: 2026-06-07
---

# Output Surface Taxonomy

The meta-practice that makes [forced-tool-call-output](forced-tool-call-output.md) decidable: enumerate every place the LLM can emit, classify each one, document the per-surface decision somewhere central.

## Why this is the prerequisite

Most teams default to one output mechanism for the whole agent — usually free-text — and only revisit it after a customer-visible failure. The fix isn't "force schema everywhere"; the fix is **classify each surface explicitly**. Until that exists, every output decision is ad-hoc.

## A worked taxonomy

| Surface | Consumer | Reversible? | Volume | Latency-sensitive? | Default mechanism |
|---|---|---|---|---|---|
| SMS / push / voice | end user | no | high | no | forced tool-call |
| Email | end user | no (sent) but viewable later | medium | no | forced tool-call |
| Chat UI streaming | end user | yes (next turn) | high | yes | free-text + validator |
| Slack / in-product chat | end user | yes (edit/delete) | medium | mild | free-text + validator |
| Webhook to partner | wire | no | high | varies | forced tool-call |
| Internal log | engineer | yes | high | no | free-text, no validation |
| Draft UI for human review | human reviewer | n/a (human is the gate) | low | no | free-text |
| Tool inputs (other ops) | wire | n/a (typed already) | high | no | already structured |

Run this exercise once per agent; the columns differ per company and surface, but the *exercise* is the practice.

## Anti-patterns the taxonomy catches

- **One-size mechanism.** "We use free-text everywhere" → the SMS row above will eventually fail.
- **Per-feature decisions.** "The card-swipe skill uses schema; the receipts skill doesn't" → both have an SMS surface; both should match on that surface.
- **Implicit reversibility assumptions.** Engineers often assume "send" means "draft." The taxonomy forces you to state it.

## Discipline

- Document the table somewhere a future agent (human or AI) can read before adding a new surface.
- Adding a new surface = a row in the table = an explicit decision in PR review.
- A failure on any surface should trigger re-asking the table's classification, not just patching the prompt.

## See also

- [forced-tool-call-output](forced-tool-call-output.md) — when the row's answer is "schema-forced".
- [schema-vs-validator](schema-vs-validator.md) — when the row's answer is "free-text + validator".
- [hard-surface-irrevocability](hard-surface-irrevocability.md) — the column that drives most decisions.
