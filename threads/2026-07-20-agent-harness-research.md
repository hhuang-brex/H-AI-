---
id: 2026-07-20-agent-harness-research
type: thread
tags: [meta, research, fan-out, agent-harness, gap-analysis, harness]
related:
  - [[agent-harness]]
  - [[self-improving-harness]]
  - [[background-agent-execution]]
  - [[harness-as-hyperparameter]]
  - [[managed-agent-apis]]
  - [[agent-control-loop]]
  - [[action-execution-safety]]
  - [[llm-evaluation]]
  - [[references-task-agent-design]]
status: snapshot
created: 2026-07-20
summary: "fan-out research to refresh agent-harness.md: 29 fetch-verified anchors, 6 deepenings (convergence-as-spectrum, async gap, debate→trilemma), 3 candidate nodes."
---

# Thread — Agent-Harness Research Fan-Out (2026-07-20)

## Goal

Refresh [agent-harness](../nodes/topics/agent-harness.md) (created 2026-07-10, anchored almost entirely on Lilian Weng's 2026-07-04 blog) with newer/adjacent, fetch-verified scholarship and primary sources. Method: a 5-lens web-search fan-out → per-URL adversarial verification (fetch-confirm title/authors/date, flag beyond-cutoff) → synthesis, deduped against what the node already cites.

## Run

- **31 unique candidates → 29 fetch-verified.** 156 tool calls, ~604k subagent tokens.
- **One lens blocked:** `async-backend-jobs` tripped a WebSearch deny-rule safety classifier ("web-search via delegated sub-agent"). Its territory was recovered by the coding-agent and permissions lenses (Claude Code workflows, Crab). **Process note:** a WebSearch deny rule is active in this session — fan-out research lenses should be phrased as "find/locate" and lean on WebFetch, not "web-search," to avoid the block.
- Every 2026 (beyond-cutoff) anchor below was re-fetched by hand on 2026-07-20 before this thread was written; pre-cutoff anchors were verified in-run.

## New anchors worth adding (verified 2026-07-20)

| Title | id / URL | Date | Facet | Finding (mechanism vs self-reported) |
|---|---|---|---|---|
| A harness for every task: dynamic workflows in Claude Code | claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code | 2026-06-02 | async gap; harness-as-artifact | PRIMARY (Anthropic, Shihipar & Bidasaria): Claude Code writes/orchestrates its own multi-agent harness at runtime; subagents in isolated worktrees, saveable to `~/.claude/workflows`. |
| Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes | arXiv:2604.28138 | 2026-04-30 | async gap; state | Mechanism: host-side runtime bridges agent-OS semantic gap for efficient C/R. Self-reported: recovery→100%, up to 87% less checkpoint traffic, within 1.9% of fault-free time. |
| Automated Discovery Has No Universally Superior Harness | arXiv:2607.18235 | 2026-07-20 | debate (third position) | Ablation argues harnesses have a "generalization problem" → treat harness choice as a **tunable hyperparameter** guided by early performance, not a fixed recipe. |
| From Prompts to Contracts: Harness Engineering for Auditable Enterprise LLM Agents | arXiv:2607.08028 | 2026-07-09 | debate (persist, empirical) | Shift deterministic logic into code/schemas/validators; experiments claim "only code-owned enforcement preserves both safety and utility" (model-substitution ablation). |
| Agentless: Demystifying LLM-based Software Engineering Agents | arXiv:2407.01489 | 2024-07 | debate (dissolve, empirical) | Fixed localize→repair→validate pipeline, no agent loop; canonical "complex scaffolding largely unnecessary" position. Cite as position, not a fixed number. |
| The Bitter Lesson Kills Your Orchestration Layer | loganlincoln.com/blog/bitter-lesson-kills-your-orchestration-layer | 2026-02-06 | debate (taxonomy) | Names **durable** (guardrails, audit, cost, HITL) vs **transient** (step-enforcement, output-retry, decomposition, routing) scaffolding; removability diagnostic. Percentages anecdotal. |
| mini-swe-agent | github.com/SWE-agent/mini-swe-agent | 2026-07 | convergence claim (line 44) | PRIMARY artifact: ~100-line harness, **bash as the only tool**, self-reported >74% SWE-bench Verified — competes with Weng's rich 8-tool taxonomy. |
| MemoHarness: Agent Harnesses That Learn from Experience | arXiv:2607.14159 | 2026-07-14 | harness-as-configurable-artifact | Adaptive framework optimizes the agent's "control layer" per test case from its own execution history; outperforms fixed configs (author-reported). |
| Do Agent Optimizers Compound? (Continual-Learning on Terminal-Bench 2.0) | arXiv:2607.14004 | 2026-07-15 | evaluation | Mechanism: harness-optimization gains compound only with regression control as inductive bias. Pass-rate ranking is vendor-authored — cite mechanism, not numbers. |
| What Twelve LLM Agent Benchmark Papers Disclose About Themselves | arXiv:2605.21404 | 2026-05-20 | evaluation | Disclosure audit: agent benchmarks score 0.38 vs 0.66 for classical static; "harness specification" is a top-2 gap. n=12, single-auditor. |

Pre-cutoff primaries the node **names but does not cite**, to add as reference entries: SWE-agent (arXiv:2405.15793, ACI/tool-layer), OpenHands (arXiv:2407.16741), SWE-bench (arXiv:2310.06770), Terminal-Bench (tbench.ai), Codex (openai.com/index/introducing-codex, 2025-05-16), METR "Guidelines for capability elicitation" (2024-03-15), beren "Scaffolded LLMs as natural language computers" (LessWrong, 2023-04-12).

## Deepenings for agent-harness.md

1. **Line 44 — convergence-as-spectrum.** The 8-tool taxonomy is not a converged standard: mini-swe-agent hits >74% with bash-only; SWE-agent shows the *ACI design*, not tool count, is what's ablated. Reframe as a live boundary from rich-taxonomy ↔ minimalism.
2. **Line 54 — fill the async frontier gap.** Reword "no node yet owns" → "emerging: worktree isolation + workflow registry ([Claude Code dynamic workflows]) and checkpoint/restore durability ([Crab]) exist; the multi-job supervisor abstraction is what's missing" — owned by [background-agent-execution].
3. **Lines 56–63 — debate binary → trilemma.** dissolve (Agentless) / persist (Contracts) / **adapt-online** (Hyperparameter paper). The third frame is genuinely new to the node.
4. **Line 63 — name the taxonomy.** Anchor transient-vs-durable to Lincoln's explicit split + removability diagnostic.
5. **Lines 26–32 — boundary lineage + "why".** beren's hardware/software analogy (origin) + METR elicitation (scaffolding materially moves *measured* capability → capability claims must attribute harness vs model). Reinforces "The one rule."
6. **Eval facet.** Reproducibility corollary: harness must be pinned to compare evals (disclosure audit + compounding paper; MemoHarness's control dimensions as a concrete decomposition).

## Candidate new nodes

- **`background-agent-execution`** (already in `related:` — flesh out): the async/detached-job supervisor. Cluster: Claude Code workflows + Crab + OpenHands.
- **`harness-as-hyperparameter`** (concept): optimal harness is problem/model-dependent → favor online adaptation over fixed commitment. Cluster: 2607.18235 + 2607.14004 + MemoHarness. A distinct third stance in the dissolve/persist debate.
- **`references-harness-evaluation`** (reference): substrates that isolate the harness as the studied variable — SWE-bench, Terminal-Bench, Agent-as-a-Judge (arXiv:2410.10934), disclosure audit, METR.
- Route to **[self-improving-harness]** (not the umbrella): Phantom Guardrails (arXiv:2607.13083 — documented negative result: proposer hallucinates failures + adds needless guardrails; strong "negative result is a finding" material), Self-Evolving GSME (2607.13683), AgentBreeder (2502.00757), Harness Handbook (2607.13285).

## Rejected / recorded

- **Nothing failed to resolve.** No negative-resolution result.
- **lowtouch.ai "Rethinking AI Agent Scaffolding"** — vendor marketing, no benchmarks. Reject.
- **AgentGuard (2502.09809)** — MOOC-hackathon feasibility report, no quantitative results. Too thin.
- **Before the Tool Call / OAP (2603.20953)** and **When Lower Privileges Suffice (2606.20023)** — solid, but belong to [action-execution-safety], not this umbrella.
- **Permission Manifests for Web Agents (2601.02371)** — external server-side manifest, pre-cutoff, outside coding-agent core scope. Note only.
- **The Second Half (Yao, 2025-04-10)** — good boundary essay but opinion; optional flavor for the debate section, not a required anchor.

## Next

Deepenings 1–6 and the `harness-as-hyperparameter` node are queued for follow-up passes (see the loop this thread was produced under).
