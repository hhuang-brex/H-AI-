---
id: references-multi-turn-agent-eval
type: reference
tags: [eval, multi-turn, agents, memory, planner, tool-use, reading-list, survey]
summary: "the ~250-source multi-turn conversational agent evaluation survey as a map of the field, with its taxonomies extracted, its citation defects recorded, and eight of its anchor benchmarks verified at the primary source."
related:
  - [[llm-evaluation]]
  - [[agent-trajectory-eval]]
  - [[memory-types-taxonomy]]
  - [[reflection-loop-taxonomy]]
  - [[conversation-memory]]
  - [[simulated-user-eval]]
  - [[llm-as-judge]]
  - [[eval-case-design]]
  - [[references-eval-reading-list]]
  - [[references-context-and-memory]]
status: living
created: 2026-08-06
source-thread: [[2026-08-06-multi-turn-eval-survey-fanout]]
---

# References — Multi-Turn Conversational Agent Evaluation

Fan-out of one seed survey. The survey's own text was read from its **arXiv LaTeX source** (`arxiv.org/src/2503.22458`), not from a summary, and each anchor below was then verified at its own primary source on **2026-08-06**. Where the survey and a primary source disagree, the primary source wins and the disagreement is recorded.

## The seed

- **Evaluating LLM-based Agents for Multi-Turn Conversations: A Survey** — Shengyue Guan, Jindong Wang, Jiang Bian, Bin Zhu, Jian-guang Lou, Haoyi Xiong (v1 2025-03-28, **v2 2026-01-05**). https://arxiv.org/abs/2503.22458 — cs.CL/cs.AI, CC BY 4.0, **no venue stated on the abstract page**. A PRISMA-inspired review of ~250 sources, organized as two linked taxonomies (*what to evaluate* / *how to evaluate*). Its value to this graph is as a **map with citations attached**, and its component decomposition maps almost 1:1 onto this graph's clusters:

