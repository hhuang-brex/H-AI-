---
id: agent-state-persistence
type: topic
tags: [agent, state, persistence, checkpoint, resume, durability, engineering-excellence]
summary: "the durable run state that lets an agent survive crashes, pause/resume across sessions, and recover to a consistent point — distinct from the audit log and conversation memory."
related:
  - [[worked-example-chatting-task-agent]]
  - [[agent-control-loop]]
  - [[action-execution-safety]]
  - [[run-state-model]]
  - [[checkpoint-and-replay]]
  - [[crash-recovery-consistency]]
  - [[decision-audit-trail]]
  - [[conversation-memory]]
  - [[interrupt-and-resume]]
status: living
created: 2026-06-11
---

# Agent State Persistence

An agent that does real work outlives a single process. It gets interrupted and resumed hours later, the server restarts mid-task, a user comes back the next day to a half-finished job. Agent state persistence is the durable record of *where a run is* — enough to stop the agent cold and pick it back up at a consistent point, without redoing completed work or repeating side effects.

## What this owns vs. its neighbors

The graph has three state-shaped nodes that are NOT this:

| Node | Holds | Why it's different |
|---|---|---|
| [decision-audit-trail](../concepts/decision-audit-trail.md) | Immutable log of decisions made | An append-only *history* for replay/audit, not the *live resumable* state |
| [conversation-memory](../concepts/conversation-memory.md) | What to remember about the user across turns/sessions | *Semantic* memory, not *execution* state |
| [sms-state-machine](../concepts/sms-state-machine.md) | Per-thread channel state (5 states) | A *channel-specific* instance of the general idea |

This topic is the general, channel-agnostic **run state**: the goal, the plan with per-step status, established facts, open commitments, and in-flight-action markers — the minimum to resume.

## The three concerns

| Concern | Question | Concept |
|---|---|---|
| What to persist | What's the minimum durable state to resume? | [run-state-model](../concepts/run-state-model.md) |
| When and how | When do you write a checkpoint, and how do you replay from it? | [checkpoint-and-replay](../concepts/checkpoint-and-replay.md) |
| Recovering safely | A crash landed mid-action — how do you resume consistently? | [crash-recovery-consistency](../concepts/crash-recovery-consistency.md) |

## Why this is load-bearing for everything built so far

Several Tier-2 patterns *assume* durable state without owning it:

- [interrupt-and-resume](../concepts/interrupt-and-resume.md) — pause/resume is impossible without checkpointed run state.
- [idempotency-keys](../concepts/idempotency-keys.md) — "persist intent+key before acting" needs somewhere durable to persist *to*.
- [rollback-and-compensation](../concepts/rollback-and-compensation.md) — compensation reads the record of which steps completed.
- [context-compaction](../concepts/context-compaction.md) — structured run state IS the compacted history carried forward.

This topic is where that shared assumption gets a home.

## The governing principle: state is the resume contract

The test of your run state is brutal and simple: **kill the process at any point, restart, and the agent continues correctly.** If resume drops a commitment, redoes a side effect, or restarts from scratch, the state model is incomplete. Design the state by asking "what would I need to never lose?" — then persist exactly that, durably, before each risky step.

## Connections

- **Loop:** run state is the substrate the [agent-control-loop](agent-control-loop.md) reads at the start of each iteration and writes after each step.
- **Execution safety:** persistence and [action-execution-safety](action-execution-safety.md) are interdependent — idempotency needs durable keys; recovery needs durable completion records.
- **Science excellence:** "kill-anywhere, resume-correctly" is a *property to test* — crash-injection tests that assert consistency, not manual hope.
