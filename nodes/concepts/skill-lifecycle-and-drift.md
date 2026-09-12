---
id: skill-lifecycle-and-drift
type: concept
tags: [skills, versioning, maintenance, drift, eval, security, agents]
summary: "externalizing knowledge into a skill makes its decay invisible — every release invalidates part of a repo skill set, frontier agents cannot reliably repair it, and the artifact's real identity is its dependency closure, not the signed directory."
related:
  - [[context-engineering]]
  - [[agent-skills-progressive-disclosure]]
  - [[skill-text-authoring]]
  - [[skill-injection-decision]]
  - [[eval-dataset-quality]]
  - [[adaptive-eval-budget]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[memory-consolidation-and-forgetting]]
  - [[prompt-injection-and-isolation]]
  - [[action-authority]]
  - [[llm-observability]]
  - [[references-agent-skill-authoring]]
status: living
created: 2026-09-11
source-thread: [[2026-09-11-industry-trend-catchup]]
---

# Skill Lifecycle & Drift

A skill's value comes from being **specific to your current world** — these APIs, these conventions, this release. That is also what rots. The sharp formulation: "the same version specificity that makes a skill useful also makes it fragile," and because the knowledge now lives in an artifact rather than in a person's head, **externalizing it into a skill can make its decay invisible** ([arXiv:2608.21964](https://arxiv.org/abs/2608.21964)).

This upgrades what [agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md) lists as a one-line pitfall ("no versioning discipline") into a measured failure with a known repair rate.

## Staleness is silent, and universal

Repo2Skill-Evo casts each software release as a **skill-maintenance task**: given a V1 skill set and the official V1→V2 patch, update the obsolete content while preserving guidance that still holds. Across **57 real-world repositories and 105 release transitions**:

- **Every evaluated transition invalidated part of the V1 skill set.** Not most — all of them.
- Six frontier agents reached only **29.9%–69.7% avg@3 macro F1** on a patch-grounded removal metric.
- Nothing raises a signal. The stale skill keeps returning confident, obsolete guidance.

The failure is two-sided, which is why the metric has to be: **incomplete coverage** leaves stale content untouched (the agent misses affected files in the skill set), while **overbroad editing** raises recall and destroys precision. An agent told to "refresh the skill" will land on one error or the other, so a maintenance eval that scores only recall will reward the agent that deletes half the playbook.

## Your version pin covers less than you think

Pinning the skill directory is necessary and insufficient, because a skill's operational identity exceeds it: skills combine instructions with files, packages, tools, models, and services, and "recursive or lazy dependencies may change while root-level evidence remains valid" ([arXiv:2609.05920](https://arxiv.org/abs/2609.05920)). The paper's remedy is a reference monitor that binds each grant to an exact **dependency closure** rather than a directory hash, so authorization cannot transfer across a material change beneath the root — its stated property is **version non-inheritance**.

The audit alongside it is the part to act on immediately. Over **549 public skills / 4,872 unique files**:

| Finding | Count |
|---|---|
| Roots with bundled files that name every non-manifest path verbatim | **21 of 526** |
| Skills containing links that resolve *outside* their own root | **67** |
| Roots declaring a frontmatter `dependencies` field | **0** |

So in the public corpus, the closure is essentially undeclared. For your own skills that is a cheap fix — enumerate what the skill reaches, in the frontmatter — and it is the precondition for any automated staleness check, because you cannot diff what the artifact never named.

## The maintenance loop

1. **Declare the closure.** Files, scripts, tool/service dependencies, and the release each pinned assumption belongs to. Undeclared reach is undetectable drift.
2. **Tie a retest trigger to each dependency**, not to the calendar. The trigger for a repo skill is a release; for a policy skill, a policy change; for a tool skill, a schema change.
3. **Retest with a two-sided metric.** Stale-content recall *and* over-edit precision, per the failure pair above.
4. **Keep the critical set non-adaptive.** Drift retesting is exactly where a cheap adaptive screen is tempting and wrong for the safety-relevant cases — the layer split in [adaptive-eval-budget](adaptive-eval-budget.md).
5. **Date the assumptions in the text.** Not as a conditional the model must reason over ("before August 2025, use the old API" — [skill-text-authoring](skill-text-authoring.md) rejects that), but as a superseded-patterns section a diff can find.

The knowledge-representation analogue is already in this graph: a fact whose validity interval ended is not the same as a fact that was wrong ([bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md)). A stale skill line is an *expired* rule, and expiring it needs a different mechanism than deciding it never earned its place ([skill-injection-decision](skill-injection-decision.md)).

## Compression interacts with the lifecycle

If a skill bundle is compressed, the compression is now part of the lifecycle rather than a one-time build step. SkillZip Pro compresses **across files** — removing content from a reference or subskill when the root or a declared environment contract already supplies it — while preserving routing so every required file and callable entry stays reachable, and offers a *Continual* mode that reapplies compression after each evolution patch (Zip-on-Write). On a production content-moderation skill it removed **38% of bundle tokens and 10.4% of end-to-end per-run tokens with no quality loss**; an unprotected **71%** configuration lost **up to 26 accuracy points**, and the loss was **one-sided false positives** ([arXiv:2608.30785](https://arxiv.org/abs/2608.30785), author-reported on an industrial harness).

Two things to take: over-compression fails *asymmetrically*, so measure the direction of the error and not just the aggregate; and cross-file dedup is the safe move that [skill-text-authoring](skill-text-authoring.md) already argues for ("explain once, reference many") — now with the caveat that it makes the closure declaration load-bearing.

**Naming warning:** "SkillZip" is now attached to at least three unrelated 2026 arXiv entries ([2608.05604](https://arxiv.org/abs/2608.05604), [2608.11079](https://arxiv.org/abs/2608.11079), and this one). Cite by identifier. I did not establish which, if either, of the earlier two this one descends from.

## Pitfalls

- **Trusting a review date over a dependency event.** A skill reviewed last week is stale if the API shipped yesterday.
- **Letting an agent refresh a skill unsupervised.** Best-case measured repair is under 70% F1, and the failure mode is over-deletion — put the diff behind the same acceptance gate as any other skill edit.
- **Treating a bundled-file link that leaves the root as an implementation detail.** It is an undeclared dependency and, for a shared skill, an unaudited surface ([prompt-injection-and-isolation](prompt-injection-and-isolation.md)).
- **Deleting on staleness evidence alone.** Stale phrasing around a still-valid rare exception is a rewrite, not a removal — the rare-exception ceiling in [skill-text-authoring](skill-text-authoring.md).
