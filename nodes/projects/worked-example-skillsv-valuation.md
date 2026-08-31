---
id: worked-example-skillsv-valuation
type: project
kind: worked-example
tags: [skills, attribution, shapley, valuation, eval, compression]
summary: "SkillSV walked through from its source: how a skill compiles into a Shapley game, the three-number report (content value / context cost / net effect), the budgeted estimator, and where the paper is weaker than its abstract."
related:
  - [[prompt-component-attribution]]
  - [[skill-text-authoring]]
  - [[agent-skills-progressive-disclosure]]
  - [[offline-prompt-optimization]]
  - [[eval-statistical-significance]]
  - [[cost-aware-eval]]
  - [[references-agent-skill-authoring]]
  - [[references-prompt-attribution]]
status: snapshot
created: 2026-08-30
source-thread: [[2026-08-30-skillsv-fanout]]
---

# Worked Example — SkillSV, Walked Through

Method walkthrough of *What Is a Skill Worth? Structure-Aware Shapley Valuation of Agent Skills* ([arXiv:2608.04562](https://arxiv.org/abs/2608.04562), Li, Liu, Zhao, Li, Wang, Shao, Liu, Shou; 2026-08-05), read from its **arXiv LaTeX source** (main.tex + a 41 KB appendix) rather than its abstract. Everything below is the paper's own claim unless marked *[graph]*. Author-reported, 2026 preprint, not independently reproduced.

Why it earns a node: it is the only published method that answers "which line of my skill earns its tokens?" with a calibrated number, and three of its mechanisms are worth copying even if you never implement Shapley values.

## 1. Compilation — skill artifact → structured game, no model in the loop

A compiler maps the artifact to `(Units, Dependencies, Hierarchy)`:

| Element | Rule |
|---|---|
| **Unit** | Cut "at the granularity at which skill optimizers edit the artifact": each **top-level Markdown list item** opens a unit; indented continuations stay with the parent; **headings are scaffolding, not players** (a heading renders whenever any unit under it survives); auxiliary files (scripts, references) compile to *resource units* |
| **Dependencies** | Nine families of edges. Named: **reference** (markdown links, file-path tokens, verbatim heading mentions), **semantic** (a symbol's definition bound to its use — no syntactic marker, recovered by analysing code blocks), **continuity** (fragments a patch-editing history left adjacent, e.g. an orphaned table body and the unit carrying its header) |
| **Feasibility** | A coalition is scored only if **downward-closed** under dependencies: keep a unit, keep what it needs |
| **Hierarchy** | Enforces **contiguity** — siblings are evaluated as a block, so a unit is never judged against a fragmented, half-open section. Dependencies cannot express this |

The methodological line worth adopting verbatim: *"We do not fix infeasible coalitions by rewriting the remaining text, because that would measure deletion plus rewriting rather than unit value."*

## 2. Valuation — restricted Shapley with two renderings

The value is the random-order Shapley marginal with two changes: orders restricted to **feasible** ones, and the uniform distribution replaced by a declared distribution μ. The paper is candid that this costs canonicity — "the layerwise sampler used in practice is generally not uniform over linear extensions, and uniform sampling is computationally hard." **The value is therefore sampler-relative.**

Two **local** removal operators — only removed units change, survivors stay byte-for-byte identical — yield three reported quantities:

| Quantity | Definition | Decision it drives |
|---|---|---|
| **content value** | φ under length-matched neutral padding | keep |
| **context cost** | φ(pad) − φ(delete) | **compress** |
| **net effect** | φ under outright deletion | delete |

The rule that falls out is the paper's most portable sentence: *"A unit with positive content value but large context cost is a compression target rather than a deletion target."*

Two design details worth stealing: at the grand coalition both renderings must agree (`V_del(N) = V_pad(N)`), a **runtime self-check on the renderer**; and the frontmatter is valued separately as a **trigger value** `θ_m = V({m}) − V(∅)`, because it triggers rather than executes — every feasible order begins with it, so all body units are valued *conditional on the skill having fired*. *[graph]* That is the measurable form of "the description is the routing function" in [agent-skills-progressive-disclosure](../concepts/agent-skills-progressive-disclosure.md).

## 3. Estimation — why this is affordable at all

A full two-operator audit costs `2 × K × (n+1) × M` rollouts: for n=50 units, M=40 tasks, K=10 orders, **40,800 agent rollouts**. Two reductions:

1. **Prefix-chain reuse** — one sampled feasible order yields a marginal for *every* unit, not one.
2. **Chain-coupled task windows** — draw a stratified window of `b ≪ M` tasks per order and score **every prefix of that order on the same window**, so each marginal is a paired difference over identical tasks. "The implementation enforces pairing by requiring the two sides of every marginal difference to use the identical task list." Plus early truncation once a prefix is within τ of the full-skill anchor.

Shipped config: **K=12, b=8, τ=0.05**, 1000-replicate task-level bootstrap, frozen GPT-5.5 agent.

## 4. What the experiments establish

Four benchmarks (LiveMathematicianBench, OfficeQA Pro, SpreadsheetBench, ALFWorld) × the best `skill.md` from four optimizers (Trace2Skill, TextGrad, GEPA, SkillOpt). Optimizer-agnostic: it values the compiled document, not the process that made it.

- **Value closure (the strongest result).** Summed unit values recover the measured content lift `Λ = V(N) − V({m})` at **0.95×–1.04×** on all four benchmarks — the empirical counterpart of Shapley efficiency. Closure-LOO fails the same check with the wrong sign or wild magnitudes: **−0.83×, 4.43×, −1.00×, −10.00×**.
- **Interaction recovery.** On planted synthetic units (redundant OR pair, complementary AND pair, harmful, dead) SkillSV recovers every role; Closure-LOO assigns **zero to the redundant pair** and **double-counts the complementary pair**; an LLM judge is inconsistent. On a real skill, removing either member of a redundant pair barely moves the score while removing both drops it clearly — "the interaction value is real, yet entirely missed by single-removal evaluations."
- **Pruning.** AUC beats LOO by +0.026, LLM judge by +0.049, random by +0.082, no 95% CI containing zero.
- **Attribution-guided refinement.** An editor given the three numbers from panel A, scored on disjoint panel B, retains **69% of tokens on average** (96 / 80 / 57 / 42% per benchmark) with no significant performance change.
- **Why compression works: value is concentrated.** Top 10% of units hold **21%** of value mass (OfficeQA), **35%** (LiveMath), **60%** (Spreadsheet), **100%** (ALFWorld). LOO cannot see this because "redundant units mask each other in the full context. True sparsity emerges only through multi-context evaluation."

## 5. Where it is weaker than its abstract *[graph]*

- **No limitations section.** Neither main.tex nor the appendix has one; the hedges are inline only.
- **"Lossless" is underpowered, not demonstrated.** The refinement CIs are wide — LiveMath is **−4.8 [−14.5, +4.8]** on 62 tasks. "No significant change" here means *no detectable change*, exactly the failure [eval-statistical-significance](../concepts/eval-statistical-significance.md) warns about. Well-supported: *ranking quality*. Not supported: losslessness.
- **Context cost inherits an assumption.** It is *defined* as the operator gap, so any behavioural non-neutrality of a length-matched placeholder is absorbed into it. Placeholder neutrality is stated as an explicit assumption; the grand-coalition check is necessary but not sufficient — it holds trivially when nothing is removed.
- **Values are sampler-relative and agent-specific.** μ is non-uniform by admission, and everything is conditioned on a frozen GPT-5.5. Portability across models is unestablished — and the task-order fragility result in [eval-statistical-significance](../concepts/eval-statistical-significance.md) suggests it should not be assumed.
- **The compiler is the load-bearing unvalidated component.** Nine heuristic edge families, no reported precision/recall for edge extraction. A missed dependency silently produces an infeasible coalition scored as if valid — referential dangling one level up.
- **Cost.** Even windowed: `2 × 12 × (n+1) × 8` rollouts per skill, thousands before truncation. A tool for a converged, high-value skill; not a CI-loop check ([cost-aware-eval](../concepts/cost-aware-eval.md)).

## 6. What to adopt without adopting the framework *[graph]*

1. **Report three numbers, not one** — content value, context cost, net effect — and route on them: high content value + high context cost means *compress*, never delete.
2. **Run the closure check as a free self-audit** of any ablation tooling: Σφ should recover `V(full) − V(trigger-only)` within a few percent. LOO reliably fails it, which is a cheap way to prove your own tooling is miscalibrated.
3. **Pair every marginal on an identical task list.** The single cheapest variance reduction available, and it generalises to any ablation ([eval-statistical-significance](../concepts/eval-statistical-significance.md)).
4. **Never repair an infeasible variant by rewriting** — you would be measuring deletion plus rewriting.
5. **Write skills so they compile.** Units are top-level list items and headings are not players, so a skill written as flat top-level bullets is *measurable* while one written as nested prose is not — an independent argument for the flat decision-table style in [skill-text-authoring](../concepts/skill-text-authoring.md).
