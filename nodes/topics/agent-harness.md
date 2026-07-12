---
id: agent-harness
type: topic
tags: [agent, harness, runtime, orchestration, system-design, engineering-excellence]
summary: "the whole system wrapping a base model — loop, context, tools, state, permissions, eval — named as ONE engineered artifact; the umbrella over the loop/context/tool/state/eval topics and the debate over what belongs in the harness vs the model."
related:
  - [[references-task-agent-design]]
  - [[agent-control-loop]]
  - [[context-engineering]]
  - [[tool-use-design]]
  - [[action-execution-safety]]
  - [[agent-memory]]
  - [[agent-state-persistence]]
  - [[multi-agent-delegation]]
  - [[llm-evaluation]]
  - [[self-improving-harness]]
  - [[managed-agent-apis]]
status: living
created: 2026-07-10
---

# Agent Harness

The **harness** is the whole software system surrounding a base model — "the system surrounding a base model that orchestrates execution and decides how the model thinks and plans, calls tools and acts, perceives and manages context, stores artifacts, and evaluates results." It is a *superset* of the classic "agent = LLM + memory + tools + planning" formula, adding **workflow design (loop engineering), evaluation, permission controls, and persistent state management** — work that is "no longer only prompt templates, but closer to runtime and software system design." (Framing: Lilian Weng, *Harness Engineering for Self-Improvement*, [lilianweng.github.io](https://lilianweng.github.io/posts/2026-07-04-harness/), 2026-07-04 — a blog framing, **not** peer-reviewed. The five verbs in that definition are prose, not a numbered taxonomy Weng publishes.)

The load-bearing design principle is an **operating-system analogy**: like an OS, "a harness should encapsulate complicated logic while keeping the interface simple." The harness hides the loop, context management, tool layer, state store, and permission checks behind a simple interface for both the model and the operator.

## Why this is its own topic (and what it is NOT)

Every other topic in this cluster owns one *mechanism* of a running agent — the loop ([agent-control-loop](agent-control-loop.md)), what the model sees ([context-engineering](context-engineering.md)), how it acts ([tool-use-design](tool-use-design.md)), how it stays safe ([action-execution-safety](action-execution-safety.md)), how it remembers ([agent-memory](agent-memory.md)), how it persists ([agent-state-persistence](agent-state-persistence.md)), how it splits work ([multi-agent-delegation](multi-agent-delegation.md)), how it is scored ([llm-evaluation](llm-evaluation.md)). This topic adds the **gestalt**: the claim that these are not independent modules but *facets of one deployable, configurable artifact* that must be co-designed, and it names the boundary — where the harness ends and the base model begins.

**This node deliberately owns no mechanism.** It does not re-describe loops, compaction, sandboxes, or delegation — each is linked below. Its non-duplicative content is (1) the naming/OS-analogy framing, (2) the harness-vs-framework-vs-agent boundary, (3) the pattern catalog as an index, and (4) the harness-vs-core-intelligence debate. For the *self-improvement* loop that treats the harness as an optimization target, see [self-improving-harness](../concepts/self-improving-harness.md) — the ladder and propose-evaluate-accept mechanics live there, not here.

## Harness vs framework vs bare agent

| Layer | What it is | Framing |
|---|---|---|
| **Bare agent** | `LLM + memory + tools + planning + action` | the 2023 formula; a loop wrapping a model call |
| **Framework** | a library of abstractions / prompt templates you compose | "prompt-template" altitude; Weng contrasts by *characterization*, not by naming specific libraries |
| **Harness** | the runtime + software-system tying loop, context, tools, state, permissions, and eval into one configurable deployable unit | "closer to runtime and software system design"; the thing an operator ships and a self-improvement loop edits |

The canonical case study is the **coding agent**. Weng claims the core interface has "stabilized" across Claude Code / Codex / OpenCode / Cursor-style agents onto a converged tool taxonomy (file system, shell, IO, external context/MCP, web search, artifacts, backend jobs, agent delegation). *Verified only for Claude Code* (settings.json owns allow/ask/deny permissions, PreToolUse/PostToolUse/Stop hooks, CLAUDE.md + session + checkpoint state) — the cross-product "convergence" and the **standardization prediction** are forward-looking framing, not measured results.

## The design-pattern catalog (index — mechanism lives in the linked nodes)

| Pattern | What it is | Owning node(s) |
|---|---|---|
| **Filesystem as memory** | write durable state/artifacts to files, read on demand, vs accumulating in-window; Manus's "restorable compression" — drop the payload, keep the pointer (path/URL) so shrinking context is lossless | [context-storage-and-hydration](../concepts/context-storage-and-hydration.md); contrast [context-compaction](../concepts/context-compaction.md) (the lossy alternative); [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) (how file ops run) |
| **Workflow automation / loop engineering** | how much control lives in dev code vs the model — the workflow↔agent spectrum — plus goal-oriented plan→execute→observe→improve loops with durable checkpoints | [agent-control-loop](agent-control-loop.md), [plan-execute-replan](../concepts/plan-execute-replan.md), [step-budget-and-runaway-control](../concepts/step-budget-and-runaway-control.md), [stop-and-yield-conditions](../concepts/stop-and-yield-conditions.md) |
| **Sub-agents & backend jobs** | make parallelism explicit and inspectable — spawn/wait/list/close/interrupt sub-agents whose state lives in files/logs, not transient chat context | [multi-agent-delegation](multi-agent-delegation.md), [subagent-context-isolation](../concepts/subagent-context-isolation.md), [when-to-delegate](../concepts/when-to-delegate.md), lifecycle → [run-state-model](../concepts/run-state-model.md) |

The genuinely *under-covered* slice is **async/detached backend jobs** — a supervisor that keeps jobs alive without an attached terminal, worktree-per-job concurrency isolation, scheduled work, and a multi-job registry. The delegation nodes model the *decision* to delegate and single-run state; the *job-lifecycle runtime across many concurrent detached jobs* is a frontier gap no node yet owns.

## The harness-vs-core-intelligence debate

Should any of this exist, or will scaling absorb it?

- **Dissolve (Sutton's "Bitter Lesson"):** general methods leveraging computation — search and learning — repeatedly beat hand-engineered structure. Today's planning loops, compaction heuristics, and workflow code are the "human structure" that better models may eat, as manual prompt tricks faded after instruction tuning.
- **Persist (Weng, framing):** "harness improvement enables better deployment of the model **but intelligence is still the core**." Some functions internalize into weights, but "the interface with external context and tools should remain," and specifying goals, constraints, context, and evaluation does not disappear.

**Empirical hinge (established):** STOP ([arXiv:2310.02304](https://arxiv.org/abs/2310.02304), COLM 2024) self-improves *scaffolding code* (weights unchanged) and works only with a capable base — GPT-4 improves monotonically, GPT-3.5 degrades (only 12% of runs gained ≥3%). Capability, not scaffolding, is the binding constraint. Practitioner corollary: add harness complexity "only when it demonstrably improves outcomes." Builder takeaway: treat intra-loop heuristics (context tricks, planning cleverness) as **transient**; the durable investments are the tool/context *interface*, permission boundaries, evaluation, and durable state.

## Connections

- **Down (mechanisms):** the eight sub-topics and the pattern-catalog concepts above — this topic only wires them.
- **The optimization loop:** [self-improving-harness](../concepts/self-improving-harness.md) makes the harness *itself* the optimization target. This umbrella is the **static** framing; that concept is the **dynamic** one.
- **The interface:** [decision-engine-contract](../concepts/decision-engine-contract.md) is the per-step wire format across the harness/model boundary — the concrete instance of the OS-analogy "simple interface."

## The one rule

**Name the boundary.** For any capability, be able to say whether it lives in the harness (you build, configure, and can edit it) or in the model (you wait for it). Over-engineer nothing the model will internalize; harden the interface, permissions, state, and evaluation that persist regardless of how capable the model gets. A harness you can't draw the edge of is one you'll either keep patching against model weakness or find silently obsoleted by the next model.
