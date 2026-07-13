---
id: text-to-sql-retrieval
type: concept
tags: [retrieval, text-to-sql, structured-data, tools, guardrails, grounding]
related:
  - [[context-engineering]]
  - [[domain-knowledge-injection]]
  - [[action-execution-safety]]
  - [[plan-execute-replan]]
  - [[grounding-and-citation]]
  - [[prompt-time-knowledge-capture]]
  - [[prince-reliable-agentic-case-study]]
status: living
created: 2026-07-10
summary: "natural-language→SQL over a structured store as a retrieval modality beside RAG — with its guardrail bundle: dynamic schema selection, dynamic few-shot, SELECT-only, record cap, bounded self-correcting retry."
---

# Text-to-SQL Retrieval

The graph's [domain-knowledge-injection](domain-knowledge-injection.md) covers RAG-over-documents, prompt-stuffing, structured-state, and fine-tuning — but not the other production retrieval modality: **natural-language → SQL over a structured store**. For tabular/relational domain data (counts, aggregations, exact filters, joins), vector RAG is the wrong tool — it retrieves *similar text*, it cannot *compute*. Text-to-SQL is a first-class retrieval modality that sits **alongside** RAG: the model generates a query, it executes against a live DB, rows come back as evidence. (Model it as a **tool/modality**, not a separate "agent" — in [prince-reliable-agentic-case-study](../projects/prince-reliable-agentic-case-study.md) it's one tool inside the Researcher, beside doc-RAG.)

## The generated-query guardrail bundle

A generated query that *executes against a real database* is a read-side action, so the pattern is a bundle of guards, not just a prompt:

- **Dynamic schema selection** — inject only the query-relevant tables/columns (plus always-include keys like an ID/title) rather than the whole schema; too much schema is [context pollution](context-engineering.md), too little hallucinates columns.
- **Dynamic few-shot from a semantic layer** — retrieve query exemplars relevant to *this* question (a curated NL→SQL example store), not a fixed few-shot block.
- **SELECT-only** — block `DELETE`/`INSERT`/`UPDATE` at the execution boundary; a generated write is an unbounded side effect ([action-execution-safety](../topics/action-execution-safety.md)).
- **Result cap** — bound rows returned (e.g. 50) so a broad query can't flood context or the DB.
- **Bounded self-correcting retry** — on a *real DB error*, feed the error back and regenerate (≤N times), then replan ([plan-execute-replan](plan-execute-replan.md) / [verbal-self-correction](verbal-self-correction.md)); don't retry forever, and don't retry a *semantically* wrong-but-valid query (the error channel only catches syntax/execution failures).

## When to use it (vs RAG)

| Bottleneck | Modality |
|---|---|
| exact counts / aggregation / filtering / joins over tabular data | **Text-to-SQL** |
| fuzzy semantic recall over prose/documents | vector RAG ([domain-knowledge-injection](domain-knowledge-injection.md)) |
| both (a real domain agent) | run both as sibling tools; the agent picks per sub-question |

## Pitfalls

- **Hallucinated schema.** The top failure — mitigated by dynamic schema injection + always-include keys, not by a bigger prompt.
- **An LLM query-reviewer can be net-negative.** PRINCE *removed* an LLM SQL-review step because it false-flagged valid queries — an added LLM check is not free insurance ([layered-defense-pipeline](layered-defense-pipeline.md) / [llm-as-judge](llm-as-judge.md)).
- **Retry masking a bad question.** The retry loop fixes execution errors, not a misunderstood intent; pair with intent clarification upstream.
- **Unbounded/expensive queries.** Without a record cap and SELECT-only, a generated query is an availability + data-integrity risk.
- **No provenance.** Ground the answer in the actual rows/query returned ([grounding-and-citation](grounding-and-citation.md)), not the model's paraphrase.

## References

Sits under [context-engineering](../topics/context-engineering.md) as the structured-data sibling of [domain-knowledge-injection](domain-knowledge-injection.md). Production instance: [prince-reliable-agentic-case-study](../projects/prince-reliable-agentic-case-study.md) (Bayer PRINCE — Text-to-SQL over Athena with exactly this guardrail bundle; Frontiers in AI 8:1636809).
