---
id: confirm-before-act
type: concept
tags: [agent, human-in-the-loop, approval, confirmation, reversibility, engineering-excellence]
summary: "gating an action on explicit user approval, with the gate's strictness scaled to the action's reversibility and blast radius."
related:
  - [[action-execution-safety]]
  - [[human-in-the-loop-control]]
  - [[hard-surface-irrevocability]]
  - [[action-authority]]
  - [[stop-and-yield-conditions]]
  - [[tool-use-design]]
  - [[turn-outcome-signal]]
  - [[decision-audit-trail]]
  - [[system-one-decision-models]]
status: living
created: 2026-06-11
---

# Confirm-Before-Act

A confirm gate pauses the agent before an action to get explicit user approval. The engineering question is never "should we confirm?" in the abstract — it's "*which* actions, and *how* heavily," because a gate on everything is as useless as a gate on nothing.

## Scale the gate to the consequence

Match confirmation strength to reversibility × blast radius:

| Action class | Example | Gate |
|---|---|---|
| Read / compute | look up an expense | None — just do it |
| Reversible write, low blast | draft a memo, tag one transaction | None, or propose-and-undo |
| Reversible write, wide blast | re-tag 200 transactions | Show preview; proceed on assent |
| Irreversible, bounded | send one SMS | Explicit confirm |
| Irreversible, wide blast | issue refunds to a list | Explicit confirm + echo the exact scope |

The principle is the same reversibility lens as careful execution generally: cheap-and-reversible needs no gate; expensive-or-irreversible ([hard-surface-irrevocability](hard-surface-irrevocability.md)) needs an explicit one. The gate lives at the tool boundary ([action-authority](action-authority.md)), not in the prompt — a model told "please confirm first" will skip it under pressure.

## A confirm is a deliberate yield

Mechanically, confirm-before-act is a *blocked → yield* in [stop-and-yield-conditions](stop-and-yield-conditions.md): the loop suspends, surfaces the proposed action, and resumes with the user's decision. That means it needs the same durable-state plumbing as any yield — resuming a confirm must continue the task, not restart it.

It also means the turn is **not terminal**, and anything downstream that fires on "nothing is owed" must be able to see that without re-reading the prose. Record the confirm as a typed outcome on the turn rather than leaving it implicit in a question mark ([turn-outcome-signal](turn-outcome-signal.md)).

## Confirm the *specifics*, not the abstraction

A gate that says "Proceed? (y/n)" without stating exactly what will happen trains users to reflexively approve. Echo the concrete action and its scope: "Send this SMS to +1-555-0142: '<text>'?" or "Refund these 3 charges totaling $240?" The confirmation's value is entirely in what it makes the user *see* before they assent.

## Default-deny on ambiguity

If the user's approval is ambiguous ("ok I guess", a non-answer, silence), treat it as *not confirmed* for irreversible actions. The asymmetry from [stop-and-yield-conditions](stop-and-yield-conditions.md) holds: the cost of acting on a non-approval dwarfs the cost of asking once more.

## Approval covers the invocation, not its closure (2026)

Echoing specifics is necessary, but the specifics are usually the *entry call*. *Agent Approval Laundering* ([arXiv:2609.28586](https://arxiv.org/abs/2609.28586), 2026-09-23) names the gap: approval interfaces bind the human decision to a command or tool call, while the tool executes the **transitive workflow** that call activates — an install runs lifecycle hooks and writes files, an MCP call exercises network authority. The durable record then names the entry and omits the effects.

Two results make it a design constraint rather than a hygiene note:

- **An information limit.** Identical policy-visible fields can require different effect-specific decisions, so no policy that reads only the record can be both safe and permissive. More metadata narrows the gap without closing it: across 111 approval/trace pairs, residual unrecorded effects fell from **40** (explicit fields) to **17** (command semantics) to **13** (decision-time metadata).
- **The fix binds a prediction before authorization.** Commit a frozen, source-backed prediction of the workflow's effect boundary with the approval. On 17 prespecified holdout workflows the predictions reached **0.926 macro recall and 0.941 macro precision**, and binding them cut residual effects from **10 to 3**. It ships as a Claude Code PreToolUse hook that carries the record through the permission path without auto-approving.

For a conversing task agent, the confirm prompt should echo the *effects* ("this books the room, sends three invites, and charges the card on file"), and the [decision-audit-trail](decision-audit-trail.md) should store that predicted set beside what actually happened so residuals are findable.

## Pitfalls

- **Gate everything.** Confirmations on reads and reversible drafts; users learn to rubber-stamp, and the gate stops protecting anything.
- **Vague confirms.** "Proceed?" without the specifics — approval theater.
- **Prompt-only gates.** Relying on the model to remember to ask; enforce at the tool layer.
- **Confirm that loses state.** Approving, then the agent restarts the task — see [interrupt-and-resume](interrupt-and-resume.md).
- **Confirming the command, not its effects.** The user approves the entry call; the workflow does more. Echo and record the predicted effect set.
- **Treating weak assent as approval** for irreversible actions.

## References

[hard-surface-irrevocability](hard-surface-irrevocability.md) is *what* makes an action need a gate; [mid-task-steering](mid-task-steering.md) handles when the user's reply is a redirect rather than a yes/no.
