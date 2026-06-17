---
id: verbal-self-correction
type: concept
tags: [reflection, agents, self-improvement, prompt, memory]
related:
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[offline-prompt-optimization]]
  - [[agentic-context-engineering-ace]]
  - [[conversation-memory]]
  - [[cot-as-forensic-artifact]]
  - [[llm-evaluation]]
status: living
created: 2026-06-16
summary: "a model revises its own behaviour from natural-language self-feedback — Self-Refine (within a task) and Reflexion (across trials); the primitive the optimizers scale up."
---

# Verbal Self-Correction

A model improves by **reading its own output/trace, articulating in natural language what was wrong, and revising** — no weight update, no gradient. This is the primitive that [offline-prompt-optimization](offline-prompt-optimization.md) and [agentic-context-engineering-ace](agentic-context-engineering-ace.md) scale up; see [verbal-reinforcement-vs-gradient-rl](verbal-reinforcement-vs-gradient-rl.md) for why it is "RL-flavored" but not RL.

The two foundational instances differ on **one axis: how far the lesson persists.**

## Self-Refine — within one task

*Self-Refine* ([arXiv:2303.17651](https://arxiv.org/abs/2303.17651)): a **single LLM acts as generator, feedback-provider, and refiner**, looping generate → critique → revise at test time. No training, no RL, and **no persistence** — the lesson dies when the task ends. ~20% absolute average gain across 7 tasks. The floor of the family: pure within-output iteration.

## Reflexion — across trials of a task

*Reflexion: Language Agents with Verbal Reinforcement Learning* ([arXiv:2303.11366](https://arxiv.org/abs/2303.11366)) reinforces an agent **"not by updating weights, but through linguistic feedback."** After a failed trial it writes a reflection into an **episodic memory buffer** and uses it on the **next attempt of the same task**. 91% pass@1 on HumanEval (vs GPT-4's 80%). This is the canonical "learn from failure without weights" loop, and the origin of the "verbal reinforcement" phrase. Persistence is **per-task-episode**, not global.

## The persistence ladder

| Scope of the lesson | Technique |
|---|---|
| One output | Self-Refine |
| Retries of one task | Reflexion (episodic buffer) |
| A reusable instruction, compiled offline | GEPA / [offline-prompt-optimization](offline-prompt-optimization.md) |
| A structured playbook, offline **and** online | [agentic-context-engineering-ace](agentic-context-engineering-ace.md) |

An agent that reads a *batch* of eval failures and rewrites its **skill** is Reflexion's signal pushed to the bottom of this ladder — the buffer becomes a durable, reusable artifact.

## Pitfalls

- **Reflector quality is load-bearing.** If the reflection misdiagnoses the failure, it writes a *wrong* lesson — a weak reflector actively degrades behaviour (ACE documents this directly).
- **Self-graded reward gaming.** When the same model judges its own success, it can reward-hack the grader; pair with an independent, deterministic check ([llm-as-judge](llm-as-judge.md), [decision-engine-contract](decision-engine-contract.md)).
- **Needs a real signal.** Without ground-truth or reliable execution feedback, reflection amplifies noise rather than correcting it.

## References

- Self-Refine [arXiv:2303.17651](https://arxiv.org/abs/2303.17651); Reflexion [arXiv:2303.11366](https://arxiv.org/abs/2303.11366). Scaled-up forms: [offline-prompt-optimization](offline-prompt-optimization.md), [agentic-context-engineering-ace](agentic-context-engineering-ace.md).
