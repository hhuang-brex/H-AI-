---
id: tool-use-design
type: topic
tags: [agent, tool-use, function-calling, tool-schema, action]
summary: "how an agent acts on the world through tools — schema design, selection, and grounding results back into the loop."
related:
  - [[references-task-agent-design]]
  - [[worked-example-chatting-task-agent]]
  - [[action-execution-safety]]
  - [[task-agent-pattern]]
  - [[agent-control-loop]]
  - [[tool-schema-design]]
  - [[tool-selection-and-routing]]
  - [[tool-result-grounding]]
  - [[forced-tool-call-output]]
  - [[action-authority]]
  - [[output-surface-taxonomy]]
status: living
created: 2026-06-11
---

# Tool-Use Design

Tools are the agent's hands. The control loop ([agent-control-loop](agent-control-loop.md)) decides *that* it should act; tools are *how* it acts — querying a database, calling an API, sending a message, running code. Designing tools well is the difference between an agent that reliably gets things done and one that calls the wrong function, misreads the result, or floods its own context with junk.

## Tool-use is not output-formatting

A common confusion: [forced-tool-call-output](../concepts/forced-tool-call-output.md) uses the *tool-call mechanism* to constrain what the model emits to a user. That's an **output** concern — the "tool" is a formatting envelope, and nothing executes. Tool-*use* is an **action** concern: the model picks a real tool, real code runs, and a real result comes back into the loop. Same wire mechanism (function calling), opposite purpose. This topic is about the action side.

## The three decisions

| Decision | Failure if wrong | Concept |
|---|---|---|
| How is each tool defined? | Model can't tell when/how to call it; malformed args | [tool-schema-design](../concepts/tool-schema-design.md) |
| Which tool (of many) fires, and when? | Wrong tool; or paralysis with 40 tools in context | [tool-selection-and-routing](../concepts/tool-selection-and-routing.md) |
| How does the result re-enter the loop? | Context bloat; the model can't act on what came back; errors look like success | [tool-result-grounding](../concepts/tool-result-grounding.md) |

## Where authority lives

A tool that *reads* and a tool that *acts irreversibly* are different risk classes. The tool layer is exactly where authority gets enforced — not the prompt. See [action-authority](../concepts/action-authority.md) (tiered authority enforced at the tool boundary) and [hard-surface-irrevocability](../concepts/hard-surface-irrevocability.md) (some tool calls can't be taken back). A well-designed tool surface makes the dangerous actions structurally distinct from the safe ones.

## Connections

- **Loop:** tools are what [agent-control-loop](agent-control-loop.md) invokes each iteration; tool results are the "observe" half of perceive-reason-act.
- **Surfaces:** a tool that emits to a user is also an output surface — see [output-surface-taxonomy](../concepts/output-surface-taxonomy.md). Classify whether a tool reads, computes, or emits.
- **Context:** tool results are the fastest way to blow your context budget. [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) keeps large results out of the model entirely.
- **Eval:** correct tool *sequences* are a trajectory property — [agent-trajectory-eval](../concepts/agent-trajectory-eval.md).
