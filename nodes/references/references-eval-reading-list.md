---
id: references-eval-reading-list
type: reference
tags: [eval, reading-list, anthropic, openai]
related:
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[llm-as-judge]]
  - [[prod-shadow-replay]]
  - [[cost-aware-eval]]
  - [[agent-trajectory-eval]]
  - [[adversarial-eval]]
status: living
created: 2026-06-05
summary: "frontier-lab + practitioner posts on LLM eval (Anthropic, OpenAI, Husain, Yan, Carter, Shankar, …)."
---

# LLM Eval — Frontier Lab + Practitioner Reading List

Curated for senior engineers building agentic systems. URLs verified 2026-06-05. Anthropic + OpenAI sources marked 🔑.

## (a) Test pyramid for LLM apps

- **Your AI Product Needs Evals** — Hamel Husain, 2024. https://hamel.dev/blog/posts/evals/
- **How to Test ML Code and Systems** — Eugene Yan, 2020. https://eugeneyan.com/writing/testing-ml/
- **Don't Mock ML Models In Unit Tests** — Eugene Yan, 2022. https://eugeneyan.com/writing/unit-testing-ml/

## (b) LLM-as-judge calibration

- **Evaluating LLM-Evaluators (LLM-as-Judge)** — Eugene Yan, 2024. https://eugeneyan.com/writing/llm-evaluators/
- **Creating an LLM-as-Judge That Drives Business Results** — Hamel Husain, 2024. https://hamel.dev/blog/posts/llm-judge/
- **Who Validates the Validators?** — Shankar et al., 2024. https://arxiv.org/abs/2404.12272

## (c) Prod traffic → eval pipeline

- **A Field Guide to Rapidly Improving AI Products** — Hamel Husain, 2025. https://hamel.dev/blog/posts/field-guide/
- **So We Shipped an AI Product. Did It Work?** — Phillip Carter (Honeycomb), 2023. https://www.honeycomb.io/blog/we-shipped-ai-product
- **All the Hard Stuff Nobody Talks About When Building Products with LLMs** — Phillip Carter (Honeycomb), 2023. https://www.honeycomb.io/blog/hard-stuff-nobody-talks-about-llm

## (d) Error analysis methodology

- **Patterns for Building LLM-based Systems & Products** — Eugene Yan, 2023. https://eugeneyan.com/writing/llm-patterns/
- **Task-Specific LLM Evals That Do & Don't Work** — Eugene Yan, 2024. https://eugeneyan.com/writing/evals/

## (e) Cost-aware eval design

- 🔑 **A Statistical Approach to Model Evaluations** — Anthropic, 2024. https://www.anthropic.com/research/statistical-approach-to-model-evals
- 🔑 **Getting Started with OpenAI Evals** — OpenAI Cookbook, 2024. https://developers.openai.com/cookbook/examples/evaluation/getting_started_with_openai_evals
- 🔑 **How to Evaluate a Summarization Task** — OpenAI Cookbook, 2023. https://developers.openai.com/cookbook/examples/evaluation/how_to_eval_abstractive_summarization

## (f) Agent trajectory eval

- 🔑 **Building Effective Agents** — Anthropic (Schluntz & Zhang), 2024. https://www.anthropic.com/engineering/building-effective-agents
- 🔑 **How We Built Our Multi-Agent Research System** — Anthropic, 2025. https://www.anthropic.com/engineering/multi-agent-research-system
- 🔑 **Practices for Governing Agentic AI Systems** — OpenAI, 2023. https://openai.com/index/practices-for-governing-agentic-ai-systems/
- **Evaluate a Complex Agent (LangSmith)** — LangChain, 2024. https://docs.langchain.com/langsmith/evaluate-complex-agent
- **LLM Powered Autonomous Agents** — Lilian Weng, 2023. https://lilianweng.github.io/posts/2023-06-23-agent/

## (g) Red-team / adversarial

- 🔑 **Challenges in Red Teaming AI Systems** — Anthropic, 2024. https://www.anthropic.com/news/challenges-in-red-teaming-ai-systems
- 🔑 **Advancing Red Teaming with People and AI** — OpenAI, 2024. https://openai.com/index/advancing-red-teaming-with-people-and-ai/

## (h) Measurement validity — added 2026-09-27

arXiv ids fetch-confirmed 2026-09-27. All are preprints or workshop papers, author-reported.

- **Attack Success Rate Is Not a Number: On Measurement Validity in Agentic AI Security Evaluation** — Pathade, Pawar, Patil, 2026-09-21. https://arxiv.org/abs/2609.25173 — A full-text meta-analysis of **259** agentic-security papers: most report neither variance nor repeated runs for the headline metric (**58%** in a hand-coded sample of 50; **65.3%** by automated coding), only **30.9%** disclose enough about decoding to tell whether evaluation was stochastic, and of 64 papers using an LLM judge, **29.7%** report any human-agreement check. On a 100-instance benchmark the minimum detectable difference at conventional power is **18.2 pp**, and two defenses 5 points apart are mis-ranked by a single run about **21%** of the time. Ships a ten-item reporting checklist. Pairs with [eval-statistical-significance](../concepts/eval-statistical-significance.md).
- **Measuring the Serving Stack Instead of the Model: Hidden Confounds in Local Tool-Use Evaluation** — Tang, Zheng, 2026-09-22 (REALM @ EMNLP 2026). https://arxiv.org/abs/2609.26693 — In Ollama the default tool request is gated per model by a static template flag, so some models are rejected before inference; a harness that did not keep rejection and retry exhaustion as structured failure metadata scored them as **0%** tool-call fidelity. Turn-pooled and per-instance estimates differed by up to about **55 points**. Treat the serving layer as part of the protocol — see [harness-as-hyperparameter](../concepts/harness-as-hyperparameter.md).
- **Agreement Overstates Evidence: Error Dependence in LLM Judge Consensus** — Hossain, Yousefi, Lim, 2026-09-18. https://arxiv.org/abs/2609.22512 — Ten judges with mean pairwise error correlation 0.21 are worth about 3.5 independent ones. Summarized in [llm-as-judge](../concepts/llm-as-judge.md).
- **LLJ Cards: Best practices for the Use of LLMs as Judges** — Chehbouni, Medjdoub, Carichon, Farnadi, Cheung, 2026-09-21. https://arxiv.org/abs/2609.24516 — A reporting framework drawn from measurement theory for LLM-judge evaluations. The abstract reports no empirical results; use it as a checklist, not evidence.

## Top four for an IAF-shaped system

1. Anthropic — *Statistical Approach to Model Evaluations*
2. Anthropic — *Building Effective Agents*
3. Hamel Husain — *Creating an LLM-as-Judge That Drives Business Results*
4. OpenAI Cookbook — *Getting Started with OpenAI Evals*
