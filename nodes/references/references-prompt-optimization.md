---
id: references-prompt-optimization
type: reference
tags: [prompt, optimization, dspy, gepa, reading-list, eval, agents]
summary: "verified primary sources for automatic prompt optimization — the token-search → text-gradient → program-optimizer lineage behind offline-prompt-optimization, plus the agent-specific work and the field survey."
related:
  - [[offline-prompt-optimization]]
  - [[agentic-context-engineering-ace]]
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[self-improving-harness]]
  - [[dspy-domain-chatbot-cases]]
  - [[agent-eval-improvement-tiers]]
  - [[llm-evaluation]]
status: living
created: 2026-08-05
---

# References — Automatic Prompt Optimization

Primary sources behind [offline-prompt-optimization](../concepts/offline-prompt-optimization.md) and its neighbours [agentic-context-engineering-ace](../concepts/agentic-context-engineering-ace.md) and [verbal-reinforcement-vs-gradient-rl](../concepts/verbal-reinforcement-vs-gradient-rl.md). Every entry's title, author list, date, and venue was fetched from its arXiv abstract page and confirmed on **2026-08-05**; nothing here is recalled from memory. **All reported gains are author-reported on the authors' own benchmark selections** unless noted otherwise — read them as evidence a mechanism works, not as effect sizes you should expect.

## The lineage — token search → text gradients

Read in order, these four papers are one argument: the optimizer moves from needing model internals, to needing only an API, to needing only *language*.

- **AutoPrompt: Eliciting Knowledge from Language Models with Automatically Generated Prompts** — Shin, Razeghi, Logan IV, Wallace, Singh (2020-10-29, rev. 2020-11-07). https://arxiv.org/abs/2010.15980 — The pre-LLM ancestor and the reason the term "auto prompt" exists. Prompts are searched by **gradient-guided search** over discrete tokens, which requires access to the model's gradients and yields often-unreadable trigger strings. Its framing claim — that the manual effort and guesswork of writing prompts is the bottleneck worth automating — is the premise every entry below inherits. Its *method* is the one they all abandoned: nothing in the modern stack needs weights.

- **Large Language Models Are Human-Level Prompt Engineers** — Zhou, Muresanu, Han, Paster, Pitis, Chan, Ba (2022-11-03, rev. 2023-03-10). https://arxiv.org/abs/2211.01910 — Introduces **APE**: treat the instruction as a program, have an LLM *propose* candidates, and score each by a second LLM's zero-shot performance. This is the propose-and-select loop that [offline-prompt-optimization](../concepts/offline-prompt-optimization.md) wraps an agent inside. Reported to match or beat human-written instructions on 19 of 24 NLP tasks. The load-bearing structural point for this graph: the optimizer never needs to see inside the model, only to read a score — which is exactly why a thin `forward()` shim over a real agent is sufficient.

- **Automatic Prompt Optimization with "Gradient Descent" and Beam Search** — Pryzant, Iter, Li, Lee, Zhu, Zeng (2023-05-04, rev. 2023-10-19; EMNLP 2023). https://arxiv.org/abs/2305.03495 — The origin of the **textual-gradient** metaphor: an LLM critiques the current prompt in natural language on a minibatch, and the prompt is rewritten "in the opposite semantic direction," with beam search plus bandit selection allocating the eval budget. Reported up to **31%** improvement over the initial prompt on three NLP tasks and a jailbreak-detection task. Direct ancestry for the graph's "make the metric return text, not just a number" rule and for the *why it failed* feedback string.

- **Large Language Models as Optimizers** — Yang, Wang, Lu, Liu, Le, Zhou, Chen (2023-09-07, rev. 2024-04-15; ICLR 2024). https://arxiv.org/abs/2309.03409 — **OPRO**: the optimizer *is* a prompt. Each step shows the LLM previously-tried solutions with their scores and asks for better ones; the meta-prompt accumulates the trajectory. Reported up to **8% on GSM8K** and **up to 50% on Big-Bench Hard** over human-written prompts. Useful as the cleanest statement of the idea that search history in-context substitutes for a gradient — and as the cheapest thing to implement before reaching for a framework.

- **Promptbreeder: Self-Referential Self-Improvement Via Prompt Evolution** — Fernando, Banarse, Michalewski, Osindero, Rocktäschel (2023-09-28). https://arxiv.org/abs/2309.16797 — Evolutionary search over a population of task-prompts where the **mutation-prompts themselves evolve**, so the system improves the machinery that does the improving. The clearest published instance of the recursive rung at the top of [self-improving-harness](../concepts/self-improving-harness.md)'s optimization-target ladder; also the cautionary one, since self-referential search multiplies the rollout bill that GEPA later attacks.

- **TextGrad: Automatic "Differentiation" via Text** — Yuksekgonul, Bianchi, Boen, Liu, Huang, Guestrin, Zou (2024-06-11). https://arxiv.org/abs/2406.07496 — Generalizes textual gradients into a full **backprop-through-text** framework over compound systems: LLM-generated feedback propagates backward through a computation graph whose variables can be prompts, code, or molecules, behind a PyTorch-like API. Reported GPQA zero-shot accuracy 51% → 55% with GPT-4o and a 20% relative gain on LeetCode-Hard. Read it for the abstraction, not the recipe — it optimizes *any* variable, which is broader than the single-playbook case this graph cares about.

