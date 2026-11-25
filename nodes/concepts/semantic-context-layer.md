---
id: semantic-context-layer
type: concept
tags: [ontology, knowledge-graph, semantic-layer, context-engineering, data-agent, governance, tool-use]
summary: "When an ontology, knowledge graph, or semantic layer actually makes an agent smarter: 2026 evidence says private semantics served as a queryable tool win, and structure for its own sake often doesn't."
related:
  - [[ontology-grounded-agent]]
  - [[ontology-knowledge-memory-layering]]
  - [[building-ontology-backed-memory]]
  - [[ontology-as-validator-shacl]]
  - [[domain-event-task-ontology]]
  - [[memory-graph-topology]]
  - [[text-to-sql-retrieval]]
  - [[domain-knowledge-injection]]
  - [[just-in-time-context]]
  - [[action-authority]]
  - [[confirm-before-act]]
  - [[prompt-injection-and-isolation]]
  - [[tool-schema-design]]
  - [[memory-consolidation-and-forgetting]]
  - [[manus-context-engineering]]
  - [[references-ontology-agents-2026-11]]
  - [[references-ontology-llm-agents]]
  - [[context-engineering]]
  - [[task-agent-pattern]]
status: living
created: 2026-11-25
---

# Semantic Context Layer

A **semantic context layer** is curated domain meaning that the agent can look up while it works: what each entity, metric, or action means, how they relate, and which rules apply. It can be an ontology, a knowledge graph, a semantic layer over a warehouse, or a YAML data contract. The format matters less than two choices: **what goes in it** and **how the agent reaches it**.

[ontology-grounded-agent](ontology-grounded-agent.md) decides *whether* formal structure earns its cost. This node collects the 2026 evidence on *when it makes the agent measurably better*, and in which of three jobs: grounding answers, guiding actions, or checking outputs.

## Where it helps

All results are author-reported from arXiv abstracts, read 2026-11-25.

