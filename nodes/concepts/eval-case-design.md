---
id: eval-case-design
type: concept
tags: [eval, dataset, benchmark, design, agents]
summary: "how to construct eval cases: design from the decision, a coverage matrix, scorable end-states, discrimination-piloting, held-out splits, and a failure flywheel."
related:
  - [[llm-evaluation]]
  - [[eval-dataset-quality]]
  - [[agent-trajectory-eval]]
  - [[simulated-user-eval]]
  - [[golden-snapshot-eval]]
  - [[decision-engine-contract]]
  - [[offline-prompt-optimization]]
status: living
created: 2026-06-18
---

# Eval Case / Benchmark Design

The construction-side companion to [eval-dataset-quality](eval-dataset-quality.md) (which *audits* a set): how to build cases that are valid, discriminating, and durable by construction.

## Principles

- **Design backward from the decision.** An eval answers ship/no-ship, A vs B, or did-N-regress. Start from the decision + threshold; build the minimum cases that resolve it. Cases with no decision in mind measure everything and decide nothing.
- **Pin the construct first.** Write the checkable definition of "correct" (rubric/gold spec) *before* authoring cases. If you can't state what passing means, annotators won't agree and the set is born invalid.

## Where cases come from (blend, don't pick one)

| Source | Strength | Weakness |
|---|---|---|
| **Production traffic** (sampled, stratified) | real distribution | needs logging; misses rare cases |
| **Hand-authored / designed** | covers rare/hard cases on purpose | skews to what you *imagined*, not what users do |
| **Synthetic / LLM-generated** | scale, controllable difficulty | distribution skew + artifacts; must verify |
| **Adversarial / red-team** | targets failure modes directly | not representative of normal traffic |

Most robust: a **prod-sampled backbone + hand-authored hard/edge cells + adversarial cases + synthetic augmentation**. Hand-designed sets alone skew to the happy path — anchor them to sampled real traffic ([prod-shadow-replay](prod-shadow-replay.md)).

## Coverage by construction — the test matrix

Make coverage deliberate: a matrix of `intent × channel × user-type × difficulty × turn-count × {happy/edge/adversarial}`, fill every cell. Enumerate failure modes as cells — the "almost-right sentence," error recovery, ambiguous intent, out-of-scope/refusal, multi-turn drift, tool failures. An empty cell is a measured blind spot.

## Make each case scorable (the hardest choice)

Design for the cheapest reliable scorer (the test pyramid):
- **Prefer programmatic** — assert on the **action/end-state** (right tool, right args, right final state — [decision-engine-contract](decision-engine-contract.md)), schema validity, `input.equals`, golden snapshot. For a task agent, score *what it did*, not the prose.
- **Trajectory vs end-state** ([agent-trajectory-eval](agent-trajectory-eval.md)) — decide per case.
- **Judge only where prose quality is the point**, with a precise rubric calibrated to humans ([llm-as-judge](llm-as-judge.md)).
- Store per case: inputs, **gold/expected**, *and the scoring method*. No scorer ⇒ not a case.

## Multi-turn / agentic cases

Cases are conversations/trajectories: script the turn sequence + a **simulated user** ([simulated-user-eval](simulated-user-eval.md)) with interruptions/corrections/abandonment, inject realistic tool results *and failures*, and evaluate an **end-state assertion** after the whole trajectory.

## Build in discrimination (most teams skip this)

A case has signal only if it *separates* systems. **Pilot each candidate case against a known-good and a deliberately-degraded agent**; drop cases both pass or both fail (IRT item-discrimination). Aim difficulty where systems differ; include headroom cases harder than current SOTA so the set doesn't saturate.

## Durable by design

- **Freeze a held-out test split** the moment you'll tune against the set ([offline-prompt-optimization](offline-prompt-optimization.md)'s regression gate) — design the split in from day one.
- Prefer **freshly-authored / private** cases; public sets leak and collapse under perturbation. Add perturbation variants to catch memorization.
- **Version + timestamp**; refresh from production on a cadence (drift).
- **Stratify by importance/risk, not just frequency** — a rare high-stakes case deserves weight raw sampling would drown; ensure enough cases per important slice for per-slice claims ([cost-aware-eval](cost-aware-eval.md)).

## The flywheel

The best cases are real incidents: every production failure / bug report becomes a regression case. The benchmark accretes from a "failure museum" and keeps discriminating because it's built from things that actually broke.

## References

Sits under [llm-evaluation](../topics/llm-evaluation.md); pairs with [eval-dataset-quality](eval-dataset-quality.md) (audit) and [agent-eval-improvement-tiers](../projects/agent-eval-improvement-tiers.md) (improve). Dual-control multi-turn design: τ²-Bench [arXiv:2506.07982](https://arxiv.org/abs/2506.07982).
