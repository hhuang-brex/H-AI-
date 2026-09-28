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
  - [[llm-as-judge]]
  - [[confirm-before-act]]
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

## Where exactly-once lives: the contract, not the model (2026)

LIMBO ([arXiv:2609.29095](https://arxiv.org/abs/2609.29095), single author, 2026-09-24) asks whether exactly-once belongs in the model, the harness, or the tool contract. It injects twelve fault modes at the service boundary (late commits, redelivery, partial batches) across six services, 25,930 episodes, nine models, and three production harnesses, and grades every episode against a **ledger of committed effects**. The answer depends on the fault:

| Fault shape | Who decides | Frontier duplicate rate |
|---|---|---|
| Lost acknowledgement, immediate read-back reveals the truth | the model (53% of explained variance) | **0.5%** |
| Request still in flight, or transport delivered twice | the contract (81%) | **56%** and **74%** |

It proves that **no verification-only policy is exactly-once under late commits** without a bound on in-flight time. Waiting works only when that bound is short and known; under heavy-tailed delays even an hour of waiting per episode falls short of simply **offering a key on every write, which cut duplicates from 28% to 4%** because agents use keys when they exist. The harness barely mattered, and a guard that attaches keys transferred across harnesses unchanged. The number to remember: **agents reported success in 90% of the episodes in which they had duplicated an effect.**

So "read back before retrying" handles only the case the model already handles. Make the key part of the tool contract, required or attached by the harness, and check completion against the downstream ledger rather than the agent's report — the same self-written-evidence problem as [llm-as-judge](llm-as-judge.md).

## Pitfalls

- **Keying on the attempt.** A fresh UUID per retry defeats the whole mechanism.
- **Key minted after the side effect.** Recording success only post-call means a crash-in-between still double-fires; persist intent+key *before* acting.
- **Downstream doesn't honor keys.** If the API ignores the key, you must dedup agent-side before calling.
- **Verification instead of a key.** Read-back cannot see a request still in flight; only the key makes the late commit harmless.
- **Trusting the agent's "done once."** Duplicating agents reported success 90% of the time; reconcile against the ledger.
- **Assuming reads need keys.** They don't — reserve this for side-effecting actions; keying reads is noise.

## References

[rollback-and-compensation](rollback-and-compensation.md) handles the case where the action *can't* be made idempotent and must instead be undone; [tool-use-design](tool-use-design.md) is where the key is threaded into the tool call.
