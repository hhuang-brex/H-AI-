---
id: worked-example-gepa-mechanism
type: project
kind: worked-example
tags: [gepa, dspy, optimizer, prompt, pareto, reflection, eval]
summary: "GEPA read at source: the genetic loop, the feedback function's two trace types, Pareto illumination as the load-bearing component, where the rollout budget actually goes, and the results the abstract leaves out."
related:
  - [[offline-prompt-optimization]]
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[prompt-component-attribution]]
  - [[cost-aware-eval]]
  - [[eval-statistical-significance]]
  - [[self-improving-harness]]
  - [[worked-example-skillsv-valuation]]
  - [[references-prompt-optimization]]
status: snapshot
created: 2026-08-30
source-thread: [[2026-08-30-gepa-dspy-fanout]]
---

# Worked Example — GEPA, Walked Through

Mechanism walkthrough of *GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning* ([arXiv:2507.19457](https://arxiv.org/abs/2507.19457), 17 authors, ICLR 2026 Oral), read from its **arXiv LaTeX source** (v2, 2026-02-14) rather than its abstract. The graph cited GEPA in five places from the abstract alone; everything below is from the body. Author-reported.

## Inputs and what actually moves

GEPA takes a system Φ seeded with simple prompts, `D_train`, the task metric μ, a **feedback function μ_f**, and a total rollout budget B. It evolves **only the prompt set Π; the weights Θ stay frozen** — the formal statement of the [verbal-reinforcement-vs-gradient-rl](../concepts/verbal-reinforcement-vs-gradient-rl.md) split.

## The loop

Candidate pool starts with the base system. Each iteration: (i) select a promising candidate, (ii) propose a variant by **reflective mutation** or **crossover** and score it on a *minibatch*, (iii) only if it beats its parent, add it to the pool **with ancestry records** and evaluate on `D_pareto`, the selection set. At budget exhaustion, return the candidate with the best aggregate score on `D_pareto`. Each candidate inherits learning signals from its parents, so knowledge accumulates along the genetic tree.

**Reflective mutation**, precisely: run the candidate on a stochastically sampled minibatch with tracing; extract the module's inputs, outputs, and reasoning; call μ_f for a score *and* text feedback; pick the module to update by **round-robin policy**; show a reflection LM the tuple *(current prompt, program trajectory, score, feedback)* and ask it to attribute success/failure to prompt elements and propose revised instructions; re-score on the minibatch and keep only on improvement.

## The feedback function is two distinct signals

The distinction the paper draws and the graph did not have:

| Signal | Source | Examples |
|---|---|---|
| **Execution trace** | text the LLM produced | intermediate inferences, per-module reasoning |
| **Evaluation trace** | text the *environment* produced while computing reward | compiler errors, failed rubrics, profiling output |

μ_f extends a scalar reward to return both the score and `feedback_text`. Feedback can be **module-specific** (in a multi-hop system the evaluator may emit feedback after each hop), and where humans grade outputs, their written justifications can be attached to `D_train` and consumed as auxiliary `feedback_text`. *[graph]* This is the concrete build order for "make the metric return text": your validator already prints why it failed — that string is the gradient, and you are probably discarding it.

## Pareto selection is the load-bearing part

Selecting the best candidate each round "often traps the optimizer in a local optimum: once a dominant strategy is found, it becomes difficult to surpass, and the optimizer exhausts its budget." GEPA instead uses an **illumination** strategy borrowed from MAP-Elites ([arXiv:1504.04909](https://arxiv.org/abs/1504.04909)): for each training instance record the best score across candidates → keep every candidate that leads on **at least one** task → prune strictly dominated ones → **sample stochastically, weighted by how many tasks each candidate leads**.

The ablation is the number to remember, because it says the gains come from *selection*, not from a cleverer mutation operator: Pareto sampling beats `BeamSearch(N=4)` — the APO/ProTeGi strategy — by up to **11.33%**, and `SelectBestCandidate` — the TextGrad-like strategy — by up to **8.17%**, with aggregate margins of **+7.33%** and **+6.4%**.

**Merge** (system-aware crossover) finds distinct lineages that evolved *different* modules and composes the best version of each: up to **+5%** over GEPA, +2% aggregate.

## Where the rollout budget actually goes

The most useful operational fact in the paper, and absent from the abstract: *"The majority of GEPA's rollout budget is spent on validation, where scores are utilized solely for candidate selection and not for producing learning signals."*

Counting only **train** rollouts, GEPA reaches optimal performance in **79–737 rollouts**, and matches GRPO's best validation score with **102, 32, 6, and 179** train rollouts on four tasks. The authors' own proposed fix is to evaluate on a smaller validation set or **dynamically selected validation subsets** — i.e. state-driven budget allocation ([cost-aware-eval](../concepts/cost-aware-eval.md)) is named as future work by the authors of the best-performing optimizer.

## Results the abstract leaves out

- **Six benchmarks** (AIME-2025, LiveBench-Math, HotpotQA, IFBench, HoVer, PUPA) × **Qwen3 8B** and **GPT-4.1 Mini**, against MIPROv2, Trace/OptoPrime, TextGrad, and GRPO (LoRA, 24,000 rollouts).
- Beats GRPO on **5 of 6** tasks (+19.0, +2.73, +13.66, +5.19, +0.7%) at up to **35× fewer rollouts**; matches GRPO's best validation at up to **78×** greater sample efficiency.
- Beats MIPROv2 in **all** settings, margins to 11.1% (GPT-4.1 mini) and 10.3% (Qwen3 8B); aggregate lift over baseline **+13.33% / +12.19%** vs **+5.64%** for MIPROv2.
- **Prompts are up to 9.2× shorter than MIPROv2's**, and in aggregate higher-performing optimizers produced shorter prompts. *[graph]* Note the tension with the brevity-bias caution in [agentic-context-engineering-ace](../concepts/agentic-context-engineering-ace.md): here compactness *co-occurs* with performance, because instruction text replaces long demonstrations rather than being squeezed.
- **Lower generalization gap** (validation → test) for reflectively evolved instructions than for few-shot demonstrations.
- **Cross-model transfer:** prompts optimized on Qwen3-8B and evaluated on GPT-4.1-Mini give **+9.00% aggregate** (up to **+27.67%** on HotpotQA) — beating MIPROv2 (+5.64%), TextGrad (+6.11%), and Trace (+3.27%) *optimized directly on the target model*. Optimize cheap, deploy expensive.

## Honest negatives, stated by the authors

- **Merge degraded Qwen3 8B**, helping on only 1 of 4 tasks, because budget split between mutation and crossover and *when* merge fires were held fixed across models. Merge is a hyperparameter, not a free win.
- Selection strategy, module-selection policy (round-robin), and merge timing are all "further study" items.

## A contested claim worth carrying *[graph]*

GEPA's Observation 2 — instruction optimization alone now beats joint instruction + few-shot optimization — directly contests *Teach Better or Show Smarter?* (Wan, Sun, Nakhost, Arık, NeurIPS 2024), which concluded that "how we select exemplars can outweigh how we optimize instructions" and that even random-search exemplar optimization can beat state-of-the-art instruction methods. GEPA attributes the reversal to improved instruction-following and self-reflection in newer models. Both are author-reported on their own benchmark selections; the graph carries the disagreement rather than resolving it, and the practical read is that the answer is **model-generation-dependent** — re-test on your models rather than inheriting either conclusion.

## What to adopt *[graph]*

1. **Log evaluation traces, not just scores.** Compiler output, failed rubric names, validator messages — that text is the learning signal, and it is usually already being thrown away.
2. **Never select only the current best candidate.** Keep every variant that leads on at least one case, and sample proportionally to how many cases it leads. This is the cheapest single upgrade to a homegrown optimization loop.
3. **Instrument where your budget goes.** If most rollouts are buying *selection* rather than *learning*, shrink the selection set before buying more rollouts.
4. **Try transferring a prompt optimized on a cheaper model** before paying to optimize on the expensive one.
