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

## Confirm the *specifics*, not the abstraction

A gate that says "Proceed? (y/n)" without stating exactly what will happen trains users to reflexively approve. Echo the concrete action and its scope: "Send this SMS to +1-555-0142: '<text>'?" or "Refund these 3 charges totaling $240?" The confirmation's value is entirely in what it makes the user *see* before they assent.

## Default-deny on ambiguity

If the user's approval is ambiguous ("ok I guess", a non-answer, silence), treat it as *not confirmed* for irreversible actions. The asymmetry from [stop-and-yield-conditions](stop-and-yield-conditions.md) holds: the cost of acting on a non-approval dwarfs the cost of asking once more.

## Pitfalls

- **Gate everything.** Confirmations on reads and reversible drafts; users learn to rubber-stamp, and the gate stops protecting anything.
- **Vague confirms.** "Proceed?" without the specifics — approval theater.
- **Prompt-only gates.** Relying on the model to remember to ask; enforce at the tool layer.
- **Confirm that loses state.** Approving, then the agent restarts the task — see [interrupt-and-resume](interrupt-and-resume.md).
- **Treating weak assent as approval** for irreversible actions.

## References

[hard-surface-irrevocability](hard-surface-irrevocability.md) is *what* makes an action need a gate; [mid-task-steering](mid-task-steering.md) handles when the user's reply is a redirect rather than a yes/no.
