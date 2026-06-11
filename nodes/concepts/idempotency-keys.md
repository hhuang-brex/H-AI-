---
id: idempotency-keys
type: concept
tags: [agent, execution, idempotency, retry, side-effects, engineering-excellence]
summary: "making a side-effecting action safe to call more than once by keying it on a stable client-generated token, so retries and replays produce one effect."
related:
  - [[action-execution-safety]]
  - [[interrupt-and-resume]]
  - [[step-budget-and-runaway-control]]
  - [[tool-use-design]]
  - [[decision-audit-trail]]
status: living
created: 2026-06-11
---

# Idempotency Keys

An idempotency key is a stable, client-generated token attached to a side-effecting action so that calling it twice with the same key produces the effect *once*. It is the single most important primitive for action safety, because in an agent loop you genuinely cannot prevent duplicate calls — you can only make them harmless.

## Why duplicates are unavoidable

The action can succeed while its *result* is lost: the API charges the card, then the network drops the response, or the agent crashes before recording success. On retry or resume the agent re-issues the call, not knowing the first one worked. Without a key, that's a second charge. With a key, the server recognizes "I've seen this token; here's the original result" and the effect happens once.

This is the at-least-once-delivery / exactly-once-effect split: you accept that the *call* may repeat and engineer the *effect* not to.

## How to key

- **Derive the key from the action's identity, not the attempt.** A charge for "expense X, run Y" should produce the *same* key on every retry — otherwise each retry looks new. Key on what the action *is*, not when it was tried.
- **Generate client-side, before the first attempt.** The agent mints the key, persists it with the intent ("about to charge, key=K"), then calls. If it crashes and resumes, it reuses K.
- **Persist key→result.** The dedup only works if someone remembers the key. Either the downstream API does (best — pass it through) or the agent records "key K already executed → result R" in its own [decision-audit-trail](decision-audit-trail.md).

## Idempotency is what makes resume safe

[interrupt-and-resume](interrupt-and-resume.md) and [step-budget-and-runaway-control](step-budget-and-runaway-control.md) both can leave an action in flight. Resume re-runs the in-flight step; budget-kill stops mid-step and a later retry re-runs it. Both are safe *only* if the step is idempotent. "Is this step safe to re-run?" is the question every irreversible tool must answer, and an idempotency key is usually the answer.

## A testable invariant

Idempotency is a property you can assert: *running the action twice with the same key leaves the same state as running it once.* That's a unit test, not a hope. Make it one — it's the cheapest guard against the most expensive class of agent bug (duplicated money movement, duplicate messages).

## Pitfalls

- **Keying on the attempt.** A fresh UUID per retry defeats the whole mechanism.
- **Key minted after the side effect.** Recording success only post-call means a crash-in-between still double-fires; persist intent+key *before* acting.
- **Downstream doesn't honor keys.** If the API ignores the key, you must dedup agent-side before calling.
- **Assuming reads need keys.** They don't — reserve this for side-effecting actions; keying reads is noise.

## References

[rollback-and-compensation](rollback-and-compensation.md) handles the case where the action *can't* be made idempotent and must instead be undone; [tool-use-design](tool-use-design.md) is where the key is threaded into the tool call.
