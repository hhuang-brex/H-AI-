---
id: llm-evaluation
type: topic
tags: [eval, agents, llm, testing]
related:
  - [[simulated-user-eval]]
  - [[execution-invariant-testing]]
  - [[test-pyramid-llm]]
  - [[llm-as-judge]]
  - [[prod-shadow-replay]]
  - [[cost-aware-eval]]
  - [[agent-trajectory-eval]]
  - [[adversarial-eval]]
  - [[golden-snapshot-eval]]
  - [[agent-eval-case-study]]
  - [[offline-prompt-optimization]]
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[eval-dataset-quality]]
  - [[eval-case-design]]
  - [[verbal-self-correction]]
  - [[collaborative-agent-eval]]
  - [[live-traffic-eval]]
  - [[agent-failure-modes]]
status: living
created: 2026-06-05
summary: "measuring whether LLM systems do what they should without bankrupting the team."
---

# LLM Evaluation

The umbrella topic for measuring whether an LLM-powered system does what it should — without paying so much per measurement that you stop measuring.

## What an eval is for

1. **Catch regressions** before customers do.
2. **Quantify deltas** when a prompt, model, tool, or skill changes.
3. **Stay cheap enough** to run as often as the change rate.

Anything not serving (1)–(3) is overhead.

## Sub-topics

- [test-pyramid-llm](../concepts/test-pyramid-llm.md) — how to layer cheap deterministic checks under expensive LLM-judged ones.
- [llm-as-judge](../concepts/llm-as-judge.md) — calibration, multi-vote, cascading judges, bias.
- [prod-shadow-replay](../concepts/prod-shadow-replay.md) — closing the gap between frozen datasets and live traffic.
- [cost-aware-eval](../concepts/cost-aware-eval.md) — sample-size math and budget assertions.
- [agent-trajectory-eval](../concepts/agent-trajectory-eval.md) — multi-turn, tool-call sequences, end-state vs step.
- [adversarial-eval](../concepts/adversarial-eval.md) — red-team / safety / prompt injection.
- [execution-invariant-testing](../concepts/execution-invariant-testing.md) — assert agent safety properties (idempotency, crash-consistency, budget-bound) as deterministic tests.
- [simulated-user-eval](../concepts/simulated-user-eval.md) — drive a chatting agent with a scripted/LLM-played user across multi-turn interruption and correction scenarios.
- [offline-prompt-optimization](../concepts/offline-prompt-optimization.md) — turn the eval metric around and use it to *improve* a skill: search prompt space offline, scored end-to-end by the real agent.
- [verbal-reinforcement-vs-gradient-rl](../concepts/verbal-reinforcement-vs-gradient-rl.md) — the eval-driven "rewrite the skill from failures" loop is *verbal* reinforcement (text moves), not gradient RL (weights move); maps the OPRO/DSPy/GEPA/Reflexion family.
- [verbal-self-correction](../concepts/verbal-self-correction.md) — the primitive underneath it: Self-Refine (within a task) and Reflexion (across trials).
- [eval-dataset-quality](../concepts/eval-dataset-quality.md) — audit the *instrument*: validity, label agreement, discrimination (the negative-control test), contamination, drift — a scorecard for "is my eval set any good?"
- [eval-case-design](../concepts/eval-case-design.md) — *construct* good cases: design from the decision, a coverage matrix, scorable end-states, discrimination-piloting, held-out splits, and the failure flywheel.

## Canonical references

See [references-eval-reading-list](../references/references-eval-reading-list.md) for the curated frontier-lab + practitioner reading list.