| Survey axis | Sub-structure (survey's own terms) | Graph node |
|---|---|---|
| End-to-end experience | task completion · interaction patterns · user experience & safety | [agent-trajectory-eval](../concepts/agent-trajectory-eval.md) |
| Action & tool use | API interaction & dynamic tool use · multi-step tool selection & reasoning · reliability & hallucination in tool use | [tool-selection-and-routing](../concepts/tool-selection-and-routing.md), [tool-result-grounding](../concepts/tool-result-grounding.md) |
| Memory | **spans**: turn · conversation · permanent — **forms**: textual (complete / recent / retrieved / external) · parametric (fine-tuning / memory editing) | [memory-types-taxonomy](../concepts/memory-types-taxonomy.md), [parametric-memory-and-editing](../concepts/parametric-memory-and-editing.md) |
| Planner | task modeling (task representation · context modeling) · task decomposition (granularity · interdependency · dynamism) · adaptation & control · reflection (plan verification · plan selection: in-generation / post-generation) | [goal-decomposition](../concepts/goal-decomposition.md), [plan-execute-replan](../concepts/plan-execute-replan.md), [reflection-loop-taxonomy](../concepts/reflection-loop-taxonomy.md) |
| Evaluation data | generation *and* annotation, each split over next-turn response · tool use / function calls · query rewriting · fact checking | [eval-case-design](../concepts/eval-case-design.md), [simulated-user-eval](../concepts/simulated-user-eval.md) |
| Evaluation metrics | **annotation-based** (annotation as reference — traditional BLEU/ROUGE vs. advanced BERTScore-family; annotation as exact match) · **annotation-free** (point-wise scoring; pair-wise / list-wise scoring) | [llm-as-judge](../concepts/llm-as-judge.md), [eval-dataset-quality](../concepts/eval-dataset-quality.md) |

Its sharpest reusable claim is a critique, not a result: current evaluation "tend[s] to assess conversation turns in isolation rather than holistically, which limits the ability to capture the dynamic interplay among successive turns." Its stated future-work list — unified/adaptive frameworks, memory-and-context retention benchmarks that separate short-term recall from long-term integration, test-time self-assessment, error propagation across turns, cumulative tool-use, scalability without manual annotation, and privacy-preserving evaluation (TEE, federated learning) — reads as a gap list this graph can be checked against.

**Use it as a bibliography, not as a source of numbers.** Defects found by reading the v2 source directly:

- **A number that doesn't match its source.** The survey describes LoCoMo as "dialogues spanning 600 turns and 16K tokens." LoCoMo's own abstract reports **300 turns and 9K tokens on average, up to 35 sessions** (see below). Not reconcilable from the abstract; re-verify any figure taken from this survey.
- **Two literal placeholder links survive in the published v2 source** — `\href{https://example.com/tool-based-dialogue}{...}` and `\href{https://example.com/fact-check-ai}{...}`.
- **An unresolved placeholder citation**, `\cite{cite-key}`, in the data-generation section.
- **A duplicated future-work bullet** — "Philosophical and Ethical Dimensions of Multi-Turn Conversational AI" appears twice, near-verbatim.
- The "LongEval" benchmark is attributed to a paper whose verified title is *Long Context RAG Performance of Large Language Models*; treat that attribution as unchecked (not verified here either way).

## Anchors verified at the primary source

**Long-horizon memory.**

- **Evaluating Very Long-Term Conversational Memory of LLM Agents** — Maharana, Lee, Tulyakov, Bansal, Barbieri, Fang (2024-02-27; project page `snap-research.github.io/locomo/`). https://arxiv.org/abs/2402.17753 — The **LoCoMo** dataset. Its framing is the gap statement worth quoting: prior long-term dialogue work evaluates over "no more than five chat sessions." Built by a machine-human pipeline generating dialogues grounded in **personas and temporal event graphs**, with human verification; **300 turns / 9K tokens per conversation on average, up to 35 sessions**, and three task types (question answering, event summarization, multi-modal dialogue generation). Finding is qualitative in the abstract: long-context LLMs and RAG help but "still substantially lag behind human performance," especially on long-range temporal and causal dynamics. The right anchor for [conversation-memory](../concepts/conversation-memory.md)'s across-sessions horizon.

- **A Survey on the Memory Mechanism of Large Language Model based Agents** — Zhang, Bo, Ma, Li, Chen, Dai, Zhu, Dong, Wen (2024-04-21; 39 pages). https://arxiv.org/abs/2404.13501 — The memory-specific companion survey (what/why → design → evaluation → applications), and the source of the seed survey's textual-vs-parametric memory-forms split. Tracking repo: `nuster1128/LLM_Agent_Memory_Survey`. Pairs with [references-context-and-memory](references-context-and-memory.md).

**Interleaving and context switching — the finding most relevant to a chatting task agent.**

- **Beyond Prompts: Dynamic Conversational Benchmarking of Large Language Models** — Castillo-Bolado, Davidson, Gray, Rosa (2024-09-30, rev. 2024-10-11; **NeurIPS D&B Track 2024 poster**). https://arxiv.org/abs/2409.20222 — Evaluates an agent through **one long simulated conversation carrying several concurrent tasks with deliberate context switching**, probing long-term memory, continual learning, and information integration. Two reported findings: models "in general perform well on single-task interactions" but **degrade on the same tasks once interleaved**, and **short-context models with a long-term memory system matched or exceeded larger-context models**. Both land directly on [sms-multi-thread-chatbot](../topics/sms-multi-thread-chatbot.md) and [flat-channel-thread-tracking](../concepts/flat-channel-thread-tracking.md) — interleaving is the load-bearing variable, not conversation length.

**Sociality and role consistency.**

- **SocialBench: Sociality Evaluation of Role-Playing Conversational Agents** — Chen, Chen, Yan, Xu, Xing, Shen, Quan, Li, Zhang, Huang (Findings of ACL 2024, pp. 2108–2126). https://aclanthology.org/2024.findings-acl.125/ — **500 characters, >6,000 questions, 30,800 multi-turn utterances**, evaluated at individual *and* group level. Key result: "agents excelling in individual level does not imply their proficiency in group level." Relevant to [persona-tone-compliance](../concepts/persona-tone-compliance.md); note it is role-play sociality, not task completion — do not cite it as a memory-retention benchmark.

**Multi-turn tool use and web action.**

- **On the Multi-turn Instruction Following for Conversational Web Agents** — Deng, Zhang, Zhang, Yuan, Ng, Chua (ACL 2024, pp. 8795–8812). https://aclanthology.org/2024.acl-long.477/ — Defines **Conversational Web Navigation** and releases **MT-Mind2Web**, plus Self-MAP (self-reflective memory-augmented planning) motivated by the limited context window and the context-dependence of conversational tasks. No dataset statistics or numbers in the abstract.

- **MTU-Bench: A Multi-granularity Tool-Use Benchmark for Large Language Models** — Wang, Wu, Wang, Liu, Song, Peng, Deng, Zhang, Wang, Peng, Zhang, Guo, Zhang, Su, Zheng (15 authors; 2024-10-15). https://arxiv.org/abs/2410.11710 — Five settings: single-turn/single-tool, single-turn/multi-tool, **multi-turn/single-tool, multi-turn/multi-tool**, and out-of-distribution. Its design choice is the transferable one: scoring compares predictions to ground truth only, explicitly avoiding GPT-based or human judging to cut evaluation cost — the same argument as [test-pyramid-llm](../concepts/test-pyramid-llm.md). Ships MTU-Instruct for fine-tuning. **No quantitative results in the abstract.**

**Planning under workflow knowledge.**

- **FlowBench: Revisiting and Benchmarking Workflow-Guided Planning for LLM-based Agents** — Xiao, Ma, Wang, Wu, Zhao, Wang, Huang, Li (Findings of EMNLP 2024, pp. 10883–10900). https://aclanthology.org/2024.findings-emnlp.638/ — Formalizes several **workflow-knowledge formats** and benchmarks planning across **51 scenarios in 6 domains** with a multi-tiered evaluation framework, motivated by "undesired planning hallucinations" when an agent lacks domain expertise and by prior workflow knowledge being "disorganized and diverse in formats." Reported conclusion: current agents "need considerable improvements for satisfactory planning." The scholarly counterpart to this graph's playbook-as-workflow framing in [task-agent-pattern](../topics/task-agent-pattern.md).

**General agent capability.**

- **AgentBench: Evaluating LLMs as Agents** — Liu et al. (22 authors; 2023-08-07, rev. 2023-10-25, rev. 2025-10-04; **ICLR 2024**). https://arxiv.org/abs/2308.03688 — **8 distinct environments** for LLM-as-Agent reasoning and decision-making. Failure attribution is the useful part: poor long-horizon reasoning, decision-making, and instruction following, with better instruction following and "training on high quality multi-round alignment data" proposed as the fix, and **code training reported to have mixed effects** across agent tasks. Note the abstract on arXiv contains an unrendered `\num` macro where the model count belongs — cite the 8 environments, not a model count. Repo: `THUDM/AgentBench`.
