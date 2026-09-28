---
id: checkpoint-and-replay
type: concept
tags: [agent, state, checkpoint, replay, durability, engineering-excellence]
summary: "when to write durable state — before every risky step — and how to rebuild a live run from the last checkpoint."
related:
  - [[agent-state-persistence]]
  - [[run-state-model]]
  - [[crash-recovery-consistency]]
  - [[idempotency-keys]]
  - [[prod-shadow-replay]]
  - [[golden-snapshot-eval]]
status: living
created: 2026-06-11
---

# Checkpoint & Replay

A checkpoint is a durable write of the [run-state-model](run-state-model.md) at a point the run could safely resume from. Replay is reconstructing a live run from the latest checkpoint. The engineering questions are *when to checkpoint* (too often is slow, too rarely loses work) and *how to rebuild* without re-firing side effects.

## Checkpoint before every risky step, not on a timer

The instinct is to checkpoint periodically (every N seconds). Wrong frame for an agent: checkpoint at **semantic boundaries**, specifically *before every irreversible or expensive action*. The rule that ties this to safety:

> Persist "about to do X, idempotency key K" **before** calling X. Persist "X done, result R" **after**.

This write-ahead pattern is what makes crash-recovery decidable — on restart you can see "we were about to do X" and check whether X actually happened. A timer-based checkpoint that lands mid-action gives you no such marker. (See [idempotency-keys](idempotency-keys.md) for the key, [crash-recovery-consistency](crash-recovery-consistency.md) for the recovery logic.)

Between risky steps, cheap reversible work needn't checkpoint each micro-step — batch it. The grain is "before anything I couldn't cheaply redo or couldn't undo."

## Replay rebuilds state, not the transcript

On resume you load the last run-state checkpoint and **re-assemble** the working context from it ([context-assembly-per-turn](context-assembly-per-turn.md)) — you don't replay every historical model call. Replaying LLM calls is expensive, non-deterministic, and pointless: the state already captures their *outcomes*. Load state → rebuild prompt → continue the loop.

## Two distinct meanings of "replay" — don't conflate

| Replay | Purpose | Determinism need |
|---|---|---|
| **Resume-replay** (this concept) | Continue an interrupted run | Must NOT re-fire side effects |
| **Eval-replay** ([prod-shadow-replay](prod-shadow-replay.md)) | Re-run past inputs against a new model/prompt to measure drift | Side effects mocked/disabled by design |

Resume-replay continues real work; eval-replay re-scores history with effects off. Same word, opposite stance on side effects — keep them separate in code (a "replay mode" flag that means both is a bug factory).

### A third meaning: cut-point replay as a regression test

Chronicle ([arXiv:2609.20625](https://arxiv.org/abs/2609.20625), 2026-09-17) sits between the two. It records a run at its **non-deterministic boundaries** — model calls and state-reading tools — as immutable envelopes. *Cut-point replay* serves a chosen subset of boundaries from the record and runs the rest live with new code, turning a recorded incident into a CI regression test. On six recorded failures with simulated model boundaries, recording cost **23 µs per crossing**, full replay made zero model calls and was bit-stable across 20 repetitions, and cut-point tests failed on faulty code and passed on guarded and benign changes for all six. In a mutation study, cut-point tests caught **every** mutant that let the recorded unsafe action through, while a baseline stubbing every boundary with the same assertion caught **none**.

This does not blur the table above. Recorded boundaries are served, never re-fired, so side effects stay off as in eval-replay, while the code under test runs live. Scope is six incidents with simulated model boundaries, author-reported.

## Checkpoint atomicity

A half-written checkpoint is worse than none — resume reads corrupt state. Write checkpoints atomically (write-to-temp-then-rename, or a transactional store). The checkpoint must either fully exist or not exist.

## Pitfalls

- **Timer-based checkpoints.** Land mid-action; no write-ahead marker; recovery undecidable.
- **Replaying LLM calls on resume.** Slow, non-deterministic, unnecessary — state holds the outcomes.
- **Conflating resume-replay with eval-replay.** One must protect side effects, the other disables them.
- **Non-atomic writes.** A crash during checkpoint corrupts the resume point.

## References

[run-state-model](run-state-model.md) is *what* gets checkpointed; [crash-recovery-consistency](crash-recovery-consistency.md) is the logic that consumes the write-ahead markers on restart.
