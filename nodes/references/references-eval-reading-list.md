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

## Top four for an IAF-shaped system

1. Anthropic — *Statistical Approach to Model Evaluations*
2. Anthropic — *Building Effective Agents*
3. Hamel Husain — *Creating an LLM-as-Judge That Drives Business Results*
4. OpenAI Cookbook — *Getting Started with OpenAI Evals*
