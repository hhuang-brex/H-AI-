---
id: manus-context-engineering
type: project
kind: snapshot
tags: [context-engineering, kv-cache, compaction, subagents, filesystem-memory, harness, case-study]
summary: "How Manus manages agent context, 2025–2026: KV-cache-first design, masked tools, restorable compaction, filesystem memory, isolated sub-agents, and what changed as the harness was rebuilt."
related:
  - [[context-engineering]]
  - [[agent-harness]]
  - [[context-compaction]]
  - [[context-storage-and-hydration]]
  - [[just-in-time-context]]
  - [[harness-token-economics]]
  - [[subagent-context-isolation]]
  - [[multi-agent-delegation]]
  - [[tool-selection-and-routing]]
  - [[agent-skills-progressive-disclosure]]
  - [[code-execution-sandbox-pattern]]
  - [[forced-tool-call-output]]
  - [[plan-execute-replan]]
  - [[context-budget-allocation]]
  - [[step-budget-and-runaway-control]]
  - [[experiential-memory-substrates]]
  - [[uber-agent-skills-at-scale]]
  - [[references-just-in-time-context]]
  - [[semantic-context-layer]]
status: snapshot
created: 2026-11-24
---

# Manus Context Engineering

Manus is a general-purpose agent that runs each task in a cloud sandbox and averages about 50 tool calls per task. Its team is unusually open about context management. This node collects what Manus itself has published, as of 2026-11-24. **Every number below is self-reported by Manus**, and none is independently reproduced.

## Sources

