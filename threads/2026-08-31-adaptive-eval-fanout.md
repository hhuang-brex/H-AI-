---
id: 2026-08-31-adaptive-eval-fanout
type: thread
tags: [meta, research, fan-out, eval, statistics, bandit, psychometrics]
related:
  - [[adaptive-eval-budget]]
  - [[references-adaptive-eval]]
  - [[eval-statistical-significance]]
  - [[cost-aware-eval]]
  - [[worked-example-gepa-mechanism]]
status: snapshot
created: 2026-08-31
summary: "fan-out on adaptive eval budgeting: seven verified sources across anytime-valid stopping, best-arm allocation, and psychometrics; one new concept and one new reference node."
---

# Thread — Adaptive Eval Budget Fan-Out (2026-08-31)

## Goal

Close the longest-deferred gap in this repo. On 2026-08-29 the working intuition was recorded as: *the only option is to utilise state and make repetitions and gating dynamic relative to baselines and targets, but every service punts it to configuration.* On 2026-08-30 GEPA's authors turned out to propose the same thing as future work. This fan-out checks whether the literature already answers it — the check offered twice and not previously run.

## Method

Four arXiv queries (efficient benchmarking / subset selection; adaptive-sequential-anytime-valid; IRT and adaptive testing; bandits and best-arm identification for evaluation), then `id_list` verification of seven standouts. The intuition turned out to have three distinct literatures behind it, none of which the graph cited.

## Answer to the question that started it

**The instinct is right and the machinery exists — it just isn't in eval harnesses.** Three mechanisms, one per question:

| Question | Mechanism | Anchor |
|---|---|---|
| when to stop sampling | continuously monitored **confidence sequences** | [2608.06362](https://arxiv.org/abs/2608.06362) |
| where to spend the next call | **best-arm identification** | [2606.07726](https://arxiv.org/abs/2606.07726) (ICML 2026) |
| which cases to run at all | **IRT / Fisher-information item selection** | [2608.05086](https://arxiv.org/abs/2608.05086), [2607.25257](https://arxiv.org/abs/2607.25257) |

## Key insights

- **The statistical objection is real but narrow.** "Naive optional stopping with an ordinary confidence interval invalidates the stated level" — which is an argument for confidence sequences, not against adaptivity. Fixed budgets fail in *both* directions: they "either keep paying after the result is settled or stop before the agents can be told apart."
- **Variance reduction and stopping compose multiplicatively.** AV-AIVAT: a median **54×** variance reduction (across 15 LLM agent configurations, 71,439 paired hands) plus anytime-valid stopping → **74×** cheaper evaluation with the guarantee intact. Domain is imperfect-information games, so the composition transfers, not the number.
- **Similarity is an asset, not a nuisance.** SySRs' guarantees *improve* with similarity between the candidates being compared — exactly the regime of prompt variants of one system, where naive methods struggle.
- **A cheap proxy can spend your budget without corrupting the verdict** — low-rank prediction of the unobserved candidate×case matrix wrapped in **doubly robust** estimators ([2605.10405](https://arxiv.org/abs/2605.10405)). That is the principled form of the test pyramid, and multi-fidelity bandits ([2605.08558](https://arxiv.org/abs/2605.08558)) even model a proxy that improves with use.
- **Uniform case sampling is provably wasteful.** Psychometrically selected items recover full benchmark scores with lower error than random selection (8 safety benchmarks × 192 models), and benchmarks carry "pronounced internal heterogeneity that is not captured by aggregate accuracy scores."
- **The layer split resolves the reproducibility objection**: adaptive screening / fixed pre-registered gate of record / never-adaptive critical set. Adaptivity and auditability conflict only if applied to the same layer.
- **The honest reason vendors punt**: the gate encodes what a false ship costs versus a false block, which is domain knowledge no vendor has. That argues for the user automating it, not for nobody automating it.

## Process notes

- The arXiv API cooperated today with 5–6s spacing after yesterday's persistent 429s.
- One self-inflicted error worth recording: a frontmatter edit inserted a `related:` item after `summary:`, producing invalid YAML that `build-graph.py` accepted without warning. Repaired in the same commit — but the validator does not catch misplaced sequence items, which is a gap in `tools/build-graph.py`.

## Open gaps

- [2605.07964](https://arxiv.org/abs/2605.07964) (confidence sequences for bounded means) is cited as the statistics dependency from its abstract only; not read in depth.
- No source found that applies any of this *to prompt/skill evaluation specifically* — every entry is model-level or agent-level. That is the gap between this literature and [offline-prompt-optimization](../nodes/concepts/offline-prompt-optimization.md), and GEPA's "dynamically selected validation subsets" remains unimplemented as far as this sweep found.
- IRT's cost (many models × items to fit) is stated but not quantified here; unclear at what suite size it becomes worthwhile.
- Nothing here is validated on an in-house suite; the layer split is a design recommendation, not a measured result.
