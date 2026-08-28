---
id: live-traffic-eval
type: concept
tags: [eval, monitoring, production, reference-free, ragas, observability]
related:
  - [[llm-evaluation]]
  - [[prod-shadow-replay]]
  - [[llm-observability]]
  - [[eval-dataset-quality]]
  - [[llm-as-judge]]
  - [[prince-reliable-agentic-case-study]]
  - [[prompt-component-attribution]]
  - [[cost-aware-eval]]
status: living
created: 2026-07-10
summary: "reference-free scoring of actual production outputs on a cadence to catch live regressions/hallucinations — distinct from prod-shadow-replay and passive observability; pairs with change-triggered dataset evals."
---

# Live-Traffic Evaluation

Scoring **actual production outputs** on a recurring cadence (e.g. a daily batch) with metrics that need **no ground truth** — reference-free checks like RAGAS Faithfulness / Answer Relevancy / Context Relevancy — to catch live regressions and hallucinations the moment real users hit them. It is a *monitoring* eval, not a gate: it watches what the system actually produced in the wild.

## Not the same as its neighbors

| | What it does |
|---|---|
| **live-traffic-eval** | *scores* real production outputs, reference-free, on a cadence — quality monitoring |
| [prod-shadow-replay](prod-shadow-replay.md) | *replays* sampled past traffic through a **candidate** build and diffs candidate-vs-baseline — pre-ship regression |
| [llm-observability](llm-observability.md) | *traces* runs passively — no scoring |

They share substrate (e.g. Langfuse traces feed the scorer) but occupy different axes: replay = *will this change regress?*; observability = *what happened?*; live-traffic-eval = *is what we're shipping right now still good?*

## The dual-mode topology

Pair it with **change-triggered dataset evals** (gold-labeled, run on every major change — [eval-dataset-quality](eval-dataset-quality.md)) to get the production pattern: **offline-on-change + online-daily**. The offline set has ground truth and gates deploys; the online set has no ground truth and monitors drift. Neither substitutes for the other.

## Frontier (2026): mining trajectories for implicit feedback

Scoring outputs answers *is it still good?* The next step is *which context source broke, and fix it* — from the same production stream, with no labels. **TRACE** ([arXiv:2608.09153](https://arxiv.org/abs/2608.09153), 2026 preprint) mines historical agent trajectories for **implicit dissatisfaction signals — user corrections, rephrasing, abandonment cues** — to localize failures across system prompts, knowledge bases, tool descriptions, and procedural skills, then propose remediations, explicitly "without explicit feedback collection" and without retraining because it operates on the context layer.

Two reasons this matters here rather than in an offline node: the signals only exist in real traffic (an eval-suite user never rephrases in frustration), and it turns this node's monitoring output into a **repair loop**. It is the production counterpart of [prompt-component-attribution](prompt-component-attribution.md), whose methods assume a fixed suite and a target span. Treat the mined signal as a *hypothesis generator* — corrections and abandonment are noisy proxies for dissatisfaction, and the localization still needs an offline paired check before you edit anything.

## Pitfalls

- **Reference-free ≠ truth.** Faithfulness/relevancy are LLM-judged estimates ([llm-as-judge](llm-as-judge.md)) — they catch unsupported/off-topic answers, not factual wrongness of well-grounded text. A high live score is a health signal, not a correctness proof.
- **Cost/cadence.** Scoring every production output is an LLM bill; batch + sample, and tie the cadence to the change rate ([cost-aware-eval](cost-aware-eval.md)).
- **No baseline = no alert.** Track the metric over time with thresholds; a single day's number means little without the trend.
- **Judge drift.** The scoring model is itself a moving part — pin/version it, or the "regression" may be the judge.

## References

Sits under [llm-evaluation](../topics/llm-evaluation.md); the monitoring counterpart to [prod-shadow-replay](prod-shadow-replay.md)'s pre-ship replay. Production instance: [prince-reliable-agentic-case-study](../projects/prince-reliable-agentic-case-study.md) (RAGAS run in both dataset-on-change and daily live-traffic modes).
