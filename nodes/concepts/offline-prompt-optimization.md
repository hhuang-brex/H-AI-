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
  - [[self-improving-harness]]
  - [[prompt-component-attribution]]
  - [[skill-text-authoring]]
  - [[worked-example-skillsv-valuation]]
  - [[worked-example-gepa-mechanism]]
  - [[eval-statistical-significance]]
  - [[references-prompt-optimization]]
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

## What actually makes GEPA work (from the paper body, not the abstract)

Four facts that change how you'd build or configure this — see [worked-example-gepa-mechanism](../projects/worked-example-gepa-mechanism.md):

- **Candidate *selection* carries the gains, not the mutation operator.** Pareto sampling beats `BeamSearch(N=4)` (the APO strategy) by up to **11.33%** and `SelectBestCandidate` (TextGrad-like) by up to **8.17%**, aggregate +7.33% / +6.4%. Mechanism: keep every candidate that leads on **at least one** training instance, prune strictly dominated ones, then sample weighted by how many instances each leads — MAP-Elites *illumination* ([arXiv:1504.04909](https://arxiv.org/abs/1504.04909)) applied to tasks. Always-take-the-best stalls in a local optimum and burns the budget on one lineage.
- **Most of the rollout budget buys *selection*, not learning.** "The majority of GEPA's rollout budget is spent on validation, where scores are utilized solely for candidate selection and not for producing learning signals." Counting train rollouts only, GEPA reaches optimum in **79–737** rollouts. So instrument the split before buying more budget, and note the authors' own proposed fix — smaller or **dynamically selected validation subsets**, which is state-driven allocation ([cost-aware-eval](cost-aware-eval.md)).
- **The feedback string has two distinct sources.** *Execution traces* (what the LLM produced) and *evaluation traces* (what the environment produced while computing the reward — compiler errors, failed rubrics, profiling output). Feedback may be **module-specific**, and human graders' written justifications can be attached to the trainset as auxiliary feedback. Your validator already prints why it failed; that string is the gradient.
- **Merge is a hyperparameter, not a free win.** System-aware crossover gave up to +5% on GPT-4.1 Mini but **degraded Qwen3 8B**, helping on 1 of 4 tasks, because the mutation/crossover budget split and merge timing were held fixed across models.

Two results worth knowing before you plan a run: GEPA's prompts were up to **9.2× shorter** than MIPROv2's with a *lower* generalization gap, and prompts optimized on **Qwen3-8B transferred to GPT-4.1-Mini for +9.00% aggregate** — beating MIPROv2/TextGrad/Trace optimized directly on the target. Try optimizing on a cheap model first.

## The metric is the whole game

Optimization is only as good as the metric. Weight a **deterministic programmatic check** (right tool, right args, right final state) highest; use [llm-as-judge](llm-as-judge.md) for the rest; keep humans *out* of the loop but use them to calibrate the judge and spot-check the winner. Score against a **held-out test set** the optimizer never sees, behind a **regression gate** (must beat baseline *and* break zero critical cases). See [agent-eval-improvement-tiers](../projects/agent-eval-improvement-tiers.md).

**Make the metric return text, not just a number.** GEPA's metric returns a score *and* a textual feedback string — "Actionable Side Information," framed as the text analogue of a gradient. Richer feedback is *why* GEPA needs ~100–500 rollouts vs RL's 5k–25k+. So have your programmatic + judge layer emit *why* it failed ("skipped the confirmation step"), not just a scalar — that text is the optimization signal.

## Pitfalls

- **Coarse credit assignment.** One score for a whole multi-step flow can't localize *which* sentence caused a late-step failure — convergence is slower. Mitigate with feedback that points at *where* in the transcript it went wrong, and measure the localization directly rather than guessing: [prompt-component-attribution](prompt-component-attribution.md).
- **Reward hacking.** The agent games a weak judge. Weight programmatic checks highest; review final transcripts by hand.
- **Cost and noise.** Every candidate eval is a full agent run × N examples × many rounds; multi-call flows are noisy even with pinned temperature. Iterate on a subset, cap the budget, report score variance so you don't chase noise.
- **Diminishing returns.** Published gains are largest over *weak* baselines. Against an already hand-tuned playbook, expect modest lift — the durable value is a repeatable, regression-tested loop, not a one-time jump.
- **Seed-prompt quality is a precondition, not an input.** Reflective search can *amplify* a bad starting prompt instead of repairing it: with a defective seed on GSM8K, GEPA has been reported to degrade accuracy from 23.81% to 13.50% ([arXiv:2603.18388](https://arxiv.org/abs/2603.18388), ACL SRW 2026 — single paper, not replicated). Because the optimization trajectory is uninterpretable, this looks like "the optimizer didn't help" rather than "the optimizer walked downhill." Always start from your best hand-written playbook and check the first round's score against the seed's.
- **Black-box trace path (resolved — choose deliberately).** Reflective optimizers reflect best on a predictor's own input→output trace. `dspy.GEPA` needs the predictor to run inside a DSPy module (wrap it). For a purely external agent, use the standalone `gepa-ai/gepa` `GEPAAdapter` so *your* code runs the rollout and feeds back textual feedback — no DSPy execution needed. MIPROv2 has **no** external/feedback path; it is DSPy-trace-only.

## What the evidence actually shows

As of mid-2026, **no verified production case** improves a genuinely *multi-step tool-use agent's* skill with before/after task-success metrics. The closest public attempt — SpecterOps optimizing an `AGENTS.md` for a CTF agent via `optimize_anything` — was near-flat (−0.5%/+4%/+5%) and **explicitly overfit** on a tiny dataset. The real production wins are all **single-call**: Databricks information-extraction agents (GEPA, vendor benchmark), Dropbox Dash relevance judge, Decagon classifiers. **Benchmark** evidence on multi-step tool use did arrive in 2026 — τ-bench tool-use 74% → 91% via an RL-trained prompter model ([arXiv:2605.14443](https://arxiv.org/abs/2605.14443)) and BALROG PutNext 0% → 72.5% via environment-scored APO ([arXiv:2606.17838](https://arxiv.org/abs/2606.17838)) — but neither is a production system, neither is independently reproduced, and the first moves *weights*, so it is not the text-only loop described here. Provenance discipline: separate **vendor-reported-on-own-benchmark** from **independently inspectable** (the GEPA paper, AutoPDL [arXiv:2504.04365](https://arxiv.org/abs/2504.04365)); a circulated "Hermes + ETH Zurich, 33–38% SWE-bench lift from GEPA" claim could not be sourced — treat as fabricated until proven. Production constants worth reusing (Decagon): **20–100 training examples** is often the sweet spot, a **frontier reflection model is required** (small models fail outright), and a prompt-length cap can buy ~4× compression at <1% accuracy cost.

## References

- Industry evidence and which DSPy primitives real teams used: [dspy-domain-chatbot-cases](../projects/dspy-domain-chatbot-cases.md).
- The structural counterpart — optimizing *what context the playbook assembles* rather than its prose: [agentic-context-engineering-ace](agentic-context-engineering-ace.md).
- Eval foundations this depends on: [agent-trajectory-eval](agent-trajectory-eval.md), [llm-as-judge](llm-as-judge.md), [adversarial-eval](adversarial-eval.md).
- Primary: GEPA [arXiv:2507.19457](https://arxiv.org/abs/2507.19457); DSPy [arXiv:2310.03714](https://arxiv.org/abs/2310.03714); `gepa-ai/gepa` (standalone, MIT).
- The 2026 shift from optimizing a prompt string to optimizing a **skill document** — SkillOpt's strict held-out acceptance rule, textual learning-rate budget, and rejected-edit buffer; Trace2Skill's parallel trajectory merging — is catalogued in [references-prompt-optimization](../references/references-prompt-optimization.md).
- Full verified reading list — the AutoPrompt → APE → textual-gradient → program-optimizer lineage, the agent-specific work, and the field survey: [references-prompt-optimization](../references/references-prompt-optimization.md).
