---
id: agent-trajectory-eval
type: concept
tags: [eval, agent, trajectory, multi-turn]
related:
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[golden-snapshot-eval]]
  - [[agent-eval-case-study]]
status: living
created: 2026-06-05
summary: "multi-turn, tool sequences, end-state."
---

# Agent Trajectory Eval

Evaluating an agent — not just an LLM — means evaluating the *trajectory*: the full sequence of tool calls, observations, and messages that produced an outcome.

## Three eval shapes (LangSmith framing)

1. **Final-response** — only the last message matters. Easiest, weakest signal for tool-using agents.
2. **Trajectory** — assert on tool-call sequence (with partial credit). Catches "wrong tool" bugs final-response misses.
3. **Single-step / component** — pin one decision (router, tool selection, parameter extraction) and test it in isolation. Cheapest, most actionable when something breaks.

## Mechanical assertions worth having

- **Tool existence/forbidden** — required tool present, banned tool absent.
- **Tool count bounds** — `min/max` calls per case (catches loops + missed work).
- **`input.exists` / `input.equals`** — argument-level checks. `input.equals` is underused; promote it whenever the value is verifiable.
- **Sequence with wildcards** — partial-order assertions on tool calls.
- **Schema validity** — every emitted tool call parses against its operation's schema.

## End-state evaluation (Anthropic multi-agent post)

For genuinely nondeterministic agents, judging "did the final state satisfy the rubric?" is more tractable than judging every step. Pair with [llm-as-judge](llm-as-judge.md) rubrics: factual accuracy, citation accuracy, completeness, tool efficiency.

## Multi-turn drift

Single-turn cases miss the failure mode where state from turn N contaminates turn N+1 (system-reminder leakage, tool-output framing, premature tool use). Cover at least a handful of 3+ turn trajectories per surface.

## References

- Anthropic, *Building Effective Agents* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- Anthropic, *How We Built Our Multi-Agent Research System* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- LangSmith, *Evaluate a Complex Agent* — [references-eval-reading-list](../references/references-eval-reading-list.md)
