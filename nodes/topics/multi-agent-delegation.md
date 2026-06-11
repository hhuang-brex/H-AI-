---
id: multi-agent-delegation
type: topic
tags: [agent, multi-agent, delegation, sub-agent, orchestration, engineering-excellence]
summary: "splitting work across sub-agents — when delegation earns its cost, how to isolate their context, and how to merge results without trusting them blindly."
related:
  - [[worked-example-chatting-task-agent]]
  - [[agent-control-loop]]
  - [[task-planning]]
  - [[context-engineering]]
  - [[when-to-delegate]]
  - [[subagent-context-isolation]]
  - [[result-aggregation-and-trust]]
  - [[escalation-handoff]]
  - [[engine-vs-conversation-routing]]
status: living
created: 2026-06-11
---

# Multi-Agent Delegation

One agent can spawn others to do scoped pieces of a task — a researcher fans out readers over sources, a coordinator splits a migration across files. Multi-agent delegation is the discipline of deciding *when* that split is worth its substantial cost, *how* to give each sub-agent exactly the context it needs and no more, and *how* to merge results you can't blindly trust. The default answer is usually "don't" — delegation is powerful and over-used.

## Delegation is not the neighbors

| Already covered | This topic instead |
|---|---|
| Handing to a *human* ([escalation-handoff](../concepts/escalation-handoff.md)) | Handing to another *agent* |
| Engine vs. chat-layer routing ([engine-vs-conversation-routing](../concepts/engine-vs-conversation-routing.md)) | One agent dispatching sub-agents |
| A single agent's loop ([agent-control-loop](agent-control-loop.md)) | A *coordinator* loop over child loops |

## The three decisions

| Decision | Failure if wrong | Concept |
|---|---|---|
| Should this be one agent or many? | Needless cost/latency, or a single overloaded context | [when-to-delegate](../concepts/when-to-delegate.md) |
| What context does each sub-agent get? | Leaked state, bloated children, cross-contamination | [subagent-context-isolation](../concepts/subagent-context-isolation.md) |
| How do you combine and trust their outputs? | A confident-but-wrong child poisons the result | [result-aggregation-and-trust](../concepts/result-aggregation-and-trust.md) |

## The governing principle: delegate for isolation, not for verbs

The right reason to spawn a sub-agent is **context isolation** — a child gets a clean, scoped window to do one thing without the parent's accumulated history diluting it, and returns a compact result instead of dumping its working context back. The *wrong* reason is anthropomorphic decomposition ("a planner agent, a writer agent, a critic agent") imposed because it sounds organized. If the pieces share state and run sequentially, they're functions, not agents — keep them in one loop. Spawn when the work is genuinely independent (parallelizable) or genuinely needs a fresh context.

## When delegation actually pays

- **Parallel independent work** — N sources to read, N files to migrate; children run concurrently, wall-clock drops.
- **Context isolation** — a sub-task that would pollute the parent's window with detail the parent never needs again.
- **Adversarial separation** — a verifier child that must judge without seeing the generator's reasoning (independence is the point).

If none hold, a single [agent-control-loop](agent-control-loop.md) with good [context-engineering](context-engineering.md) is simpler, cheaper, and easier to debug. YAGNI applies hard.

## Connections

- **Planning:** the coordinator's plan ([task-planning](task-planning.md)) is what gets split into sub-agent assignments; the dependency structure decides what can fan out vs. must serialize.
- **Context:** each spawn is a context-assembly decision ([context-engineering](context-engineering.md)) — the child's prompt is constructed, not inherited wholesale.
- **Science excellence:** delegation's wins (parallel speedup, isolation) and costs (token multiplication, merge errors) are *measurable* — benchmark one-agent vs. many before committing to the topology.
