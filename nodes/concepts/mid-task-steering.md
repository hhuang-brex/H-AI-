---
id: mid-task-steering
type: concept
tags: [agent, human-in-the-loop, steering, correction, interrupt, engineering-excellence]
summary: "handling a user message that arrives while the agent is working — classify it as redirect, refinement, abort, or chatter, then replan accordingly."
related:
  - [[human-in-the-loop-control]]
  - [[interrupt-and-resume]]
  - [[plan-execute-replan]]
  - [[intent-and-disambiguation]]
  - [[perceive-reason-act-loop]]
status: living
created: 2026-06-11
---

# Mid-Task Steering

A chatting task agent will receive user messages *while it is mid-task* — not just at clean turn boundaries. "Actually, make it the Tuesday one." "Wait, stop." "How long will this take?" Steering is recognizing what such an interjection means and adjusting the in-flight task accordingly, instead of either ignoring it (rude, dangerous) or blindly restarting (wasteful, loses progress).

## Classify the interjection first

A mid-task message is not automatically a new task. Classify it — this is [intent-and-disambiguation](intent-and-disambiguation.md) applied to the in-flight context:

| Class | Example | Response |
|---|---|---|
| **Redirect** | "no, the Tuesday charge, not Monday" | Revise the plan; keep valid work |
| **Refinement** | "and also flag anything over $100" | Extend the plan; continue |
| **Abort** | "stop", "cancel that" | Halt; see [interrupt-and-resume](interrupt-and-resume.md) |
| **Query** | "how long will this take?" | Answer without disturbing the task |
| **Chatter** | "thanks!" | Acknowledge; don't perturb the plan |

The expensive mistake is treating every interjection as a redirect (constantly replanning on "thanks") or treating a redirect as chatter (plowing ahead on the wrong target).

## Steering is perception injected mid-loop

In [perceive-reason-act-loop](perceive-reason-act-loop.md), a steering message is an out-of-band update to the agent's perception between iterations. The loop must check for it at a safe point — *between* steps, never mid-irreversible-action — and fold it into the next perception. An agent that only reads user input at the start of a run can't be steered at all.

## Redirect → replan, don't restart

When the steer is a genuine redirect, the right response is a *replan* ([plan-execute-replan](plan-execute-replan.md)) that keeps the still-valid prefix of work and fixes the diverged part — not a full restart. "Make it Tuesday not Monday" should not re-run the five steps that had nothing to do with the day. Restart-on-steer is the wasteful failure that also risks repeating side effects.

## Honor the steer before the next irreversible step

The safe checkpoint to apply a steer is exactly where confirm-before-act gates live: just before an irreversible action. A redirect that arrives while the agent is about to send the wrong SMS must be applied *before* the send, not after. Coordinate steering checks with the [confirm-before-act](confirm-before-act.md) gate.

## Pitfalls

- **No mid-run input check.** The agent can't be steered; users shout into the void until it's too late.
- **Everything is a redirect.** Replanning on "ok cool" — thrashing.
- **Steer applied after the irreversible step.** The correction lands one action too late.
- **Restart on redirect.** Discarding valid progress and risking repeated side effects.

## References

[interrupt-and-resume](interrupt-and-resume.md) is the abort/pause case of steering; [plan-execute-replan](plan-execute-replan.md) is how a redirect is absorbed without restarting.
