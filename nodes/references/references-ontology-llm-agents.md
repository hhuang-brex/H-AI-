---
id: references-ontology-llm-agents
type: reference
tags: [ontology, knowledge-graph, neuro-symbolic, agents, reading-list, science-excellence]
summary: "verified primary sources for the ontology-grounded-agent cluster — KG-RAG, LLM ontology engineering, autoformalization+solvers, temporal-KG memory, SHACL/OWL, MCP/A2A."
related:
  - [[ontology-grounded-agent]]
  - [[domain-event-task-ontology]]
  - [[user-intent-to-task-grounding]]
  - [[llm-as-autoformalizer-plus-solver]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[ontology-as-validator-shacl]]
status: living
created: 2026-07-03
---

# References — Ontology & LLM Agents

Primary sources for the [ontology-grounded-agent](../concepts/ontology-grounded-agent.md) cluster. Verified during a 25-agent adversarial fan-out on **2026-07-03** (each claim independently refuted-or-confirmed against the primary source; 2024–2026 work is beyond the training cutoff, so all confirmation is by live fetch). Tags: **[supported]** = confirmed against primary source; **[self-report]** = vendor/author's own numbers, not independently reproduced; **[contested]** = genuine disagreement.

## Ontology of the user's world (assistant understanding of events/tasks/activities)

The most on-point line for "an ontology so an agent understands the user's events/tasks/activities." (KNOW abstract + PROV-O page fetched directly 2026-07-03; the rest confirmed — title/ID/authors/date — against the arXiv search listing, not each abstract.)

- **KNOW: A Real-World Ontology for Knowledge Capture with LLMs** — Arto Bendiken, arXiv:2405.19877 (2024-05). **[supported]** Bills itself as the *first ontology designed to capture everyday knowledge to augment LLMs* for personal AI assistants; scope = human universals **spacetime (places, events) + social (people, groups, organizations)**; open (CC0), client libs in 12 languages.
- **PROV-O (The PROV Ontology)** — W3C **Recommendation 2013-04-30**. **[supported]** Models `Agent` / `Activity` / `Entity` with `used`, `wasGeneratedBy`, `wasAssociatedWith`, `startedAtTime`/`endedAtTime` — the canonical vocabulary for "who did what activity to what, and when." Pair with **OWL-Time** for temporal reasoning.
- **Prompt-Time Symbolic Knowledge Capture with LLMs** — Çöplü et al., arXiv:2402.00414 (2024-02); and the **Ontology-Driven** follow-up, arXiv:2405.14012 (2024-05). **[supported]** Extract personal facts/events from the user's prompts into an ontology/KG so a personal assistant remembers and understands the user.
- **OntoBOT** — Martorana, Urgese, Tiddi, Schlobach, arXiv:2509.22434 (2025-09). **[supported]** Ontology unifying **tasks, actions, environments, capabilities** for context-aware reasoning + task-oriented execution by an assistive agent.
- **Personal-KG-as-memory (LLM era, mostly proposals/self-reports):** POLAR (arXiv:2605.26256, multimodal semantic+episodic KG for embodied agents); Personalized Graph-Empowered LLM (arXiv:2602.21862, personal KG over lifelogs to recall life events); REMI (arXiv:2509.06269, personal *causal* KG of life events/habits); RAG+KG personalization (arXiv:2505.09945, KG of calendar/contacts/location). **[supported as existing works; treat their metrics as self-reported / directional]**

## Understanding user activities → connecting to the asked task

The connect-the-user's-context-to-the-task line, grounding [user-intent-to-task-grounding](../concepts/user-intent-to-task-grounding.md). Confirmed via a 31-agent discovery+verification fan-out (2026-07-03); each paper below was independently confirmed to exist with correct ID/authors/year — venue corrections noted. **[supported]** unless flagged.

