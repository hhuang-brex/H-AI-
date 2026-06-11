---
id: task-planning
type: topic
tags: [agent, planning, task-decomposition, replanning, task-agent]
summary: "turning a goal into an ordered set of actions and adapting when reality diverges from the plan."
related:
  - [[worked-example-chatting-task-agent]]
  - [[task-agent-pattern]]
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[goal-decomposition]]
  - [[plan-execute-replan]]
  - [[decision-engine-contract]]
  - [[agent-trajectory-eval]]
status: living
created: 2026-06-11
---

# Task Planning

The "task" in *task agent* is the goal; planning is how the agent gets from goal to ordered actions, and — more importantly — how it adapts when an action fails or reality turns out different from what it assumed. Without planning, an agent is purely reactive: it can answer "what's the next step?" but never "what's the shape of the whole job, and am I still on track?"

## When you actually need a planner

Not every agent needs explicit planning. A single-tool, single-step agent ("look up this expense and reply") needs none — the [agent-control-loop](agent-control-loop.md) alone suffices. Planning earns its complexity when:

- the goal requires **multiple dependent steps** (do B only after A succeeds),
- steps can **fail and require a different approach**, not just a retry,
- the user needs to **see and approve the plan** before execution, or
- the agent must **resume** a partially-done task later.

If none of these hold, skip the planner — a plan you never replan is just an over-engineered loop. (YAGNI applies hard here.)

## The two decisions

| Decision | Failure if wrong | Concept |
|---|---|---|
| How do you break a goal into steps? | Steps too coarse (unactionable) or too fine (brittle, slow) | [goal-decomposition](../concepts/goal-decomposition.md) |
| What happens when a step fails or the world changed? | Agent blindly continues a dead plan, or restarts from scratch | [plan-execute-replan](../concepts/plan-execute-replan.md) |

## Plan as data, not prose

A plan the agent can *act on* and *resume* must be structured — an ordered list of typed steps with dependencies and status, not a paragraph of intentions. This is the same discipline as [decision-engine-contract](../concepts/decision-engine-contract.md): the plan is a wire format that the loop, the UI, and the audit trail all read. A plan that lives only inside a model's prose reasoning can't be checkpointed, shown to a user, or replayed.

## Connections

- **Loop:** the planner sets the agenda; [agent-control-loop](agent-control-loop.md) executes it step by step and feeds outcomes back for replanning.
- **Tools:** each plan step usually resolves to one or more tool calls — see [tool-use-design](tool-use-design.md).
- **Human-in-the-loop:** an explicit plan is the natural artifact to show a user for approval before acting (a major reason to make planning explicit even when the agent could go implicit).
- **Eval:** plan quality is a trajectory property — did the agent take a sensible path, not just reach a correct end-state? See [agent-trajectory-eval](../concepts/agent-trajectory-eval.md).
