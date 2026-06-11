---
id: action-execution-safety
type: topic
tags: [agent, execution, safety, idempotency, rollback, engineering-excellence]
summary: "executing side-effecting actions safely — idempotency, dry-run preview, and rollback — so retries, crashes, and replans don't double-charge or corrupt state."
related:
  - [[execution-invariant-testing]]
  - [[worked-example-chatting-task-agent]]
  - [[agent-state-persistence]]
  - [[tool-use-design]]
  - [[agent-control-loop]]
  - [[idempotency-keys]]
  - [[dry-run-and-preview]]
  - [[rollback-and-compensation]]
  - [[hard-surface-irrevocability]]
  - [[interrupt-and-resume]]
  - [[step-budget-and-runaway-control]]
status: living
created: 2026-06-11
---

# Action Execution Safety

An agent that *acts* will retry, crash mid-action, get interrupted, and replan — and every one of those events can fire a side effect twice or leave the world half-changed. Action execution safety is the engineering discipline that makes side-effecting actions survive the non-deterministic, failure-prone reality of an agent loop: a retried charge charges once, an interrupted batch leaves a consistent state, and a wrong action can be walked back.

## Why this is distinct from what the graph already has

| Already covered | This topic instead |
|---|---|
| Irrevocable *channels* as a category ([hard-surface-irrevocability](../concepts/hard-surface-irrevocability.md)) | The *execution mechanics* that make revocable actions safe and bound irrevocable ones |
| The *audit record* of a decision ([decision-audit-trail](../concepts/decision-audit-trail.md)) | The *execution guarantees* around the action the decision triggers |
| *Stopping* a runaway loop ([step-budget-and-runaway-control](../concepts/step-budget-and-runaway-control.md)) | What state the world is left in when it stops mid-action |

`hard-surface-irrevocability` tells you *which* actions you can't undo; this topic tells you how to execute *all* side-effecting actions so the undoable ones stay clean and the un-undoable ones fire exactly once.

## The three mechanics

| Mechanic | Problem it solves | Concept |
|---|---|---|
| Idempotency | Retry / crash-replay fires the action twice | [idempotency-keys](../concepts/idempotency-keys.md) |
| Dry-run / preview | Acting before the user (or agent) sees what will happen | [dry-run-and-preview](../concepts/dry-run-and-preview.md) |
| Rollback / compensation | A multi-step action fails halfway, leaving inconsistent state | [rollback-and-compensation](../concepts/rollback-and-compensation.md) |

## The governing principle: assume every action runs at-least-once

In a loop with retries, interrupts, and replans, you cannot guarantee an action runs *exactly* once at the call site — the call may succeed and the *result* be lost (crash before recording), prompting a replay. So design for **at-least-once delivery with exactly-once effect**: make the action idempotent so a duplicate call is harmless. This single assumption drives most of the topic.

## Connections

- **Tools:** execution safety is a property of how [tool-use-design](tool-use-design.md) implements side-effecting tools. A read tool needs none of this; a `charge`/`send`/`delete` tool needs all of it.
- **Loop & resume:** [interrupt-and-resume](../concepts/interrupt-and-resume.md) depends on idempotency — resume must not re-fire a completed side effect. [step-budget-and-runaway-control](../concepts/step-budget-and-runaway-control.md) must not guillotine the loop mid-action.
- **HITL:** [dry-run-and-preview](../concepts/dry-run-and-preview.md) is what a [confirm-before-act](../concepts/confirm-before-act.md) gate shows the user.
- **Science excellence:** idempotency and rollback are *testable invariants* — "running this action twice equals running it once" is a property you assert in tests, not hope for.
