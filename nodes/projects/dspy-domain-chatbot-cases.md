---
id: dspy-domain-chatbot-cases
type: project
kind: snapshot
tags: [dspy, chatbot, case-study, llm, optimizer]
related:
  - [[domain-chatbot-design]]
  - [[references-domain-chatbot-design]]
  - [[llm-as-judge]]
  - [[grounding-and-citation]]
  - [[domain-knowledge-injection]]
status: snapshot
created: 2026-06-09
summary: "verified DSPy domain-chatbot success examples (JetBlue, Dr.Copilot, etc.; 2026-06-09 snapshot)."
source-thread: [[2026-06-09-dspy-domain-chatbot-research]]
---

# DSPy Domain-Chatbot Cases — Verified Snapshot

Cases where teams used **DSPy** (Stanford framework for *programming* — not prompting — LLMs: Signatures, Modules, Optimizers like MIPROv2 / BootstrapFewShot / SIMBA, Assertions) to build domain-specific chatbots or conversational agents. Adversarially verified via fan-out web search + 3-vote refute on each claim. Snapshot of public evidence as of 2026-06-09; private deployments at named companies are not in scope.

## Headline finding

The public evidence base is **smaller than DSPy's marketing implies**. Two cases cleanly satisfy "domain-specific chatbot": **JetBlue** (multiple chatbots on Databricks) and **Dr.Copilot** (Romanian telemedicine multi-agent assistant, live with 41 doctors). Other frequently-cited DSPy adopters built **adjacent** systems: training-data pipelines (Replit), entity extraction (Infinitus), error-detection guardrails (RAEC), or RAG-QA (Emory LiveRAG). Of the user-named companies, only **JetBlue, Replit, and Databricks** appear on the official adopter list — **Zoro, VMware, Sephora, and Moody's do not** (the Moody's claim was unanimously refuted in verification).

## Cases

### 1. JetBlue × Databricks — flagship public domain-chatbot case

| | |
|---|---|
| **Domain** | Aviation operations + customer feedback (fintech-adjacent: ops + CX) |
| **What was built** | Multiple chatbots, including a RAG-powered **predictive maintenance chatbot**, a customer-feedback classification system, and a general RAG chatbot |
| **DSPy primitives** | Signatures (inline form `dspy.ChainOfThought("context, question -> query")` and class-based), PyTorch-like Modules whose `forward` composes signatures sequentially |
| **Stack** | Databricks Model Serving + Vector Search; Llama 2 70B from Databricks Marketplace |
| **Reported outcome** | Databricks/JetBlue co-authored blog cites "2× faster than LangChain" and DSPy optimizers tuned to retrieval-quality / answer-quality / LLM-judge-toxicity metrics. Treat these as *vendor-reported, not independently verified* — split-voted in adversarial check. |
| **Source** | https://www.databricks.com/blog/optimizing-databricks-llm-pipelines-dspy ; listed at https://dspy.ai/ |

### 2. Dr.Copilot — Romanian telemedicine multi-agent assistant

| | |
|---|---|
| **Domain** | Healthcare / telemedicine; specifically *presentation quality* of physician written replies (not clinical correctness) |
| **What was built** | Three-agent system that gives feedback to doctors along **17 interpretable axes** on the quality of their written patient responses |
| **DSPy primitives** | Multi-agent composition; **prompts automatically optimized via DSPy** (specific optimizer not stated in abstract) |
| **Deployment** | Live with **41 doctors** — described as "one of the first real-world deployments of LLMs in Romanian medical settings" |
| **Reported outcome** | "Measurable improvements in user reviews and response quality" — qualitative in the abstract; magnitudes need full-paper retrieval |
| **Source** | https://arxiv.org/abs/2507.11299 |

### 3. RAEC — patient-portal error detection (guardrail, not chatbot)

| | |
|---|---|
| **Domain** | Clinician–patient asynchronous messaging |
| **What was built** | Two-stage DSPy pipeline for hierarchical error detection over an ontology of 5 domains × 59 error codes in AI-drafted patient-portal messages |
| **DSPy primitives** | Two-stage prompting architecture; not specified which optimizer |
| **Reported outcome** | F1 **0.500 vs 0.256 baseline**; concordance with human reviewers **50% vs 33%**, n=100 messages |
| **Caveat** | Functions as a guardrail layer over a chatbot, not a chatbot itself; arXiv preprint, small n |
| **Source** | https://arxiv.org/abs/2509.22565 |

### 4. LingVarBench (Infinitus Systems) — phone-call entity extraction

| | |
|---|---|
| **Domain** | Customer-support / healthcare phone-call transcripts |
| **What was built** | Automatic entity extraction (ZIP, DOB, name) from call transcripts |
| **DSPy primitives** | **DSPy + SIMBA optimizer** for prompt generation/refinement |
| **Reported outcome** | **F1 ≈ 94–95%** on structured entities — matches or nearly matches human-tuned prompts; primary benefit reported is reduced manual prompt engineering |
| **Caveat** | Extraction pipeline, not a conversational agent |
| **Source** | https://arxiv.org/abs/2508.15801 (EACL 2026 Industry Track) |

### 5. Emory LiveRAG 2025 entry — RAG-QA, not chatbot

| | |
|---|---|
| **Domain** | Generic RAG-QA benchmark (LiveRAG Challenge 2025) |
| **What was built** | DSPy-optimized prompting for retrieval-augmented question answering |
| **Reported outcome** | Semantic similarity **0.771 vs 0.668 baseline**; 4th in faithfulness, 11th in correctness among 25 teams |
| **Caveat** | Authors flagged 0% refusal rate as a generalizability concern; not strictly a domain chatbot |
| **Source** | https://arxiv.org/abs/2506.22644 |

### 6. Replit — DSPy in training-data pipeline, not the chatbot

| | |
|---|---|
| **Domain** | Code repair |
| **What was built** | Few-shot DSPy pipeline that synthesizes line-diff training data; data fine-tunes a 7B model based on DeepSeek-Coder-Instruct-v1.5 |
| **DSPy in inference path?** | **No** — DSPy is offline, not in the served path |
| **Note** | Often cited as "DSPy chatbot success" — actually a training-data pipeline |
| **Source** | https://replit.com/blog/code-repair |

## What's not on the list (and shouldn't be cited)

The official DSPy adopter list (https://dspy.ai/, mirrored at https://dspy.ai/community/use-cases/) names: **Shopify, Dropbox, AWS, JetBlue, Replit, Databricks, Nous Research**.

It does **not** name **Zoro, VMware, Sephora, or Moody's**. The Moody's claim that occasionally circulates ("uses DSPy to optimize RAG / LLM-as-Judge / agentic systems for financial workflows") was unanimously refuted in adversarial verification — do not cite it without new primary evidence.

The original DSPy paper (https://arxiv.org/abs/2310.03714) contains **no chatbot case studies**; its evaluation domains are math word problems, multi-hop retrieval, complex QA, and agent-loop control. Chatbot evidence comes from industry blogs and follow-on academic work, not the foundational paper.

## Reading guide for the [domain-chatbot-design](../topics/domain-chatbot-design.md) cluster

| If you care about | Read |
|---|---|
| End-to-end production chatbot built with DSPy | JetBlue × Databricks blog |
| Multi-agent domain assistant with DSPy-tuned prompts | Dr.Copilot paper |
| Using DSPy as an optimizer-under-LLM-judge | JetBlue blog (judge-tuned optimizers) — relates to [llm-as-judge](../concepts/llm-as-judge.md) |
| DSPy as a guardrail layer | RAEC paper — relates to [safety-rails-domain-specific](../concepts/safety-rails-domain-specific.md) |
| DSPy for offline data generation rather than runtime | Replit blog |

## Open questions

1. Do Zoro, VMware, Sephora, or Moody's have non-public-blog DSPy chatbot deployments documented in podcasts (Latent Space, Cognitive Revolution) or conference talks? Not found in this pass.
2. What were the *quantitative* deltas at Dr.Copilot — patient-rating delta, per-axis improvement? Full-paper retrieval needed.
3. What specific optimizers (MIPROv2 vs BootstrapFewShot vs SIMBA) did each case use? Generally underspecified in the public write-ups.

## Methodology

Sourced via fan-out web search across the official DSPy site, Databricks engineering blog, arXiv, and primary company blogs. Each claim was 3-vote adversarially verified (kill on 2/3 refute). Claims with split votes are flagged as *reported* rather than *established*. See [2026-06-09-dspy-domain-chatbot-research](../../threads/2026-06-09-dspy-domain-chatbot-research.md) for the full research thread.
