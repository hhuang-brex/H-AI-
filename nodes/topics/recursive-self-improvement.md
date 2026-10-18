---
id: recursive-self-improvement
type: topic
tags: [rsi, self-improvement, harness, evaluation, safety, agents]
summary: "entry point for agents that edit their own prompts, skills, memory, or harness code: what the loop is, why the acceptance gate decides the outcome, and where to read next."
related:
  - [[self-improving-harness]]
  - [[references-recursive-self-improvement]]
  - [[references-rsi-2026-10]]
  - [[agent-harness]]
  - [[agent-control-loop]]
  - [[offline-prompt-optimization]]
  - [[agentic-context-engineering-ace]]
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[skill-lifecycle-and-drift]]
  - [[memory-poisoning]]
  - [[llm-as-judge]]
  - [[eval-statistical-significance]]
  - [[adaptive-eval-budget]]
  - [[action-authority]]
  - [[decision-audit-trail]]
  - [[llm-evaluation]]
  - [[action-execution-safety]]
status: living
created: 2026-10-18
---

# Recursive Self-Improvement

**Recursive self-improvement (RSI)** is a loop in which an AI system uses its current ability to improve the machinery that produces that ability. The term goes back to I. J. Good's "ultraintelligent machine" (1965) and Yudkowsky's 2008 framing. For an agent in production it rarely means rewriting weights. Lilian Weng argues that near-term RSI is "unlikely to start as a model directly rewriting its weights" and that the harness — prompts, context, workflow, tools, orchestration code — is the practical target ([*Harness Engineering for Self-Improvement*](https://lilianweng.github.io/posts/2026-07-04-harness/), 2026-07-04, fetched 2026-10-18).

The loop has the same three parts in every system:

```
propose an edit  ──▶  evaluate the edited agent  ──▶  accept or reject
      ▲                                                    │
      └──────────── the accepted agent proposes next ◀─────┘
```

## Why it matters for a conversing task agent

A task agent improves today by a human reading failures and editing prompts. RSI automates that loop. The graph's position, built from both fan-outs: **the evaluator and the acceptance gate decide whether the loop improves or quietly degrades, and the proposer matters much less than the literature's attention suggests.** For a domain agent that takes real actions, any self-edit loop is a deploy pipeline and should be built like one.

## The decisions, and where they live

| Decision | Failure if wrong | Node |
|---|---|---|
| What the loop may edit | The loop edits its own guardrails, evaluator, or permissions | [self-improving-harness](../concepts/self-improving-harness.md) |
| How an edit is accepted | False and harmful commits accumulate from noisy scores | [self-improving-harness](../concepts/self-improving-harness.md), [eval-statistical-significance](../concepts/eval-statistical-significance.md) |
| Who grades the edit | The loop optimizes the grader, or reads evidence the agent wrote | [llm-as-judge](../concepts/llm-as-judge.md) |
| What persists | Bad skills or memories seed later ones and resist rollback | [skill-lifecycle-and-drift](../concepts/skill-lifecycle-and-drift.md), [memory-poisoning](../concepts/memory-poisoning.md) |
| Which rung to optimize | Prompt tuning where the harness or weights were the bottleneck | [offline-prompt-optimization](../concepts/offline-prompt-optimization.md), [agentic-context-engineering-ace](../concepts/agentic-context-engineering-ace.md) |
| Which edits may act | A self-modified successor inherits or multiplies authority | [action-authority](../concepts/action-authority.md), [decision-audit-trail](../concepts/decision-audit-trail.md) |

## What the 2026-10 evidence adds

Each point is sourced in [references-rsi-2026-10](../references/references-rsi-2026-10.md).

- **Matched baselines erase many reported gains.** Under matched budgets and held-out tasks, harness evolution did not beat simple test-time scaling on Terminal-Bench 2.1. It did help on long-horizon games, where feedback is granular and headroom is large.
- **Failure feedback is not as directed as it looks.** Across 145 Darwin Gödel Machine edits, repair of the targeted failure was no better than repair of the parent's other failures.
- **The gate can be made statistically honest.** Paired per-item tests and certified reuse of a fixed evaluation set drove regression and false-promotion rates to zero in several studies.
- **Harness first, then weights.** Process failures such as loops and blocked calls yield to harness edits; content failures need weight training, and harness-evolved behavior can be trained into the weights.
- **Safety degrades in ways no single edit shows.** Individually safe updates combined into 43 pairwise and 18 three-way unsafe interactions, and stale scores kept unsafe programs running after a dependency changed.

## Reading order

1. [self-improving-harness](../concepts/self-improving-harness.md) — the mechanism and the deploy-style acceptance rule.
2. [references-recursive-self-improvement](../references/references-recursive-self-improvement.md) — the 2026-09-28 fan-out, by question.
3. [references-rsi-2026-10](../references/references-rsi-2026-10.md) — this pass: lineage from Weng's post, the DGM write-up, and papers from 2026-09-26 to 10-17.
