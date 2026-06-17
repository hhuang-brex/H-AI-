---
id: offline-prompt-optimization
type: concept
tags: [eval, dspy, gepa, optimizer, prompt, agents]
related:
  - [[llm-evaluation]]
  - [[llm-as-judge]]
  - [[agent-trajectory-eval]]
  - [[agent-eval-improvement-tiers]]
  - [[dspy-domain-chatbot-cases]]
  - [[agentic-context-engineering-ace]]
  - [[context-engineering]]
  - [[verbal-reinforcement-vs-gradient-rl]]
status: living
created: 2026-06-15
summary: "improve an agent skill by searching prompt space offline, scored end-to-end by the real agent — not hand-tuning."
---

# Offline Prompt Optimization

Treat a skill's instruction text as a parameter and **search for a better version offline** with an optimizer (e.g. DSPy's GEPA or MIPROv2) instead of hand-tuning. The optimizer proposes candidate instructions; a metric scores each. The durable idea: the optimizer is an *offline tool*, never a runtime dependency, and the score comes from **running the real agent end-to-end**, not from a proxy on one isolated LM call.

A *skill* here is one playbook prompt that governs a multi-step flow (see [task-agent-pattern](../topics/task-agent-pattern.md)). The flow is how the playbook executes; the optimizable artifact is still a single block of prose.

## Wrap, don't rewrite

For a custom in-house agent, the optimizer doesn't need to *run* the agent — only to (1) propose a candidate and (2) read a score. So wrap the agent in a thin shim: `forward(conversation)` injects the candidate playbook, runs the real agent (real tools, real control loop), returns the transcript + final state. The optimizer never models the loop. This avoids reimplementing the agent in the optimizer's framework and keeps production untouched until a winning prompt is pasted back.

**Two ways to wrap.** (1) As a thin `dspy.Module` whose `forward()` calls the agent — needed for `dspy.GEPA`/`MIPROv2`, which optimize predictors that run *inside* a DSPy program. (2) Cleaner for an external agent: the standalone **`gepa-ai/gepa`** library's **`GEPAAdapter`** — you implement `evaluate()` (which runs *your* real agent as the rollout) and `make_reflective_dataset()`, and GEPA orchestrates while your code executes the agent, **no DSPy trace required**. It ships agent-targeted adapters for MCP (optimizes tool descriptions + system prompt), LangChain/LangGraph, and whole DSPy programs.

## Optimizer choice (DSPy)

DSPy optimizers tune one of three things: **few-shot demos** (`BootstrapFewShot` family), **instructions** (`COPRO`, `MIPROv2`, `SIMBA`, `GEPA`), or **weights** (`BootstrapFinetune`). The official size heuristic: ~10 examples → `BootstrapFewShot`, 50+ → `…WithRandomSearch`, 200+ → `MIPROv2` (longer runs to resist overfitting). Note the heuristic predates GEPA and undersells it.

- **Single prose playbook** → **GEPA** (reflective instruction evolution): selects from a *Pareto frontier* of candidates, reflects in natural language on failure traces, and mutates the instruction. *GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning* ([arXiv:2507.19457](https://arxiv.org/abs/2507.19457), ICLR 2026 Oral) beats RL (GRPO) by ~6% avg (up to 20%) at **up to 35× fewer rollouts**, and MIPROv2 by >10%. Its edge for you: it evolves instruction *text* and is sample-efficient — decisive when each eval is a full, expensive agent run.
- **Several distinct predictors, each input→output** → MIPROv2-style few-shot bootstrapping per predictor.

## The metric is the whole game

Optimization is only as good as the metric. Weight a **deterministic programmatic check** (right tool, right args, right final state) highest; use [llm-as-judge](llm-as-judge.md) for the rest; keep humans *out* of the loop but use them to calibrate the judge and spot-check the winner. Score against a **held-out test set** the optimizer never sees, behind a **regression gate** (must beat baseline *and* break zero critical cases). See [agent-eval-improvement-tiers](../projects/agent-eval-improvement-tiers.md).

**Make the metric return text, not just a number.** GEPA's metric returns a score *and* a textual feedback string — "Actionable Side Information," framed as the text analogue of a gradient. Richer feedback is *why* GEPA needs ~100–500 rollouts vs RL's 5k–25k+. So have your programmatic + judge layer emit *why* it failed ("skipped the confirmation step"), not just a scalar — that text is the optimization signal.

## Pitfalls

- **Coarse credit assignment.** One score for a whole multi-step flow can't localize *which* sentence caused a late-step failure — convergence is slower. Mitigate with feedback that points at *where* in the transcript it went wrong.
- **Reward hacking.** The agent games a weak judge. Weight programmatic checks highest; review final transcripts by hand.
- **Cost and noise.** Every candidate eval is a full agent run × N examples × many rounds; multi-call flows are noisy even with pinned temperature. Iterate on a subset, cap the budget, report score variance so you don't chase noise.
- **Diminishing returns.** Published gains are largest over *weak* baselines. Against an already hand-tuned playbook, expect modest lift — the durable value is a repeatable, regression-tested loop, not a one-time jump.
- **Black-box trace path (resolved — choose deliberately).** Reflective optimizers reflect best on a predictor's own input→output trace. `dspy.GEPA` needs the predictor to run inside a DSPy module (wrap it). For a purely external agent, use the standalone `gepa-ai/gepa` `GEPAAdapter` so *your* code runs the rollout and feeds back textual feedback — no DSPy execution needed. MIPROv2 has **no** external/feedback path; it is DSPy-trace-only.

## What the evidence actually shows

As of mid-2026, **no verified production case** improves a genuinely *multi-step tool-use agent's* skill with before/after task-success metrics. The closest public attempt — SpecterOps optimizing an `AGENTS.md` for a CTF agent via `optimize_anything` — was near-flat (−0.5%/+4%/+5%) and **explicitly overfit** on a tiny dataset. The real production wins are all **single-call**: Databricks information-extraction agents (GEPA, vendor benchmark), Dropbox Dash relevance judge, Decagon classifiers. Provenance discipline: separate **vendor-reported-on-own-benchmark** from **independently inspectable** (the GEPA paper, AutoPDL [arXiv:2504.04365](https://arxiv.org/abs/2504.04365)); a circulated "Hermes + ETH Zurich, 33–38% SWE-bench lift from GEPA" claim could not be sourced — treat as fabricated until proven. Production constants worth reusing (Decagon): **20–100 training examples** is often the sweet spot, a **frontier reflection model is required** (small models fail outright), and a prompt-length cap can buy ~4× compression at <1% accuracy cost.

## References

- Industry evidence and which DSPy primitives real teams used: [dspy-domain-chatbot-cases](../projects/dspy-domain-chatbot-cases.md).
- The structural counterpart — optimizing *what context the playbook assembles* rather than its prose: [agentic-context-engineering-ace](agentic-context-engineering-ace.md).
- Eval foundations this depends on: [agent-trajectory-eval](agent-trajectory-eval.md), [llm-as-judge](llm-as-judge.md), [adversarial-eval](adversarial-eval.md).
- Primary: GEPA [arXiv:2507.19457](https://arxiv.org/abs/2507.19457); DSPy [arXiv:2310.03714](https://arxiv.org/abs/2310.03714); `gepa-ai/gepa` (standalone, MIT).
