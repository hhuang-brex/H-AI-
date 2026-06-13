---
id: plan-execute-replan
type: concept
tags: [agent, planning, replanning, recovery, adaptation]
summary: "executing a plan step by step and revising it when a step fails or reality diverges — the difference between an agent and a script."
related:
  - [[references-task-agent-design]]
  - [[task-planning]]
  - [[goal-decomposition]]
  - [[agent-control-loop]]
  - [[step-budget-and-runaway-control]]
  - [[stop-and-yield-conditions]]
status: living
created: 2026-06-11
---

# Plan–Execute–Replan

A plan written once and followed blindly is a script. What makes an agent adaptive is the *replan*: execute a step, observe whether reality matches the plan's assumption, and revise the remaining plan when it doesn't. Replanning is where most of an agent's robustness — and most of its bugs — live.

## The cycle

```
make plan ──▶ execute next step ──▶ observe result
   ▲                                     │
   │                                     ▼
   └──── replan (if diverged) ◀──── on track? ──▶ continue
```

After each step the agent asks: did this do what the plan assumed? If yes, continue to the next step. If no, *replan* — revise the remaining steps given what actually happened. The plan is a living artifact, not a fixed program.

## Replan triggers

| Trigger | Right response |
|---|---|
| Step succeeded as expected | Continue to next step |
| Step failed, transiently (timeout, rate limit) | Retry the *same* step (bounded) |
| Step failed, structurally (wrong approach) | Replan the remaining subtree — a different path |
| World changed (new info from result) | Revise downstream steps that assumed the old state |
| Repeated identical failure | Stop or escalate — do **not** retry again |

The critical distinction is **retry vs. replan**. A transient failure warrants retrying the same action; a structural failure means the action was wrong and retrying it again will fail identically. Conflating the two produces the classic runaway: the agent re-issues a doomed call forever. This is exactly where [step-budget-and-runaway-control](step-budget-and-runaway-control.md)'s repeat-detection ties in.

## Replan, don't restart

When a step fails, revise the *remaining* plan — don't discard everything done so far and start over. Restart-on-failure throws away completed work and, if those steps had side effects, may repeat irreversible actions. Good replanning is local: keep the valid prefix, fix the broken part forward.

## Know when to stop replanning

Replanning can itself run away — endlessly generating new plans that all fail. Replanning is bounded by the same budget as the loop ([step-budget-and-runaway-control](step-budget-and-runaway-control.md)), and a goal that survives N replans without progress should resolve to *failed* or *blocked* ([stop-and-yield-conditions](stop-and-yield-conditions.md)), not an N+1th plan. Sometimes the right replan is "yield to the user."

## Pitfalls

- **Retry where replan was needed.** Same failing action, again, because the error didn't change the plan.
- **Restart where replan was needed.** Discarding completed steps — wasteful, and dangerous if steps had side effects.
- **Unbounded replanning.** New plan, new plan, new plan — a runaway in disguise.
- **Replanning on success.** Re-deriving the whole plan after a step that worked fine adds latency and instability. Only replan on divergence.

## References

[goal-decomposition](goal-decomposition.md) produces the plan this cycle executes; [agent-control-loop](../topics/agent-control-loop.md) is the loop that drives it; [step-budget-and-runaway-control](step-budget-and-runaway-control.md) bounds how long replanning may continue.
