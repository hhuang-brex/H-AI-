---
id: references-adaptive-eval
type: reference
tags: [eval, reading-list, sequential-testing, bandit, psychometrics, budget]
summary: "verified sources for adaptive eval budgeting — anytime-valid stopping, best-arm allocation with valid use of cheap proxies, and psychometric item selection."
related:
  - [[adaptive-eval-budget]]
  - [[eval-statistical-significance]]
  - [[cost-aware-eval]]
  - [[test-pyramid-llm]]
  - [[eval-dataset-quality]]
  - [[references-prompt-attribution]]
  - [[llm-evaluation]]
status: living
created: 2026-08-31
source-thread: [[2026-08-31-adaptive-eval-fanout]]
---

# References — Adaptive Eval Budgeting

Sources behind [adaptive-eval-budget](../concepts/adaptive-eval-budget.md). All fetched and confirmed **2026-08-31** via the arXiv API. Every entry is a 2026 preprint except where a venue is noted, and none is independently reproduced — figures are author-reported. Two of the three sub-literatures here (sequential testing, psychometrics) are decades old outside LLM evaluation; these entries are the LLM-facing adaptations.

## Anytime-valid stopping

- **AV-AIVAT: 74x Cheaper Agent Evaluation with Certified Anytime-Valid Stopping in Imperfect-Information Games** — Li, Chen, Huang (2026-08-06; 34 pages). https://arxiv.org/abs/2608.06362 — The clearest statement of the problem and the cleanest composition of the fix. Problem: "Since the number of games needed is unknown, fixed-budget evaluations either keep paying after the result is settled or stop before the agents can be told apart, while naive optional stopping with an ordinary confidence interval invalidates the stated level." Fix: variance reduction (AIVAT's conditional mean-zero corrections — a median **54×** variance reduction across **15 LLM agent configurations** over **71,439 paired** Heads-Up No-Limit Hold'em hands) composed with **continuously monitored confidence sequences**, yielding the titular **74×** cost reduction with the guarantee intact. Caveat: the domain is imperfect-information games, where AIVAT's corrections exploit known game structure. Transfer the *composition* (reduce variance, then stop anytime-valid); do not transfer the multiplier.

- **Asymptotically Log-Optimal Bayes-Assisted Confidence Sequences for Bounded Means** — (2026-05-08, rev.). https://arxiv.org/abs/2605.07964 — Surfaced in the same sweep as the underlying machinery: confidence sequences for bounded means, which is the shape an eval metric usually has (accuracy, pass rate, rubric score in [0,1]). Recorded as the statistics dependency; **abstract only, not read in depth**.

## Best-arm identification and valid use of cheap proxies

- **Cutting LLM Evaluation Costs with SySRs: A Bandit Algorithm that Provably Exploits Model Similarity** — Lyu, Nejma, Wegel, Yang, Dorner (2026-06-05; **ICML 2026**). https://arxiv.org/abs/2606.07726 — States the wastefulness plainly: benchmarking evaluates "every model on every test query," but "if a model clearly performs worse than others, there is no need to precisely estimate its performance." **Synchronized Successive Rejects** augments classical Successive Rejects with **paired comparisons**, is **hyperparameter-free**, and — the property that matters for prompt variants of one system — carries guarantees that *improve with the degree of similarity* between the evaluated candidates. The most directly adoptable entry in this list.

- **Valid Best-Model Identification for LLM Evaluation via Low-Rank Factorization** — Tolochinsky, Tenzer, Romano (2026-05-11). https://arxiv.org/abs/2605.10405 — How to let a cheap proxy spend your budget without corrupting the conclusion. Predicts unobserved entries of the partially observed model×example score matrix by low-rank factorization, then wraps the predictions in **doubly robust estimators** so bias in the predictions cannot flip the identification: "such predictions are not ground truth: they can be biased and may therefore lead to incorrect identification of the best model." The principled form of "run the cheap check first."

- **Beyond Static Bias: Adaptive Multi-Fidelity Bandits with Improving Proxies** — Lu, Hong, Wang, Lin (2026-05-08). https://arxiv.org/abs/2605.08558 — The formal frame for a cheap-proxy/expensive-target eval stack: multi-fidelity bandits where arms can be evaluated by sources differing in cost and accuracy. Its contribution is dropping the usual assumption of a *fixed* fidelity gap, since "modern proxy sources, such as learning-based simulators and Large Language Models, can be improved using additional calibration" — it models a low-fidelity source that becomes more informative with use, via a selected-average mismatch bound. Read it as the theory under [test-pyramid-llm](../concepts/test-pyramid-llm.md).

## Psychometrics — which cases are worth running

- **Item Response Theory for AI Safety** — Fonseca Rivera, Shah, Africa, Voudouris (2026-08-05). https://arxiv.org/abs/2608.05086 — The scale entry: IRT fit to **8 safety benchmarks across 192 language models**, self-described as the largest psychometric analysis of LLM safety evaluations to date. Motivation is the aggregate-score critique this graph shares — benchmarks "duplicate one another, correlate heavily, and models may sandbag when they detect evaluation." Two results to use: three interpretable factors (**refusal strictness, truthfulness, contextual harm**) explain most between-model variance, and **psychometrically selected items recover full benchmark scores with lower error than random selection** — the direct argument against uniform case sampling.

- **Laplace-PSN-IRT: Uncertainty Quantification for Neural Item Response Theory Models of LLM Benchmarks** — Mandujano Reyes (2026-07-28). https://arxiv.org/abs/2607.25257 — Supplies the missing uncertainty layer: existing neural IRT (PSN-IRT) gives point estimates, "limiting uncertainty quantification and downstream statistical inference." A post-hoc last-layer Laplace approximation recovers calibrated posteriors over **model ability and item difficulty without retraining**, enabling credible intervals, probabilistic model comparisons, and — the operative part for adaptive budgeting — propagation of parameter uncertainty into **Fisher-information-based item selection**, i.e. the classical computerized-adaptive-testing rule.

- **Benchmarks Are Not Monolithic: Sample-Level Auditing and Orchestration for LLM Evaluation** — Siedler, Sassoon (2026-07-30). https://arxiv.org/abs/2607.28801 — Why uniform sampling wastes budget in the first place. Audits benchmarks at the **sample level** along five latent dimensions (cognitive/knowledge demands, language and content quality, task properties, context, and ethics/safety/fairness), annotating MMLU, ARC, WinoGrande, HellaSwag, and TruthfulQA, and finds "pronounced internal heterogeneity that is not captured by aggregate accuracy scores" — then uses the annotations for criterion-driven composition of benchmark subsets.
