---
id: bitemporal-fact-invalidation-memory
type: concept
tags: [memory, temporal, knowledge-graph, versioning, agents, science-excellence]
summary: "track valid-time + transaction-time and invalidate-not-delete on contradiction — the one thing flat-text memory structurally can't do — so an agent answers 'as of when' and keeps an audit trail for changing user facts."
related:
  - [[agent-memory]]
  - [[ontology-grounded-agent]]
  - [[domain-event-task-ontology]]
  - [[memory-consolidation-and-forgetting]]
  - [[agent-native-memory-framework]]
  - [[prompt-time-knowledge-capture]]
  - [[references-ontology-llm-agents]]
  - [[memory-poisoning]]
status: living
created: 2026-07-03
---

# Bi-Temporal Fact Invalidation Memory

A user's facts *change*: a task flips to done, a meeting moves, a preference is updated, an address changes. Flat-text memory handles this badly — it either overwrites (losing history) or accumulates contradictions ("hallucinations of the past"). **Bi-temporal typed memory** is the one capability flat text structurally lacks: every fact carries two timelines, and contradiction triggers *invalidation, not deletion*.

## The two clocks

| Time | Answers | Example |
|---|---|---|
| **Valid time** | when the fact was true *in the world* | "user lived in NYC from 2023-01 to 2025-06" |
| **Transaction time** | when the system *learned/recorded* it | "we recorded the move on 2025-07-02" |

On a contradicting update the old edge is **invalidated** (its valid-time closed) rather than removed. This yields two things flat memory can't: **as-of-T queries** ("what did we believe the task status was on Tuesday?") and an **audit trail** of how belief changed — the same authority/recency reasoning [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md) calls *supersession*, now made structural.

## Verified state

Zep/Graphiti (Rasmussen et al., [arXiv:2501.13956](https://arxiv.org/abs/2501.13956), verified 2026-07-03) implements exactly this: bi-temporal edges, invalidate-not-delete, incremental updates without full-graph recompute, and schema-constrained extraction into developer-defined entity/edge types — with **soft enforcement** (unmapped pairs are still captured; retyping old data needs re-ingestion). It ties to the [agent-native-memory-framework](agent-native-memory-framework.md) finding that structural-topological memory leads Knowledge-Update / Temporal-Reasoning workloads — *but is the least cost-efficient* (high utility only at 116–155s/query). Zep's headline accuracy/latency numbers are **author-reported**, not independently reproduced.

## When it earns its cost

- **Yes:** contradiction-heavy, time-sensitive user state — task/event status that changes, evolving preferences, anything where "as of when" or an audit trail matters. This is the natural store for a [domain-event-task-ontology](domain-event-task-ontology.md).
- **No:** long coherent-dialogue recall with no stable schema, or where per-query cost/latency dominates — flat/coarse-to-fine text memory wins.

## Pitfalls

- **Overwriting instead of invalidating.** Destroys the audit trail and the ability to answer historical questions; the whole point is to keep superseded facts, closed.
- **Never actually querying the temporal dimension.** If deployments only read current-state, the bi-temporal graph collapses back to flat text at graph-build cost with no payoff (an open question in the literature — verify your access patterns need it).
- **Trusting soft-schema types as guarantees.** Extraction is best-effort; unmapped/mistyped facts still land — validate downstream ([ontology-as-validator-shacl](ontology-as-validator-shacl.md)).
- **Paying graph cost for a recall problem.** Bi-temporal memory answers *update/temporal* bottlenecks, not raw recall.
- **Calling valid-time-plus-supersession "bi-temporal."** Many shipped builds carry only `valid_from`/`valid_until` + `superseded_by` edges (e.g. Iusztin, *Decoding AI*, 2026 — [references-ontology-llm-agents](../references/references-ontology-llm-agents.md)) — genuinely useful and cheaper, but it is *single-temporal*: without a separate **transaction time** you can answer "when was this true in the world" but not "what did we *believe* on Tuesday," and you lose the ingestion/correction audit trail. Add transaction time only when retroactive-correction auditing is a real requirement — otherwise the lighter variant is the right default.

## References

Sits under [agent-memory](../topics/agent-memory.md); the U/S modules of [agent-native-memory-framework](agent-native-memory-framework.md) made temporal; the changing-facts case of [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md). Sources in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
