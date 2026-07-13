---
id: interrupt-and-resume
type: concept
tags: [agent, human-in-the-loop, interrupt, pause, resume, state, engineering-excellence]
summary: "stopping a run in flight — abort vs. pause — and resuming from durable state without redoing completed work or repeating side effects."
related:
  - [[agent-state-persistence]]
  - [[action-execution-safety]]
  - [[human-in-the-loop-control]]
  - [[mid-task-steering]]
  - [[stop-and-yield-conditions]]
  - [[decision-audit-trail]]
  - [[step-budget-and-runaway-control]]
  - [[background-agent-execution]]
status: living
created: 2026-06-11
---

# Interrupt & Resume

A user must be able to stop an agent that's already running — and, often, to pick the task back up later. Interrupt-and-resume is the machinery behind "stop", "pause", and "where were we?" Without it, the only way to halt a misbehaving agent is to kill the session, and the only way to continue an interrupted task is to start over.

## Abort vs. pause are different

| Signal | Meaning | State outcome |
|---|---|---|
| **Abort** | Stop and discard the task | Run ends; mark cancelled; no resume |
| **Pause** | Stop for now, continue later | Run suspends; state checkpointed for resume |

Conflating them is a real bug: treating "stop" as "pause" leaves a zombie task that resumes unexpectedly; treating "pause" as "abort" throws away a task the user meant to continue. When ambiguous, ask — "cancel this entirely, or pause it?"

## Interrupt at a safe point

An interrupt can arrive at any instant, but the agent may only *act* on it at a safe boundary: between loop steps, never mid-irreversible-action. The harness checks for an interrupt signal at the top of each [perceive-reason-act-loop](perceive-reason-act-loop.md) iteration and, critically, just before any irreversible tool call. An interrupt that lands during a `send_sms` waits until the send completes (or is itself the thing the confirm gate was protecting). You cannot un-send.

## Resume needs durable run state

Resuming is only as good as the state you checkpointed. The minimum durable record: the goal, the plan with per-step status, facts/decisions established so far, and any open commitments. This is exactly the [decision-audit-trail](decision-audit-trail.md) / structured-state representation — the same artifact that powers context compaction also powers resume. If "resume" replays completed steps, two things break: latency (redoing work) and correctness (repeating side effects — a second refund, a duplicate SMS).

## Idempotency makes resume safe

Because a crash or interrupt can land *after* a side effect but *before* its result was recorded, resume must not blindly re-execute the in-flight step. Either the step is idempotent (safe to repeat) or the agent records "about to do X" before doing it and checks "did X already happen?" on resume. This is the same discipline a planned `action-execution-safety` concept will own; for now, treat "is this step safe to re-run on resume?" as a required question per irreversible action.

## Pitfalls

- **No safe-point checking.** Interrupt handled mid-irreversible-action — half-sent, half-charged.
- **Abort/pause conflation.** Zombie resumes, or discarded tasks the user wanted back.
- **Resume by restart.** Redoes work and repeats side effects.
- **Checkpoint missing commitments.** Resume forgets the question it had asked or the step it deferred.
- **Non-idempotent replay.** Resuming re-runs a `charge` that already succeeded.

## References

[mid-task-steering](mid-task-steering.md) is the redirect/refine sibling of interrupt; [stop-and-yield-conditions](stop-and-yield-conditions.md) covers the agent's *own* decision to stop (vs. an external interrupt); [step-budget-and-runaway-control](step-budget-and-runaway-control.md) is the *involuntary* interrupt when a run exceeds budget.
