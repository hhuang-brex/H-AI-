---
id: agent-native-memory-framework
type: concept
tags: [agent, memory, data-management, architecture, evaluation, science-excellence]
summary: "the R/S/Q/U four-module decomposition of agent memory as a data-management system (Zhou et al. 2026) — the cross-system lens for the cluster, plus its two headline results."
related:
  - [[agent-memory]]
  - [[memory-types-taxonomy]]
  - [[memory-retrieval]]
  - [[memory-consolidation-and-forgetting]]
  - [[eval-dataset-quality]]
  - [[agentic-context-engineering-ace]]
status: living
created: 2026-06-24
---

# Agent-Native Memory Framework (R/S/Q/U)

The cluster's [memory-types-taxonomy](memory-types-taxonomy.md) classifies memory by *content* (working / episodic / semantic / procedural). This node adds the orthogonal axis: a **data-management** decomposition of a memory *system* by **lifecycle phase**, from *Are We Ready For An Agent-Native Memory System?* (Zhou et al., [arXiv:2606.24775](https://arxiv.org/abs/2606.24775), 23 Jun 2026; SJTU/Tsinghua/MemTensor; code [OpenDataBox/MemoryData](https://github.com/OpenDataBox/MemoryData)). Its premise: prior evaluation treats memory as a *monolithic black box* scored only by end-to-end task metrics ("e.g., F1, BLEU"), leaving operational cost, cross-module trade-offs, and update-robustness unexamined. The fix is to model a memory system as a tuple and ablate it module by module.

## The four modules

`M_sys = ⟨R, S, Q, U⟩`, each governing "a distinct phase of the memory lifecycle":

| Module | Phase | Design space |
|---|---|---|
| **R — Representation & Storage** | the data model | logical: token sequences (discrete text / continuous vectors), graph/tree topologies, composite; physical: in-context register, single-engine (vector/graph/relational/file), multi-engine |
| **S — Extraction** | write path | raw-sequence concat · schema-free semantic extraction · schema-constrained structured extraction |
| **Q — Retrieval & Routing** | read path | native attention · dense KNN · topological subgraph traversal · agentic routing · multi-stage hybrid |
| **U — Maintenance** | lifecycle | conflict resolution & versioning · capacity management (hard / score-based eviction) · semantic consolidation (LLM-merge or tool-CRUD) · (parametric optimization) |

Existing cluster nodes are slices of this: [memory-retrieval](memory-retrieval.md) is **Q**; [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md) is **U**; [context-storage-and-hydration](context-storage-and-hydration.md) is the engineering of **R/S**. The paper maps 14 systems into three architecture families — *sequential context* (Mem0, MemoChat, MEM1, MemAgent), *structural-topological* (MemTree, Zep, Cognee), *multi-paradigm hybrid* (MemOS, MemoryOS, A-MEM, Letta/MemGPT, LightMem, SimpleMem).

## Two headline results

- **No single architecture dominates.** Verbatim: "effectiveness depends heavily on how well the memory structure aligns with the **workload bottleneck**." Graph/temporal-KG systems win dispersed cross-session reasoning (Zep leads Knowledge-Update; Cognee leads Temporal Reasoning); coarse-to-fine filtering wins long coherent dialogue; trace preservation wins stateful procedural execution. The design move is **match structure to the bottleneck**, not pick a "best" memory.
- **Localized maintenance beats global reorganization** (Observation O7). The cost driver is **maintenance scope** — how widely each write propagates — *not* whether a system is "structured." Bounded-scope updaters (LightMem 48.3 utility @ 3.67s; MemTree 63.5 @ 15.9s) sit on the efficiency frontier; whole-state reorganizers (Cognee/Zep exceed 84 utility only at 116.5s / 155.1s per query) are least efficient. This is the same mechanism [agentic-context-engineering-ace](agentic-context-engineering-ace.md) calls *context collapse*: bounded incremental deltas beat monolithic rewrites on both cost and information retention.

## Why it matters for a task agent

It turns "which memory system?" into "which module is my bottleneck?" — profile retrieval fidelity (Q), update robustness (U), and per-query cost separately rather than trusting one end-to-end score ([eval-dataset-quality](eval-dataset-quality.md)). Productized primitives map onto the modules too: Anthropic's memory tool (`memory_20250818`, **GA** — no beta header) is agentic routing (Q) over a developer-owned `/memories` store (R/S); context editing (`clear_tool_uses_20250919`, *beta*) is capacity eviction (U) over the transient register; server-side compaction (`compact_20260112`, *beta*) is extraction-summarization (S) + consolidation (U). (Mapping is this graph's construction, not the paper's; docs verified 2026-06-24.)

## Caveats (carry these — the numbers are not vendor figures)

- **All per-system scores are the authors' own re-implementations** under one harness on a shared backbone/slice — *not* the vendors' self-reported numbers, and latency is adapter/hardware-sensitive (the authors wrote the adapters). Do not compare across papers.
- **Asserted-vs-measured gap.** Mem0's own paper ([arXiv:2504.19413](https://arxiv.org/abs/2504.19413)) claims ~26% LLM-judge gain over OpenAI memory / >90% token savings; the survey measures Mem0 among the *slowest* (374.2s LongBench) and finds MemOS, not Mem0, leading LoCoMo EM. Label self-reported metrics as such.
- **Conflict of interest:** co-authors are affiliated with MemTensor, which ships MemOS (a benchmarked, favorably-rated system).
- **LLM-judge + backbone** reported as GPT-5.4-family (post-cutoff; reported as stated, not endorsed).

## References

Anchors the data-management view under [agent-memory](../topics/agent-memory.md). Corroborating critiques: *Anatomy of Agentic Memory* ([arXiv:2602.19320](https://arxiv.org/abs/2602.19320), benchmarks underscaled / metrics misaligned) and *MemConflict* ([arXiv:2605.20926](https://arxiv.org/abs/2605.20926), answer correctness diverges from retrieval/ranking) — note these share an author with the anchor paper, so they are complementary, not independent.