## Optimizing programs, not prompts

Once a system is several LM calls, "the prompt" is no longer one string, and credit assignment becomes the problem.

- **DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines** — Khattab, Singhvi, Maheshwari, Zhang, Santhanam, Vardhamanan, Haq, Sharma, Joshi, Moazam, Miller, Zaharia, Potts (2023-10-05). https://arxiv.org/abs/2310.03714 — The framing shift from prompt-string to **text transformation graph**: declarative modules carry parameters, and a compiler optimizes the pipeline against a metric. Reported >25% (GPT-3.5) and >65% (llama2-13b-chat) over standard few-shot prompting after minutes of compilation. Grounds the "optimizer is an offline compiler, not a runtime dependency" stance and [agent-as-compiler](../concepts/agent-as-compiler.md).

- **Optimizing Instructions and Demonstrations for Multi-Stage Language Model Programs** — Opsahl-Ong, Ryan, Purtell, Broman, Potts, Zaharia, Khattab (2024-06-17, rev. 2024-10-06; EMNLP 2024). https://arxiv.org/abs/2406.11695 — The **MIPRO** paper, and the honest statement of the hard part: optimize prompts across all modules "without access to module-level labels or gradients." Its three ingredients — program- and data-aware instruction proposal, stochastic minibatch evaluation as a surrogate objective, and meta-optimization of the proposer — are why MIPROv2 is trace-bound and has no external-feedback path. Reported wins on 5 of 7 multi-stage programs with Llama-3-8B, up to 13% accuracy.

- **GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning** — Agrawal, Tan, Soylu, Ziems, Khare, Opsahl-Ong, Singhvi, Shandilya, Ryan, Jiang, Potts, Sen, Dimakis, Stoica, Klein, Zaharia, Khattab (17 authors; 2025-07-25, rev. 2026-02-14; **ICLR 2026 Oral**). https://arxiv.org/abs/2507.19457 — The current default for a single prose playbook, and the sharpest formulation of this cluster's thesis: language is a richer learning signal than a sparse scalar reward. Samples trajectories *including reasoning, tool calls, and tool outputs*, reflects on them in natural language, and merges lessons from **the Pareto frontier of its own attempts**. Reported: beats GRPO by 6% on average (up to 20%) with **up to 35× fewer rollouts**, and beats MIPROv2 by >10% (e.g. +12% on AIME-2025). The tool-trajectory reflection is what makes it the right fit for agent work; the rollout economics are what make it affordable when one eval is a full agent run.

## Agents specifically — where the evidence thins

- **AutoPDL: Automatic Prompt Optimization for LLM Agents** — Spiess, Vaziri, Mandel, Hirzel (2025-04-06, last rev. 2025-11-03; AutoML 2025 Methods Track for an earlier version). https://arxiv.org/abs/2504.04365 — The one entry here that optimizes an *agent configuration* rather than an instruction: a structured AutoML search over **both** the prompting pattern (Zero-Shot, CoT, ReAct, ReWOO) and its content (instructions + demonstrations), traversed by successive halving, emitting human-readable and editable PDL programs. Reported **+9.21 ± 15.46 percentage points** over three tasks and seven LLMs (3B–70B), max +67.5 pp. Read the standard deviation, not the mean — it is wider than the effect, which is the quantitative form of this graph's warning that agent-level gains are noisy and dataset-dependent. Its second finding is the more durable one: **the best prompting strategy differs by model and task**, which is the same conclusion as [harness-as-hyperparameter](../concepts/harness-as-hyperparameter.md) reached from the harness side.

## The field survey

- **A Systematic Survey of Automatic Prompt Optimization Techniques** — Ramnath, Zhou, Guan, Mishra, Qi, Shen, Wang, Woo, Jeoung, Wang, Wang, Ding, Lu, Xu, Zhou, Srinivasan, Yan, Chen, Ding, Xu, Cheong (21 authors; 2025-02-24, rev. 2025-04-02; **EMNLP 2025**, pp. 33066–33098). https://arxiv.org/abs/2502.16923 — Start here for coverage rather than depth: a formal definition of APO plus a 5-part unifying framework used to classify prior work. Use it to check whether a technique you are considering has a name and a literature; do not use it for effect sizes.

## What this list does not settle

The papers above establish **mechanism** — text-as-gradient search over instructions works, and works at far lower rollout cost than gradient RL. They do not establish **outcome for multi-step tool-use agents**: the strongest agent-level datapoint here (AutoPDL) has a standard deviation wider than its mean, and the production wins catalogued in [dspy-domain-chatbot-cases](../projects/dspy-domain-chatbot-cases.md) are overwhelmingly single-call. Keep that gap explicit when citing this cluster; see the "What the evidence actually shows" section of [offline-prompt-optimization](../concepts/offline-prompt-optimization.md).
