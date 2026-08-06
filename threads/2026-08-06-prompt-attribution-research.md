---
id: 2026-08-06-prompt-attribution-research
type: thread
tags: [meta, research, prompt, attribution, eval, statistics]
related:
  - [[prompt-component-attribution]]
  - [[eval-statistical-significance]]
  - [[references-prompt-attribution]]
  - [[references-prompt-optimization]]
  - [[offline-prompt-optimization]]
  - [[cot-as-forensic-artifact]]
  - [[llm-evaluation]]
status: snapshot
created: 2026-08-06
summary: "research on measuring prompt effectiveness — which sentence causes which output; 20 fetch-verified sources, 2 new concept nodes, 1 reference node, and the resolution of a dangling edge."
---

# Thread — Measuring Prompt Effectiveness (2026-08-05 → 2026-08-06)

## Goal

Two questions asked in sequence: (1) ground [offline-prompt-optimization](../nodes/concepts/offline-prompt-optimization.md) in the automatic-prompt-optimization literature, including post-2025 work; then (2) study how to *measure* prompt effectiveness at component granularity — "which sentence causes which output."

## Method

Semantic Scholar search API for discovery (rate-limited quickly; fell back to the arXiv API), then **arXiv API `id_list` batch fetches** to confirm title / authors / dates / comments / abstract for every candidate before citing it. WebFetch for the one ACL Anthology entry. No citation in the outputs was written from memory — the DSPy/GEPA/AutoPrompt/Selective-Context entries in particular had recalled titles that differed from the verified ones.

## Outputs

| Node | Type | What it holds |
|---|---|---|
| [references-prompt-optimization](../nodes/references/references-prompt-optimization.md) | reference | 19 sources: the AutoPrompt → APE → textual-gradient → program-optimizer lineage, plus nine 2026 papers |
| [prompt-component-attribution](../nodes/concepts/prompt-component-attribution.md) | concept | instance-vs-population framing, the 8-rung method ladder, the 5-step playbook instrumentation protocol, 5 reasons naive measurement lies |
| [eval-statistical-significance](../nodes/concepts/eval-statistical-significance.md) | concept | the variance budget table, paired/multi-prompt designs, winner's curse — **resolves a dangling body link** that `harness-as-hyperparameter` had been carrying |
| [references-prompt-attribution](../nodes/references/references-prompt-attribution.md) | reference | 20 sources across methods, meta-evaluation of attribution, sensitivity/ablation, compression, statistics |

## Key insights

- **Two questions get conflated.** Per-instance attribution ("which span produced that sentence?") and population-level effectiveness ("does this rule earn its place?") need different methods and answer different needs. Using an average effect to explain one incident, or one incident to justify deleting a rule, is the common failure.
- **Per-sentence effects are not additive, with a number attached.** *Instruction Stacking Collapse* ([arXiv:2608.02639](https://arxiv.org/abs/2608.02639)) stacks 24 verifier-checked instructions and reports follow rate falling ~96% → 20%, with "output JSON" jointly unsatisfiable with nine other constraints. So any per-rule contribution is conditional on the rest of the prompt and must be re-measured after edits.
- **There is a variance floor under every ablation.** Format alone moves accuracy up to 76 points ([arXiv:2310.11324](https://arxiv.org/abs/2310.11324)); few-shot order spans near-SOTA to near-random ([arXiv:2104.08786](https://arxiv.org/abs/2104.08786)). This is why the significance node had to be written alongside the attribution node rather than later.
- **A working sentence may work for a reason unrelated to its meaning.** *Spurious Prompts* ([arXiv:2605.29678](https://arxiv.org/abs/2605.29678)) shows task-irrelevant prompts sometimes matching or beating task-aware prompt optimization — measured lift does not validate the explanation attached to it.
- **Attribution has its own faithfulness problem.** Methods cannot separate in-context from in-weight contributions when context overlaps training data ([arXiv:2607.23804](https://arxiv.org/abs/2607.23804)), reasoning tokens absorb attribution mass on long-CoT models ([arXiv:2602.01914](https://arxiv.org/abs/2602.01914), ICML 2026 Oral), and single-pass methods miss cross-turn dependency structure ([arXiv:2607.22610](https://arxiv.org/abs/2607.22610)). There is now a gold-standard framework for evaluating the attribution methods themselves ([arXiv:2510.02629](https://arxiv.org/abs/2510.02629)) — use it before trusting a tool's output.
- **The GEPA seed-quality result changed an existing node.** With a defective seed on GSM8K, GEPA has been reported to *degrade* accuracy 23.81% → 13.50% ([arXiv:2603.18388](https://arxiv.org/abs/2603.18388), ACL SRW 2026); added as a pitfall to `offline-prompt-optimization`, whose "no verified production case for multi-step agents" claim was also qualified — 2026 added *benchmark* evidence (τ-bench 74% → 91%, BALROG PutNext 0% → 72.5%) but not production evidence.

## Process notes

- The Semantic Scholar Graph API 429s after roughly three unauthenticated queries in a minute; the arXiv API is the more reliable batch verifier but returns empty bodies or 503s under rapid successive calls — space them ~3s.
- `git push` on this repo requires `SKIP_ORIGIN_CHECK=1` (a local hook allowlists `brexhq`/`brex-security`/`brexhq-private` only; this repo is under `hhuang-brex`), and git identity must be supplied via env vars — no `user.email` is configured locally.

## Open gaps

- No node yet on **A/B testing prompts on live traffic** (interference, assignment, sequential testing) — [live-traffic-eval](../nodes/concepts/live-traffic-eval.md) covers the eval side, not the experiment design.
- Multi-turn attribution (MTCA) is the most relevant frontier for a conversational task agent, and the only source is a 2026 preprint with a benchmark not yet released. Worth re-checking for the released `MTCABench`.
- Nothing here is validated on a real in-house agent playbook; the instrumentation protocol in `prompt-component-attribution` is synthesized from the literature, not from a measured deployment.
