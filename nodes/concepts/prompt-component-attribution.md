---
id: prompt-component-attribution
type: concept
tags: [prompt, attribution, interpretability, eval, agents, credit-assignment]
summary: "which sentence caused which output — per-instance context attribution vs population-level ablation, the method ladder from leave-one-out to surrogate/Shapley/bandit, and why a per-sentence effect is always conditional."
related:
  - [[offline-prompt-optimization]]
  - [[agentic-context-engineering-ace]]
  - [[eval-statistical-significance]]
  - [[llm-evaluation]]
  - [[eval-case-design]]
  - [[cot-as-forensic-artifact]]
  - [[recency-bias-prompt-design]]
  - [[grounding-and-citation]]
  - [[prompt-injection-and-isolation]]
  - [[llm-observability]]
  - [[live-traffic-eval]]
  - [[harness-token-economics]]
  - [[context-budget-allocation]]
  - [[skill-text-authoring]]
  - [[context-engineering]]
  - [[references-prompt-attribution]]
status: living
created: 2026-08-06
source-thread: [[2026-08-06-prompt-attribution-research]]
---

# Prompt Component Attribution

"Which sentence in my prompt caused this output?" is a real, formalized problem — **context attribution**: pinpointing the parts of the input (*if any*) that led the model to generate a particular statement (ContextCite, [arXiv:2409.00729](https://arxiv.org/abs/2409.00729)). The "if any" is load-bearing: the honest answer is sometimes *nothing in the prompt did* — the output came from weights.

## Two questions, routinely conflated

| | **Attribution** (per instance) | **Effectiveness** (per population) |
|---|---|---|
| Question | which part of *this* prompt produced *that* span? | does this rule earn its place in the playbook? |
| Unit of answer | one run | an eval suite |
| Method | context attribution (surrogate ablation, Shapley, gradient) | leave-one-out ablation, per-rule follow rate |
| Used for | debugging one bad answer, verifying grounding, catching injection | pruning, ordering, deciding what to cut |
| Failure when swapped | deleting a sentence because it "caused" one bad answer — it may carry nine good ones | explaining a specific incident with an average effect that doesn't apply to that case |

Answer the *instance* question when triaging an incident. Answer the *population* question when editing the playbook. Both are needed; neither substitutes.

## The method ladder

Ordered cheapest-first. Everything above the mechanistic tier is black-box and works on an API-only model.

| Method | Mechanism | Granularity | Rough cost | Anchor |
|---|---|---|---|---|
| **Leave-one-out / corruption** | delete or corrupt component *i*, re-run the suite, measure Δ | your own sections | *n* × suite | [arXiv:2404.02054](https://arxiv.org/abs/2404.02054) |
| **Surrogate ablation** | randomly ablate subsets, fit a *linear surrogate* predicting the target response's logprob; surrogate weights are the attributions | sentence / source | tens of calls per query | ContextCite |
| **Shapley** | Monte Carlo over subsets; interaction-aware by construction | token / substring | high, sampling-bounded | TokenSHAP [arXiv:2407.10114](https://arxiv.org/abs/2407.10114) |
| **Bandit-optimized** | Linear Thompson Sampling adaptively prioritizes informative subsets instead of sampling uniformly; reward from token logprobs | segment | fewer queries than SHAP | [arXiv:2506.19977](https://arxiv.org/abs/2506.19977) |
| **Joint counterfactual** | combinatorial optimization for the *set* of prompt texts that jointly drive a full generation | phrase set | search-bounded | JoPA [arXiv:2405.20404](https://arxiv.org/abs/2405.20404) |
| **Gradient / mechanistic** | causal intervention on activations; span-wise aggregation for multi-token targets | token, internal | needs weights or logits | FlashTrace [arXiv:2602.01914](https://arxiv.org/abs/2602.01914), ROME [arXiv:2202.05262](https://arxiv.org/abs/2202.05262) |
| **Multi-turn tracing** | recursive traversal of a DAG over conversation turns, so attribution propagates *across* turns | turn → span | attribution cost × depth | Tokengeist [arXiv:2607.22610](https://arxiv.org/abs/2607.22610) |
| **Ask the model** | "which instruction made you do that?" | whatever it says | ~free | unreliable — see below |

For a conversational task agent the practical default is **surrogate or bandit attribution for incident triage** plus **leave-one-out for playbook editing**. Single-pass attribution is the wrong tool for a long session: it recovers surface-level dependencies and misses the layered structure of a real dialogue, which is the gap multi-turn tracing exists to fill.

## Instrumenting a playbook so attribution is cheap

Attribution gets dramatically cheaper if the prompt was written to be attributable:

1. **Give every rule an ID.** `R1…Rn`, one behavior each — the same discipline as the itemized bullets in [agentic-context-engineering-ace](agentic-context-engineering-ace.md).
2. **Write a verifier per rule wherever the rule is checkable.** IFEval's "verifiable instructions" ([arXiv:2311.07911](https://arxiv.org/abs/2311.07911)) is the template: "mention the ticket ID," "never send before confirming" are deterministically checkable; "be warm" is not. Verifiable rules get a follow rate; the rest fall to [llm-as-judge](llm-as-judge.md).
3. **Log which rule IDs were satisfied per case.** That yields a **per-rule follow rate** across the suite — the cheapest useful effectiveness signal, and it needs no ablation at all.
4. **Ablate by rule ID on a held-out slice, paired.** Same cases, same seeds, per-case deltas.
5. **Keep sections fixed.** A stable schema (role / context / task / constraints / output format) lets edits and textual gradients stay **section-local** rather than rewriting the blob ([arXiv:2601.04055](https://arxiv.org/abs/2601.04055)).

Steps 1–3 are logging discipline, not research; they belong in [llm-observability](llm-observability.md) from day one, because retrofitting rule IDs after an incident is how attribution work gets skipped.

## Five reasons a naive measurement lies

- **Per-sentence effects are not additive.** Instruction-following degrades **non-linearly** as constraints accumulate — a benchmark stacking 24 verifier-checked instructions one to twenty at a time reports follow rate falling from ~96% to as low as **20%**, with a single "output JSON" constraint jointly unsatisfiable with nine others ([arXiv:2608.02639](https://arxiv.org/abs/2608.02639); 2026 preprint, three production-tier models). So a rule's measured contribution is *conditional on the rest of the prompt* and can invert when you add the next rule. Re-measure after edits; never bank a per-sentence number as a constant.
- **Your Δ may be under the variance floor.** Meaning-preserving **format** changes alone move accuracy by up to **76 points** ([arXiv:2310.11324](https://arxiv.org/abs/2310.11324)), and few-shot **ordering** spans near-SOTA to near-random ([arXiv:2104.08786](https://arxiv.org/abs/2104.08786)). An ablation Δ smaller than that spread measures noise. See [eval-statistical-significance](eval-statistical-significance.md).
- **A sentence can help for reasons unrelated to its meaning.** Semantically *irrelevant* prompts have been shown to steer behavior and sometimes match or beat task-aware prompt optimization ([arXiv:2605.29678](https://arxiv.org/abs/2605.29678)) — so "removing it hurt" does not license the story you'll write about *why* it helped.
- **In-context and in-weight contributions get confounded.** When context overlaps training data, attribution methods cannot disentangle the two and produce unreliable scores ([arXiv:2607.23804](https://arxiv.org/abs/2607.23804)). A high score on your retrieved passage may mean the model already knew it — which matters directly for [grounding-and-citation](grounding-and-citation.md), since it inflates apparent groundedness.
- **Self-reports and attention weights are not attribution.** CoT explanations systematically misrepresent the true cause — reordering options to make the answer always "(A)" changes behavior while models fail to mention it ([arXiv:2305.04388](https://arxiv.org/abs/2305.04388)); faithfulness varies by task and *decreases* with model capability ([arXiv:2307.13702](https://arxiv.org/abs/2307.13702)); attention weights are frequently uncorrelated with gradient-based importance ([arXiv:1902.10186](https://arxiv.org/abs/1902.10186)). Treat any self-explanation as a lead to verify by ablation, per [cot-as-forensic-artifact](cot-as-forensic-artifact.md).

## Per-line efficiency: is this line worth its tokens?

Attribution asks *what did this line do?* Efficiency asks *did it earn its tokens?* — a different question, with its own literature and its own traps. Two method families:

| Family | Mechanism | Cost | What it gets wrong |
|---|---|---|---|
| **Value-based** (ablation / Shapley) | delete or permute a unit, measure the outcome delta | rollouts per unit | needs valid counterfactuals; confounds content with length |
| **Score-based** (compression) | score each token/sentence/chunk, keep the top under a budget | one cheap pass | scores units *independently*, so it breaks dependencies |

**The length confound is the first thing to fix.** Deleting a rule also shortens the prompt, so a naive ablation measures two changes at once. SkillSV's answer is **paired deletion with length-neutral padding**, plus dependency- and hierarchy-aware counterfactuals so only *valid* variants are scored ([arXiv:2608.04562](https://arxiv.org/abs/2608.04562)). Adopt the padding even if you never adopt the Shapley machinery.

**A free self-audit for whatever you build.** Calibrated unit values must sum to the whole they explain: Σφ over units should recover `V(full prompt) − V(trigger/frontmatter only)`. SkillSV passes at **0.95×–1.04×** across four benchmarks while closure-corrected leave-one-out fails the same check with the wrong sign or wild magnitude (**−0.83×, 4.43×, −1.00×, −10.00×**), because single-deletion effects are not additive under redundancy and complementarity ([worked-example-skillsv-valuation](../projects/worked-example-skillsv-valuation.md)). Run this before trusting any per-line number you compute.

**Score-based methods have three documented failure modes**, all of which are the independence assumption failing:

- **Referential dangling.** Independent scoring keeps the sentence containing the answer and deletes the sentence defining the entity needed to interpret it. At compression ratio 0.30 one compressor leaves the answer path incomplete in **34–54%** of bridge examples across three multi-hop QA datasets; on a shared HotpotQA bridge set **all six** tested hard compressors dangle at rates up to **60%**, and every document in LongBench-v2 Single-Document QA contains at least one dangling reference ([arXiv:2608.04569](https://arxiv.org/abs/2608.04569)).
- **Theme collapse.** Ranking sentences by a scalar relevance score lets the dominant theme monopolize a tight budget, discarding less-frequent but task-relevant themes; coverage requires allocating budget *across* themes rather than scoring sentences in isolation ([arXiv:2607.17486](https://arxiv.org/abs/2607.17486)).
- **Language dependence.** Compressors trained on English supervision transfer poorly, and non-English content already pays a **1.3–1.8× token premium** — so the tooling widens the gap it was meant to close ([arXiv:2608.26175](https://arxiv.org/abs/2608.26175); 10 languages, 11 target models, 250,000+ evaluation calls).

**Caching can invert the entire calculation.** Query-aware compression emits a different prefix per query, which *mechanically invalidates the prefix cache on every call*. Measured against Anthropic's Sonnet 4.6 API: a two-tier cache with a sharp threshold near **3,500 tokens**, below which hit rate plateaus at **ρ≈0.83** over 30-call sessions — well short of the ρ=1.0 the compression literature assumes — and query-aware compression only beats naive caching at high compression ratios (**r ≥ 6**) ([arXiv:2607.15516](https://arxiv.org/abs/2607.15516)). A skill or system prompt is a *stable prefix*, so for the case this graph cares about, trimming lines can cost more than it saves. Establish whether the prompt is cached before asking whether a line is efficient — see [harness-token-economics](harness-token-economics.md).

**The ceiling on the question.** A line whose value only appears in a case your eval set doesn't contain scores as zero under *every* method here — ablation, Shapley, and compression alike. "Rare exceptions may remain essential even when no sampled task activates them" ([arXiv:2608.11079](https://arxiv.org/abs/2608.11079)). So the operating rule is asymmetric: **measure value on lines your eval exercises; restructure rather than delete the rest.** Deletion needs outcome evidence; deduplication needs only structure ([skill-text-authoring](skill-text-authoring.md)).

## Where this connects

- Attribution is the **localization** that [offline-prompt-optimization](offline-prompt-optimization.md)'s coarse-credit-assignment pitfall is missing. The 2026 optimizers that build it in — section-local textual gradients, an environment-grounded *behavior analyzer* that attributes episode outcomes to prompt components, temporal/structural credit decomposition for multi-agent systems — are catalogued in [references-prompt-optimization](../references/references-prompt-optimization.md).
- ACE's `helpful`/`harmful` counters per bullet are the cheap **online** approximation of a per-rule follow rate: no ablation, just tallying outcomes per component.
- Two non-debugging uses: **pruning** context by attribution (reported to improve response quality) and **detecting poisoning** — an injected instruction is, by construction, a high-attribution span you didn't write. See [prompt-injection-and-isolation](prompt-injection-and-isolation.md) and [memory-poisoning](memory-poisoning.md).
- **The production path.** Everything above assumes a fixed eval suite and a chosen target span. Attribution can instead be driven from live traffic by mining trajectories for implicit dissatisfaction signals (corrections, rephrasing, abandonment) — see the 2026 frontier section of [live-traffic-eval](live-traffic-eval.md).
- Full verified source list, including how to evaluate an attribution method itself: [references-prompt-attribution](../references/references-prompt-attribution.md).
