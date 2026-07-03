---
id: llm-output-design
type: topic
tags: [llm, output, design, schema, ux]
related:
  - [[llm-evaluation]]
  - [[forced-tool-call-output]]
  - [[output-surface-taxonomy]]
  - [[schema-vs-validator]]
  - [[ontology-as-validator-shacl]]
  - [[streaming-vs-structured]]
  - [[hard-surface-irrevocability]]
  - [[template-rendered-output]]
  - [[layered-defense-pipeline]]
  - [[native-thinking-vs-prompted-reasoning]]
  - [[llm-observability]]
  - [[cot-as-forensic-artifact]]
status: living
created: 2026-06-07
summary: "how an LLM emits to the world; per-surface decisions."
---

# LLM Output Design

How an LLM emits to the world. Distinct from prompt design (what goes in) and from eval (what was true after the fact). The output side is where most production failures land — a malformed message reaches a customer; an ill-shaped tool call breaks a downstream service; a streaming token sequence corrupts a UI.

## Mental model

A forced tool-call is to LLM output what a typed RPC is to a network call. You wouldn't let a microservice send arbitrary strings to a customer-facing endpoint without a schema; treat LLM outputs the same way — *per surface*.

## The decision is per-surface, not per-feature

The recurring mistake is choosing one output mechanism for the whole agent. Real systems have many output surfaces — SMS, chat UI, logs, tool inputs, partner webhooks, voice — and each one has a different failure cost, a different consumer, and different latency requirements. See [output-surface-taxonomy](../concepts/output-surface-taxonomy.md).

## Sub-topics

- [forced-tool-call-output](../concepts/forced-tool-call-output.md) — when to force the schema; when free-text is correct.
- [output-surface-taxonomy](../concepts/output-surface-taxonomy.md) — the meta-practice of classifying surfaces explicitly.
- [schema-vs-validator](../concepts/schema-vs-validator.md) — schema-enforced output vs. free-text + post-hoc validator.
- [streaming-vs-structured](../concepts/streaming-vs-structured.md) — partial-token UX vs. structured output, and why they're at odds.
- [hard-surface-irrevocability](../concepts/hard-surface-irrevocability.md) — when "send" is unrecoverable, and what that implies.
