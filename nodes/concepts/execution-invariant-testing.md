---
id: execution-invariant-testing
type: concept
tags: [eval, agent, testing, invariant, crash-injection, idempotency, science-excellence]
summary: "asserting an agent's safety properties as tests — run-twice-equals-once, crash-anywhere-resumes-consistently, never-exceeds-budget — instead of hoping they hold."
related:
  - [[llm-evaluation]]
  - [[action-execution-safety]]
  - [[agent-state-persistence]]
  - [[idempotency-keys]]
  - [[crash-recovery-consistency]]
  - [[golden-snapshot-eval]]
status: living
created: 2026-06-11
---

# Execution-Invariant Testing

The safety properties an acting agent depends on — exactly-once effect, consistent crash recovery, bounded spend — are *invariants*: statements that must hold over every run, regardless of the model's non-determinism. Execution-invariant testing is asserting them as deterministic tests rather than trusting they hold. This is the science-excellence backstop for [action-execution-safety](../topics/action-execution-safety.md) and [agent-state-persistence](../topics/agent-state-persistence.md): the dangerous bugs there are invisible in any single happy-path run and only surface under retry, crash, or load.

## These are properties, not examples

Most LLM eval scores *outputs* against expected values ([golden-snapshot-eval](golden-snapshot-eval.md), [agent-trajectory-eval](agent-trajectory-eval.md)). Invariant tests are different: they assert a *relationship* that must hold for all inputs, and they live below the LLM in the deterministic layer — so they're cheap, fast, and non-flaky. The model's output can vary; the invariant must not.

## The core agent invariants

| Invariant | Test shape |
|---|---|
| **Idempotency** — run-twice == run-once | Call the side-effecting action twice with the same key; assert one effect, same final state. ([idempotency-keys](idempotency-keys.md)) |
| **Crash-consistency** — crash-anywhere resumes correctly | Inject a crash after each step boundary; assert resume reaches the same final state as an uninterrupted run, each effect applied once. ([crash-recovery-consistency](crash-recovery-consistency.md)) |
| **Budget-bound** — never exceeds the ceiling | Drive a non-terminating scenario; assert the loop halts at the budget, not after. ([step-budget-and-runaway-control](step-budget-and-runaway-control.md)) |
| **Confirm-gate** — irreversible never fires unconfirmed | Simulate "no"/silence at the gate; assert the irreversible action did not execute. ([confirm-before-act](confirm-before-act.md)) |
| **Plan-safety** — irreversible steps ordered last | Static check the plan; assert no reversible step depends on an irreversible one. ([rollback-and-compensation](rollback-and-compensation.md)) |

## Crash-injection is the highest-value, least-run test

Resume paths are the code that *only* runs during an outage — so it's the code least exercised before the first real one. A crash-injection harness (interrupt the run at each step boundary, restart from checkpoint, assert consistency) turns "we think resume works" into "resume is proven for every boundary." It's the single test most likely to catch a duplicated-money-movement bug before production does. The mechanism is the same as fault-injection / chaos testing, scoped to the agent's step boundaries.

## Mock the side effect, assert the call

You don't file real disputes in a test. Replace the side-effecting tool with a mock that records calls; the invariant is asserted against the *call log* ("file_dispute called exactly once with key K"), not a real downstream. This is also why resume-replay and eval-replay must be distinguishable in code ([checkpoint-and-replay](checkpoint-and-replay.md)) — the test runs in effects-off mode by design.

## Pitfalls

- **Only happy-path tests.** Green suite, latent double-charge under retry.
- **Crash tests at run boundaries only.** The dangerous window is *mid-step*; inject between every step, including just-after-side-effect.
- **Testing against a real downstream.** Slow, flaky, and you can't assert "called once" cleanly; mock and inspect the call log.
- **Invariants as prose, not tests.** "The agent is idempotent" in a doc is not the same as a test that fails when it isn't.

## References

[action-execution-safety](../topics/action-execution-safety.md) and [agent-state-persistence](../topics/agent-state-persistence.md) define the invariants; this concept asserts them. [simulated-user-eval](simulated-user-eval.md) is the conversational-behavior counterpart for a *chatting* agent.