- **ContextAgent** — arXiv:2505.14668 (NeurIPS 2025). Context-aware proactive agent: sense open-world user context → infer intent → decide when to act → ground into a service/tool call. The closest single work to "understand what the user is doing → do the right task."
- **Ask-before-Plan** — arXiv:2406.12639 (EMNLP 2024 Findings). Proactive planning that *clarifies* an under-specified request against context before executing (Clarification→Execution→Planning).
- **Training Proactive and Personalized LLM Agents** — arXiv:2511.02208. Jointly optimizes task success + proactivity + personalization.
- **Satori** — arXiv:2410.16668. Explicit BDI user-state + environment modeling to infer the relevant task/step (proactive AR assistant).
- **FnCTOD** — arXiv:2402.10466 (ACL 2024). Zero-shot dialogue-state tracking *as LLM function calling*: utterance → function/slot schema (the request-side autoformalizer).
- **Intent Detection in the Age of LLMs** — arXiv:2410.01627 (EMNLP 2024 Industry). Intent detection + out-of-scope rejection with uncertainty-based routing.
- **Utterance-to-API semantic parsing** — arXiv:2305.15338 (**cite as arXiv preprint**; EMNLP Findings unconfirmed). Constrained decoding + retrieval for schema-valid API calls.
- **InstructTODS** — arXiv:2310.08885 (**cite as arXiv preprint, NOT GenBench@EMNLP2023**). Zero-shot proxy-belief-state translation from dialogue to task execution.

## Memory → plan (turning understood context into the task's steps)

- **Reflexion** — Shinn et al., arXiv:2303.11366 (NeurIPS 2023). Verbal RL; episodic reflection memory revises plans.
- **Generative Agents** — Park et al., arXiv:2304.03442 (UIST 2023). Memory stream → retrieval → reflection → planning.
- **ExpeL** — arXiv:2308.10144 (AAAI 2024). Extract NL insights into memory, recall at inference.
- **MemGPT** — arXiv:2310.08560. OS-style tiered virtual context for long-term/multi-session memory.

## Benchmarks

- **LongMemEval** — arXiv:2410.10813 (ICLR 2025). Long-term interactive memory: extraction / multi-session / temporal / knowledge-update / abstention.
- **LoCoMo** — arXiv:2402.17753 (**ACL 2024 venue unconfirmed on arXiv**). Very long-term conversation memory (~35 sessions).
- **MultiWOZ** — arXiv:1810.00278 (EMNLP 2018) and **MultiWOZ 2.2** — arXiv:2007.12720 (NLP4ConvAI 2020). The canonical belief-state + task-success paradigm the connect-to-task work is measured against.

> **Coverage caveat.** This fan-out hard-verified the top candidates per facet. Many further leads (SGD arXiv:1909.05855, Toolformer, Gorilla, ToolLLM, τ-bench, LaMP, OWL-Time, ProactiveBench, PrefEval, and others) were surfaced but **not** run through verification — treat them as leads, not confirmed citations, until checked.

## KG / ontology grounding (empirical)

- **From Local to Global: A Graph RAG Approach** — Edge et al. (Microsoft), arXiv:2404.16130 (v2 2025-02). **[supported / self-report]** GraphRAG wins *global query-focused summarization* (GPT-4-judged comprehensiveness 72–83%); vector RAG wins directness; **hallucination/accuracy was not measured** — do not cite as a hallucination cure.
- **Han et al., "RAG vs GraphRAG: A Systematic Evaluation"** — arXiv:2502.11371. **[supported]** No consistent winner: plain RAG wins single-hop (F1 64.78 vs 63.01), GraphRAG wins multi-hop by ~3 F1, KG-triplet-only collapses (F1 25.02; only 65.8% of answer entities in the graph), graph build 50–100× index cost, **hybrid best**.
- **Think-on-Graph** — Sun et al., ICLR 2024, arXiv:2307.07697. **[supported]** Traversal over *curated* KGs: CWQ 67.6 vs CoT 38.8; weaker single-hop. **HippoRAG** — arXiv:2405.14831 **[supported]**: +~21 recall on 2WikiMultiHop but underperforms ColBERTv2 on HotpotQA.
- Li et al., arXiv:2512.09148 **[supported]**: given *correct* subgraphs, LLMs still misread topology — KG grounding ≠ no hallucination.
- Pan et al. roadmap (arXiv:2306.08302), Peng et al. GraphRAG survey (arXiv:2408.08921) — **taxonomies/surveys, not evidence** (often miscited).

