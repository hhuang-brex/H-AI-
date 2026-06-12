---
id: run-state-model
type: concept
tags: [agent, state, persistence, schema, resume, engineering-excellence]
summary: "the minimal durable shape that lets a run resume — goal, plan with per-step status, established facts, open commitments, and in-flight markers."
related:
  - [[agent-memory]]
  - [[agent-state-persistence]]
  - [[checkpoint-and-replay]]
  - [[decision-audit-trail]]
  - [[goal-decomposition]]
  - [[context-compaction]]
status: living
created: 2026-06-11
---

# Run-State Model

The run-state model is the typed shape of what you persist to make a run resumable. Get it right and resume is trivial; get it wrong — too little and you can't continue, too much and every checkpoint is expensive and brittle — and the whole persistence layer fights you.

## The minimal viable shape

A resumable task agent's run state is roughly:

| Field | Why it must survive |
|---|---|
| **Goal** | What the run is for; resume is meaningless without it |
| **Plan + per-step status** | Which steps are done / in-flight / pending — the resume cursor |
| **Established facts** | What the agent learned (looked-up values, user answers) so it needn't re-fetch |
| **Open commitments** | Questions asked, steps deferred — must persist until closed or they're silently dropped |
| **In-flight action markers** | "About to do X, key K" — the record that makes crash-recovery safe |
| **Run metadata** | Run id, agent version, budget consumed — for audit and drift |

This is deliberately small. It is *not* the full conversation transcript, *not* every intermediate model output — those are reconstructable or disposable. Persist the irreducible core.

## State is structured, not a transcript

The temptation is to persist "the whole context" and rehydrate it. That's expensive, fragile across model/prompt changes, and conflates resumable state with the disposable context window. Instead, persist a **typed object** and re-assemble the context from it on resume — the same discipline as [context-assembly-per-turn](context-assembly-per-turn.md). The run state is the seed; the prompt is regrown from it.

This also makes run state the natural output of [context-compaction](context-compaction.md): the compacted "structured state" representation and the persisted run state are the *same artifact* viewed two ways — one for fitting the window, one for surviving a restart.

## Relationship to the audit trail

[decision-audit-trail](decision-audit-trail.md) is the append-only *history*; run state is the *current* mutable position. They share fields (completed steps, keys) but differ in shape: the audit trail never forgets, the run state is overwritten as the run advances. Often the run state can be *reconstructed* by folding the audit log — if so, the audit trail is your source of truth and run state is a materialized view. Either way, decide which is authoritative.

## Version the schema

Run state outlives deploys. A run checkpointed under v1 may resume under v2 with a changed plan shape. Version the state schema and handle migration (or refuse to resume incompatible versions cleanly) — an unversioned state model silently corrupts on the first breaking deploy.

## Pitfalls

- **Persisting the transcript.** Expensive, brittle, conflates window with state.
- **Dropping open commitments.** Resume forgets a question it had asked.
- **No in-flight marker.** Can't tell, on resume, whether the crashed step's side effect fired — see [crash-recovery-consistency](crash-recovery-consistency.md).
- **Unversioned schema.** A breaking deploy can't read old checkpoints.

## References

[checkpoint-and-replay](checkpoint-and-replay.md) is *when* this state is written; [goal-decomposition](goal-decomposition.md) produces the plan-with-status that is its core field.
