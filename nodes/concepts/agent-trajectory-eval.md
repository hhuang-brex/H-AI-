---
id: agent-trajectory-eval
type: concept
tags: [eval, agent, trajectory, multi-turn]
related:
  - [[task-planning]]
  - [[llm-evaluation]]
  - [[test-pyramid-llm]]
  - [[golden-snapshot-eval]]
  - [[agent-eval-case-study]]
  - [[collaborative-agent-eval]]
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

## Frontier (2026): reward models, failure attribution, dual-control

The eval frontier is moving from scoring a final state to scoring and *diagnosing* the whole trajectory:

- **Trajectory-level reward modeling.** Plan-RewardBench (Wang et al., *Aligning Agents via Planning*, [arXiv:2604.08178](https://arxiv.org/abs/2604.08178), ACL 2026) tests whether judges/reward models can tell a preferred trajectory from a confusable distractor across safety-refusal, tool-irrelevance, complex-planning, and error-recovery families. Finding: generative, discriminative, *and* LLM-judge evaluators all **degrade sharply on long-horizon trajectories** — a scorer calibrated on short tasks is not trustworthy on long ones.
- **Automated failure attribution.** AgentRx (Barke et al., *Diagnosing AI Agent Failures from Execution Trajectories*, [arXiv:2602.02475](https://arxiv.org/abs/2602.02475), Feb 2026) synthesizes constraints, checks them step-by-step, and pinpoints the **critical failure step + category** with an auditable validation log — moving trajectory eval from "did it fail?" to "where, and why." Built on 115 hand-annotated failed runs across API workflows, incident management, and web/file tasks.
- **Dual-control conversational eval.** τ²-Bench (Barres et al., [arXiv:2506.07982](https://arxiv.org/abs/2506.07982), Jun 2025) models a domain where **both agent and user act with tools** (a Dec-POMDP); agents show large performance drops moving from no-user to dual-control, separating reasoning errors from communication/coordination errors. Directly relevant to a conversing task agent that must *guide* a user who also acts.

## References

- Anthropic, *Building Effective Agents* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- Anthropic, *How We Built Our Multi-Agent Research System* — [references-eval-reading-list](../references/references-eval-reading-list.md)
- LangSmith, *Evaluate a Complex Agent* — [references-eval-reading-list](../references/references-eval-reading-list.md)
