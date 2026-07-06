---
id: memory-graph-topology
type: concept
tags: [memory, knowledge-graph, topology, retrieval, graphrag, science-excellence]
summary: "which graph structure backs an agent's memory — flat / tree / entity-graph / community-structured / temporal-KG — and what each buys vs costs; topology is a cost-capability dial matched to the workload bottleneck, not a default win."
related:
  - [[agent-memory]]
  - [[agent-native-memory-framework]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[memory-retrieval]]
  - [[memory-consolidation-and-forgetting]]
  - [[domain-knowledge-injection]]
  - [[references-context-and-memory]]
status: living
created: 2026-07-05
---

# Memory-Graph Topology

The **representation (R)** choice of [agent-native-memory-framework](agent-native-memory-framework.md) made concrete: *what graph structure backs the memory store* — from no graph (flat text/vector) up through hierarchical trees, entity graphs, community-structured graphs, and temporal KGs. Two independent systematic evaluations converge on one shape: **richer topology buys reasoning over scattered / multi-hop / temporally-distant / update-heavy evidence and pays for it in construction + maintenance cost — a trade that clears only when that reasoning slice dominates the workload and upkeep stays localized.** Topology is a dial matched to the bottleneck, not a general win. (Sources verified 2026-07-05.)

## The topologies

| Topology | Buys | Cost / honest scope | Retrieval algorithm |
|---|---|---|---|
| **Flat (chunks + vector/BM25)** | single-hop, detail, recent-context, latency, directness; cheapest | fails corpus-level sensemaking; weak multi-hop & contradiction | dense cosine and/or BM25, pack to budget |
| **Hierarchical tree** (RAPTOR [arXiv:2401.18059](https://arxiv.org/abs/2401.18059); MemTree) | multi-resolution abstraction — retrieve at the level matching the query; RAPTOR +20% abs. on QuALITY (GPT-4); MemTree path-local upkeep is cheap | tree summaries can lose detail; not a single-hop winner | traverse/collapse the summary tree |
| **Entity graph + Personalized PageRank** (HippoRAG NeurIPS 2024 [arXiv:2405.14831](https://arxiv.org/abs/2405.14831); HippoRAG 2 [arXiv:2502.14802](https://arxiv.org/abs/2502.14802)) | single-step **multi-hop associative** retrieval: 2WikiMultiHop R@2 71.5/R@5 89.5 vs ColBERTv2 59.2/68.2 | **underperforms** ColBERTv2 on HotpotQA (lower knowledge-integration); "all task types" is self-report | PPR seeded on query-linked entity (+passage) nodes |
| **Community-structured** (GraphRAG [arXiv:2404.16130](https://arxiv.org/abs/2404.16130), hierarchical Leiden) | **corpus-level global sensemaking**; hierarchy level = token dial (root C0 9–43× cheaper) | wins are GPT-4 *relative preference*, not gold accuracy; **hallucination never measured**; vector RAG wins directness | map-reduce over pre-built community summaries |
| **Temporal / bitemporal KG** (Zep/Graphiti [arXiv:2501.13956](https://arxiv.org/abs/2501.13956)) | "as-of-time-X", contradiction reconciliation without global recompute; see [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md) | **all numbers are vendor self-report**, no independent replication; can lose info vs raw context; heavy write path | hybrid cosine + BM25 + BFS n-hop, reranked |

## Pick by the dominant bottleneck

- **Single-hop / recent / low-latency / directness →** flat vector (structure loses here: plain RAG +1.8 F1 on NQ single-hop).
- **Multi-hop associative over scattered evidence →** entity graph + PPR (confirm the workload really has high knowledge-integration; it *lost* on HotpotQA).
- **"Summarize / make sense of the whole corpus" →** community-structured; use the hierarchy level as a quality/token dial. Won't help local lookup or verified accuracy.
- **Evolving facts / contradictions / as-of-time →** temporal-KG ([bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md)).
- **Mixed →** hybrid (Han et al.): *Selection* routes by query type (+1.1%, cheap); *Integration* concatenates both retrievals (+6.4%, costlier).

**The cost lever underneath all of it:** efficiency is governed by **maintenance scope, not structure** (Zhou et al. [arXiv:2606.24775](https://arxiv.org/abs/2606.24775), O7) — *localized* upkeep (MemTree path-local, LightMem 3.67s) beats *global* reorganization (graph-wide consolidation, 116–552s). This is the bridge to [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md) and the [agent-native-memory-framework](agent-native-memory-framework.md) "structural-topological leads update/temporal but is least cost-efficient" finding.

## Pitfalls

- **Pure KG-triplet topology collapses.** In Han et al. ([arXiv:2502.11371](https://arxiv.org/abs/2502.11371)) triples-only is weakest everywhere (NQ F1 34.28) because only ~65.8% of answer entities even appear in the built KG. "Graph wins multi-hop" belongs to *passage-graph / community* variants, **not** pure triples.
- **Construction overhead is real (~40–57×), not mythical.** KG-GraphRAG 7702s vs RAG 135s = 57× build time (Han et al.); latency-measured, no $/token figures exist in the sources — don't quote a clean "50–100×."
- **Self-report vs independent benchmark.** Zep's numbers and HippoRAG 2's "all task types" are vendor/author self-reports; GraphRAG's wins are LLM-judged *preference*. Treat as capability claims, not verified accuracy.
- **Structure can lose information.** Lossy summaries/extraction drop detail (Zep underperforms full-context on single-session-assistant 94.6%→80.4%); whether they increase fabrication is unmeasured.
- **Global maintenance is the silent cost.** Dynamic communities "gradually diverge" and need periodic full recompute — prefer bounded/path-local upkeep.

## References

Sits under [agent-memory](../topics/agent-memory.md); the topology axis of [agent-native-memory-framework](agent-native-memory-framework.md)'s R-module. Primary sources verified 2026-07-05 (RAPTOR, HippoRAG/2, GraphRAG, Zep, Han et al., Zhou et al.); reading lists in [references-context-and-memory](../references/references-context-and-memory.md) and [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
