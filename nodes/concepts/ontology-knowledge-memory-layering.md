---
id: ontology-knowledge-memory-layering
type: concept
tags: [ontology, knowledge-graph, agent-memory, tbox-abox, layering, neuro-symbolic, science-excellence]
summary: "ontology, knowledge graph, and agent memory are three LAYERS of one stack, not three things: ontology = schema/type layer (DL TBox), knowledge/KG = that schema populated with instance facts (ABox), memory = the process/lifecycle layer (write, consolidate, forget, retrieve, temporally invalidate) over the instances. The data structure doesn't distinguish them; the state-transition operators do."
related:
  - [[agent-memory]]
  - [[ontology-grounded-agent]]
  - [[domain-event-task-ontology]]
  - [[ontology-as-validator-shacl]]
  - [[memory-types-taxonomy]]
  - [[agent-native-memory-framework]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[prompt-time-knowledge-capture]]
  - [[memory-retrieval]]
  - [[memory-consolidation-and-forgetting]]
  - [[references-ontology-llm-agents]]
  - [[references-context-and-memory]]
status: living
created: 2026-07-13
---

# Ontology · Knowledge · Memory — the layering

"Ontology," "knowledge graph," and "agent memory" are constantly used as if they compete. Technically they don't: they are **three strata of one stack**. The single mental model that survives switching between Description-Logic papers, the W3C stack, and KG tooling is — *separate the stable type layer from the changing instance layer, then treat memory as the lifecycle over the instances.* This node is the **unifying spine** that relates the graph's ontology cluster to its memory cluster; it does not restate either (dedup boundaries at the end).

## The three strata

