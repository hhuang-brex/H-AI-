---
id: agent-control-loop
type: topic
tags: [agent, control-loop, react, orchestration, task-agent]
summary: "the iteration that turns an LLM into an agent — perceive, reason, act, observe — plus when to stop, yield, and bound runaway."
related:
  - [[agent-state-persistence]]
  - [[action-execution-safety]]
  - [[human-in-the-loop-control]]
  - [[task-agent-pattern]]
  - [[tool-use-design]]
  - [[task-planning]]
  - [[context-engineering]]
  - [[perceive-reason-act-loop]]
  - [[stop-and-yield-conditions]]
  - [[step-budget-and-runaway-control]]
  - [[decision-engine-contract]]
  - [[llm-observability]]
status: living
created: 2026-06-11
---

# Agent Control Loop

What separates an *agent* from a *chatbot* is the loop. A chatbot answers one turn and stops. An agent iterates — it observes state, decides on an action, executes it, observes the result, and repeats until the goal is met or it must yield. The control loop is the spine that everything else hangs from: tools are what the loop calls, plans are what the loop follows, the conversation is one of the loop's I/O channels.

## Why this is its own topic

Teams routinely build a "task agent" by wrapping a model call in a `while` loop and discover the hard problems only in production: the loop never terminates, it burns the token budget on a single stuck step, it acts when it should have asked, or it silently gives up mid-task. These are not prompt problems — they are *loop-design* problems, and they have known shapes.

The conversation-design topics ([domain-chatbot-design](domain-chatbot-design.md)) tell you *what to say*. The output topics ([llm-output-design](llm-output-design.md)) tell you *how to emit*. This topic tells you *when to act, when to stop, and when to hand control back to the user* — the part that makes the agent an agent.

## The three decisions every loop makes

| Decision | Failure if wrong | Concept |
|---|---|---|
| What's the next action, given current state? | Wrong action, or thrashing between actions | [perceive-reason-act-loop](../concepts/perceive-reason-act-loop.md) |
| Should the loop continue, halt, or yield to the user? | Infinite loop, premature give-up, or acting when it should ask | [stop-and-yield-conditions](../concepts/stop-and-yield-conditions.md) |
| How much is this loop allowed to spend? | Runaway cost; a single task drains the budget | [step-budget-and-runaway-control](../concepts/step-budget-and-runaway-control.md) |

## How it connects to the rest of the graph

- **Above:** [task-agent-pattern](task-agent-pattern.md) frames the agent as an engine that produces decisions; the control loop is *how* that engine runs over time. [decision-engine-contract](../concepts/decision-engine-contract.md) is the per-step output the loop consumes.
- **Sideways:** the loop calls tools ([tool-use-design](tool-use-design.md)) and follows plans ([task-planning](task-planning.md)). A loop with no plan is reactive; a plan with no loop is a static script.
- **Observability:** every loop iteration is a span. [llm-observability](../concepts/llm-observability.md) and [decision-audit-trail](../concepts/decision-audit-trail.md) are how you reconstruct why a loop did what it did — essential, because loop bugs are invisible in the final output.
- **Eval:** the loop's *trajectory* (not just its final answer) is what you score. See [agent-trajectory-eval](../concepts/agent-trajectory-eval.md).

## The one rule

**The loop must always be able to answer "why am I still running, and what would make me stop?"** If you can't state the stop condition and the budget for a given run, the loop is unsafe to ship — it will eventually run forever or quit early, and you won't know which until a user complains.
