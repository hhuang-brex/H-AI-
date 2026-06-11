---
id: crash-recovery-consistency
type: concept
tags: [agent, state, recovery, consistency, crash, idempotency, engineering-excellence]
summary: "resuming after a crash that landed mid-action — using write-ahead markers to decide whether the in-flight side effect fired, and reconciling to a consistent state."
related:
  - [[agent-state-persistence]]
  - [[checkpoint-and-replay]]
  - [[idempotency-keys]]
  - [[rollback-and-compensation]]
  - [[interrupt-and-resume]]
status: living
created: 2026-06-11
---

# Crash-Recovery Consistency

The hardest moment in agent persistence is the crash that lands *between* firing a side effect and recording its result. On restart the agent sees "about to charge the card, key K" and a missing result — did the charge go through or not? Crash-recovery consistency is the logic that answers that question and reconciles the run to a known-good state without double-acting or losing work.

## The dangerous window

```
persist "about to do X (key K)"  ← write-ahead marker
          │
   ┌──────┴───────┐  ← CRASH can land anywhere in here
   │  call X       │
   │  X succeeds   │
   └──────┬───────┘
persist "X done, result R"        ← completion record
```

A crash before the marker: X never started — safe to do it on resume. A crash after the completion record: X is done — skip it. The crash *in the dangerous window* is the whole problem: the marker says "about to," there's no completion record, and you cannot tell from your own state whether X fired.

## Three ways to make the window safe

| Technique | How it resolves the unknown |
|---|---|
| **Idempotent X + retry** | Just re-run X with key K; the downstream dedups — one effect regardless. Simplest; preferred. |
| **Query downstream** | On resume, ask the external system "did action K happen?" before deciding to retry. |
| **Compensate then redo** | If X isn't idempotent and isn't queryable, undo any partial effect, then redo cleanly. |

The first is why [idempotency-keys](idempotency-keys.md) is the backbone of recovery: with an idempotent action, the dangerous window stops being dangerous — you blindly retry and correctness holds. Reach for query or compensate only when you can't make X idempotent.

## Reconcile, don't restart

On resume the agent walks its run state and, for each step, classifies: done (skip), not-started (do), or in-flight-unknown (resolve via the table above). Then it continues from the first genuinely-pending step. The failure mode to avoid is restart-from-scratch, which redoes done steps — see [interrupt-and-resume](interrupt-and-resume.md). Recovery is *reconciliation* against the durable record, not replay from zero.

## At-least-once is the only honest assumption

You cannot build exactly-once *execution* across a crash boundary — physics won't allow the agent to know, with certainty and zero latency, whether a remote effect committed. So you build exactly-once *effect* on top of at-least-once *execution*, via idempotency. Any design that claims exactly-once execution across crashes is hiding an assumption that will break.

## A testable property

Inject a crash after every step boundary in a test harness; assert that resume reaches the same final state as an uninterrupted run, with each side effect applied exactly once. This crash-injection test is the science-excellence backstop — consistency you *prove*, not assume.

## Pitfalls

- **No write-ahead marker.** Can't classify the in-flight step; recovery is a guess.
- **Assuming exactly-once execution.** The bug that ships as "it'll probably be fine."
- **Restart instead of reconcile.** Redoes completed work; repeats non-idempotent effects.
- **Untested recovery.** Crash paths that never ran until the first real outage.

## References

[idempotency-keys](idempotency-keys.md) is what makes the dangerous window safe; [rollback-and-compensation](rollback-and-compensation.md) is the compensate-then-redo path; [checkpoint-and-replay](checkpoint-and-replay.md) writes the markers this logic reads.