## LLM ontology engineering (empirical)

- **LLMs4OL** — Babaei Giglou, D'Souza, Auer, ISWC 2023, arXiv:2307.16648. **[supported]** Sharp task gradient: term typing easy (WordNet MAP@1 91.7%), biomedical 16–38%, non-taxonomic relations peak F1 49.5%; **fine-tuning beats scale** (8-shot Flan-T5 > models 1000× larger).
- **OntoAxiom** — arXiv:2512.05594. **[supported]** 12 modern LLMs; **axiom identification effectively unsolved** (overall F1 ~0.126; domain/range ~0.03).
- **LLMs4OM** — ESWC 2024, arXiv:2404.10317. **[supported]** Retrieve-then-verify matching beats OAEI leaders on general tracks, collapses on Bio-ML (25.64 vs 78.50).

## Neuro-symbolic (LLM + sound solver)

- **Logic-LM** — Pan et al., EMNLP 2023, arXiv:2305.12295. **[supported]** +39.2%/+18.4% over standard/CoT via translate→solver→repair.
- **LINC** — Olausson et al., EMNLP 2023, arXiv:2310.15164. **[supported]** 15.5B + FOL prover beats GPT-4 CoT by 10% absolute.
- **PlanBench / o1** — arXiv:2409.13373. **[supported]** o1-preview 97.8% standard Blocksworld → 37.3% obfuscated; **Fast Downward 100% @ ~0.265s/instance** with guarantees vs o1 ~$42/100.
- **[contested]** Autoformalization ceiling: Thatikonda (arXiv:2409.16461) / Ryu (arXiv:2410.08047) treat NL→formal translation error as the dominant failure; Brunello et al. (AAAI 2026, arXiv:2511.11816) argue prior negatives were artifacts and modern LLMs translate well. The single most decision-relevant open disagreement.

## Temporal-KG memory

- **Zep: A Temporal Knowledge Graph Architecture for Agent Memory** — Rasmussen et al., arXiv:2501.13956 (2025-01). **[supported]** Bi-temporal (valid + transaction time), invalidate-not-delete, as-of-T queries; schema-constrained extraction (Pydantic entity/edge types) with **soft** enforcement. Headline benchmark numbers (94.8% DMR; up to 18.5% LongMemEval; ~90% latency) are **[self-report]**.
- **Are We Ready For An Agent-Native Memory System?** — Zhou et al., arXiv:2606.24775 (already the [agent-native-memory-framework](../concepts/agent-native-memory-framework.md) node). **[supported]** Structural-topological memory leads Knowledge-Update/Temporal but is least cost-efficient.

## Validation, capability modeling, eval

- **SHACL** — W3C Recommendation, 2017-07-20. **[supported]** RDF constraint validation (shapes, cardinality/type/range/pattern). **OWL 2 profiles** (EL/QL/RL, W3C Rec 2012) **[supported]** — expressivity is a tractability dial.
- **MCP** (spec 2025-06-18) & **A2A v1.0.0** **[supported]**: tool/skill = name + free-text description + JSON-Schema; **no formal capability ontology**; MCP spec says annotations MUST be treated as untrusted. **OWL-S** (2004) / **WSMO** (2005) — W3C Member Submissions, ~zero production deployment.
- **RAGAS** — Es et al., arXiv:2309.15217. **[supported]** faithfulness = supported-statements/total = an LLM-judge *estimate*, not a truth oracle. **GrailQA** — Gu et al., WWW 2021 **[supported]**: iid/compositional/zero-shot split; in-distribution accuracy overstates real performance.

## How to read this list

The cluster nodes are engineering distillations: they extract *when formal/ontological structure earns its cost for a conversational domain agent*. Empirical results, vendor self-reports, and proposals are kept distinct — the recurring lesson is that the formal layer's cost is construction/maintenance + the LLM boundary, and it wins only at a specific bottleneck.
