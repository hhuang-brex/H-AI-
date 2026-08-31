---
id: 2026-08-30-skillsv-fanout
type: thread
tags: [meta, research, fan-out, skills, attribution, shapley, valuation]
related:
  - [[worked-example-skillsv-valuation]]
  - [[prompt-component-attribution]]
  - [[skill-text-authoring]]
  - [[offline-prompt-optimization]]
  - [[references-prompt-optimization]]
  - [[references-prompt-attribution]]
status: snapshot
created: 2026-08-30
summary: "fan-out from SkillSV (arXiv:2608.04562) read at source: one worked-example node, its optimizer and Shapley lineages verified and distributed, plus two sources that could not be verified."
---

# Thread — SkillSV Fan-Out (2026-08-30)

## Goal

The graph cited SkillSV in three places at abstract depth. Read the paper properly, then fan out along its bibliography: the optimizers that *produce* the artifacts it values, and the valuation theory it descends from.

## Method

Pulled `arxiv.org/src/2608.04562` (main.tex + 41 KB appendix + `references.bib`) rather than working from the abstract — the same route that paid off on the multi-turn survey. The bib gave exact ids for the fan-out targets; each was then verified at its own arXiv abstract page.

## Outputs

- New [worked-example-skillsv-valuation](../nodes/projects/worked-example-skillsv-valuation.md) — compilation rules, the three-number report, the budgeted estimator, what the experiments establish, six weaknesses, and five things to adopt without adopting the framework.
- [references-prompt-optimization](../nodes/references/references-prompt-optimization.md) — new *skill optimizers* section: **SkillOpt** ([2605.23904](https://arxiv.org/abs/2605.23904)) and **Trace2Skill** ([2603.25158](https://arxiv.org/abs/2603.25158)).
- [references-prompt-attribution](../nodes/references/references-prompt-attribution.md) — new *valuation lineage* section: **Data Shapley** ([1904.02868](https://arxiv.org/abs/1904.02868)), PC-Winter, Winter 1989.
- Deepened [prompt-component-attribution](../nodes/concepts/prompt-component-attribution.md) (the closure check as a free self-audit), [skill-text-authoring](../nodes/concepts/skill-text-authoring.md) (write so the skill compiles), [offline-prompt-optimization](../nodes/concepts/offline-prompt-optimization.md) (the string → document shift).

## Key insights

- **The closure check is the cheapest thing in the paper and the most reusable.** Calibrated unit values must sum to the whole they explain: Σφ recovers content lift at **0.95–1.04×**, while closure-corrected LOO fails at **−0.83×, 4.43×, −1.00×, −10.00×**. Any homegrown attribution tool can be audited this way for free, and LOO reliably fails it.
- **Three numbers, not one.** content value (padded), context cost (pad − delete), net effect (delete) — and the routing rule: positive content value with large context cost is a *compression* target, not a deletion target.
- **Structure is what makes counterfactuals valid.** Downward-closed coalitions under nine dependency-edge families, hierarchy enforcing sibling contiguity, and the refusal to repair infeasible variants by rewriting ("that would measure deletion plus rewriting rather than unit value").
- **Unit granularity is a writing constraint.** Units are cut at top-level list items; headings are scaffolding, not players. Flat bullets are measurable; nested prose is not.
- **SkillOpt is the strongest text-space optimizer result so far** and its discipline is the transferable part: constrained add/delete/replace edits, an edit kept **only if it strictly raises a held-out score**, plus a textual learning-rate budget, a rejected-edit buffer, and an epoch-level slow update. Best or tied on all 52 (model, benchmark, harness) cells.
- **Value is concentrated**: top 10% of units hold 21–100% of value mass depending on benchmark, and LOO cannot see it because redundant units mask each other in the full context.

## What failed to verify

- **PC-Winter** (precedence-constrained Winter value) — OpenReview served a bot-verification interstitial; recorded as cited-by-SkillSV with ICLR 2025 per its bib, explicitly marked unverified.
- **Winter 1989** (*IJGT*) — paywalled journal, recorded as cited, unverified.
- The **arXiv API 429'd persistently** this session (empty bodies and 503s under repeated `id_list` calls); per-paper WebFetch on `arxiv.org/abs/` pages is the working fallback.
- **Data Shapley venue**: SkillSV's bib records ICML 2019; the arXiv page states no venue. Recorded both ways rather than picking one.

## Open gaps

- **OfficeQA Pro** ([2603.08655](https://arxiv.org/abs/2603.08655), Opsahl-Ong et al. — the MIPRO author, at Databricks) was verified but not landed: 89,000 pages of U.S. Treasury Bulletins, 26M+ numerical values, 133 questions, frontier models under **5%** on parametric knowledge alone and **34.1%** average given the corpus. It belongs in the eval reading list as an enterprise grounded-reasoning benchmark; deferred to keep this fan-out scoped.
- SkillSV's compiler (nine dependency-edge families) has no reported precision/recall. If the graph ever leans harder on its numbers, that is the component to check first.
- Nothing here is validated on an in-house skill; the adoption list in the worked example is derived from the paper, not from a measured deployment.
