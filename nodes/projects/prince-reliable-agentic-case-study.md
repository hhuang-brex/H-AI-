---
id: prince-reliable-agentic-case-study
type: project
kind: snapshot
tags: [case-study, agents, rag, text-to-sql, context-engineering, harness, pharma, eval, production]
related:
  - [[context-engineering]]
  - [[agent-harness]]
  - [[domain-knowledge-injection]]
  - [[grounding-and-citation]]
  - [[multi-agent-delegation]]
  - [[verbal-self-correction]]
  - [[plan-execute-replan]]
  - [[checkpoint-and-replay]]
  - [[crash-recovery-consistency]]
  - [[llm-evaluation]]
  - [[llm-observability]]
  - [[human-in-the-loop-control]]
  - [[action-execution-safety]]
  - [[subagent-context-isolation]]
  - [[context-assembly-per-turn]]
  - [[text-to-sql-retrieval]]
  - [[live-traffic-eval]]
  - [[reflection-loop-taxonomy]]
status: snapshot
created: 2026-07-10
summary: "Bayer/Thoughtworks PRINCE — a shipped, peer-reviewed production agentic-RAG + Text-to-SQL system; field validation that reliability = context engineering + harness engineering."
---

# PRINCE — Reliable Agentic AI Case Study (Snapshot)

**PRINCE** (Preclinical Information Center) is a real, cloud-hosted Bayer AG production system built with Thoughtworks, integrating decades of preclinical safety-study reports (toxicology, safety pharmacology, DMPK) — 18,000+ in-house studies. It uses **agentic RAG + Text-to-SQL** to let scientists query unstructured documents and structured data in natural language. Captured because it grounds the graph's abstractions in one named, regulated-industry, shipped enterprise system — and its central thesis, **reliability = context engineering + harness engineering**, is direct field corroboration for the [context-engineering](../topics/context-engineering.md) and [agent-harness](../topics/agent-harness.md) clusters.

## Two sources — keep them separate

- **Blog (practitioner writeup):** "Building Reliable Agentic AI Systems" — Sarang Sanjay Kulkarni (Principal Consultant, Thoughtworks), martinfowler.com/articles/reliable-llm-bayer.html, **2026-06-16**. Reliability-pattern narrative; source of the terms *context discipline* / *context pollution*.
- **Peer-reviewed (citable):** "From data silos to insights: the PRINCE multi-agent knowledge engine for preclinical drug development." Vieira-Vieira & Kulkarni (co-first), Zalewski, Löffler, Münch, Kreuchwig. *Frontiers in Artificial Intelligence* **8:1636809**, Brief Research Report, **2025-08-19**, DOI 10.3389/frai.2025.1636809.

Kulkarni bridges both. The **paper predates the blog by ~10 months** — cite the Frontiers paper as the primary artifact; the blog for pattern framing. No claim is contradicted between them. Timeline (paper): platform since 2020; user-facing **chatbot March 2024** ("early 2024"); **agentic layer November 2024** ("later that year").

## Architecture → which node owns each mechanism

| PRINCE mechanism | Owned by |
|---|---|
| Clarify Intent → Think&Plan → Researcher → Reflection → Writer | [multi-agent-delegation](../topics/multi-agent-delegation.md) + [goal-decomposition](../concepts/goal-decomposition.md) + [agent-control-loop](../topics/agent-control-loop.md) |
| Hybrid doc-RAG (vector + keyword) | [domain-knowledge-injection](../concepts/domain-knowledge-injection.md) |
| **Text-to-SQL over Athena as a 2nd retrieval modality** | **[text-to-sql-retrieval](../concepts/text-to-sql-retrieval.md)** (a genuine gap this fills) |
| Per-stage "context discipline" (tailored context, not one big prompt) | [context-engineering](../topics/context-engineering.md) + [context-assembly-per-turn](../concepts/context-assembly-per-turn.md) + [subagent-context-isolation](../concepts/subagent-context-isolation.md) |
| Writer synthesizes with citations, discovers nothing new | [grounding-and-citation](../concepts/grounding-and-citation.md) |
| SELECT-only + 50-record cap on a generated-query tool | [action-execution-safety](../topics/action-execution-safety.md) (read-side variant) |
| Text-to-SQL error→retry (≤3) then replan | [plan-execute-replan](../concepts/plan-execute-replan.md) + [verbal-self-correction](../concepts/verbal-self-correction.md) |
| Three reflection loops (process / data / draft) | **[reflection-loop-taxonomy](../concepts/reflection-loop-taxonomy.md)** |
| Checkpointer → PostgreSQL after each node; resume from failed node | [checkpoint-and-replay](../concepts/checkpoint-and-replay.md) + [crash-recovery-consistency](../concepts/crash-recovery-consistency.md) + [run-state-model](../concepts/run-state-model.md) |
| RAGAS dataset evals (on change) + **daily reference-free live scoring** | [llm-evaluation](../topics/llm-evaluation.md) + **[live-traffic-eval](../concepts/live-traffic-eval.md)** |
| Langfuse traces / CloudWatch | [llm-observability](../concepts/llm-observability.md) |
| Expert-review-before-submission; confidence-gated quarantine of extractions | [human-in-the-loop-control](../topics/human-in-the-loop-control.md) |
| Cross-provider LLM fallback behind a unified OpenAI-compatible endpoint | nuance → [managed-agent-apis](../concepts/managed-agent-apis.md) / [agent-harness](../topics/agent-harness.md) |
| Removed an LLM SQL-reviewer that false-flagged valid queries | counter-example for [layered-defense-pipeline](../concepts/layered-defense-pipeline.md) / [llm-as-judge](../concepts/llm-as-judge.md) |

## Self-reported engineering choices — NOT general results

One team, one pharma corpus, no ablations. Do not adopt as recommendations: hybrid weighting **0.7 semantic / 0.3 keyword**; retrieve **~20** chunks → rerank to **top 7** (`bge-reranker-large`; the "→7" is blog-only); query expansion **n=5**; Text-to-SQL **50-record** cap, **≤3** retries; dynamic schema injection + dynamic few-shot from a curated "semantic layer". Model stack (paper): GPT-4o (temp 0) default; Claude 3.5 Sonnet for Text-to-SQL; GPT-4o-mini for the 5 expansion queries; open-source LangGraph.

## Adoption / impact — small-n self-reported survey, NOT a benchmark

Peer-reviewed but a qualitative survey of **~15–20 frequent users**, no control group: 75% reported significant search-time reduction; ~30% average response-time improvement on complex queries after the agentic stage; ease-of-use 4/5; "fully meets my needs" 3.1/5 (the team's own flag of remaining gaps). Scale: 18,000+ studies.

## What this validates in the graph

- **context-engineering:** "Larger context windows did not remove the need to be selective about what each agent sees" — an independent *production* testimonial for a claim the graph otherwise backs only with Lost-in-the-Middle / Context Rot. Adds the named failure mode **context pollution** and a broader cost framing (harder to *steer* and *evaluate*, not just accuracy).
- **agent-harness:** a full exemplar instance — durable checkpointed state, layered retries, provider fallback, and decomposition so "each agent can be evaluated, debugged, and improved in isolation."

## Caveats

Single-vendor case study (both sources share an author); no independent corroboration of the numbers. Blog-only stage names differ from the paper's (Supervisor/Reflection/Writer/Document-Planner/Researcher/HITL over Search→Ask→Do) — same system. All engineering knobs + survey numbers are self-reported, labeled above.
