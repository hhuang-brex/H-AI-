---
id: action-authority
type: concept
tags: [chatbot, conversation-design, agents, authority, risk]
related:
  - [[domain-chatbot-design]]
  - [[escalation-handoff]]
  - [[forced-tool-call-output]]
  - [[safety-rails-domain-specific]]
  - [[intent-and-disambiguation]]
status: living
created: 2026-06-08
summary: "what the bot can *do*; tiered authority enforced at the tool layer."
---

# Action Authority

What the bot can *do*, not just say. The under-discussed half of domain chatbot design — most teams obsess over message quality and forget that an agentic bot's failure mode is *acting wrongly*, not speaking wrongly.

## The authority ladder

Most domains support a tiered model:

| Tier | Examples | Mechanism |
|---|---|---|
| **0 — Read-only** | Look up balance, fetch policy text, search docs | No confirmation needed |
| **1 — Low-risk write** | Update a draft note, attach a tag | Implicit confirmation (action visible, easy undo) |
| **2 — Reversible state change** | Cancel pending request, change preference | Explicit "OK?" before acting |
| **3 — Irreversible / high-stakes** | Send money, confirm a refund, delete a record | Confirmation + summary + cool-off window or human approval |
| **4 — Out of authority** | Anything regulated, cross-account, or above a threshold | Hand off; never act. See [escalation-handoff](escalation-handoff.md) |

Per-action authority is the design contract. Per-action evaluation is how you verify the bot honors it.

## Why authority must be designed in, not prompted in

Prompting "always confirm before acting on tier-3 actions" is leaky — the model will sometimes skip when the user's phrasing implies consent. Authority must be enforced at the **tool layer**:

- Tier 3 tools require a `confirmed_by_user: true` argument; the tool's wrapper rejects calls without it.
- Tier 4 tools simply don't exist in the bot's toolset — the only path is escalation.

This is the same principle as [forced-tool-call-output](forced-tool-call-output.md) for outputs: shift the constraint from "I asked the model to" to "the surface refuses to accept malformed actions."

## Common anti-patterns

- **Prompt-only authority.** "You are an agent; only act after confirmation." Eventually leaks.
- **Single-tier toolset.** Every action is equally easy to call → high-stakes ones get called too readily.
- **Silent action.** The bot performs a tier-2 action and reports completion without surfacing what it did → user can't catch errors.
- **Missing audit trail.** Bot actions don't appear in the same log as human actions; investigation later is hard.

## Eval

- **Authority-respect evaluator** — for each tier, run cases that should and shouldn't trigger an action; assert the bot acts only when authorized.
- **Confirmation evaluator** — assert tier-2/3 actions are preceded by a confirmation turn, and abort on "no" / silence.
- **Tool-call invariants** — schema-level: tier-3 tools fail at the boundary if `confirmed_by_user` is absent. See [golden-snapshot-eval](golden-snapshot-eval.md) / schema-validity scorer.

## See also

- [escalation-handoff](escalation-handoff.md) — the relief valve for tier 4 and unclassified situations.
- [forced-tool-call-output](forced-tool-call-output.md) — the structural enforcement principle this borrows.
- [intent-and-disambiguation](intent-and-disambiguation.md) — disambiguation requirements scale with authority.
