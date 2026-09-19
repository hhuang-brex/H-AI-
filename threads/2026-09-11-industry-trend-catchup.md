---
id: 2026-09-11-industry-trend-catchup
type: thread
tags: [meta, research, trend-scan, skills, eval, security, multi-turn]
related:
  - [[skill-injection-decision]]
  - [[skill-lifecycle-and-drift]]
  - [[agent-skills-progressive-disclosure]]
  - [[skill-text-authoring]]
  - [[agent-trajectory-eval]]
  - [[llm-as-judge]]
  - [[eval-statistical-significance]]
  - [[harness-as-hyperparameter]]
  - [[offline-prompt-optimization]]
  - [[prompt-component-attribution]]
  - [[simulated-user-eval]]
  - [[prompt-injection-and-isolation]]
  - [[references-agent-skill-authoring]]
  - [[references-harness-evaluation]]
  - [[references-prompt-optimization]]
  - [[references-multi-turn-agent-eval]]
  - [[references-prompt-attribution]]
status: snapshot
created: 2026-09-11
summary: "24-day arXiv trend scan (2026-08-19 → 09-11): cluster volumes normalized per day, 2 new nodes, 12 edited — should a skill load at all, skills go stale in silence, and the judge stops being trusted."
---

# Thread — Industry Trend Catch-Up (2026-08-19 → 2026-09-11)

## Goal

Catch up on the 24 days since the [previous sweep](2026-08-18-industry-trend-catchup.md), and land only what changes an existing claim.

## Method

Seven date-bounded arXiv queries (`submittedDate:[202608190000 TO 202609112359]`, non-overlapping with the prior window), capturing `opensearch:totalResults` per cluster as a volume proxy; then title listings for the three fastest-moving clusters; then `id_list` verification of every candidate — published/updated dates, full author list, `arxiv:comment` for venue, and the complete abstract — before any number entered the graph.

> **Superseded 2026-09-18 — this volume table is biased, read it with the correction.** The [09-18 sweep](2026-09-18-industry-trend-catchup.md) established that arXiv **undercounts a trailing window**: submission date is not announcement date, so a window ending on the run date is still filling in (the same query over the same window returned 29 → 37 and 2 → 5 an hour apart). The newest column below was measured fresh, so it is biased **downward**. Both headline movements are affected: multi-turn's rise is likely *understated*, and agent memory's halving may be partly artifact. The per-day deltas should not be quoted. The landings in this thread are unaffected — each was verified per paper, not from the counts.

**Two caveats on the volume table.** (1) The prior sweep's *verbatim* query strings were not preserved, so they were reconstructed from the 08-18 thread's cluster labels; the comparison is indicative, not exact. (2) The windows differ in length (11 days vs 24), so only the **per-day** column is comparable.

| Cluster (abstract keyword) | 08-08→08-18 (11d) | 08-19→09-11 (24d) | per day, then → now |
|---|---|---|---|
| LLM agent + benchmark/evaluation | 74 | 176 | 6.7 → **7.3** |
| tool use / MCP / tool calling | 48 | 123 | 4.4 → **5.1** |
| prompt injection / agent security | 25 | 49 | 2.3 → 2.0 |
| multi-turn dialogue / conversational agent | 14 | 58 | 1.3 → **2.4** |
| agent skills / skill library | 29 | 40 | 2.6 → **1.7** |
| agent memory / long-term memory | 25 | 24 | 2.3 → **1.0** |
| prompt optimization | 8 | 19 | 0.7 → 0.8 |

**The shape of the shift:** multi-turn nearly doubled per day and is now the fastest-growing cluster; agent memory halved. The skills cluster cooled in *volume* while sharpening in *content* — the papers stopped proposing new skill formats and started asking whether skills work, whether they stay true, and whether they can be trusted.

## Landed

Two new nodes, twelve edited.