| Source | Date | Note |
|---|---|---|
| [Context Engineering for AI Agents: Lessons from Building Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus), Yichao "Peak" Ji | 2025-07-18 | The six lessons |
| [Context Engineering in Manus](https://rlancemartin.github.io/2025/10/15/manus/), Lance Martin's notes on a webinar with Ji | 2025-10-15 | Second-hand; I did not watch the [video](https://youtu.be/6_BcCthVvb8) |
| [Wide Research: Beyond the Context Window](https://manus.im/blog/manus-wide-research-solve-context-problem) | 2025-10-29 | No byline |
| [Introducing Manus 2.0](https://manus.im/blog/introducing-manus-2-0) | 2026-09-28 | Cascade harness |
| [Rebuilding Manus with Manus](https://manus.im/blog/rebuilding-manus-with-manus), Tao Zhang | 2026-10-30 | Internal use |
| [Projects That Learn](https://manus.im/blog/manus-projects-self-updating), [Branch](https://manus.im/blog/manus-branch), [Data agent](https://manus.im/blog/how-we-built-a-data-agent) | 2026-05-06, 07-09, 11-06 | Product posts |

All were fetched on 2026-11-24.

## The six 2025 lessons

| Lesson | Mechanism | Graph node |
|---|---|---|
| **Design around the KV cache** | A stable prefix (no timestamp at the top), append-only history, deterministic serialization. Input to output is about 100:1, and cached input costs $0.30/MTok against $3 uncached. Ji calls the hit rate "the single most important metric." | [harness-token-economics](../concepts/harness-token-economics.md) |
| **Mask, don't remove** | Never add or remove tools mid-task. A state machine masks token logits instead, and shared name prefixes (`browser_`, `shell_`) let it constrain a whole group at once. | [tool-selection-and-routing](../concepts/tool-selection-and-routing.md) |
| **Use the file system as context** | Files are unlimited, persistent memory. Compression stays "restorable": drop a page but keep its URL or path. | [context-storage-and-hydration](../concepts/context-storage-and-hydration.md) |
| **Recite to steer attention** | The agent rewrites a `todo.md` so its goals sit at the end of the context, where the model attends most. | [plan-execute-replan](../concepts/plan-execute-replan.md) |
| **Keep the wrong stuff in** | Leave failed actions and stack traces in context so the model avoids repeating them. | [context-compaction](../concepts/context-compaction.md) |
| **Don't get few-shotted** | Many near-identical action–observation pairs make the model copy the pattern. Vary templates and wording slightly. | [context-budget-allocation](../concepts/context-budget-allocation.md) |

## What the 2025 webinar added

According to Martin's notes:

- **Compaction before summarization.** Each tool result has a full form, saved to the sandbox, and a compact form: a file path. Older results are swapped for the compact form. Only when that stops helping does Manus summarize, using a fixed schema built from the full results. This is the restorable-first order that [context-compaction](../concepts/context-compaction.md) recommends.
- **Sub-agents for isolation, not roles.** A planner, a knowledge manager (decides what to save), and executors. Simple tasks pass only instructions; complex tasks share the planner's full context. Each sub-agent returns results through a `submit results` tool whose schema is enforced by constrained decoding ([forced-tool-call-output](../concepts/forced-tool-call-output.md)).
- **A layered action space.** Fewer than 20 atomic functions (shell, files, code). Most capabilities, including MCP tools, run as command-line programs in the sandbox. That keeps tool definitions out of the cached prefix ([code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md)).
- **Plain search.** `glob` and `grep` over files, with no vector index.
- **Recitation was costly.** About a third of actions once went to updating `todo.md`, so Manus moved planning to a planner agent. This revises the 2025 recitation lesson.
- **Watch for the harness holding the model back.** If a stronger model does not score higher in your harness, the harness may be the limit.

## Wide Research: one fresh context per item

A single agent researching a long list degrades. The post says quality falls after about five items and the agent starts inventing content past eight or nine. Wide Research gives each item its own sub-agent with a "fresh, empty context window," its own VM, and full tools. Sub-agents never talk to each other, and a controller merges their results. Below about 10 items, or for sequential work, one agent is cheaper. See [subagent-context-isolation](../concepts/subagent-context-isolation.md).

## 2026: what changed

| Change | What Manus says |
|---|---|
| **Cascade harness** (Manus 2.0) | Projects start light and load capabilities only when needed. In "one tested configuration": 23.2% fewer tokens, 28.2% less time, 32% lower cost. No internals published. |
| **Branch** | A fork copies the whole context so far into an isolated session. There is no merge. |
| **Projects that learn** | Lessons are saved as edits to project instructions, files, and skills. Changes need user approval. No separate memory store. |
| **Internal use** | "Better context did more for us than better prompts." Agents start from a repository map and past decisions. Roles are split (the triage agent "can't change code"), and humans approve merges. |
| **Data agent** | Built on a semantic map of what each metric means and which table answers what. Most fixes were "a missing knowledge base entry, or a fuzzy definition." |

## Lessons for a conversing task agent

The graph's synthesis, not Manus's claims:

1. **Treat the cache as a design constraint.** At about 100:1 input to output, prefix stability drives cost more than prompt length does. Put anything that changes per turn (timestamps, user state) at the end.
2. **Compact by pointer first, summarize last.** A path or record ID can be re-read; a summary cannot be undone.
3. **Keep the tool list fixed and limit by state.** Masking and shared name prefixes keep the prefix stable. Push rarely used capabilities behind a CLI or a skill.
4. **Keep errors in the context.** Hiding a failed call invites the model to retry it.
5. **Use a fresh context for each repeated item.** For batch work such as triaging 50 emails, run one sub-agent per item rather than one long context.
6. **Re-check techniques as models improve.** Manus rebuilt its harness repeatedly and dropped its own recitation trick. Retest when you change models.
7. **Give autonomy a finish line.** An unbounded weekend run left "more than 200 items" waiting for one person's decision ([step-budget-and-runaway-control](../concepts/step-budget-and-runaway-control.md)).

## Not verified

- The webinar claims come from a third party's notes, not from the recording.
- Manus has published nothing about Cascade's internals, its evaluation method, or how project memory is loaded and ranked.
- The quality curve in the Wide Research post ("items 9+") is illustrative, not a measured result.
