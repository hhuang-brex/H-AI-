---
id: llm-evaluation
type: topic
tags: [eval, agents, llm, testing]
related:
  - [[test-pyramid-llm]]
  - [[llm-as-judge]]
  - [[prod-shadow-replay]]
  - [[cost-aware-eval]]
  - [[agent-eval-case-study]]
status: living
created: 2026-06-05
---

# LLM Evaluation

The umbrella topic for measuring whether an LLM-powered system does what it should — without paying so much per measurement that you stop measuring.

## What an eval is for

1. **Catch regressions** before customers do.
2. **Quantify deltas** when a prompt, model, tool, or skill changes.
3. **Stay cheap enough** to run as often as the change rate.

Anything not serving (1)–(3) is overhead.

## Sub-topics

- [[test-pyramid-llm]] — how to layer cheap deterministic checks under expensive LLM-judged ones.
- [[llm-as-judge]] — calibration, multi-vote, cascading judges, bias.
- [[prod-shadow-replay]] — closing the gap between frozen datasets and live traffic.
- [[cost-aware-eval]] — sample-size math and budget assertions.
- [[agent-trajectory-eval]] — multi-turn, tool-call sequences, end-state vs step.
- [[adversarial-eval]] — red-team / safety / prompt injection.

## Canonical references

See [[references-eval-reading-list]] for the curated frontier-lab + practitioner reading list.
