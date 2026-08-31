---
id: 2026-08-30-gepa-dspy-fanout
type: thread
tags: [meta, research, fan-out, gepa, dspy, optimizer, pareto]
related:
  - [[worked-example-gepa-mechanism]]
  - [[offline-prompt-optimization]]
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[cost-aware-eval]]
  - [[references-prompt-optimization]]
status: snapshot
created: 2026-08-30
summary: "fan-out from GEPA read at source: what the abstract omits (Pareto ablation, budget anatomy, two trace types, merge's negative result, cross-model transfer) plus its verified lineage and one contested claim."
---

# Thread — GEPA / DSPy Fan-Out (2026-08-30)

## Goal

The graph cited GEPA in five places, all from its abstract. Read the paper's body, then fan out along its bibliography.

## Method

`arxiv.org/src/2507.19457` (v2, 2026-02-14) — main tex plus `gepa_description.tex`, `gepa_main_algorithm.tex`, and the ICLR bib. Then verified three lineage entries at their own pages. Same source-first route as the SkillSV fan-out earlier today.

## Outputs

- New [worked-example-gepa-mechanism](../nodes/projects/worked-example-gepa-mechanism.md).
- Deepened [offline-prompt-optimization](../nodes/concepts/offline-prompt-optimization.md) with the four practice-changing facts, [verbal-reinforcement-vs-gradient-rl](../nodes/concepts/verbal-reinforcement-vs-gradient-rl.md) with the train-rollout counts, and [cost-aware-eval](../nodes/concepts/cost-aware-eval.md) with the learning-vs-selection budget audit.
- [references-prompt-optimization](../nodes/references/references-prompt-optimization.md) gains GEPA's lineage: MAP-Elites, Trace/OptoPrime, and Wan et al.

## What the abstract hides

- **Selection, not mutation, carries the gains.** Pareto sampling beats `BeamSearch(N=4)` (APO's strategy) by up to **11.33%** and `SelectBestCandidate` (TextGrad-like) by up to **8.17%**; aggregate +7.33% / +6.4%. The mechanism is MAP-Elites illumination with *training instances* as the dimensions of variation: keep whatever leads on ≥1 task, prune dominated, sample weighted by tasks led.
- **Most of the budget buys selection, not learning.** Authors' words: validation scores are "utilized solely for candidate selection and not for producing learning signals." Train-only rollouts to optimum: **79–737**; matching GRPO's best validation took **102 / 32 / 6 / 179**. Their proposed remedy — smaller or **dynamically selected validation subsets** — is exactly the state-driven budget allocation discussed in this repo on 2026-08-29, now with an author-endorsed motivation.
- **Two trace types feed the feedback function**: *execution* traces (what the model wrote) and *evaluation* traces (what the environment wrote while computing reward — compiler errors, failed rubrics). Feedback can be module-specific; human graders' justifications can ride along as auxiliary `feedback_text`.
- **Merge has a published negative result**: up to +5% on GPT-4.1 Mini, but it *degraded* Qwen3 8B (helped on 1 of 4 tasks) because mutation/crossover budget split and merge timing were fixed across models.
- **Prompts up to 9.2× shorter than MIPROv2's**, with a *lower* generalization gap — and in aggregate the higher-performing optimizers produced shorter prompts.
- **Cross-model transfer**: Qwen3-8B-optimized prompts scored **+9.00% aggregate** on GPT-4.1-Mini (up to +27.67%), beating MIPROv2/TextGrad/Trace optimized *directly on the target model*.
- Module selection inside reflective mutation is **round-robin** — a detail with no justification given, and a plausible improvement target.

## Contested claim recorded, not resolved

GEPA's Observation 2 (instructions alone now beat instructions + few-shot) directly contests *Teach Better or Show Smarter?* (Wan, Sun, Nakhost, Arık, NeurIPS 2024), which found "how we select exemplars can outweigh how we optimize instructions." GEPA attributes the reversal to newer models' instruction-following. Both author-reported on their own benchmark picks; the reference node now carries both and says re-test rather than inherit.

## Tension worth noting

GEPA's cross-model transfer result sits against [worked-example-skillsv-valuation](../nodes/projects/worked-example-skillsv-valuation.md)'s framing, where unit values are explicitly conditioned on a *fixed* agent. Both can hold — a prompt can transfer while its per-unit value decomposition does not — but if the graph ever asserts portability, that is the seam to test.

## Open gaps

- GEPA's own future-work list (adaptive merge timing, budget split, dynamic validation subsets) is unaddressed in the literature as far as this sweep found.
- DD-GEPA ([arXiv:2606.07894](https://arxiv.org/abs/2606.07894), dialogue disentanglement) was surfaced in an earlier sweep and is still unverified.
- IFBench and PAPILLON/PUPA appear in the bib with verified titles but were not read; they are benchmark dependencies, not mechanisms.
