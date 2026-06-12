---
id: references-task-agent-design
type: reference
tags: [agent, task-agent, reading-list, react, tool-use, multi-agent, science-excellence]
summary: "verified primary sources grounding the agent cluster — ReAct, Reflexion, Toolformer, Tree of Thoughts, MetaGPT, and Anthropic's effective-agents guidance."
related:
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[task-planning]]
  - [[multi-agent-delegation]]
  - [[perceive-reason-act-loop]]
  - [[plan-execute-replan]]
status: living
created: 2026-06-11
---

# References — Task Agent Design

Primary sources behind the agent cluster ([agent-control-loop](../topics/agent-control-loop.md), [tool-use-design](../topics/tool-use-design.md), [task-planning](../topics/task-planning.md), [multi-agent-delegation](../topics/multi-agent-delegation.md)). The cluster's concepts were written from engineering reasoning; this list grounds them in the literature and practitioner guidance they descend from. Every entry below was fetched and verified (title/authors/year confirmed) on 2026-06-11 — not recalled from memory.

## The control loop

- **ReAct: Synergizing Reasoning and Acting in Language Models** — Yao, Zhao, Yu, Du, Shafran, Narasimhan, Cao (2022). https://arxiv.org/abs/2210.03629 — The canonical source for the interleaved reason→act→observe loop. Directly behind [perceive-reason-act-loop](../concepts/perceive-reason-act-loop.md); the paper's framing ("reasoning and acting studied as separate topics") is exactly what the loop synthesizes.

- **Reflexion: Language Agents with Verbal Reinforcement Learning** — Shinn, Cassano, Berman, Gopinath, Narasimhan, Yao (2023). https://arxiv.org/abs/2303.11366 — Agents that reflect on failed trajectories and retry with that reflection in context. The conceptual ancestor of [plan-execute-replan](../concepts/plan-execute-replan.md)'s "structural failure → replan, not blind retry" and of feeding errors back as actionable perceptions ([tool-result-grounding](../concepts/tool-result-grounding.md)).

## Tool use

- **Toolformer: Language Models Can Teach Themselves to Use Tools** — Schick, Dwivedi-Yu, Dessì, Raileanu, Lomeli, Zettlemoyer, Cancedda, Scialom (2023). https://arxiv.org/abs/2302.04761 — Foundational work on LMs deciding which API to call and when. Background for [tool-schema-design](../concepts/tool-schema-design.md) and [tool-selection-and-routing](../concepts/tool-selection-and-routing.md) — the model's tool choice as a learned/promptable behavior.

## Planning

- **Tree of Thoughts: Deliberate Problem Solving with Large Language Models** — Yao, Yu, Zhao, Shafran, Griffiths, Cao, Narasimhan (2023). https://arxiv.org/abs/2305.10601 — Search over a tree of intermediate reasoning steps with lookahead/backtracking. A more elaborate planning regime than [goal-decomposition](../concepts/goal-decomposition.md)'s linear-with-dependencies default; useful context for *when* heavier planning earns its cost (the YAGNI gate in [task-planning](../topics/task-planning.md)).

## Multi-agent

- **MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework** — Hong, Zhuge, Chen, Zheng, Cheng, Zhang, Wang, Wang, Yau, Lin, Zhou, Ran, Xiao, Wu, Schmidhuber (2023, rev. 2024). https://arxiv.org/abs/2308.00352 — Role-based multi-agent collaboration with structured outputs between agents. Read it *alongside* [when-to-delegate](../concepts/when-to-delegate.md)'s caution: it demonstrates the role-decomposition pattern that the concept argues is usually over-applied — a useful tension to hold, not a contradiction.

## Practitioner guidance

- **Building Effective Agents** — Erik Schluntz & Barry Zhang, Anthropic (2024). https://www.anthropic.com/engineering/building-effective-agents — Argues for "simple, composable patterns rather than complex frameworks," distinguishing workflows from autonomous agents. The strongest external corroboration of the cluster's recurring YAGNI stance — especially [when-to-delegate](../concepts/when-to-delegate.md)'s "default is don't" and [task-planning](../topics/task-planning.md)'s "skip the planner unless multi-step."

## How to read this list against the cluster

The cluster's nodes are *engineering distillations*, not summaries of these papers — they emphasize production concerns (idempotency, crash-recovery, budget ceilings, confirm gates) that the research literature largely doesn't cover. Where the papers and the cluster diverge, the divergence is the point: ReAct doesn't discuss exactly-once side effects, MetaGPT doesn't gate on "is delegation worth the cost." The papers establish the *mechanisms*; the cluster adds the *production discipline* ([action-execution-safety](../topics/action-execution-safety.md), [agent-state-persistence](../topics/agent-state-persistence.md), [execution-invariant-testing](../concepts/execution-invariant-testing.md)) that shipping requires.

## Verification note

Each URL above was fetched and its title/authors/year confirmed on 2026-06-11 (per the repo rule against guessing citations). arXiv IDs are stable; the Anthropic URL is a living page and may evolve. Re-verify before citing externally.
