---
id: references-ontology-agents-2026-11
type: reference
tags: [ontology, knowledge-graph, semantic-layer, graphrag, data-agent, governance]
summary: "arXiv sources, July–November 2026, on when ontologies, knowledge graphs, and semantic layers improve agents, and when they don't; abstracts verified 2026-11-25."
related:
  - [[semantic-context-layer]]
  - [[references-ontology-llm-agents]]
  - [[ontology-grounded-agent]]
  - [[building-ontology-backed-memory]]
  - [[memory-graph-topology]]
status: snapshot
created: 2026-11-25
---

# References: Ontology and Knowledge Graphs for Agents, 2026-11

Sources for [semantic-context-layer](../concepts/semantic-context-layer.md). This continues [references-ontology-llm-agents](references-ontology-llm-agents.md), which was verified on 2026-07-03.

**Method.** I ran arXiv searches for 2026-07-01 to 2026-11-24 on ontology + agent (45 results), knowledge graph + LLM agent (47), GraphRAG (30), semantic layer (17), and knowledge graph + agent memory (103). I read 20 abstracts and kept the ones below. Every abstract was fetched 2026-11-25, and only abstracts were read. All numbers are author-reported.

## Where structure helps

| Paper | Claim |
|---|---|
| [2606.22419](https://arxiv.org/abs/2606.22419) — *KG Grounding Helps LLMs Only for Out-of-Training Knowledge* | Public-graph grounding adds ≤3.4 points; novel facts go from chance to about 100% |
| [2609.22259](https://arxiv.org/abs/2609.22259) — *Which Part of the Context Layer Does the Work?* | A four-arm ablation of a data contract: content dominates scaffolding, and the contract beats the prompt |
| [2611.12114](https://arxiv.org/abs/2611.12114) — *OGDA* | Ontology built by proposer–verifier agents; up to +10.82 points on KramaBench and DiscoveryBench |
| [2609.27257](https://arxiv.org/abs/2609.27257) — *UniDataAgent* | Enterprise deployment; 95.0% vs 72.5% for document RAG |
| [2610.37242](https://arxiv.org/abs/2610.37242) — *Process-Aware Knowledge Graphs* | OData + BPMN typed graph; task completion 10.3%→38.7% |
| [2611.06682](https://arxiv.org/abs/2611.06682) — *SecureGARD* | Executable ontology returns ready, waiting, or forbidden per call; 0% attack success reported |
| [2608.13662](https://arxiv.org/abs/2608.13662) — *Ontology-Grounded Project Memory for Coding Agents* | Supersession queries 0.98–1.00 vs 6–27% for vector memory; NeSy 2026 industry track; uses a proprietary engine |
| [2609.15779](https://arxiv.org/abs/2609.15779) — *EvoOntology* | Ontology served as an MCP server; edits accepted after a paired eval; no headline number in the abstract |
| [2608.22974](https://arxiv.org/abs/2608.22974) — *OaK* | Task-built ontology on TravelPlanner, CRMArenaPro, ToolQA; no number in the abstract |
| [2610.17719](https://arxiv.org/abs/2610.17719) — *Keep Your Receipts* | Per-artifact evidence receipts for cleanup after retraction; NeurIPS 2026 workshop |

## Where it doesn't

| Paper | Claim |
|---|---|
| [2608.12888](https://arxiv.org/abs/2608.12888) — *ReFind* | Keyword search over raw chat logs 58.2 vs HippoRAG 2 53.2 |
| [2610.41172](https://arxiv.org/abs/2610.41172) — *Context as Infrastructure* | Structural artifacts gave no detectable accuracy gain under a BM25/grep harness; RAGFlow authors |
| [2610.37809](https://arxiv.org/abs/2610.37809) — *What Does an Ontology Catch?* | A curated ontology as checker is barely better than random flags on real answers; under review |
| [2610.20959](https://arxiv.org/abs/2610.20959) — *Same Context, Different Agents* | 1,514 tasks, seven models; a semantic layer can stop investigating agents from looking |
| [2610.08082](https://arxiv.org/abs/2610.08082) — *POLAR* | Reversibility ontology improves 8 of 18 cells; AACL-IJCNLP 2026 Findings |
| [2506.06331](https://arxiv.org/abs/2506.06331) — *Unbiased Evaluation Framework for GraphRAG* | Gains much more moderate than reported (v2, 2026-08-13) |

## Read but not used

- [2611.09282](https://arxiv.org/abs/2611.09282) — ontology-defined conversation strategy for job-interview practice, with fine-tuning. Relevant to conversation design but has no comparative number in the abstract.
- [2610.23317](https://arxiv.org/abs/2610.23317) AgentOnto, [2611.23629](https://arxiv.org/abs/2611.23629) Value Semantics Layer, and [2611.27350](https://arxiv.org/abs/2611.27350) GRACE — the abstracts give no comparison or are narrower than the node needs.

Many other titles in the search results were domain applications (robots, biomedicine, cyber threat intelligence) and were not read.
