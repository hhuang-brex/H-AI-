---
id: stop-and-yield-conditions
type: concept
tags: [agent, control-loop, termination, human-in-the-loop, yield]
summary: "the three ways a loop can end — done, blocked-needs-user, or failed — and why 'yield to user' is distinct from 'stop'."
related:
  - [[human-in-the-loop-control]]
  - [[agent-control-loop]]
  - [[perceive-reason-act-loop]]
  - [[step-budget-and-runaway-control]]
  - [[turn-taking-and-proactivity]]
  - [[escalation-handoff]]
status: living
created: 2026-06-11
---

# Stop-and-Yield Conditions

A loop that can't stop is a hang; a loop that stops wrong either gives up too early or acts when it should have asked. Every control loop needs explicit, enumerable end conditions — and the most-missed one is *yield*, which is not the same as *stop*.

## Three terminal outcomes, plus one suspension

| Outcome | Meaning | What happens next |
|---|---|---|
| **Done** | Goal achieved; success criteria met | Return result; loop ends |
| **Failed** | Goal unreachable; retries/replans exhausted | Report failure honestly; loop ends |
| **Blocked** | Can't proceed without input the agent doesn't have | **Yield** to user — loop *suspends*, not ends |

The first two are *stops* (the run is over). **Blocked → yield** is a *suspension*: the agent hands control back, the user supplies what's missing, and the loop resumes from where it paused. Treating "blocked" as a stop is why agents either guess (act without the needed input) or fail (give up on a recoverable situation).

## When to yield vs. when to push on

This is the central judgment, and it maps to authority and reversibility:

- **Yield** when the next action is irreversible and the agent lacks confidence ([hard-surface-irrevocability](hard-surface-irrevocability.md)), when required information is genuinely absent (not just inconvenient to fetch), or when the user asked to be consulted.
- **Push on** when the action is reversible, cheap, and the agent has enough to proceed. Yielding on every minor uncertainty produces a useless agent that asks before every step.

The asymmetry from conversation design applies: cost-of-acting-wrong ≫ cost-of-asking, *but only for high-stakes actions*. For low-stakes reversible ones, the asymmetry flips — asking is the annoyance. See [turn-taking-and-proactivity](turn-taking-and-proactivity.md).

## Success criteria must be stated up front

"Done" is only checkable if you defined it before the loop ran. An agent that decides mid-run whether it's done will rationalize completion. Derive the stop condition from the goal at plan time, not at the model's discretion each turn.

## Pitfalls

- **No blocked state.** Loops with only done/failed force the model to either hallucinate missing inputs or fail recoverable tasks.
- **Yield that loses state.** If resuming after a yield restarts the task, users won't tolerate being asked. Yield requires durable run state.
- **Model-judged "done" with no external check.** Pair the model's self-assessment with a deterministic success check where one exists ([golden-snapshot-eval](golden-snapshot-eval.md) style).
- **Escalation conflated with failure.** Handing off to a human ([escalation-handoff](escalation-handoff.md)) is a *yield to a different party*, not a failure.

## References

[escalation-handoff](escalation-handoff.md) is the human-handoff form of yield; [step-budget-and-runaway-control](step-budget-and-runaway-control.md) is the *involuntary* stop when a run exceeds its budget.
