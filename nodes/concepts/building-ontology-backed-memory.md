---
id: building-ontology-backed-memory
type: concept
tags: [agent-memory, ontology, knowledge-graph, write-pipeline, build-sequence, tbox-abox, entity-resolution, engineering, science-excellence]
summary: "the buildable HOW of ontology-backed agent memory — an ordered sequence (competency questions → frozen TBox → one schema artifact → single hybrid store → write pipeline → read pipeline → eval) with explicit decision forks, giving the extract/validate/resolve/invalidate/upsert/provenance WRITE PATH the most depth because that is where durable quality bugs are minted."
related:
  - [[agent-memory]]
  - [[ontology-grounded-agent]]
  - [[domain-event-task-ontology]]
  - [[ontology-as-validator-shacl]]
  - [[ontology-knowledge-memory-layering]]
  - [[prompt-time-knowledge-capture]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[memory-retrieval]]
  - [[agent-native-memory-framework]]
  - [[memory-graph-topology]]
  - [[references-ontology-llm-agents]]
status: living
created: 2026-07-14
---

# Building Ontology-Backed Agent Memory

This is the **assembly manual**, not the parts catalog. The conceptual relationship (ontology=TBox / knowledge=ABox / memory=lifecycle) is settled in [ontology-knowledge-memory-layering](ontology-knowledge-memory-layering.md); *whether* to add structure at all is [ontology-grounded-agent](ontology-grounded-agent.md); *what* domain to model is [domain-event-task-ontology](domain-event-task-ontology.md). This node assumes those are answered "yes / here's the domain" and gives the ordered build.

**Throughline:** building this is an *assembly* problem, not a modeling problem. Author one tiny **human-frozen TBox**, express it **once** as a single artifact that is simultaneously the LLM write-contract, the ingest validator, and the read-side prompt doc, default to a **single hybrid store**, and then treat the **write path as the quality-critical surface** — nearly every durable bug (duplicate entities, silently-dropped facts, stale contradictions, orphaned edges) is minted on write and is expensive to reverse downstream. Ranking and heavyweight reasoning are cheaper to change later; keep them off the hot path.

## Build sequence

