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
  - [[decision-audit-trail]]
  - [[escalation-handoff]]
  - [[recursive-self-improvement]]
  - [[system-one-decision-models]]
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

## The judge's evidence channel must be one the subject cannot write (2026)

The section above ends on "read different bytes." Papers from the week of 2026-09-17 → 09-25 show what happens when a verifier reads bytes the thing under test wrote, and they converge on one fix.

| Paper | What the verifier also read | Effect |
|---|---|---|
| *Don't Read the Log* ([arXiv:2609.28564](https://arxiv.org/abs/2609.28564)) | the agent's execution trace, beside fixed video frames | a trace reporting a successful tool call made three open-weight Qwen-VL judges accept **78–90%** of failed clips, up from **7–19%** with no text |
| *Forgeable Confirmation* ([arXiv:2609.24200](https://arxiv.org/abs/2609.24200)) | response content the attacker controls | **9 of 15** confirmation mechanisms forgeable; forgeability predicted *entirely* by whether the decision reads attacker-controlled data |

Details that change what you build:

- **An instruction does not fix it.** Telling the judge to "use only the frames" did not remove the effect. Frontier closed judges were essentially unmoved on the same clips, so this is learned trust in tool logs rather than task difficulty — test your own judge with a contradicting trace instead of assuming immunity.
- **No adversary is needed.** In a repair loop, an honest planner that always regenerates ended at a judge pass rate of **1.00** against a human-labelled **0.28**. A cheap checker that wrote its verdict into the trace **laundered its errors into the stronger final judge (0.69 false accepts)** — which is exactly the cheap-then-expensive cascade in the table above, built wrong.
- **"Use a deterministic rule" is not the fix; the channel is.** Rules were *cheaper* to forge than eight open-weight LLM judges (failing at **2%** attacker-controlled content against a median **50%**), and routing between a rule and an AI judge raised forgery to **99%**. Moving the decisive evidence to a channel the attacker cannot write cut attack success from **97% to 0%**, and an explicit *escalate* verdict recovered the lost sensitivity. The forgeability prediction, fixed before any attack, separated 16 held-out mechanisms exactly and was **99.9%** accurate over 12,203 public scanner templates. It fails when the scanned host is itself the adversary.

**Multi-vote buys less independence than it looks.** *Agreement Overstates Evidence* ([arXiv:2609.22512](https://arxiv.org/abs/2609.22512)) measures a mean pairwise error correlation of **0.21** across ten judges, so ten judges carry about as much information as **3.5 independent ones**; dependence is *stronger* among high-accuracy frontier judges, **including across providers**. In up to **28%** of comparisons, ignoring shared errors produced a significant system difference that vanished once they were accounted for. This qualifies both the "3× majority" move and the heterogeneous-recheck table above: different-family is a hypothesis about independence, and a small trusted labelled set is how you check it and pick the voting rule before applying it. The same correlation caps cascades: a cheap typed classifier's most confident errors were repeated by nearly all LLM judges, so a cascade gained **at most 1.5 points** over the best single judge (2.0 with oracle thresholds) while costing 29–325× less ([arXiv:2609.29769](https://arxiv.org/abs/2609.29769)). A second group reports a confident-accept cascade retaining 99% of its comparator's accuracy ([arXiv:2609.26550](https://arxiv.org/abs/2609.26550)); both hold — a cascade buys cost, not accuracy, when errors correlate.

The graph's generalization, not stated by any one source: **list a verifier's inputs by who can write them.** Anything the subject writes — its trace, its summary, its tool-call status, an upstream checker's verdict — is advisory at most, and the verdict of record must rest on a channel the subject cannot touch. See [decision-audit-trail](decision-audit-trail.md) for the logging side of the same rule.

## Decision models as first-pass judges

Several of the judges above — Jev and its open replicas — are [system-one-decision-models](system-one-decision-models.md): they return a probability per verdict without generating text, at roughly 1/70 to 1/300 of a frontier judge's cost in the studies summarized there. Match accuracy is not enough to swap one in: in RAG claim verification, a tied decision model admitted 23.2% of unsupported claims against the frontier judge's 14.1%. Compare error types, not just the headline score.

## References

- Eugene Yan, *Evaluating LLM-Evaluators* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- Hamel Husain, *Creating an LLM-as-Judge That Drives Business Results* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- Shankar et al., *Who Validates the Validators?* — [references-eval-reading-list](../references/references-eval-reading-list.md)
