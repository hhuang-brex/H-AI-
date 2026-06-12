---
id: 2026-06-11-chatting-task-agent-buildout
type: thread
tags: [meta, agent, task-agent, knowledge-graph, build-out, loop, thread]
related:
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[task-planning]]
  - [[context-engineering]]
  - [[human-in-the-loop-control]]
  - [[action-execution-safety]]
  - [[agent-state-persistence]]
  - [[multi-agent-delegation]]
  - [[worked-example-chatting-task-agent]]
status: archived
created: 2026-06-11
summary: "the 7-pass /loop build-out that added the agent spine (8 topics, ~30 concepts, 1 worked example, 2 eval concepts) for building a chatting task agent."
---

# Thread — Chatting Task Agent Build-Out (2026-06-11)

Conversation goal: starting from "what topics are missing to build a task agent that can chat?", expand the graph to cover the full engineering spine of an acting, conversational agent — with an engineering-excellence and science-excellence lens. Driven by a recurring `/loop` prompt firing every 5 minutes.

## Method

A gap-analysis seeded the work: the graph was strong on the *conversation* half (domain-chatbot-design, llm-output-design, sms-multi-thread, eval) and had the decision-engine *contract* (task-agent-pattern cluster), but was missing the *action* half — the loop that calls tools, plans, and acts. Each `/loop` pass took the single highest-leverage remaining gap, built it as one topic + a tight concept set (YAGNI on concept count), wired it bidirectionally, and verified with `tools/build-graph.py` (zero-warning bar). Cross-cluster reuse over duplication throughout.

## What landed, pass by pass

| Pass | Tier | Added | Why it was the next gap |
|---|---|---|---|
| 1 | 1 | [agent-control-loop](../nodes/topics/agent-control-loop.md), [tool-use-design](../nodes/topics/tool-use-design.md), [task-planning](../nodes/topics/task-planning.md) + 8 concepts | The spine: an agent is a chatbot bolted to an action loop; the loop was absent. |
| 2 | 2 | [context-engineering](../nodes/topics/context-engineering.md) + 3 | Master lever for cost/latency/accuracy; every turn re-decides what the model sees. |
| 3 | 2 | [human-in-the-loop-control](../nodes/topics/human-in-the-loop-control.md) + 3 | "Able to chat" means the chat IS the control channel. |
| 4 | 2 | [action-execution-safety](../nodes/topics/action-execution-safety.md) + 3 | Promoted the twice-referenced dangling intent-marker; idempotency/rollback. |
| 5 | 3 | [agent-state-persistence](../nodes/topics/agent-state-persistence.md) + 3 | Three Tier-2 nodes leaned on durable run state nothing owned. |
| 6 | 3 | [multi-agent-delegation](../nodes/topics/multi-agent-delegation.md) + 3 | The last genuinely-new breadth topic. |
| 7 | depth | [worked-example-chatting-task-agent](../nodes/projects/worked-example-chatting-task-agent.md) | PIVOT: thread all 8 topics into one concrete agent instead of padding. |
| 8 | depth | [execution-invariant-testing](../nodes/concepts/execution-invariant-testing.md), [simulated-user-eval](../nodes/concepts/simulated-user-eval.md) | Connect the agent cluster back to llm-evaluation. |

Graph grew from 81 → 115 nodes (6 → 16 topics), zero warnings throughout (one same-turn back-edge fix in pass 6).

## The agent spine (reading order)

For someone building a chatting task agent, the cluster reads in this order:

1. [agent-control-loop](../nodes/topics/agent-control-loop.md) — the perceive/reason/act iteration; stop/yield/budget. The spine.
2. [tool-use-design](../nodes/topics/tool-use-design.md) — how the agent acts (schema, selection, result grounding).
3. [task-planning](../nodes/topics/task-planning.md) — goal→steps and replan; only when multi-step dependent.
4. [context-engineering](../nodes/topics/context-engineering.md) — what the model sees each turn; the cost/latency/accuracy lever.
5. [human-in-the-loop-control](../nodes/topics/human-in-the-loop-control.md) — confirm, steer, interrupt/resume.
6. [action-execution-safety](../nodes/topics/action-execution-safety.md) — idempotency, dry-run, rollback.
7. [agent-state-persistence](../nodes/topics/agent-state-persistence.md) — durable run state; checkpoint/resume.
8. [multi-agent-delegation](../nodes/topics/multi-agent-delegation.md) — when to split work (default: don't).

Then [worked-example-chatting-task-agent](../nodes/projects/worked-example-chatting-task-agent.md) threads all eight into one card-dispute triage agent, and [execution-invariant-testing](../nodes/concepts/execution-invariant-testing.md) + [simulated-user-eval](../nodes/concepts/simulated-user-eval.md) verify it.

## Recurring design judgments (the through-line)

- **Delegate for isolation, not for verbs; default is don't.** Most decomposition is functions in one loop, not agents.
- **Irreversible steps ordered last.** Recurs in planning, execution-safety, and the worked example — a mid-task failure should only leave undoable state.
- **At-least-once execution, exactly-once effect.** You can't guarantee one *call* across crashes; you engineer one *effect* via idempotency.
- **Assemble context, don't accumulate it.** The append-only transcript is the default that quietly breaks at scale.
- **Invariants are tests, not hopes.** Idempotency, crash-consistency, budget-bound are crash-injection-testable properties — the science-excellence backstop.

## Honest scoping note

Passes 1–6 each filled a real, namable gap. By pass 6 breadth was saturated; passes 7–8 deliberately pivoted to depth (worked example, eval) rather than mint marginal topics. This thread itself is pass 9's output — the AGENTS.md-required provenance record, written instead of padding the graph with a 17th topic. **The build-out is considered complete**; further `/loop` fires on this prompt should stop (recommend `CronDelete`) or be repointed at new scope (e.g., a runnable reference implementation of the worked example).

## Open follow-ups

- **Runnable reference implementation** of [worked-example-chatting-task-agent](../nodes/projects/worked-example-chatting-task-agent.md) — the pseudocode stubbed a real agent; building it is a separate project, not a graph node.
- **Per-locale / multi-channel** specifics (the agent cluster is channel-agnostic; SMS specifics live in the sms-* cluster — a Slack/web variant would test the abstraction).
- The cluster has no `reference` node yet (external papers on ReAct, reflexion, saga pattern, etc.) — a reading-list node would ground the concepts in primary sources.
