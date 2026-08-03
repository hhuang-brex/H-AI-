---
id: references-harness-evaluation
type: reference
tags: [agent, harness, orchestration, fan-out, reading-list, evaluation, science-excellence]
summary: "verified primary sources grounding the agent-harness cluster — the dynamic-workflow concept (agent orchestrates its own fan-out), the minimalist vs rich-taxonomy harness projects, and the papers arguing harness-as-hyperparameter and code-owned enforcement."
related:
  - [[agent-harness]]
  - [[harness-as-hyperparameter]]
  - [[background-agent-execution]]
  - [[self-improving-harness]]
  - [[multi-agent-delegation]]
status: living
created: 2026-08-02
source-thread: [[2026-07-20-agent-harness-research]]
---

# References — Harness & Fan-Out Orchestration

Primary sources behind [agent-harness](../topics/agent-harness.md) and its fan-out / multi-agent-orchestration facet. The topic node is an *engineering distillation*; this list grounds it in the concept, the shipping projects, and the papers it descends from. Each entry below was fetched and its title/authors/date confirmed on the date noted — not recalled from memory. **Every 2026 entry is beyond the May-2026 knowledge cutoff; re-verify before citing externally.**

## The concept — an agent that writes its own fan-out harness

- **A harness for every task: dynamic workflows in Claude Code** — Thariq Shihipar & Sid Bidasaria, Anthropic (2026-06-02). https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code — The closest primary source to the fan-out-harness-as-DSL idea: Claude Code writes a JavaScript workflow that spawns and coordinates subagents, each with an isolated context window, and can decide which model each subagent uses and whether it runs in its own git worktree. Workflows are saveable/shareable (`~/.claude/workflows`). This is the runtime that a declarative fan-out config (topology: fan-out / pipeline / fan-in) would formalize. Directly behind [background-agent-execution](../concepts/background-agent-execution.md) and the "async/detached backend jobs" frontier in [agent-harness](../topics/agent-harness.md).

## The projects — the complexity spectrum, as shipping artifacts

- **mini-swe-agent** — SWE-agent team (2026-07). https://github.com/SWE-agent/mini-swe-agent — The minimalist pole: a ~100-line harness that gives the model **bash as its only tool** (no tool-calling API, so model-agnostic), self-reporting >74% on SWE-bench Verified. Refer to it as the counter-pressure on harness/DSL complexity — the "resist adding fields" argument in artifact form. Grounds the convergence-as-spectrum reframing in [agent-harness](../topics/agent-harness.md).

- **SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering** — Yang, Jimenez, Wettig, Lieret, Yao, Narasimhan, Press (2024). https://arxiv.org/abs/2405.15793 — The rich-taxonomy pole. Its key result for this cluster: the ablated variable is the *agent-computer interface (ACI) design*, not the tool *count* — so the open question is "how much tool surface a capable model needs," a boundary question, not "which N tools."

## The papers — is a configurable harness even the right shape?

- **Automated Discovery Has No Universally Superior Harness** — Gupta, Lei, Lu, Anumanchipalli, Choshen (2026-07-20). https://arxiv.org/abs/2607.18235 — The theory backing for a *configurable* fan-out DSL over a hardcoded pipeline: "discovery harnesses have a generalization problem: no fixed harness is reliably superior across the evaluated model-problem pairs," so "harness choice is better viewed as a hyperparameter rather than as a universal recipe," favoring online adaptation from early performance signals. The empirical spine of [harness-as-hyperparameter](../concepts/harness-as-hyperparameter.md).

- **From Prompts to Contracts: Harness Engineering for Auditable Enterprise LLM Agents** — Joongho Ahn & Moonsoo Kim (2026-07-09). https://arxiv.org/abs/2607.08028 — The direct argument for the DSL premise that gates/edges/schemas are *code-owned data, not prompt text*. In a model-fixed enforcement-layer ablation, prompt instructions alone let recommendation-language and trace-leakage violations reach the reader; an external guardrail blocked them but over-refused (utility 88/120 vs the harness's 120/120), so "only code-owned enforcement preserves both safety and utility" (author-reported, small private corpus). The pattern: deterministic behavior moves "into code, manifests, schemas, and validation artifacts around a replaceable composition boundary."

## How to read this list against the cluster

The concept (dynamic workflows) shows fan-out orchestration *shipping*; the two projects bracket the **how-much-harness** spectrum (bash-only ↔ rich ACI); the two papers argue the meta-point — that because no fixed harness generalizes, the durable move is to make topology and enforcement *configurable, code-owned data* and adapt it per problem. Together they justify treating a fan-out harness as a declarative artifact (named topology edges, severity-gated fan-in, pinned judge/agent config) rather than bespoke orchestration code — the same "name the boundary, harden what persists" rule the topic node closes on.

## Verification note

`claude.com` is a living page and may evolve; the GitHub repo is a moving artifact (pin a commit if citing a specific line count or benchmark number); arXiv IDs are stable but the 2026 IDs are beyond the assistant knowledge cutoff and were hand-fetched on 2026-08-02 (concept + both papers) and 2026-07-20 (projects, per [[2026-07-20-agent-harness-research]]). Re-verify before citing externally.
