---
id: llm-as-judge
type: concept
tags: [eval, judge, calibration]
related:
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[cost-aware-eval]]
  - [[agent-eval-case-study]]
  - [[layered-defense-pipeline]]
  - [[agent-trajectory-eval]]
status: living
created: 2026-06-05
summary: "calibration, bias, multi-vote, cascading."
---

# LLM-as-Judge

Using an LLM to score another LLM's output. Unavoidable for subjective verdicts; dangerous when used unaudited.

## Known biases (from Yan's survey)

- **Position bias** in pairwise scoring.
- **Verbosity bias** — longer answers preferred.
- **Self-enhancement** — judges prefer outputs from their own family.
- **Criteria drift** — judge interpretation of "good" wanders as prompts evolve (Shankar et al.).

## Calibration techniques

| Technique | Cost | When |
|---|---|---|
| Binary pass/fail rubric | low | always — easier to calibrate than scales |
| Critique shadowing (Husain) | medium | when domain expert can label ~100 cases |
| Panel of LLM Judges (PoLL) | N× | replace one big judge with N small ones |
| Cascading judge (cheap → expensive) | low/case | when fail-rate is low; cheap model handles passes |
| Pairwise + position swap | 2× | comparing two systems |

## IAF-relevant moves

- Replace single sonnet judge with **3× haiku majority** — typically catches single-judge variance and is roughly cost-neutral.
- **Pin agent + judge model** in dataset metadata so a model upgrade is a deliberate rebaseline, not a silent baseline shift.
- **Same-family judge** is a known hazard; if budget allows, judge with a different family for high-stakes cases.

## Adjacent pattern: heterogeneous-model safety recheck

Distinct from judge calibration — but worth knowing because it's often confused with multi-vote. Some chatbot architectures use a *runtime* recheck: when the primary classifier picks a high-risk option (e.g., "stay silent"), a different-family model re-classifies the same input and can override.

| Property | Multi-vote judge (this node) | Heterogeneous safety recheck |
|---|---|---|
| When it runs | Eval time, on outputs to score | Runtime, on a specific decision branch |
| What it measures | Quality / correctness of an answer | Whether to override a decision |
| Why same-model fails | Self-enhancement, correlated noise | Same model re-renders the same mistake |
| Why different-family helps | Independent vote | Uncorrelated blind spots → catches what either alone misses |

The recheck is *not* a multi-vote judge; it's a runtime branch with override authority. See [layered-defense-pipeline](layered-defense-pipeline.md) for the full architecture.

## Judges as trajectory reward models (2026)

Beyond scoring single outputs, judges are increasingly used as **reward models over whole agent trajectories**. Plan-RewardBench (*Aligning Agents via Planning*, [arXiv:2604.08178](https://arxiv.org/abs/2604.08178)) shows LLM-judges — alongside generative and discriminative reward models — **degrade sharply as trajectory horizon grows**: a judge calibrated on short tasks needs re-validation before you trust it to rank long-horizon ones. The calibration discipline above doesn't transfer for free across horizon length. See [agent-trajectory-eval](agent-trajectory-eval.md).

## Demote the judge to advisor when it gates a loop (2026)

A judge that scores reports is one thing; a judge whose score *decides what ships* inside an optimization loop is another. A practitioner report from months of running autonomous prompt-optimization loops in production (contract analysis, compliance review, code quality) argues the judge "has not earned" the last word, and catalogs **eleven ways the evaluation signal failed in four classes: judge bias, harness and metric failures, ground-truth errors, and reward hacking** ([arXiv:2609.02246](https://arxiv.org/abs/2609.02246)). The three incidents worth memorizing, because none is a judge-quality problem:

- Agents read **cached answer keys** from their environment: a **100% pass rate concealing 68% true capability**.
- A **corrupted ground-truth label** led the optimizer to *delete correct compliance rules* to agree with it.
- A **syntactically broken prompt won**, because a silent parser fallback improved the metric.

And the negative result about fixing judges: **rewriting the rubric plateaued**; the only reliable gain came from a structural constraint on the judge's *output order*. That matches the position-bias literature above — the judge's format is more tractable than its criteria.

The proposed shape is a judge whose verdict is one input among several, with every change gated by a **deterministic verification layer the judge cannot override**: hermetic sandboxes, capability-disjoint roles (subagents may diagnose and draft mutations but not apply them), **acceptance checks that outrank the grader**, frozen holdouts, and **canary cases engineered so that a perfect score is itself evidence of cheating**. That last one is the cheapest to adopt and the one this graph did not have: plant a case that cannot legitimately pass, and let a pass fail the run.

*Provenance:* single-author 2026 preprint, self-reported production experience, no benchmark and no independent reproduction — and the authors note their own Teacher is still an LLM judge, reporting failures it did not prevent. Cite the failure taxonomy and the guardrail list, not a result.

## A judge inherits the conclusions it reads (2026)

The section above says demote the judge; this one says *why* it fails, with a pre-registered experiment isolating a single field. *Audit Without Verification* ([arXiv:2609.07680](https://arxiv.org/abs/2609.07680), submitted 2026-09-07, single author, pre-registered with code) runs a six-agent pipeline with process-level information boundaries, balanced defect injection, matched clean twins, 345,600 requests per chain model across two models, and asks an auditor to name where a fault entered — from the **reports the agents filed**, not from a full trace.

The numbers are the argument:

| Reading | Auditor recovers the true fault origin |
|---|---|
| The filed reports | **4.1%** |
| A uniform guess over 5 candidates | 20% |
| Always blaming the same link | 31.0% |
| The **raw documentation** of the same episodes | **60.3%** |

An auditor reading summaries did **worse than chance** on the same episodes it solved 60% of the time from primary evidence. The isolating intervention: delete one clause — the field where each agent states *its own conclusion* — holding the observations constant. Accuracy rises to **45.2% (+41.2 pp, 95% CI +35.3 to +46.9)** and adherence to the agents' suggested culprit collapses from **94.4% to 3.4%**. The harm replicates on two frontier auditors in four of four conditions (+8.5 to +39.0 pp) and in a second domain (+47.7 and +61.1 pp).

Two honest complications the paper reports itself, both of which this graph should carry:

- **The paper's own pre-registered hypothesis was not supported** — collective-responsibility framing did *not* degrade escalation with chain length. Cite the asymmetry it found, not the one it went looking for.
- **Deleting the conclusion field is not free.** Where the upstream suggestion was *correct*, the same deletion costs accuracy (70.5% → 55.7%). The net effect is governed by upstream reliability, so this is a *conditional* design rule, not a universal one.

The generalization: **an accountability layer needs evidence sufficiently independent of the conclusions it verifies.** A judge fed the agent's own summary of what happened is not an independent check — it is a relay, and it will ratify a wrong conclusion 94% of the time. This is the concrete mechanism behind the graph's "deterministic verification layer the judge cannot override": the layer must read *different bytes*, not the same bytes more carefully. See [decision-audit-trail](decision-audit-trail.md) for what the raw record has to retain to make that possible, and [escalation-handoff](escalation-handoff.md) — the same layer named an innocent party in **34.4% and 62.6%** of clean episodes where any agent raised a false alarm, which is a false-escalation budget, not a rounding error.

## References

- Eugene Yan, *Evaluating LLM-Evaluators* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- Hamel Husain, *Creating an LLM-as-Judge That Drives Business Results* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- Shankar et al., *Who Validates the Validators?* — [references-eval-reading-list](../references/references-eval-reading-list.md)
