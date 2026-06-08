---
id: 2026-06-07-forced-tool-call-fan-out
type: thread
tags: [output, schema, design, thread]
related:
  - [[llm-output-design]]
  - [[forced-tool-call-output]]
  - [[output-surface-taxonomy]]
  - [[schema-vs-validator]]
  - [[streaming-vs-structured]]
  - [[hard-surface-irrevocability]]
status: archived
created: 2026-06-07
---

# Thread — Forced Tool-Call Fan-Out (2026-06-07)

Conversation goal: take a long-form analysis of "when to force a tool-call as the user-facing output channel" and decompose it into separable graph nodes so the ideas are reusable in contexts beyond the original case.

## Source material

A multi-section analysis covering: when forced tool-call is the right pattern, when it's wrong, why it's emerging as best practice, the per-surface decision discipline, and a concrete worked example for a transactional SMS notification surface.

## Outputs from this thread

- [llm-output-design](../nodes/topics/llm-output-design.md) — new umbrella topic.
- [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md) — the core pattern (when / when-not).
- [output-surface-taxonomy](../nodes/concepts/output-surface-taxonomy.md) — the meta-practice that makes the pattern decidable.
- [schema-vs-validator](../nodes/concepts/schema-vs-validator.md) — the alternative mechanism and how to choose between them.
- [streaming-vs-structured](../nodes/concepts/streaming-vs-structured.md) — the streaming UX trade-off, separable concept.
- [hard-surface-irrevocability](../nodes/concepts/hard-surface-irrevocability.md) — "irrevocable output channel" as a first-class category.

## Key insights captured

- Mechanism choice is **per-surface**, not per-feature; the worked taxonomy is the prerequisite practice.
- The strongest signal for schema enforcement is the conjunction of three properties (hard surface ∧ enumerable structure ∧ failure-cost ≫ rigidity-cost), not any one alone.
- A single feature usually needs **multiple mechanisms layered** — first-touch notification on schema, follow-up turns on free-text + validator, internal tool inputs already structured.
- Schema and validator are **complementary**, not alternatives — schema gates structural failures, validator gates content failures.
- Streaming UX and structured output are at odds; if you need both, you almost always want two surfaces.
- The pattern is "becoming best practice" because tool-use APIs only became reliable mid-2024 and most LLM apps inherited a free-text default that was never re-examined.