| Layer | Term | DL analogue | Character |
|---|---|---|---|
| **Schema / type** | **ontology** | **TBox** — terminological axioms (`C ⊑ D`, "every employee is a person"); RDFS `Class`/`subClassOf`/`domain`/`range`; OWL class/property axioms | small, stable, reasoned-over, human/offline-authored, versioned as a contract |
| **Instance / fact** | **knowledge (populated KG)** | **ABox** — assertions about individuals (`a : C`, `(a,b) : R`, "Bob is an employee"), bound to types via `rdf:type` | large, changing, queried, LLM-populated at runtime, often time-indexed |
| **Process / lifecycle** | **memory** | *(no DL analogue — it's the operators + time)* | the mutating operators applied over the instance layer |

**Term → layer map:** ontology → TBox (schema only); knowledge/KG → TBox+ABox (schema **plus** instances — the ontology is the KG's *schema component*, not a synonym for it); memory → the lifecycle over the ABox (occasionally the TBox).

## Formal grounding (verified)

- A DL knowledge base is formally the pair **KB = (T, A)** — TBox schema + ABox assertions (Baader et al., *Description Logic Handbook*, 2003/2007, Ch. 2). "Ontology ≈ TBox" by common convention.
- A **knowledge graph** = a schema level (often an ontology) **and** an instance/data level plus identity/context — the ontology is *one component* (Hogan et al., *Knowledge Graphs*, ACM CSUR 2021, arXiv:2003.02320).
- **RDFS** supplies the class/property type layer that instance triples populate via `rdf:type` — the same schema/instance split as TBox/ABox at the RDF level.
- The lifecycle layer is **provenance-plus-time modeling**: W3C **PROV-O** (Rec 2013) already carries `Entity`/`Activity`/`Agent`, `generatedAtTime`, `invalidatedAtTime`, `wasRevisionOf` — which map almost 1:1 onto memory's create/invalidate/supersede. And **bi-temporal** modeling (valid time vs transaction time) is established temporal-DB theory (Snodgrass 1999; standardized in **SQL:2011**), not a recent invention. Reuse both rather than inventing ad-hoc fields.

## What makes it "memory" and not a static KB

A store that only supports read-after-static-load is a **knowledge base**. Adding the **state-transition operators** is what makes it "memory": **write/extraction** (NL→triples, [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md)), **consolidation/promotion** (episodic→semantic, [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md)), **forgetting/decay**, **retrieval/ranking** ([memory-retrieval](memory-retrieval.md)), and **temporal invalidation** ([bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md)). This operator set maps almost exactly onto the R/S/Q/U decomposition of [agent-native-memory-framework](agent-native-memory-framework.md) (Representation / extraction=write / retrieval=read / Update=maintenance). *Honest caveat:* "knowledge that changes is what forces a memory" is a strong **heuristic, not a theorem** — a vector store with TTL (write+retrieve+forget, no invalidation/consolidation) is already sold as "agent memory." The operators are a menu; scope them to how much your knowledge actually changes.

## Two seams to label carefully

1. **"Ontology = schema only" is a convention, not a theorem.** OWL 2's structural spec bundles *Assertions* (ABox content) into the ontology *document*, and much DL usage calls the whole KB the "ontology." Present ontology≈TBox as a useful convention with this caveat, not a formal identity.
2. **The semantic/episodic axis cuts ACROSS the layers — it does not align with format.** This is the load-bearing correction to the folk equation "KG = semantic memory." Only the *TBox/schema* maps cleanly to semantic/conceptual memory; a KG's **time-stamped ABox edges** ("User_123 disputed charge_456 on 2026-06-03") are **episodic** content. A KG is a storage *format* orthogonal to cognitive *content type*: a KG can hold episodic content (bi-temporal edges), and a flat text log can hold semantic content (a distilled preferences file). Calling the whole KG "semantic memory" is a concrete design bug — you'd apply near-permanent, always-relevant decay to edges that should be recency-weighted and invalidated. Decouple **decay/retrieval policy** (choose by content type, [memory-types-taxonomy](memory-types-taxonomy.md)) from **storage format** (choose by retrieval/consistency needs).

## The "ontology = type system" analogy

Structurally **sound**: TBox ≈ class/property declarations with domain/range (types); ABox ≈ a typed heap of objects; a SHACL check ≈ a type check. But **overstated if read as giving type-system guarantees**: a type system is static, closed-world, and sound (compile-time rejection); OWL is *open-world* with non-unique names (missing data is "unknown," never a compile error, and it will *infer around* contradictions rather than flag them); and the LLM writer is probabilistic. Only **SHACL closed shapes** actually behave like a runtime type/schema check — which is why validation belongs as an explicit **write-gate** ([ontology-as-validator-shacl](ontology-as-validator-shacl.md)), using SHACL, *not* OWL entailment. (SHACL treats "not present" as a violation; OWL treats it as "not yet known" — the safe way to state the CWA/OWA contrast without over-claiming the spec.)

## Cognitive vocabulary: what's load-bearing vs decorative

The biology is inspiration, not mechanism — keep only the engineering content:

- **The four-type taxonomy (working/episodic/semantic/procedural) is a composite**, not one theory: working memory = Baddeley & Hitch 1974; declarative/procedural = Cohen & Squire; only episodic/semantic = Tulving. Useful boxes, unprincipled boundaries.
- **"Consolidation" is just LLM summarization/generalization** (dedup + abstraction). The genuine cognitive basis (Complementary Learning Systems, McClelland et al. 1995) is real, but sleep-replay/ripple specifics are decorative. Load-bearing content only: *a generalization should outlive its episodes and decay differently.* And keep raw-episode provenance — "episodic simply becomes semantic" is itself **contested** in the science (Multiple Trace Theory), so don't destructively delete episodes after consolidating.
- **"Working memory = context window" is loose** — the window is passive KV storage read via attention, with no rehearsal or executive control; enlarging it doesn't buy manipulation.
- **MemGPT's tiering is an OS analogy** (main-context=RAM / external=disk, function-call paging), not neuroscience — load-bearing as a fast/slow organizing principle, decorative in detail.
- **Generative Agents (Park et al., 2023)** — score = recency (exp decay 0.995) × importance (LLM 1–10) × relevance (cosine); reflection fires past an importance threshold. Notably it has **no KG and no episodic/semantic tables** — a flat time-stamped stream + reflections *is* two-tier memory. Proof the KG and the four-type taxonomy are **optional**.

## For a builder

- **Split the layers by cadence.** Author the **TBox offline / by humans** and freeze it as an API contract; let the online agent **populate the ABox** (its stronger capability), never invent the schema (its weakest — LLMs are far better at populating than at authoring axioms). Freeze *one* ontology as the contract for **both** the write prompt and the read prompt so writer and reader can't drift.
- **Invest evaluation on the write path.** Retrieval is a solved IR problem (hybrid dense+BM25+n-hop, reranked by RRF/MMR/cross-encoder — adopt off-the-shelf); the **write/maintenance path** (extraction, dedup, contradiction detection, invalidation) is the memory-specific, no-closed-form-correctness work where most quality bugs originate.
- **Update = soft bi-temporal invalidation, never destructive delete** (append + set `invalid_at`); reuse PROV-O for provenance. Distinguish **invalidation** (keeps the record for as-of queries) from **eviction/TTL** (reclaims space).
- **Only split into multiple stores when content types genuinely need different write/decay/retrieval rules** — apply the rename test (event log / fact table / skill library / active buffer); if renaming loses no engineering content, the split was cosmetic.
- **Push deterministic inference down into the graph engine** (path-finding, transitivity, subsumption, aggregation, dedup) and add a **read-side grounding check** — a correct KG doesn't guarantee correct answers, because LLMs misread even correct topology in linearized subgraphs (arXiv:2512.09148).

## Pitfalls

- **Collapsing the layers.** Treating "ontology," "KG," and "memory" as rival choices instead of schema/instance/process strata of one design.
- **"KG = semantic memory."** The format≠content-type bug above — the single most common technical error in this space.
- **OWL as a validator.** Open-world inference infers around missing/contradictory data instead of flagging it; use SHACL for the write-gate.
- **Importing neuroscience as spec.** Sleep-replay/consolidation timing has no mechanistic bearing; treat consolidation as scheduled summarize-and-promote with type-specific TTLs, evaluated empirically.
- **Letting the runtime agent author the schema.** Ontology drift and axiom errors — the LLM's weakest task; keep the TBox a frozen, human-owned contract.

## References

Sits under [agent-memory](../topics/agent-memory.md) as the formal third lens (TBox/ABox/lifecycle) alongside its context-window / run-state / memory distinction. **Dedup:** [ontology-grounded-agent](ontology-grounded-agent.md) owns the *cost/benefit decision* of adding structure (no cost table here); [domain-event-task-ontology](domain-event-task-ontology.md) owns *what* to model; [ontology-as-validator-shacl](ontology-as-validator-shacl.md) owns SHACL mechanics; [memory-types-taxonomy](memory-types-taxonomy.md) owns the content axis (this node only adds the cross-cutting TBox≈semantic / timestamped-ABox≈episodic correction); [agent-native-memory-framework](agent-native-memory-framework.md) owns R/S/Q/U (borrowed here as operator vocabulary, not re-derived); [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md), [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md), [memory-retrieval](memory-retrieval.md), [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md) own the individual lifecycle operators. Verified anchors: DL Handbook (Baader 2003); Hogan et al. KG survey (arXiv:2003.02320); RDFS/OWL/SHACL/PROV-O (W3C); SQL:2011 bi-temporal (Snodgrass 1999); Generative Agents (arXiv:2304.03442); CLS consolidation (McClelland et al. 1995). Fuller list in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md) and [references-context-and-memory](../references/references-context-and-memory.md).