| Change | Node | Source |
|---|---|---|
| **New node** — should a matched skill load at all, and as text or as a subagent | [skill-injection-decision](../nodes/concepts/skill-injection-decision.md) | [2608.23067](https://arxiv.org/abs/2608.23067), [2608.27487](https://arxiv.org/abs/2608.27487), [2609.09233](https://arxiv.org/abs/2609.09233), [2609.08228](https://arxiv.org/abs/2609.08228) |
| **New node** — skills go stale silently; closure, retest triggers, compression as a lifecycle cost | [skill-lifecycle-and-drift](../nodes/concepts/skill-lifecycle-and-drift.md) | [2608.21964](https://arxiv.org/abs/2608.21964), [2609.05920](https://arxiv.org/abs/2609.05920), [2608.30785](https://arxiv.org/abs/2608.30785) |
| Versioning pitfall upgraded with the closure caveat and the 57-repo / 105-transition evidence; routing pointers to both new nodes | [agent-skills-progressive-disclosure](../nodes/concepts/agent-skills-progressive-disclosure.md) | same |
| Form tiebreaker (**anti-pattern rules beat example-heavy content**); loop step 1 now requires a **length-matched** control; new pitfall "assuming the text stays true" | [skill-text-authoring](../nodes/concepts/skill-text-authoring.md) | 2608.23067, 2608.21964 |
| New section: two instruments that see what pass/fail hides — grounded checklist partial credit, and the self-revealing bound **Acc ≤ GAR** | [agent-trajectory-eval](../nodes/concepts/agent-trajectory-eval.md) | 2608.27487, [2609.00949](https://arxiv.org/abs/2609.00949) |
| New section: **demote the judge to advisor when it gates a loop** — four failure classes, three incidents, five guardrails, canary cases | [llm-as-judge](../nodes/concepts/llm-as-judge.md) | [2609.02246](https://arxiv.org/abs/2609.02246) *(see caveat below)* |
| New pitfall: a judge with the last word | [self-improving-harness](../nodes/concepts/self-improving-harness.md) | same |
| New practice 6: report the **reliability of the candidate you picked** (worst-condition lift, repeatability, RelLift95(B)) | [eval-statistical-significance](../nodes/concepts/eval-statistical-significance.md) | [2609.05736](https://arxiv.org/abs/2609.05736) |
| New mechanics row + section: **scope the search surface**, then report the winner's reliability | [harness-as-hyperparameter](../nodes/concepts/harness-as-hyperparameter.md) | same |
| New section: does the search complexity earn its keep? (single-lineage NPO vs GEPA's Pareto population); reward-hacking pitfall expanded | [offline-prompt-optimization](../nodes/concepts/offline-prompt-optimization.md) | [2608.27266](https://arxiv.org/abs/2608.27266) |
| Adopt-item 2 ("never select only the current best") marked **contested since 2026-08** | [worked-example-gepa-mechanism](../nodes/projects/worked-example-gepa-mechanism.md) | same |
| New section: **the prompt includes what the model already said** — neutralization, length-controlled neutralization, Turn Surgery, selective history management | [prompt-component-attribution](../nodes/concepts/prompt-component-attribution.md) | [2609.05882](https://arxiv.org/abs/2609.05882) |
| **A flat role description is not a persona** — 23-dimension vector, 15.8 pp spread, vagueness axis kept separate | [simulated-user-eval](../nodes/concepts/simulated-user-eval.md) | [2609.08592](https://arxiv.org/abs/2609.08592) |
| New vectors row + subsection: **the harness itself is an unaudited dependency layer** (config defects, covert policy steering, detector generalization collapse) | [prompt-injection-and-isolation](../nodes/concepts/prompt-injection-and-isolation.md) | [2609.07360](https://arxiv.org/abs/2609.07360), [2609.02564](https://arxiv.org/abs/2609.02564), [2608.19901](https://arxiv.org/abs/2608.19901) |
| A skill package is a candidate sub-agent — the return contract is what makes procedural knowledge delegable | [subagent-context-isolation](../nodes/concepts/subagent-context-isolation.md) | 2609.09233 |
| Reading lists extended and re-dated: injection-question, lifecycle, three security entries; PRISM + harness scanning; NPO; four multi-turn additions; Turn Surgery | five reference nodes | all of the above |
| Two Connections bullets to the new nodes | [context-engineering](../nodes/topics/context-engineering.md) | — |

## Key insights

- **The skills literature turned skeptical, and this graph now carries its second negative control.** Over 31 public WebDev skills × 50 projects × 1,000 tasks × 4 models, matched skill injection *reduced* mean Pass@2 by 1.3%–4.2% while raising tokens 72%–394%, helping in only 17%–36% of skill-project pairs — and a **length-matched irrelevant control** reproduced most of the loss, separating *length-distracted* from *content-misled* failure. Scope matters: these are third-party public skills in coding agents, not a hand-written domain playbook. The graph's rule is now the **skill-project-model triple**, not the skill.
- **Binary scoring has a measurable blind spot.** Among 879 with/without-skill pairs whose PASS/FAIL was unchanged, 20.9% improved by >0.10 and 18.7% regressed by the same margin. Grounded-checklist partial credit with **evidence-only judging and abstention** beat holistic judging at discriminating official outcomes (AUC 0.689 vs 0.619). If your only instrument is pass/fail, roughly 40% of the effect is invisible.
- **Staleness is silent and universal.** Across 57 repositories and 105 release transitions, **every** transition invalidated part of the skill set, and frontier agents reached only 29.9%–69.7% avg@3 macro F1 on a patch-grounded metric that balances stale-content recall against over-editing precision. Externalizing knowledge into a skill makes its decay invisible — and a one-sided metric rewards over-deletion.
- **A directory pin is not an identity.** A lexical audit of 549 public skills / 4,872 files found only 21 of 526 file-bearing roots naming every path verbatim, 67 with links resolving outside their roots, and **zero** declaring a `dependencies` field. Version pins cover the root, not the closure.
- **The cheapest new guardrail is a canary case.** An eval case whose correct score is *known to be imperfect*, where a perfect score is evidence of cheating rather than success. This graph did not have it.
- **The bound worth stealing costs nothing.** Acc ≤ GAR needs no new labels: when accuracy exceeds gold-action recall, your state grader is masking miscalibration. Its companion warning — a single context perturbation moved accuracy **+11.5 vs −21.0 pp** across model families — is the non-portability result to quote whenever a prompt fix is proposed as universal.
- **Half the context is written by the model.** Editing only assistant history changed downstream performance by +.027 over 2,973 trajectories, and a length-controlled subset (+.069 vs +.068) rules out mere shortening. 63.7% of degraded trajectories had at least one beneficial single-turn intervention while most positions were inert — so history management should be **selective, not uniform**, which is a constraint on compaction policy, not a tuning knob.
- **A disagreement the graph now carries rather than resolves.** NPO — a single-lineage revise-with-a-teacher loop, no population, no Pareto frontier — reports matching or beating GEPA with fewer rollouts, with the advantage *growing* with teacher strength. Both sides are author-reported on self-selected benchmarks, so the GEPA worked example's selection claim is marked contested, not replaced. The practical takeaway is unambiguous: run the naive loop as the baseline before paying for search.

## Caveat on the judge-failure source

The `llm-as-judge` section rests on a **single-author preprint with no benchmark and no reproduction**, whose own Teacher component is itself an LLM judge. It was landed because its five guardrails are cheap, independently sensible, and testable locally — not because the report is verified. The provenance is stated in the node itself. Treat the three incidents as illustrative, not as measured rates.

## Verified but deliberately not landed

- [2608.29596](https://arxiv.org/abs/2608.29596) — *Towards a Systems Foundation for Agentic Skills: Architecture, Lifecycle, and Security*; covers the same territory as both new nodes but as a position/architecture map rather than measurement. Nothing in it changes a claim; keep it as the framing citation if this cluster ever needs one.
- [2609.07395](https://arxiv.org/abs/2609.07395) — uncertainty-quantification taxonomy for agents; a real gap in this graph, but it deserves a node rather than a bullet.
- [2608.22793](https://arxiv.org/abs/2608.22793) — TRACE v2; the v1 claim already landed on 08-18 and nothing in the revision moves it.
- [2609.01736](https://arxiv.org/abs/2609.01736) — agent-native reusable tool primitives as harness engineering; overlaps existing [agent-harness](../nodes/topics/agent-harness.md) material without contradicting it.
- [2608.25776](https://arxiv.org/abs/2608.25776) — EVOMAL self-poisoning in evolving skill libraries; adjacent to both new nodes, but the mechanism belongs in a dedicated self-improvement-safety node.
- [2609.05511](https://arxiv.org/abs/2609.05511) — SCAFFOLD; recursive parametric skill abstraction with MDL-based library compaction for visual web agents. Genuinely adjacent to [skill-lifecycle-and-drift](../nodes/concepts/skill-lifecycle-and-drift.md)'s compression section, but it is a self-improvement *architecture*, and landing it as a bullet would misrepresent it.
- [2609.02149](https://arxiv.org/abs/2609.02149) — OmegaUse-SOP; SOP-following agents, close to `task-agent-pattern` but not a change to it.
- Names seen in listings and **not** verified, therefore not cited anywhere: any that did not survive the `id_list` pass.

## Process notes

- Keep the *verbatim query strings* with each sweep, not just the cluster labels — reconstructing them cost this sweep its exact cross-window comparability.
- Normalize to per-day before reading any volume shift; the raw counts here would have suggested every cluster grew.
- 6-second spacing between arXiv calls held for 10 consecutive queries with no 429s.
- Every string replacement went through a helper asserting an exact occurrence count and aborting on mismatch — the guard that would have caught the earlier silent-YAML incident, since `tools/build-graph.py` still accepts a malformed `related:` block without complaint.
