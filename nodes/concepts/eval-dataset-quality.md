---
id: eval-dataset-quality
type: concept
tags: [eval, dataset, quality, validity, reliability, measurement]
summary: "audit the eval set as an instrument — validity, label agreement, discrimination (negative-control), contamination, drift — not just the model's score."
related:
  - [[llm-evaluation]]
  - [[llm-as-judge]]
  - [[cost-aware-eval]]
  - [[agent-eval-improvement-tiers]]
  - [[agent-trajectory-eval]]
  - [[prod-shadow-replay]]
  - [[golden-snapshot-eval]]
  - [[offline-prompt-optimization]]
status: living
created: 2026-06-18
---

# Eval Dataset Quality

Most teams audit the model's score and never audit the **instrument**. An eval set *is* a measuring instrument — judge it by the same specs: **validity** (measures the right thing), **reliability** (consistent across re-runs), **discrimination** (separates good systems from bad). A bad instrument makes every downstream number noise — and if you ever *optimize* against it ([offline-prompt-optimization](offline-prompt-optimization.md)), you optimize against that noise.

## The quality axes

- **Validity** — does passing mean the agent is good at the *real* job? *Construct* validity (proxy gap — beware "Potemkin" scores that don't survive real use, [arXiv:2506.21521](https://arxiv.org/abs/2506.21521)); *criterion* validity (does eval score predict production KPIs?); *face* validity (would an expert call each case realistic? — the first gate for hand-*designed* cases).
- **Coverage / representativeness** — does it span the real input distribution *and* the failure modes (not just happy path)? Measure by clustering production traffic and checking each cluster is hit; track a failure-taxonomy %. Watch the inverted pyramid ([agent-eval-improvement-tiers](../projects/agent-eval-improvement-tiers.md)).
- **Label / gold quality** — if humans can't agree on the gold, the model can't be fairly scored. Measure inter-annotator agreement (Cohen's κ / Krippendorff's α; α ≥ 0.8 solid, < 0.67 shaky); relabel a sample to bound label noise. For judge-produced labels, calibrate the judge against humans first ([llm-as-judge](llm-as-judge.md) — *who validates the validators*).
- **Discrimination / sensitivity** — saturation (everyone scores 95%+ → useless for ranking; track headroom); item discrimination (items everyone passes/fails carry no signal — IRT lens); and the cheap high-value **negative-control test**: run a deliberately *degraded* agent and confirm the eval scores it lower. If it can't catch a sabotaged agent, it doesn't discriminate.
- **Reliability & power** — enough items to detect the delta you care about ([cost-aware-eval](cost-aware-eval.md)); report CIs not point scores; test–retest stability (re-run, especially with judge/model nondeterminism — unstable re-runs mean you're measuring noise; canonicalized/deterministic inputs make measurement reliable).
- **Contamination / leakage** — the one that bites optimization: the eval must be a **held-out test split the optimizer never sees**, or you measure memorization. For borrowed public sets, check overlap and perturbation collapse (GSM1k up to −8pt [arXiv:2405.00332](https://arxiv.org/abs/2405.00332); GSM-Symbolic/NoOp up to −65% [arXiv:2410.05229](https://arxiv.org/abs/2410.05229)); prefer private holdouts.
- **Drift** — a frozen eval passes while production shifts; periodically compare eval inputs to current prod traffic and refresh ([prod-shadow-replay](prod-shadow-replay.md)).
- **Redundancy & efficiency** — dedup near-duplicates (50 paraphrases of one case is one case); track cost-per-signal.
- **Actionability** — a good failing case localizes the fix (failure attribution, [agent-trajectory-eval](agent-trajectory-eval.md)); prefer mechanically-scorable cases ([golden-snapshot-eval](golden-snapshot-eval.md)) so a failure is unambiguous.

## Scorecard

| Axis | Quick measurement | Red flag |
|---|---|---|
| Validity | eval-vs-prod-KPI correlation | improves while prod doesn't |
| Coverage | prod clusters hit; failure-taxonomy % | happy-path only |
| Label quality | Krippendorff α; relabel disagreement | α < 0.67 |
| Discrimination | negative-control scores lower; per-item variance | saturated / can't catch a sabotaged agent |
| Reliability | re-run variance + CIs | ranking flips on re-run |
| Contamination | held-out test split; perturbation collapse | optimizing on the test set |
| Drift | eval-vs-current-prod distribution | frozen for months |
| Redundancy | embedding dedup; cost/signal | paraphrase padding |
| Actionability | failure → localized cause | only a scalar score |

## Pitfalls

- **Trusting a saturated eval** — once everything passes, it can't rank; retire passed items, raise difficulty.
- **Never running the negative control** — the single cheapest check teams skip; an eval that can't distinguish your agent from a broken one is decorative.
- **Optimizing on the measurement set** — collapses the held-out guarantee; freeze a test split before any tuning.
- **Confusing low judge agreement with a model regression** — fix the rubric/label definition first.

## References

Sits under [llm-evaluation](../topics/llm-evaluation.md). Construct-validity failure: Potemkin understanding [arXiv:2506.21521](https://arxiv.org/abs/2506.21521). Contamination/fragility: GSM1k [arXiv:2405.00332](https://arxiv.org/abs/2405.00332), GSM-Symbolic [arXiv:2410.05229](https://arxiv.org/abs/2410.05229). Judge calibration: *Who Validates the Validators?* (via [llm-as-judge](llm-as-judge.md)).
