---
id: cost-aware-eval
type: concept
tags: [eval, cost, statistics]
related:
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[llm-as-judge]]
  - [[agent-eval-case-study]]
status: living
created: 2026-06-05
---

# Cost-Aware Eval Design

Eval cost is a budget. Spend it where the signal is.

## Sample-size math (Anthropic, 2024)

You don't need 10k samples to know whether two models differ. With paired-difference tests on the same dataset, **a few hundred samples** typically resolves a 2–5pp gap with adequate power. See [references-eval-reading-list](../references/references-eval-reading-list.md).

Practical implication: if nightly runs 50 reps × 12 datasets × multiple cases, ask whether the *variance* you're chasing actually needs that many samples or whether you're paying for noise that calibration would remove.

## Where to spend the saved budget

- Raise repetitions on the **expensive layer** (fixture-backed, multi-turn).
- Add **multi-vote judges** on cases that drive alarms.
- Add **token-budget assertions** — prompt bloat is invisible until customers feel latency.

## Cheap defenses

| Defense | Cost | Catches |
|---|---|---|
| Schema-validity scorer (zod parse on each tool-call) | $0 | malformed args |
| Prompt-token snapshot (`assert tokens ≤ N`) | $0 | catalog/skill bloat |
| Differential golden trajectory (hash tool-calls + final msg) | $0 on equal | most regressions, before the judge runs |

## References

- Anthropic, *A Statistical Approach to Model Evaluations* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- OpenAI Cookbook, *Getting Started with OpenAI Evals* — [references-eval-reading-list](../references/references-eval-reading-list.md)
