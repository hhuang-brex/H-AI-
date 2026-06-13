---
id: goal-decomposition
type: concept
tags: [agent, planning, decomposition, task, granularity]
summary: "breaking a goal into steps at the right granularity — actionable but not brittle — with dependencies made explicit."
related:
  - [[references-task-agent-design]]
  - [[task-planning]]
  - [[plan-execute-replan]]
  - [[decision-engine-contract]]
  - [[agent-control-loop]]
status: living
created: 2026-06-11
---

# Goal Decomposition

Decomposition turns "document this trip's expenses" into an ordered set of steps the agent can actually execute. The whole game is *granularity*: steps too coarse aren't actionable; steps too fine are brittle and slow. Get the grain right and the rest of planning is easy.

## The granularity test

A step is at the right grain if it maps to **roughly one tool call or one decision**, and its success is **checkable**. 

- Too coarse: "reconcile the account" — not one action; the agent can't execute it directly.
- Too fine: "open the database connection," "write the SELECT" — implementation detail the agent shouldn't plan at; let the tool handle it.
- Right: "fetch unreconciled expenses for account X," "match each to a receipt," "flag the unmatched."

Rule of thumb: a step should be something you could imagine *showing the user* as a line in a plan, and something you could *check* succeeded.

## Dependencies are part of the plan

A flat list of steps loses the most important information: which steps depend on which. "Match to receipts" can't run before "fetch expenses." Making dependencies explicit is what lets the loop run independent steps in parallel and replan only the affected subtree when one fails. A plan without dependency structure forces strictly-serial execution and full-restart on any failure.

## Plan as structured data

The decomposition output is a typed object — ordered steps, each with an id, an action, dependencies, and a status — not a prose paragraph. Same discipline as [decision-engine-contract](decision-engine-contract.md): the plan is consumed by the executor loop, shown in the UI, and written to the audit trail. Prose plans can't be checkpointed, displayed for approval, or replayed. See [plan-execute-replan](plan-execute-replan.md) for how that structure gets used when reality diverges.

## Don't over-decompose

Decomposition has a cost: every step is a place to go wrong and a round-trip of latency. For a two-step task, a three-level plan tree is waste. Decompose only as far as the [agent-control-loop](../topics/agent-control-loop.md) needs to execute and recover — no deeper. Premature decomposition is the planning version of premature abstraction.

## Pitfalls

- **Decomposing what the tool should handle.** Planning SQL statements when the tool takes a query. Stop at the tool boundary.
- **Losing dependencies.** A flat checklist that hides "B needs A" — the agent runs B first and fails.
- **Decomposition the model can't check.** Steps whose success is unverifiable leave the loop unable to know when to advance.
- **One giant step.** "Do the task" as a single step is no plan at all; one tiny step each is over-planning. Find the middle.

## References

[plan-execute-replan](plan-execute-replan.md) is what consumes a decomposition; [task-planning](../topics/task-planning.md) is when to bother decomposing at all.
