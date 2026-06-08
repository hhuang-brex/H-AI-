---
id: hard-surface-irrevocability
type: concept
tags: [output, design, system-design, reliability]
related:
  - [[llm-output-design]]
  - [[output-surface-taxonomy]]
  - [[forced-tool-call-output]]
status: living
created: 2026-06-07
---

# Hard Surface / Irrevocability

A "hard surface" is any output channel where a malformed emission has externally-visible cost the team can't take back. Worth its own concept because it's the column that drives most output-design decisions, and it generalizes well beyond LLMs.

## Definition

An output is on a **hard surface** if:

1. **Send is final.** No retraction, edit, or undo on the receiver's side.
2. **Receiver is external.** Customer, partner, regulator, public API consumer.
3. **Volume × failure rate is non-trivial.** Even 0.5% failures at 100k/day are 500 visible failures.

## Examples

| Surface | Hard? | Why |
|---|---|---|
| SMS, push notification | yes | Sent the moment it's written; recipient screenshots survive |
| Voice / IVR | yes | Spoken aloud; errors jarring |
| Email | mostly yes | Recall is unreliable; recipient archives |
| Webhook to partner | yes | Consumed by their system; we don't control downstream effects |
| Regulated outputs (financial, medical, legal) | yes | Compliance review unforgiving |
| Slack / chat with edit | partly | Edit window exists; receivers may have already seen original |
| Draft UI gating human send | no | Human is the validator |
| Internal log | no | Engineer-only; cost of malformation is debugging time, not customer trust |

## Implications

- **Asymmetric failure cost.** Stylistic rigidity is invisible per-recipient; a wrong message is a customer-trust event with cascading remediation cost (ticket, PR, engineering hours, possibly legal). Asymmetry is often 1:1000+.
- **Drives mechanism choice.** Hard surface ⇒ default to schema enforcement, see [forced-tool-call-output](forced-tool-call-output.md).
- **Drives review process.** Adding a new hard surface should require the same scrutiny as adding a new public API endpoint.

## Beyond LLMs

The concept predates LLMs — "every send is a commit, treat the schema like a public API" is standard advice for any system writing to email, SMS, or partner integrations. LLMs make it acute because the *generator* of those messages is now non-deterministic.

## Anti-pattern

Treating hard and soft surfaces with the same output mechanism — usually free-text everywhere — and discovering the asymmetry one customer ticket at a time.
