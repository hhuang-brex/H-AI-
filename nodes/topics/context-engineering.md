---
id: context-engineering
type: topic
tags: [agent, context, prompt-assembly, token-budget, engineering-excellence]
summary: "the discipline of deciding what the model sees each turn — assembly, budget, and compaction — the master lever for agent cost, latency, and accuracy."
related:
  - [[agent-memory]]
  - [[worked-example-chatting-task-agent]]
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[context-assembly-per-turn]]
  - [[context-budget-allocation]]
  - [[context-compaction]]
  - [[conversation-memory]]
  - [[domain-knowledge-injection]]
  - [[sms-context-windowing]]
status: living
created: 2026-06-11
---

# Context Engineering

Every turn of an agent loop re-decides what the model sees: the system instructions, the goal, relevant history, tool definitions, the last tool result, retrieved knowledge. Context engineering is the discipline of making that assembly deliberate instead of accidental. It is the single highest-leverage engineering practice for a production agent — it dominates cost (tokens are the bill), latency (tokens are the clock), and accuracy (the model can only reason over what's in the window).

## Why it's a discipline, not a detail

The naive agent appends everything to a growing transcript and resends it every turn. This works in a demo and fails in production three ways at once: the bill grows quadratically with conversation length, latency creeps up turn over turn, and accuracy *drops* as the relevant facts get buried in middle-of-context noise. None of these are model problems — they are assembly problems, and they're fixable with explicit policy.

The frame: treat the context window as a **managed budget**, not an append log. Each turn, you *construct* the prompt from parts, each part earning its place.

## The three decisions

| Decision | Failure if wrong | Concept |
|---|---|---|
| What goes into this turn's prompt? | Missing the fact the model needed; or drowning it in noise | [context-assembly-per-turn](../concepts/context-assembly-per-turn.md) |
| How is the token budget split and what gets evicted? | OOM the window; or evict the one thing that mattered | [context-budget-allocation](../concepts/context-budget-allocation.md) |
| How do you fit a long history into a short window? | Lose earlier decisions; or pay to resend everything | [context-compaction](../concepts/context-compaction.md) |

## Connections

- **Loop:** context assembly *is* the "perceive" step of [perceive-reason-act-loop](../concepts/perceive-reason-act-loop.md). A loop that doesn't re-assemble context each turn acts on stale perception.
- **Tools:** tool results are the fastest way to blow the budget; [tool-result-grounding](../concepts/tool-result-grounding.md) and [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) keep large results out of the window.
- **Memory:** [conversation-memory](../concepts/conversation-memory.md) is *what* to remember across turns/sessions; context-engineering is *how* that memory is selected into a given prompt. They compose.
- **Knowledge:** [domain-knowledge-injection](../concepts/domain-knowledge-injection.md) covers RAG / prompt-stuffing / structured-state as ways to get domain facts in; this topic is the budget and assembly logic around them.
- **SMS slice:** [sms-context-windowing](../concepts/sms-context-windowing.md) is the channel-specific instance of these decisions.

## The one rule

**You should be able to print, for any turn, exactly why each token is in the window.** If the prompt is "whatever accumulated," you've given up the lever. Construct it; account for it; evict deliberately.
