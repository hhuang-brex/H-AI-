---
id: human-in-the-loop-control
type: topic
tags: [agent, human-in-the-loop, control, approval, steering, engineering-excellence]
summary: "the interaction patterns that keep a human in an agent's action loop — confirm before acting, steer mid-task, interrupt and resume."
related:
  - [[agent-control-loop]]
  - [[task-agent-pattern]]
  - [[confirm-before-act]]
  - [[mid-task-steering]]
  - [[interrupt-and-resume]]
  - [[stop-and-yield-conditions]]
  - [[action-authority]]
  - [[hard-surface-irrevocability]]
status: living
created: 2026-06-11
---

# Human-in-the-Loop Control

A task agent that can chat is not autonomous — the chat *is* the control channel. Human-in-the-loop (HITL) control is the set of interaction patterns that let a person stay in command of an agent that acts: approve an action before it fires, redirect the agent mid-task when it's going the wrong way, and pause or abort a run in flight. This is the difference between an agent that *does things to* the user and one that *works with* them.

## What this topic is NOT

The graph already covers neighboring pieces — this topic is specifically the *interaction loop*, not these:

| Already covered | This topic instead |
|---|---|
| *When* the loop yields ([stop-and-yield-conditions](../concepts/stop-and-yield-conditions.md)) | *How* the human interacts at that yield point |
| *What* the agent is allowed to do ([action-authority](../concepts/action-authority.md)) | *How* permission is requested and granted in the moment |
| *Handing off* to a human agent ([escalation-handoff](../concepts/escalation-handoff.md)) | Keeping the *same* user in the loop, not transferring |
| *Irreversible* channels ([hard-surface-irrevocability](../concepts/hard-surface-irrevocability.md)) | The confirm gate that protects them |

## The three patterns

| Pattern | Question it answers | Concept |
|---|---|---|
| Confirm-before-act | Should I do this, or ask first? | [confirm-before-act](../concepts/confirm-before-act.md) |
| Mid-task steering | The user said something while I was working — now what? | [mid-task-steering](../concepts/mid-task-steering.md) |
| Interrupt & resume | Stop / pause / abort a run already in flight | [interrupt-and-resume](../concepts/interrupt-and-resume.md) |

## The governing principle: control scales with consequence

The amount of human control a step demands is proportional to its reversibility and blast radius. A read is silent. A reversible write is propose-and-proceed. An irreversible, high-blast-radius action ([hard-surface-irrevocability](../concepts/hard-surface-irrevocability.md)) demands explicit confirmation. Putting a confirm gate on *every* action produces a useless agent that asks before breathing; putting one on *no* action produces a dangerous one. The art is matching the gate to the consequence — see [confirm-before-act](../concepts/confirm-before-act.md).

## Connections

- **Loop:** HITL is how a human participates in [agent-control-loop](agent-control-loop.md). A confirm gate is a deliberate yield ([stop-and-yield-conditions](../concepts/stop-and-yield-conditions.md)); steering is an out-of-band perception injected mid-loop; interrupt is an external stop signal.
- **Planning:** an explicit plan ([task-planning](task-planning.md)) is the natural artifact to show for approval *before* execution — approve the plan, not just each step.
- **State:** interrupt-and-resume is impossible without durable run state; pausing that loses progress is just a slow failure.
- **Chat surface:** every HITL exchange happens over the conversation surface — its phrasing is conversation design ([domain-chatbot-design](domain-chatbot-design.md)), its envelope is output design ([llm-output-design](llm-output-design.md)).
