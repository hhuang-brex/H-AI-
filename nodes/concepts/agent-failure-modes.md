---
id: agent-failure-modes
type: concept
tags: [agent, failure-taxonomy, reliability, measurement-validity, survey, science-excellence]
summary: "a cross-stack map of the six ways agents silently break (survey, secondary evidence) — owns the genuine-capability-vs-measurement-correction lens and three cross-cutting laws: failures compound nonlinearly with length, sub-skill competence doesn't compose, undirected scaffolding doesn't reliably help."
related:
  - [[llm-evaluation]]
  - [[eval-dataset-quality]]
  - [[context-compaction]]
  - [[multi-agent-delegation]]
  - [[plan-execute-replan]]
  - [[collaborative-agent-eval]]
  - [[self-improving-harness]]
  - [[proactive-memory-intervention]]
  - [[cost-aware-eval]]
status: living
created: 2026-07-12
---

# Agent Failure Modes (Beyond the Leaderboard)

A cross-cutting **map + argument** node, not a re-derivation. Source: *Beyond the Leaderboard: A Synthesis of Tool-Use, Planning, and Reasoning Failures in LLM Agents* (Albayaydh, Zhao, Flechais, U. Oxford; [arXiv:2607.05775](https://arxiv.org/abs/2607.05775), 7 Jul 2026, 16pp). **This is a SURVEY = secondary evidence** — it synthesizes 27 benchmark/taxonomy/audit papers across 19 benchmarks (2023–2026) and runs **no new experiments**; the authors flag Table-2 figures as *"not independently re-verified,"* so every number here is doubly-secondary. Use it as a failure-mode checklist, not a source of validated numbers.

## The six clusters — route, don't restate

| # | Cluster | Home |
|---|---|---|
| 1 | tool-invocation & parameter errors | [tool-schema-design](tool-schema-design.md) |
| 2 | planning & constraint-satisfaction failures | [plan-execute-replan](plan-execute-replan.md), [agent-control-loop](../topics/agent-control-loop.md) |
| 3 | long-horizon degradation from context accumulation | [context-compaction](context-compaction.md), [context-engineering](../topics/context-engineering.md), [proactive-memory-intervention](proactive-memory-intervention.md) ("behavioral state decay") |
| 4 | multi-agent coordination failures | [multi-agent-delegation](../topics/multi-agent-delegation.md), [collaborative-agent-eval](collaborative-agent-eval.md) |
| 5 | safety/security under adversarial/underspecified conditions | [prompt-injection-and-isolation](prompt-injection-and-isolation.md), [safety-rails-domain-specific](safety-rails-domain-specific.md) |
| 6 | measurement-validity problems | [eval-dataset-quality](eval-dataset-quality.md), [cost-aware-eval](cost-aware-eval.md) |

## What this node OWNS (un-homed elsewhere)

**1. Genuine-gain vs measurement-correction lens.** The thesis: apparent year-over-year benchmark gains conflate real capability improvement with *correction of earlier measurement error* — *"interpreting agent progress requires distinguishing genuine capability gains from corrections of earlier measurement error."* Anchor datapoints (all secondary): a SWE-agent config's reported success fell **~12.5%→~4%** after fixing solution leakage/weak tests (Aleithan 2024); stronger auto-tests (UTBoost) **flipped leaderboard rankings in ~25–41%** of cases; HAL ([arXiv:2510.11977](https://arxiv.org/abs/2510.11977), >21k rollouts, ~$40k) found **higher reasoning effort *reduced* accuracy** in most runs. These enrich [eval-dataset-quality](eval-dataset-quality.md)'s contamination/discrimination axes with *public agent-benchmark* correction cases (that node currently covers your-own-instrument only).

**2. Three cross-cutting laws** (the strongest reason for a distinct node):
- **Failures compound nonlinearly with task length** — the "no-recovery bottleneck": agents can't detect/roll back early errors, so P(clean trajectory) falls faster than constant-hazard.
- **Non-composability of sub-skill competence** — *"strong performance on individual sub-tasks does not reliably translate into end-to-end success."* Same solo→interactive drop [collaborative-agent-eval](collaborative-agent-eval.md) quantifies with τ²-Bench; cross-link, don't restate.
- **Undirected scaffolding is unreliable** — *"additional scaffolding does not consistently improve reliability,"* and can reduce it; a *targeted* fix aimed at a diagnosed failure mode is far likelier to help. Corroborates [self-improving-harness](self-improving-harness.md)'s regression-gated, diagnosis-first thesis, and is the counterweight to over-crediting harness swaps ([harness-token-economics](harness-token-economics.md)).

## Where progress IS real

The paper credits *"single-turn tool selection, short-horizon web navigation, and narrowly scoped coding"* with substantial, credible gains — so the pessimism is scoped: sub-task benchmark wins over-predict deployed reliability, they don't negate it.

## Misattribution guard

This node is the failure-modes/measurement paper only. Do **not** attribute [proactive-memory-intervention](proactive-memory-intervention.md)'s memory numbers or [harness-token-economics](harness-token-economics.md)'s cost numbers to this survey — those are separate primary papers; this supplies the problem framing and the counterweight, not corroborating measurements.

## References

Sits under [llm-evaluation](../topics/llm-evaluation.md). Primary: [arXiv:2607.05775](https://arxiv.org/abs/2607.05775) (survey/secondary).
