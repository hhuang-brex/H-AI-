---
id: 2026-06-09-reasoning-mode-research
type: thread
tags: [reasoning, thinking, prompting, research, thread]
related:
  - [[native-thinking-vs-prompted-reasoning]]
  - [[operator-trust-injection]]
  - [[forced-tool-call-output]]
  - [[decision-engine-contract]]
status: archived
created: 2026-06-09
summary: "deep-research on prompted `<reasoning>` vs. native thinking APIs."
---

# Thread — Reasoning Mode Research (2026-06-09)

Conversation goal: figure out whether prompting LLMs to emit reasoning in `<reasoning>` / `<thinking>` tags is still best practice in 2025–2026, given that frontier models now expose native thinking/reasoning APIs.

## Method

Ran the deep-research workflow:

- **5 angles**: frontier-lab guidance, quality benchmarks, cost/latency, auditability, structured-output interaction, user-leakage / replacement patterns.
- **5 parallel web-search agents**.
- **Sources fetched & verified**: Anthropic adaptive-thinking + extended-thinking + use-xml-tags + prompt-caching docs; OpenAI reasoning-best-practices + GPT-5 prompting guide + "Learning to reason with LLMs"; DeepSeek reasoning model API + R1 model card.
- **3-vote adversarial verification** on every claim. 3 plausible-sounding claims were unanimously refuted (0–3) and dropped.

Stats: 103 subagents · ~2.65M subagent tokens · ~9 min wall time.

## Outputs

- [native-thinking-vs-prompted-reasoning](../nodes/concepts/native-thinking-vs-prompted-reasoning.md) — new concept node. The current state by lab, structural advantages of native thinking, the forced-tool-choice incompatibility, when prompted `<reasoning>` is still right, replacement patterns for non-reasoning models.

## Key findings

- **Frontier labs have shifted to native reasoning APIs** as the primary mechanism; prompted `<reasoning>` is fallback or non-reasoning-model territory.
- **Anthropic Claude Fable 5 actively refuses** prompted reasoning extraction with `stop_details.category: "reasoning_extraction"` — strongest deprecation signal seen.
- **OpenAI explicitly says don't use CoT prompts on reasoning models** — "unnecessary and can sometimes hinder."
- **XML tags themselves are NOT deprecated** for prompt *structuring* — still endorsed by both Anthropic (`<documents>`, `<example>`) and OpenAI (`<self_reflection>`, `<context_gathering>`, `<tool_preambles>`). Only the specific pattern of *prompting reasoning models to verbalize reasoning* is deprecated.
- **Native thinking has four structural advantages** prompted tags can't match: separate billing/visibility, prompt-cache integration on multi-turn, automatic interleaved reasoning between tool calls, training-pressure separation.
- **Hard incompatibility**: Anthropic extended thinking + `tool_choice: "any"` or named tool → 400 error. Implications for combining [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md) with reasoning.
- **Prompted CoT *summary* is still recommended** by OpenAI specifically for `reasoning_effort=minimal` GPT-5. Native and prompted are complementary, not strictly substitutes.
- **DeepSeek forbids feeding `reasoning_content` back into context** (400 error). Native traces are ephemeral; this is *different* from prompt-tag reasoning durability.

## Refuted claims (do not cite)

- 0–3: "Anthropic claims adaptive thinking outperforms extended thinking in internal evaluations." (Not in the docs.)
- 0–3: "DeepSeek-R1 explicitly recommends NOT using a system prompt." (Not stated.)
- 0–3: "DeepSeek-R1's reasoning emerges from pure RL, not from prompting or human-labeled trajectories." (Conflates training method with API surface.)

## Time-sensitive caveats

- Adaptive-thinking-only enforcement applies to Anthropic Opus 4.7/4.8 specifically. Older Anthropic models still benefit from prompted CoT.
- Eval numbers (TAU-Bench 73.9 → 78.2, SWE-bench 63.7 / 70.3) are vendor self-reported.
- `reasoning_extraction` refusal category prevalence is documented but not quantified.
- **Gemini coverage is unconfirmed** in this pass — primary sources weren't fetched. Treat any Gemini-specific claim as needing direct verification.
- The "post-hoc rationalization vs. faithful reasoning" claim was not verified to a primary source — neither lab makes a strong claim about trace faithfulness.

## Connection to existing graph

- The new node sits alongside [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md) and [template-rendered-output](../nodes/concepts/template-rendered-output.md) under Output Design — reasoning mode is an output-channel decision.
- Reinforces [operator-trust-injection](../nodes/concepts/operator-trust-injection.md)'s hard line ("reasoning never crosses to user-facing output") — native thinking is the structurally clean implementation.
- Maps onto [decision-engine-contract](../nodes/concepts/decision-engine-contract.md)'s `reasoning` field (audit-only) — same principle at engine-output level.
- The forced-tool-choice incompatibility is the kind of hard constraint the [output-surface-taxonomy](../nodes/concepts/output-surface-taxonomy.md) should capture per surface.

## Open follow-ups

- Verify Gemini thinking-mode primary docs in a future pass.
- Worked example: when running an agent that wants both forced tool-call output AND reasoning, what's the cleanest dual-pass pattern? Could become its own concept node if the team builds something with this constraint.
- A short worked code example showing the three replacement patterns (tool-arg `reasoning` field, multi-step, `<thinking>` + strip) would help, but kept abstract here.