| Job | Finding | Source |
|---|---|---|
| **Supply facts the model lacks** | Knowledge-graph grounding added nothing on medical QA over a public graph (all changes ≤3.4 points), but lifted accuracy on novel facts from chance to about 100%. The gain exists only when the decisive fact is outside the model's training data. | [2606.22419](https://arxiv.org/abs/2606.22419) |
| **Define business semantics** | A YAML data contract raised hard-task text-to-SQL accuracy from 13.9→55.1%, 22.6→56.6%, 22.9→68.4%, and 37.0→77.4% across four models. The content did the work; retrieval scaffolding alone added 0–15 points. The contract beat pasting the same knowledge into the prompt on every model. | [2609.22259](https://arxiv.org/abs/2609.22259) |
| **Map a large data lake** | A compact, verified ontology of the lake beat the strongest baselines by up to 10.82 points, because the agent stopped exhausting its context exploring raw tables. | [2611.12114](https://arxiv.org/abs/2611.12114) |
| **Enterprise reporting** | Ontology grounding reached 95.0% strict accuracy against 72.5% for document RAG on real business questions. | [2609.27257](https://arxiv.org/abs/2609.27257) (deployment self-report) |
| **Call APIs in the right order** | A typed graph of API metadata and business-process steps raised multi-step task completion from 10.3% to 38.7%. Full typed context cut invalid calls to 3 of 101 runs. Without a process layer it gave no improvement. | [2610.37242](https://arxiv.org/abs/2610.37242) |
| **Block unsafe actions** | An executable ontology of action states, combined with task state, returned ready, waiting, or forbidden for each tool call. It reported 0% attack success on AgentDojo, ASB, and AgentDyn. | [2611.06682](https://arxiv.org/abs/2611.06682) |
| **Track decisions over time** | Project memory with supersession links answered "what replaced X" and completeness questions at 0.98–1.00, against 6–27% for top-k vector memory, at similar token cost. | [2608.13662](https://arxiv.org/abs/2608.13662) |

## Where it doesn't

| Finding | Source |
|---|---|
| **Search over raw history rivals built structure.** Agent-controlled keyword search over unmodified chat logs scored 58.2 mean accuracy, above the best graph memory (HippoRAG 2, 53.2). | [2608.12888](https://arxiv.org/abs/2608.12888) |
| **Compiled graphs don't add accuracy under a good search loop.** With BM25/grep, structural artifacts gave no detectable accuracy gain on FRAMES. Their value showed up in token cost, governance, and onboarding instead. | [2610.41172](https://arxiv.org/abs/2610.41172) |
| **An ontology checker can be worse than none.** On UniProt, the curated ontology flagged more correct answers than a data-derived one. Its flags on real agent answers were "only marginally more precise than random." | [2610.37809](https://arxiv.org/abs/2610.37809) |
| **A semantic layer can stop a good agent from looking.** For agents that already investigate, the semantic layer reduced inspection and orchestration cost them 5 points. It helped only the agents that answered too early. | [2610.20959](https://arxiv.org/abs/2610.20959) |
| **A reversibility guardrail trades away task success.** Only 8 of 18 model–domain cells improved; stronger agents often regressed. | [2610.08082](https://arxiv.org/abs/2610.08082) |
| **Reported GraphRAG gains shrink under fair evaluation.** With unbiased questions and grading, gains were "much more moderate than reported." | [2506.06331](https://arxiv.org/abs/2506.06331) |

## How vendors ship it

Product docs, fetched 2026-11-25. These describe mechanisms, not measured results.

| Product | What the layer holds | How the agent reaches it |
|---|---|---|
| [Palantir Foundry Ontology](https://www.palantir.com/docs/foundry/ontology/overview/) | "Semantic elements (objects, properties, links) and kinetic elements (actions, functions, dynamic security)" | [Chatbot Studio tools](https://www.palantir.com/docs/foundry/chatbot-studio/tools/): an object-query tool scoped to configured types, an action tool that "execute[s] an ontology edit," function tools, and a request-clarification tool. Actions can "run automatically or … after confirmation from the user." |
| [Snowflake semantic views](https://docs.snowflake.com/en/user-guide/views-semantic/overview) | Logical tables, relationships, facts, dimensions, metrics; the [YAML spec](https://docs.snowflake.com/en/user-guide/views-semantic/semantic-view-yaml-spec) adds synonyms, sample values, and verified question–SQL pairs | Added "as a tool on an agent"; the agent "reads the information captured in the semantic view definition and generates the SQL." With `is_enum`, "the model only chooses from those values when filtering." |
| [dbt MCP server](https://github.com/dbt-labs/dbt-mcp) | Metrics, dimensions, entities, saved queries | MCP tools: `list_metrics`, `get_dimensions`, `get_dimension_values`, `query_metrics`, `get_metrics_compiled_sql`. The remote server is read-only. |
| [Graphiti](https://help.getzep.com/graphiti/getting-started/overview) (Zep) | A temporal knowledge graph built from episodes, with custom entity types | Hybrid search (vector, BM25, graph traversal) "with no LLM-in-the-loop reranking"; conflicts resolved by "temporal edge invalidation" |
| [Microsoft GraphRAG](https://microsoft.github.io/graphrag/) | Entities, relationships, claims, and community summaries extracted from text | Global, local, DRIFT, and basic search modes. The docs warn that out-of-the-box use "may not yield the best possible results." |

Three shared design choices line up with the research above:

- **The layer is a tool, not a prompt.** Every product exposes it as callable tools or a queryable object.
- **Actions sit next to meaning.** Palantir puts write actions in the ontology itself, with an optional confirmation step, which is the action-gating job in the first table.
- **Valid values are first-class.** Snowflake's enumerated sample values and dbt's `get_dimension_values` stop the model inventing filter values, the same failure the process-graph paper fixed with code lists.

## The pattern

The graph's synthesis from both tables:

1. **Put private meaning in it, not public facts.** Metric definitions, business rules, process order, valid codes, and who-decided-what are what the model cannot know. Public facts it already has.
2. **Serve it as a tool, not a prompt block.** The contract beat the same text in the prompt because each rule was "one lookup away." Several systems expose the layer through an MCP server ([2609.15779](https://arxiv.org/abs/2609.15779), [2608.13662](https://arxiv.org/abs/2608.13662)). This is [just-in-time-context](just-in-time-context.md) for semantics.
3. **Write content before scaffolding.** Definitions first, retrieval plumbing second, and precomputed views only where the agent demonstrably fails to derive the answer.
4. **Use the ontology to gate actions, not just answers.** Typed actions, preconditions, and valid values stop invented codes and out-of-order calls; that is where structure is cheap to check. See [action-authority](action-authority.md) and [ontology-as-validator-shacl](ontology-as-validator-shacl.md).
5. **Model supersession explicitly.** "What is the current rule" is the question vector search gets wrong.
6. **Match it to how your agent fails.** If it answers without looking, a semantic layer helps. If it already explores, measure before adding one.

## Keeping it correct

- **Accept edits only after a paired eval.** EvoOntology and SecureGARD both let an LLM propose ontology changes and accept one only if a held-out evaluation improves ([2609.15779](https://arxiv.org/abs/2609.15779), [2611.06682](https://arxiv.org/abs/2611.06682)). This is the same gate as [skill-lifecycle-and-drift](skill-lifecycle-and-drift.md).
- **Verify proposals against the data.** OGDA's verifier checks each proposed concept against the underlying tables before it enters the ontology ([2611.12114](https://arxiv.org/abs/2611.12114)).
- **Keep provenance per claim.** When a source is retracted, deleting only directly extracted facts left 28.0% of queries contaminated. Recording supporting evidence per artifact, one receipt per sentence, cut contamination to under 1% ([2610.17719](https://arxiv.org/abs/2610.17719)).
- **Don't rebuild to repair.** Two builds of the same 300-document corpus differed in 29,475 artifacts, five times what removing the retracted documents changed ([2610.17719](https://arxiv.org/abs/2610.17719)).

## Pitfalls

- **Building a graph because it looks smart.** Run a raw-search baseline first.
- **Trusting a curated schema as a judge.** It can contradict its own data. Measure false alarms, not just caught errors.
- **Burying definitions in the system prompt.** They get lost; a lookup tool gets them used.
- **Letting the layer drift.** A stale definition is confidently wrong. Tie updates to schema and policy changes.

## References

Sources in [references-ontology-agents-2026-11](../references/references-ontology-agents-2026-11.md). Manus's data agent is a production example of the same idea, a "semantic map" of metric definitions, in [manus-context-engineering](../projects/manus-context-engineering.md).