0. **Gate first (defer to [ontology-grounded-agent](ontology-grounded-agent.md)).** Build the graph only if a competency question needs multi-hop chaining, in-world fact revision/temporal reasoning, or relational/audit provenance. Deciding number: Mem0's *graph* variant bought only **~2% accuracy** over its own non-graph base at extra maintenance cost — mostly-single-hop workloads don't clear the bar. *(Don't sell Mem0's ~91% latency / >90% token savings as "the graph's benefit" — those are vs a full-context baseline, not vs its own vector store.)*
1. **Write 15–30 competency questions and keep them as executable read-side tests** (each CQ → a query that must return non-empty on seed data). Every entity/edge type must be justified by ≥1 CQ. *[CQs are established (Grüninger & Fox / Uschold & King, 1995); the "executable-on-seed" framing is a modern add. Don't over-literally delete types needed for referential integrity or future joins.]*
2. **Author the TBox small and frozen.** Seed from a proven tiny upper model (POLE person/object/location/event; or KNOW social+spacetime) and specialize **only** the subtypes CQs demand. Model relations as **first-class typed edge objects** (closed predicate enum + explicit domain/range), not free-form string triples. Give each closed enum an `other` escape hatch that *logs* uses and feeds a promotion loop (needs a real owner/metric or it's a dumping ground). *LLMs are weak at authoring axioms, strong at populating — keep the schema human-owned.*
3. **Attach standard vocabularies by ALIGNMENT, not import.** Ship a sidecar `local_type → CURIE` map via `rdfs:seeAlso` (not `owl:equivalentClass` — that's an OWL axiom you'll never reason over). Adopt PROV-O's Entity/Activity/Agent spine for provenance and OWL-Time leaf terms (Instant/Interval), but compute Allen relations in-query, don't wire all 13 at runtime. *Importing full ontologies (schema.org ≈823 types, OWL2-DL restrictions) only adds reasoning obligations your extractor/queries never use — do it only if you publish Linked Data / need third-party entailment.*
4. **Express the frozen TBox as ONE artifact; derive everything from it.** App/Python stack: a Pydantic v2 model set → `model_json_schema()` is the LLM write-contract, the *same* models validate on ingest, and `Field(description=...)` renders into the read prompt. RDF-native stack: SHACL is canonical and you *generate* the JSON-Schema projection. Either way it's a real generator step (no source cleanly round-trips to both expressive SHACL and provider-safe JSON Schema) — never hand-maintain two copies. `semver` the TBox; stamp `schema_version` on every record.
5. **Choose storage (see forks); default to a single hybrid store.** The vector index is always a retrieval *component* with a foreign key back to canonical facts, **never the system of record**.
6. **Build the write pipeline** — the depth stage below.
7. **Build the read pipeline as an assembly** (defer ranking depth to [memory-retrieval](memory-retrieval.md)): router → hybrid dense+BM25 → RRF (k≈60, fuse *ranks* not scores; Cormack et al. SIGIR 2009) → cross-encoder rerank (top ~50–100) → MMR/threshold dedup → optional **bounded** seed-then-expand traversal → deterministic subgraph linearization + citation-forcing (LLMs misread even correct topology, arXiv:2512.09148). Enforce **read-only at the query-execution boundary** (least-privilege role + AST verb-reject + timeout/row-cap; never prompt-only — cf. OWASP LLM01). *text-to-SPARQL is materially harder/lower-accuracy than text-to-Cypher/SQL — budget more repair for the RDF case.*
8. **Keep reasoning off the hot path.** No runtime OWL/DL reasoner; if you need entailment/dedup, run it as an **offline batch** that materializes results back, with a re-run policy so the materialized graph doesn't drift stale. *(Biomedical/regulatory subsumption may justify a real reasoner.)*
9. **Stand up eval & ops** (feeds [agent-native-memory-framework](agent-native-memory-framework.md) / [memory-retrieval](memory-retrieval.md)): per-type extraction P/R/F1 (macro **and** micro); **false-merge rate as a first-class metric** (B-cubed/CEAF, not MUC); contradiction/as-of correctness against *your chosen* update semantics; LongMemEval + LoCoMo as external regression guards; and a **"validated ≠ true" factual audit** over conformant triples. Migrate the TBox with expand-contract (dual-write / backfill / cut-over).

## Decision forks

| Fork | Default | Deciding factor |
|---|---|---|
| **KG at all?** | no unless a CQ demands it | multi-hop / fact-revision / audit-provenance (owned by [ontology-grounded-agent](ontology-grounded-agent.md)) |
| **Reuse vs build schema** | align-not-import (sidecar CURIE map) | only import+conform if publishing Linked Data / needing third-party entailment |
| **Canonical artifact** | Pydantic (app stack) / SHACL (RDF stack) | your storage substrate; generate the other projection |
| **Store type** | Postgres + pgvector(HNSW) + tsvector | LPG (Neo4j) if multi-hop is core; RDF triple store **only** when the ontology is a shared/exchanged product; JSONB doc store for the raw episodic log |
| **Single vs multi store** | single hybrid | split only on a measured **p95 SLO breach**, not raw counts; if multi: one system-of-record + CDC/outbox, single writer, **never dual-write from app code** |
| **Validation strictness** | soft-validate + quarantine/dead-letter | hard write-time reject only for integrity-critical invariants (hard reject silently drops useful-but-noisy LLM facts) |
| **Bi-temporal vs single-timeline** | single "current + last-updated" stamp | go bi-temporal only if you revise/supersede facts or need as-of/audit reads (roughly doubles temporal bookkeeping) — owned by [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md) |
| **Local vs global maintenance** | local edge invalidation (bounded blast radius) | reserve community re-clustering / full re-embedding for real global-sensemaking queries, run async — Zhou et al.'s cost finding: global reorganizers hit the 116–155 s/query regime vs a ~3.7 s local frontier |

## The write path (where bugs are minted)

Eight stages. Stage order matters — **content-derived IDs (6) only work after entity resolution (3) canonicalizes.**

- **0 · Chunk + source pointer.** Chunk on conversational/semantic boundaries, not fixed token windows; stamp every chunk with `conversation_id`, `turn_id`, char span, speaker, timestamp — this pointer is load-bearing for Stage 7 and human review. Merge low-information turns; budget a rolling window for anaphora.
- **1 · Typed extraction.** Inject the frozen TBox as a **hard constraint** (closed entity + predicate lists with domain/range; required JSON per triple incl. `source_char_span`, `extraction_confidence`); few-shot > zero-shot; instruct **abstain-when-unsure**. *WHEN to extract is [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md).* Caveats: constrained decoding guarantees **shape, not semantics**; a non-enum predicate slot still lets the model emit out-of-set predicates; `extraction_confidence` is **ordinal, not a probability**; keep an **unmapped-assertion log** (a closed set silently drops inexpressible facts).
- **2 · Validation gate.** Hard **closed-world shape check** per candidate triple (SHACL `sh:closed=true`, or a Pydantic mirror); route rejects to a dead-letter queue with the report. Explicitly **not OWL entailment** (open-world: an unexpected type is an *inference*, not an error). *Mechanics owned by [ontology-as-validator-shacl](ontology-as-validator-shacl.md).* Footgun: `sh:closed=true` needs `rdf:type` in `sh:ignoredProperties` or every node fails; the gate catches structural, never factual, errors.
- **3 · Entity resolution / dedup.** Type-restricted blocking kNN (embedding over name+salient attrs, same type only), then a **three-zone band**: ≥HIGH auto-alias onto canonical / ≤LOW distinct-new / middle → **human-review** (create provisionally, link low-trust `candidate_same_as`, do **not** collapse). Prefer **reversible aliasing over destructive merge** — a wrong merge fuses two entities' edges/provenance irreversibly (Fellegi–Sunter lineage). **Critical nuance:** "bias toward under-merging" is a *policy*, not universally safe — under-merge causes **silent recall loss** ("the agent forgot"), harder to detect than a reversible over-merge; the correct bias is workload-dependent. Thresholds are corpus/embedding-specific — tune on labeled pairs, never hardcode.
- **4 · Contradiction detection.** For each surviving triple fetch priors on same `(subject, predicate)` (+object for functional predicates); classify duplicate / compatible-multivalued / conflicting. **Rules-first** over TBox-declared functional/cardinality predicates (cheap, deterministic); LLM adjudicator only for residual semantic conflicts, forced to cite both triple IDs. Blind spot: same-`(subject,predicate)` keying misses **cross-predicate** contradictions (`isAlive=true` vs `diedOn=<date>`) — those need explicit disjointness rules. Detection quality is capped by how completely functionality/cardinality is declared.
- **5 · Invalidate, never delete.** Two clocks per edge — valid-time (world truth) and transaction-time (when the system learned/retracted). Superseding closes the old edge and writes a new one; the old row physically remains, making Stage 3/4 mistakes recoverable. *Two-clock model owned by [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md).* **Enforce the "currently valid" filter in a query LAYER**, not by developer discipline — a forgotten temporal filter silently returns retracted facts. And "never delete" collides with **GDPR erasure / PII retention** — build a real hard-delete or crypto-shred escape hatch.
- **6 · Idempotent commit (content-derived IDs).** Node ID = `hash(entity_type + normalized canonical key)`; edge ID = `hash(subject_id, predicate, object_id, + valid-time discriminator)`; write via upsert (Cypher `MERGE` / SQL `ON CONFLICT DO UPDATE`) so retries/replays converge. **Hash the stable surrogate/canonical key, NOT the display name** — a renamed/corrected field would change the hash and mint a new node that orphans all inbound edges. Changing the hash recipe re-keys the whole store.
- **7 · Provenance + trust.** PROV-O per fact (`wasDerivedFrom` → Stage-0 chunk, `generatedAtTime`, an Activity node for model-id+prompt-version+run-id). Add a **non-PROV trust layer** because the write path reads an *untrusted* channel: a `source_trust` tier (user-stated vs agent-inferred vs third-party) + the ordinal confidence, so retrieval/conflict-resolution can prefer high-trust facts. Model provenance as its own nodes (RDF-star / named graphs over classic reification) so it survives invalidation; start with flat provenance columns, reify only when audit/interop demands it.

## Pitfalls

- **Forgotten temporal filter** on a read silently returns retracted facts — enforce "currently valid" in a query layer.
- **Hashing the display name** for content IDs — orphans edges on any rename; hash Stage-3's canonical key.
- **`sh:closed=true` without `rdf:type` in `sh:ignoredProperties`** — every node fails; closed shapes also compose poorly with inheritance.
- **Treating constrained decoding as correctness** — it guarantees shape only.
- **"Under-merge is safe"** — trades reversible over-merges for silent recall loss; bias is workload-dependent.
- **Global re-clustering / full re-embedding on the write path** — the 116–155 s/query regime; keep maintenance local and async.
- **Dual-writing to two stores from app code** — sync drift is the dominant multi-store failure; use one system-of-record + CDC/outbox.
- **"Additive TBox change = safe minor"** — a new enum member breaks exhaustive readers, and under OWL a new domain/range/disjointness axiom can retroactively make conformant data inconsistent; classify migrations by validation/entailment impact.
- **SHACL conformance ≠ truth** — a schema-clean graph of confidently-wrong facts passes every gate; pair conformance with an independent factual audit.
- **Read-router misroute** — a multi-hop/provenance question sent down the vector path fails silently with a plausible-incomplete answer; for audit memory, run-both-and-fuse beats "default to vector when unsure."

## References

Sits under [agent-memory](../topics/agent-memory.md) as the engineering complement to [ontology-knowledge-memory-layering](ontology-knowledge-memory-layering.md). Assembly-only — the parts live in their own nodes: [ontology-grounded-agent](ontology-grounded-agent.md) (the whether/where decision), [domain-event-task-ontology](domain-event-task-ontology.md) (what to model), [ontology-as-validator-shacl](ontology-as-validator-shacl.md) (SHACL shape syntax), [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md) (write timing / P2T), [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md) (two-clock model), [memory-retrieval](memory-retrieval.md) (ranking depth), [agent-native-memory-framework](agent-native-memory-framework.md) (R/S/Q/U + the maintenance-cost finding), [memory-graph-topology](memory-graph-topology.md) (flat/tree/graph structure choice). Verified anchors: competency questions (Grüninger & Fox 1995); PROV-O / OWL-Time / SHACL (W3C); RRF (Cormack et al., SIGIR 2009); P2T (arXiv:2402.00414); Zep/Graphiti (arXiv:2501.13956); Zhou et al. cost finding (arXiv:2606.24775); LongMemEval (arXiv:2410.10813); LoCoMo (arXiv:2402.17753). Fuller list in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
