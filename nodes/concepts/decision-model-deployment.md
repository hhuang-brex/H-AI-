---
id: decision-model-deployment
type: concept
tags: [decision-model, system-one, deployment, escalation, calibration, drift, task-agent]
summary: "how to put a System One decision model inside a conversing task agent: which decision points to hand it, how to set escalation thresholds, the design rule 'model judges, code enforces', and what to monitor."
related:
  - [[system-one-decision-models]]
  - [[references-system-one-decision-models]]
  - [[escalation-handoff]]
  - [[intent-and-disambiguation]]
  - [[confirm-before-act]]
  - [[stop-and-yield-conditions]]
  - [[context-compaction]]
  - [[memory-consolidation-and-forgetting]]
  - [[tool-selection-and-routing]]
  - [[llm-as-judge]]
  - [[eval-statistical-significance]]
  - [[live-traffic-eval]]
  - [[decision-engine-contract]]
  - [[task-agent-pattern]]
status: living
created: 2026-10-27
---

# Decision-Model Deployment

[system-one-decision-models](system-one-decision-models.md) explains what these models are and why they are fast. This node is the practical half: where one belongs inside a conversing task agent, how to wire it, and how to keep it honest after launch. The rules are the graph's synthesis; each is tied to the evidence that motivated it. All numbers are author- or vendor-reported, fetched 2026-10-27.

## The design rule: the model judges, code enforces

The pattern that worked best across the studies is to let the decision model pick among options built from **current, versioned state**, and have code check the choice against that state before acting. Jarvis, a coordination layer for voice agents, does exactly this: Jev reads each user turn against the live tasks and picks an operation, and "Code checks every choice against the current state before applying it, so no decision can act on a task version the user has replaced" ([2610.23804](https://arxiv.org/abs/2610.23804)). It also rechecks plans before execution and results before they are spoken.

This answers the model's two worst failures from the concept node — following a stale input, and choosing a harmful option an attacker steered it toward — without trusting the model to notice either.

## Which decision points to hand it

| Decision in a task agent | Fit | Why |
|---|---|---|
| Intent and route classification | **Good** | Answer is in the turn; broad zero-shot coverage is the strength |
| "Does the user's new message change a running task?" | **Good, with code checks** | Jarvis-style: model picks, code verifies the task version |
| Is this retrieved passage or summary line supported by the source? | **Good** | Source-judged compaction removed unsupported summary lines; 83% of failed runs traced to an action that carried one out ([2610.20927](https://arxiv.org/abs/2610.20927)) |
| Watching a long reasoning run for overthinking or an unanswerable question | **Good** | A monitor cut reasoning tokens up to 36% and raised abstention from 70.5% to 87.2% ([2610.26793](https://arxiv.org/abs/2610.26793)) |
| Retiring a stored memory when the user says something new | **Use a three-way answer** | A yes/no gate retired 39.2% of claims whose change was only *suggested*; adding "needs confirmation" cut that to 15.5% ([2610.15710](https://arxiv.org/abs/2610.15710)) |
| Checking a tool call's argument values | **Supply a reference first** | Judges, decision models included, follow whatever value is visible and reject correct defaults; a separately written reference lifted AUROC from near chance to about 99% ([2610.18497](https://arxiv.org/abs/2610.18497)) |
| Picking several correct items from a list | **Rank, don't threshold** | Even when every correct item ranked first, 28–50% of lists gave one a probability below 1/n ([2610.29217](https://arxiv.org/abs/2610.29217)) |
| Blocking prompt injection at a 1% miss rate | **Poor** | Every system tested needed over 91.8% escalation at that target ([2610.20907](https://arxiv.org/abs/2610.20907)) |
| The final yes on a payment, send, or delete | **No** | Keep it on [confirm-before-act](confirm-before-act.md) |

## Setting the escalation threshold

- **Fit it per decision, on held-out data from your own traffic.** Naive thresholds exceeded the target risk in about half of settings; Learn-Then-Test kept it to 7.8% ([2610.19811](https://arxiv.org/abs/2610.19811)). A per-choice threshold fitted on the agent's own trajectories is what made delegation work in agent loops ([2610.21412](https://arxiv.org/abs/2610.21412)).
- **Pool labels across questions when each has few.** A pooled fit with a small per-question correction is near optimal; tuning each question alone loses accuracy when labels are scarce ([2610.18488](https://arxiv.org/abs/2610.18488), theory).
- **Escalate on the right uncertainty.** "Confidence" mixes two things: humans disagreeing about the answer, and the cost of acting wrongly. Under an asymmetric cost they call for opposite escalation rules ([2610.33258](https://arxiv.org/abs/2610.33258)). Because extra questions are nearly free, ask both separately.
- **Check that the cascade beats a coin flip.** In one RAG study a confidence-gated cascade did no better than escalating the same share at random ([2610.20634](https://arxiv.org/abs/2610.20634)). Compare against random escalation at equal spend before crediting the threshold.

## Keeping it honest after launch

- **Watch the label mix, not just confidence.** A chi-squared test on predicted labels caught 95–99% of class-prior shifts that confidence- and embedding-based detectors missed ([2610.34329](https://arxiv.org/abs/2610.34329)).
- **Gate model updates like a deploy.** Accept a new version only on a significant held-out gain without loss on earlier traffic — the same rule as [self-improving-harness](self-improving-harness.md). Vendors ship point releases: TypeSafe moved `jev-latest` from 1.13 to 1.14 with no published numbers ([blog](https://typesafe.ai/blog/jev-1-14)). Pin the version.
- **Learn from corrections without retraining.** When a user revokes a decision, typed feedback names both the rejected and the preferred option; storing that as compact state above a frozen model added 7.5 points after two corrections ([2610.31521](https://arxiv.org/abs/2610.31521)).
- **Keep option lists fixed per decision.** The probabilities are relative to the list, so a changed list invalidates every fitted threshold.

## A production data point

TypeSafe's case study with the hiring marketplace Jack & Jill replaced Gemini 3.1 Flash Lite for initial candidate scoring at 6,000 candidates per role per day: cost per 1,000 candidates fell from $0.755 to $0.092, median screening time from 20.3 s to 10.3 s, and shortlist recall moved 93.9% → 94.6% ([case study](https://typesafe.ai/blog/jack-jill-jev-case-study), 2026-10-07). It is vendor-published, the recall gain "was not statistically significant," and quality came from an offline test. Note the shape that worked: the decision model did the wide first cut, and a stronger model narrowed the top 2,000.

## Pitfalls

- **Thresholding a probability to get a set.** It recovers the top choice, not every correct one.
- **Letting the model act on the state it read.** Re-check the state version in code before applying the choice.
- **A binary gate where "not sure yet" is a real answer.** Memory retirement, task changes, and clarification all need a third option — see [intent-and-disambiguation](intent-and-disambiguation.md).
- **Unpinned versions.** A silent upgrade moves every fitted threshold.
- **Measuring per call.** Report cost per delivered outcome, not per decision.
