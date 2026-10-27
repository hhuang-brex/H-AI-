---
id: references-system-one-decision-models
type: reference
tags: [decision-model, system-one, jev, calibration, routing, judge, reading-list]
summary: "verified reading list on System One decision models (Jev and open replicas): vendor sources, why they are fast, open reproductions, and the papers that measure accuracy, calibration, agent use, and security."
related:
  - [[system-one-decision-models]]
  - [[llm-as-judge]]
  - [[tool-selection-and-routing]]
  - [[prompt-injection-and-isolation]]
  - [[agent-trajectory-eval]]
  - [[cost-aware-eval]]
status: living
created: 2026-10-25
---

# References — System One Decision Models

Backs [system-one-decision-models](../concepts/system-one-decision-models.md). Every page and abstract below was fetched on **2026-10-25**. Vendor pages are self-reported and living; arXiv numbers are author-reported and abstract-level, with no full texts read. An arXiv sweep found about 160 abstracts mentioning Jev, nearly all from 2026-09 to 2026-10; about 40 were opened.

## 1. The vendor

| Source | What it says |
|---|---|
| **Introducing System One Models & Jev** — Diogo Almeida, TypeSafe AI (2026-09-15). [link](https://typesafe.ai/blog/introducing-system-one-models-and-jev) | Defines the category; LLMs sample "one token at a time," Jev "generates all outputs in a single query." $0.042/MTok input, output "too cheap to meter," 70–500 ms. Explains its 193.6×/444.6× claims and their biases: workflows built by its own team, frontier answers as reference, and gains "on the higher end of real world gains." |
| **TypeSafe AI home page** (2026-10-19). [link](https://typesafe.ai) | Training method named "Reinforcement Learning for Calibrated Decisions (RLCD)." Claims "Zero Hallucinations," qualified by telling software to escalate when unconfident. |
| **Jev docs: Introduction**. [link](https://docs.typesafe.ai/introduction) | Choice, Score, and Noul primitives. "System One models work best when each question asks one specific, well-scoped thing"; decompose questions that "require extended reasoning." |
| **OpenAI Decisions API** — docs, no date stated (fetched 2026-10-27). [link](https://developers.openai.com/api/docs/guides/decisions) | The same interface from OpenAI: `predicate`, `choice`, `score` question types; up to 400 per request; $0.10/MTok uncached input, output not charged; "about 10x faster than the Responses API." |

## 2. Independent benchmarks

| Paper | Finding |
|---|---|
| **Evaluating and Benchmarking the System One Model Jev** — Deußer, Sparrenberg, Sifa (2026-09-29). [2609.37647](https://arxiv.org/abs/2609.37647) | 37 datasets, 346,009 requests for under $10; beats Qwen3.8-27B on 27 and Gemma on all 37. Choice probabilities well calibrated; binary probabilities rank well but sit poorly against a 0.5 threshold. |
| **System1-Arena** — Chen et al. (2026-10-15). [2610.21244](https://arxiv.org/abs/2610.21244) | 92k questions, 30 models. Large System One models match fast closed LLMs "at one-quarter of the latency"; a reasoning LLM is most accurate at ~70× a fast LLM's cost. In closed loops small System One models "rarely succeed." |
| **Specialized Decision Models vs. General-Purpose LLMs** — Li et al. (2026-10-08). [2610.11978](https://arxiv.org/abs/2610.11978) | Best on MMLU-Redux and ARC-Challenge; on MathQA, 17.7 points below the frontier median and below all 19 LLMs. |
| **General Decision Models: Benchmarking and Insights Beyond Jev** — Duan et al. (v2 2026-10-12). [2610.03935](https://arxiv.org/abs/2610.03935) | Strongest when evidence resolves the decision; often "substantially overstating" the top probability. On τ-bench, faster decisions cut episode time but lowered success. |
| **Jev in the Wild** — Ling, Xue, Ye (2026-09-24). [2609.30216](https://arxiv.org/abs/2609.30216) | 2,170 public GitHub projects; attention concentrates on routing and interface agents. |

## 3. Why it is fast — and faster variants

| Paper | Finding |
|---|---|
| **JevCascade** — Li, Chen (v2 2026-10-10). [2610.07716](https://arxiv.org/abs/2610.07716) | Prefill-only models are "one to two orders of magnitude cheaper" per call. A curated 5-option menu on a 0.8B model beat a 4B model on all 150 labels (95.4% vs 80.0%). |
| **Large Decision Models** — Chen et al. (2026-10-11). [2610.15501](https://arxiv.org/abs/2610.15501) | One prefill pass: a 182× latency speedup over a reasoning rollout; a confidence router recovers a median 92% of reasoning's accuracy edge. |
| **LEV** — Song et al. (2026-10-14). [2610.20951](https://arxiv.org/abs/2610.20951) · **SanSi** — Gan, Lee, Kang (v2 2026-10-10). [2610.07730](https://arxiv.org/abs/2610.07730) | Loop the layers instead of generating tokens: 63.2% → 76.2% on JevBench from depth one to four. |
| **Verdict-MQ** — Chouhan, Perry (2026-10-14). [2610.20778](https://arxiv.org/abs/2610.20778) | Read a case once and answer all its questions; option order irrelevant by construction. |
| **Jeva** — Li, Wang (v2 2026-10-18). [2610.18773](https://arxiv.org/abs/2610.18773) · **Narrow Decision Models** — Antunes et al. (2026-10-18). [2610.25553](https://arxiv.org/abs/2610.25553) | Architectures that make null answers explicit, ignore option order, and reuse option encodings across requests. |

## 4. Open reproductions

| Paper | Finding |
|---|---|
| **Releasing the Inner Jev** — Geuter, Cheng, Alvarez-Melis (2026-10-12). [2610.17205](https://arxiv.org/abs/2610.17205) | Open models read at the answer letter match Jev untrained (79.6 vs 80.1); a LoRA fine-tune scores 84.4. |
| **LLM-as-Jev** — Li, Wagle (v3 2026-10-13). [2610.02076](https://arxiv.org/abs/2610.02076) | Frozen LLMs are "inherently effective decision models" and keep their thinking mode. |
| **Our Own Jev** — Weng et al. (2026-10-21). [2610.29052](https://arxiv.org/abs/2610.29052) | Replaced a frontier judge (~$1,000 per pass) with a LoRA readout: 1,000 sessions in ~3 GPU-minutes at ~1% of the cost. |

## 5. In agent loops

| Paper | Finding |
|---|---|
| **When Faster Decisions Do Not Make Better Agents** — Ling et al. (2026-10-09). [2610.13092](https://arxiv.org/abs/2610.13092) | 4,500 runs: decision cost fell for every agent, but cost per successful outcome rose for one. |
| **Good Judgment, Bad Advice** — Vats, single author, pre-specified (2026-10-17). [2610.24649](https://arxiv.org/abs/2610.24649) | As a controller: +19% cost per attempt, same 73.0% pass rate; good ranking (AUROC 0.78) but poor calibration. |
| **Reading Right, Acting Wrong** — Li, Krishnan, Padman (2026-10-13). [2610.18579](https://arxiv.org/abs/2610.18579) | Most wrong actions follow a correct reading of the state. |
| **What Can't Jev Decide?** — Yang et al. (2026-10-18). [2610.24929](https://arxiv.org/abs/2610.24929) | 97.5% on items one forward pass solves, 74% on the rest; "Given a stale summary of the state, Jev follows it." |
| **JevAgentHarness** — Zhu et al. (2026-10-15). [2610.21412](https://arxiv.org/abs/2610.21412) | Unthresholded delegation cost 19.0 points of success; a per-choice fitted threshold made agents 81–89% cheaper. |
| **Fast Models, Slow Evidence** — Jiawei Li, single author (2026-10-01). [2610.02267](https://arxiv.org/abs/2610.02267) | Self-audit found its own pipeline errors: a reported 23.9% saving was actually 4.3%. |

## 6. As a judge

| Paper | Finding |
|---|---|
| **Jev-as-a-Judge for RAG Claim Verification** — Do Rosario, Atef (2026-09-30). [2610.20634](https://arxiv.org/abs/2610.20634) | Tied a frontier LLM at 187× lower cost, but admitted 23.2% of unsupported claims against 14.1%. "Equal accuracy conceals unequal errors." |
| **Decision language models … clinical generative AI** — Gershon et al. (2026-10-20). [2610.28826](https://arxiv.org/abs/2610.28826) | Matched or beat 7 of 12 LLM judges on physician ratings; frontier judges cost 73–294× more. |
| **JEV-as-a-Judge** [2609.26550](https://arxiv.org/abs/2609.26550) and **JEV vs. LLMs as Rubric Judges** [2609.29769](https://arxiv.org/abs/2609.29769) | Already summarized in [llm-as-judge](../concepts/llm-as-judge.md). |

## 7. Calibration and option-set effects

| Paper | Finding |
|---|---|
| **Option-Set Dependence in Jev** — Rajput, Chauhan, Kosaraju, pre-registered (2026-10-12). [2610.16655](https://arxiv.org/abs/2610.16655) | 299,463 calls: every added option shifts the top-two odds; probabilities "are best read as relative to the option list." |
| **Labels Override Definitions** — Azizi et al. (2026-10-01). [2610.02586](https://arxiv.org/abs/2610.02586) | In open replicas, deleting every definition left accuracy unchanged; the cause was prompt rendering, not the decision head. |
| **Jev thinks "I don't know"** — Porcedda, single author (2026-09-28). [2609.35342](https://arxiv.org/abs/2609.35342) | Recovering a hidden third "unknown" mass lifted soft accuracy from 0.771 to 0.978. |
| **Calibration and Risk-Budgeted Decisions** — Messoudi, Mansar (2026-10-14). [2610.19811](https://arxiv.org/abs/2610.19811) | Naive thresholds exceeded target risk in about half of settings; Learn-Then-Test in 7.8%. |
| **Typed Decision Models under Prevalence Shift** — Iqbal et al. (2026-10-19). [2610.26325](https://arxiv.org/abs/2610.26325) | Neither uniformly better than their backbones nor uniquely fragile under shift. |
| **Prism-1** [2610.22066](https://arxiv.org/abs/2610.22066) · **Runoff** [2610.18233](https://arxiv.org/abs/2610.18233) · **Ordinal-scale bias** [2609.38827](https://arxiv.org/abs/2609.38827) | Order and added options steer open readouts; fixes that make answers order-invariant by construction; ordinal scales get compressed. |

## 8. Security

| Paper | Finding |
|---|---|
| **Nudge the Judge** — Luo et al. (2026-10-13). [2610.18612](https://arxiv.org/abs/2610.18612) | 81.5% of 228 real Jev applications showed decision flips; 98.6% of those had downstream security impact. |
| **Decision Hijacking** — Wu, Lim (2026-09-23). [2609.28613](https://arxiv.org/abs/2609.28613) | Injection shifts probabilities but rarely reaches the attacker's target (1.8% → 3.5% with adaptive attacks). |
| **Same Attack, Different Judge** — Li et al. (2026-10-13). [2610.17820](https://arxiv.org/abs/2610.17820) | Most robust on rule-based moderation; more exposed on judgment tasks, and flagged 27% of benign requests. |
| **Poisoned into Action** [2610.15537](https://arxiv.org/abs/2610.15537) · **DICE** [2610.14404](https://arxiv.org/abs/2610.14404) | Schema-valid choices can still trigger bad actions; the adapters around the model are an attack surface too. |

## 9. Lineage — the readout before the product (added 2026-10-27)

| Paper | Contribution |
|---|---|
| **Document Ranking with a Pretrained Sequence-to-Sequence Model (monoT5)** — Nogueira, Jiang, Lin (2020). [2003.06713](https://arxiv.org/abs/2003.06713) | Logits of target words "can be interpreted as relevance probabilities for ranking" — the decision readout, five years early. |
| **Benchmarking Zero-shot Text Classification** — Yin, Hay, Roth (EMNLP 2019). [1909.00161](https://arxiv.org/abs/1909.00161) | Classification with labels unseen in training, via entailment — the "options supplied at call time" setup. |
| **Calibrate Before Use** — Zhao, Wallace, Feng, Klein, Singh (ICML 2021). [2102.09690](https://arxiv.org/abs/2102.09690) | Answer-position and frequency bias; contextual calibration with a content-free input, up to 30.0 points absolute. |
| **Language Models (Mostly) Know What They Know** — Kadavath et al., Anthropic (2022). [2207.05221](https://arxiv.org/abs/2207.05221) | Large models are well calibrated on multiple-choice and true/false "in the right format"; P(True) and P(IK). |
| **Large Language Models Are Not Robust Multiple Choice Selectors** — Zheng et al. (ICLR 2024 spotlight). [2309.03882](https://arxiv.org/abs/2309.03882) | Letter-preference "selection bias" from token priors; PriDe debiasing. |
| **Look at the Text** — Wang et al. (COLM 2024). [2404.08382](https://arxiv.org/abs/2404.08382) | When first-token probabilities disagree with the text answer, the text answer is more robust. A caution for logit readouts. |
| **FrugalGPT** — Chen, Zaharia, Zou (2023). [2305.05176](https://arxiv.org/abs/2305.05176) · **RouteLLM** — Ong et al. (v4 2025). [2406.18665](https://arxiv.org/abs/2406.18665) | LLM cascades and routers: up to 98% cost reduction at GPT-4 parity; over 2× savings from strong/weak routing. |
| **SwiftSage** — Lin et al. (NeurIPS 2023). [2305.17390](https://arxiv.org/abs/2305.17390) · **Dualformer** — Su et al. (v3 2025). [2410.09918](https://arxiv.org/abs/2410.09918) | Fast-and-slow agent designs that predate "System One models": a small fast actor with an LLM planner, and one model trained to run in either mode. |

## 10. New since 2026-10-22 (added 2026-10-27)

| Paper | Finding |
|---|---|
| **The Hitchhiker's Guide to System 1 Models** — Roitman, single author (2026-10-24). [2610.33775](https://arxiv.org/abs/2610.33775) | A practitioner survey with a five-family taxonomy: encoder classifiers, reward models, non-autoregressive engines, contrastive models, extraction models. |
| **System One models Are Not Better Rerankers** — Dinzinger et al. (2026-10-23). [2610.32318](https://arxiv.org/abs/2610.32318) | Decision fine-tuning never beat reranker fine-tuning; up to 9B it added nothing over the untuned model. |
| **Can System-1-Style Decision Models Replace Dedicated Rerankers in RAG?** — Li, Xie (2026-10-26). [2610.34816](https://arxiv.org/abs/2610.34816) | The default setup fails on long candidate lists; a tuned reranker stays faster and uses far less GPU memory. |
| **Measure Before You Train** — Lucca, single-user case study (2026-10-23). [2610.32955](https://arxiv.org/abs/2610.32955) | On 739 real emails, logistic regression on ~200 labels had the highest accuracy on every field. |
| **Commit or Abstain?** — Demir, single author (2026-10-21). [2610.29961](https://arxiv.org/abs/2610.29961) | With the correct holding removed, LLMs still picked one in 38–86% of items; the most cautious decision model, 30%. |
| **Truncated Reasoning Under a Budget** — Wang et al. (v2 2026-10-24). [2610.25768](https://arxiv.org/abs/2610.25768) | Reading an answer from a cut-off reasoning trace beat forced answering at every budget; 71.3% cost saved at a 0.58-point loss. |
| **Two Uncertainties Are Not One** — Yadav, single author (2026-10-23). [2610.33258](https://arxiv.org/abs/2610.33258) | On 142,658 comments, AUROC 0.83 was not separable from 13 of 14 frontier models; "confidence" conflates annotator disagreement with decision risk. |
| **TrustJev** — Xu et al. (2026-10-26). [2610.34826](https://arxiv.org/abs/2610.34826) | Scores trusted policy separately from untrusted evidence and bounds how much the evidence can move the decision. |

## What failed to verify

- **Benchmark provenance is thin.** JevBench and OpenDecisions are cited by many papers; their maintainers and construction were not verified here.
- **The vendor pages contradict on date.** The launch post shows 2026-09-15 while its metadata says 2026-10-19.
- **The docs page lists no pricing, latency, or determinism.** Those figures come from the launch post only.
- **Volume is not a quality signal.** Many papers are single-author, small-sample, or name a domain application after Jev.
