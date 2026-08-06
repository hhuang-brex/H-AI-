---
id: eval-statistical-significance
type: concept
tags: [eval, statistics, variance, significance, prompt, agents]
summary: "is the delta real? — the variance budget of an LLM eval, paired and multi-prompt designs, effect-vs-spread reporting, and the winner's curse when sweeping many prompt variants."
related:
  - [[llm-evaluation]]
  - [[eval-dataset-quality]]
  - [[eval-case-design]]
  - [[cost-aware-eval]]
  - [[prompt-component-attribution]]
  - [[offline-prompt-optimization]]
  - [[harness-as-hyperparameter]]
  - [[agent-trajectory-eval]]
  - [[llm-as-judge]]
  - [[references-prompt-attribution]]
status: living
created: 2026-08-06
source-thread: [[2026-08-06-prompt-attribution-research]]
---

# Eval Statistical Significance

Every prompt change produces a number. This node is about the prior question: **is the number a signal?** The default failure is not a wrong test — it's no test, plus a single run on a single prompt format reported as a fact. Surveying ACL/TACL 2017 empirical work, *The Hitchhiker's Guide to Testing Statistical Significance in NLP* (Dror, Baumer, Shlomov, Reichart, ACL 2018, pp. 1383–1392, [P18-1128](https://aclanthology.org/P18-1128/)) found significance testing "ignored or misused" — and LLM evals added several noise sources on top of the ones that paper was written about.

## The variance budget

Before attributing a delta to your change, know what else moves the number. Each row is a knob you either **fix** (removing it from the budget) or **sample over** (paying for it in runs).

| Source | Typical size | Fix by | Sample by |
|---|---|---|---|
| Decoding | small at temp 0, unbounded above | pin temperature and seed | n runs per case |
| **Prompt format** (separators, casing, spacing) | up to **76 accuracy points** on LLaMA-2-13B few-shot ([arXiv:2310.11324](https://arxiv.org/abs/2310.11324)) | freeze one template forever | a set of plausible formats |
| **Few-shot order** | near-SOTA → near-random across permutations ([arXiv:2104.08786](https://arxiv.org/abs/2104.08786)) | fix the permutation | multiple permutations |
| Judge | drifts with judge model/version | pin judge model + rubric version | multi-vote |
| Agent path | high on multi-step flows even at temp 0 | — (irreducible) | repeat rollouts |
| Case sample | ∝ 1/√N | held-out split | bigger N ([cost-aware-eval](cost-aware-eval.md)) |

Fixing a knob is cheaper than sampling it, and legitimate — but it converts a general claim into a conditional one: "better *with this template*," not "better." Report which knobs were frozen.

## Practices that survive contact with production

1. **Pair everything.** Same cases, same seeds, same judge version, variant A vs B; then analyze **per-case deltas**, not two aggregate means. Pairing removes case difficulty from the noise and is the single highest-leverage change to a prompt A/B.
2. **Report a spread, not a point.** Single-prompt evaluation is brittle across 6.5M instances / 20 LLMs / 39 tasks; the recommendation is to evaluate over a *set* of diverse prompts and report tailored metrics ([arXiv:2401.00595](https://arxiv.org/abs/2401.00595), TACL). At minimum: mean ± spread over ≥3 plausible phrasings.
3. **Compare the effect to the spread.** AutoPDL's reported **+9.21 ± 15.46 pp** ([arXiv:2504.04365](https://arxiv.org/abs/2504.04365)) is the canonical shape to recognize: a real mechanism whose per-task outcome is not predictable. A mean without a spread is unfalsifiable.
4. **Choose the test to match the design.** Paired, per-case, non-normal metric → a paired non-parametric or bootstrap test over case-level deltas; the Hitchhiker's Guide's protocol is the reference for picking. Any test beats "the number went up."
5. **Budget for multiple comparisons.** Sweeping 20 prompt variants against one eval set produces a winner by selection, not by merit — the **winner's curse**. Correct for the number of comparisons, and require the winner to hold on a slice it was never scored on. This is the same trap as overfitting a harness to an eval slice in [harness-as-hyperparameter](harness-as-hyperparameter.md), and why [offline-prompt-optimization](offline-prompt-optimization.md) insists on a held-out set the optimizer never sees.
6. **Gate on two conditions, not one.** Ship if the change (a) beats baseline by more than the spread *and* (b) breaks zero critical cases. Criterion (b) is not statistical — a single safety regression is disqualifying at any p-value.

## Pitfalls

- **Reporting the max over reruns.** Re-rolling a flaky eval until the number is good is p-hacking with extra steps. Fix the number of runs before looking.
- **Silent instrument change.** A new judge model, a re-rendered template, or a refreshed dataset invalidates comparison with historical scores. Version the eval as strictly as the code ([eval-dataset-quality](eval-dataset-quality.md)).
- **Underpowered by construction.** With 30 cases, a 3-point difference is unmeasurable. Either accept the resolution limit or grow N — do not narrate the difference.
- **Significance ≠ importance.** A statistically solid +0.4% that costs 2× tokens is a regression in the dimension that matters ([cost-aware-eval](cost-aware-eval.md)).
- **Aggregate wins hiding segment losses.** Break results out by the segments you care about; a mean can improve while your highest-value slice degrades.
