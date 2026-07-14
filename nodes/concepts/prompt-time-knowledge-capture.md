---
id: prompt-time-knowledge-capture
type: concept
tags: [agent, memory, knowledge-graph, extraction, write-path, ontology, security]
summary: "the synchronous write path — extract structured subject-predicate-object triples from the user's utterance AT interaction time (P2T, Çöplü et al. 2024), the commit boundary where a memory item is born; owns capture-at-say, upstream of consolidation, invalidation, and retrieval."
related:
  - [[agent-memory]]
  - [[agent-native-memory-framework]]
  - [[memory-consolidation-and-forgetting]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[domain-event-task-ontology]]
  - [[ontology-grounded-agent]]
  - [[ontology-as-validator-shacl]]
  - [[text-to-sql-retrieval]]
  - [[prompt-injection-and-isolation]]
  - [[confirm-before-act]]
  - [[references-ontology-llm-agents]]
  - [[memory-poisoning]]
status: living
created: 2026-07-12
---

# Prompt-Time Knowledge Capture (P2T)

[agent-native-memory-framework](agent-native-memory-framework.md) names the write path as **module S — Extraction** (raw-concat · schema-free · schema-constrained). This node owns the axis S leaves implicit: **timing and the decision to commit**. Prompt-time capture fires the extractor *synchronously, on the user's turn, before the response* — it is the commit boundary where a memory item is **born**, upstream of consolidation (U), bitemporal invalidation (U/update), and retrieval (Q). It is the mirror of [text-to-sql-retrieval](text-to-sql-retrieval.md): text-to-SQL is the sanctioned **read** from a structured store (SELECT-only); prompt-time capture is the sanctioned, bounded **write** into one.

## P2T: prompt-to-triple

Anchor: *Prompt-Time Symbolic Knowledge Capture with Large Language Models* (Çöplü, Bendiken, Skomorokhov, Bateiko, Cobb, Bouw; Haltia Inc.; [arXiv:2402.00414](https://arxiv.org/abs/2402.00414), 1 Feb 2024; code [HaltiaAI/paper-PTSKC](https://github.com/HaltiaAI/paper-PTSKC)). Its premise, verbatim: LLMs *"inherently lack mechanisms for prompt-driven knowledge capture"* — they cannot natively persist a fact learned mid-conversation. The fix is **P2T (prompt-to-triple)**: convert prompt content into a KG triple `(subject, predicate, object)` (`"I was born in 1979"` → `("I","birthday","1979")`) and persist it **symbolically in a knowledge graph, not in model weights**.

## The bake-off (label: synthetic, 2-relation, 2024)

Table 1, macro F1 on a **200-sample synthetic test set** (Mistral-7B-Instruct-v0.2, 4-bit, QLoRA):

| Technique | Relation F1 | Triple F1 |
|---|---|---|
| Zero-shot | 0.898 | 0.535 |
| Few-shot | 0.658 | 0.485 |
| **Fine-tuning** | **1.0** | **0.980** |

Two load-bearing findings: (1) **relation recall is easy** (identifying the *predicate*) — the bottleneck is **grounding the full triple** (subject/object), where prompting collapses (~0.5 F1) and fine-tuning nears perfect. (2) **Fine-tuning wins and scales**: zero/few-shot must list every candidate relation in-prompt, so prompt size grows with the relation set; fine-tuning *internalizes* the vocabulary. **Do NOT read 0.98 as general capability** — the dataset is fully synthetic and covers only **two relations** (birthday/anniversary), so near-perfect relation-recall is a 2-way-choice artifact the authors flag themselves.

## Schema-free → ontology-driven

The follow-up (*Ontology-Driven Symbolic Knowledge Capture*, [arXiv:2405.14012](https://arxiv.org/abs/2405.14012), same group) fine-tunes into a subset of the **KNOW ontology** ([arXiv:2405.19877](https://arxiv.org/abs/2405.19877)) — moving P2T from free-form triples to **schema-constrained structured extraction**, adding **pre-storage validation** ("ontology rules can identify inconsistencies before storage"). Its case for fine-tuning is a **scalability** argument (avoid stuffing the whole ontology into every prompt), *not* a proven accuracy win; no head-to-head ontology-vs-schema-free delta is given. All three papers are one Haltia research program — they self-corroborate, they don't independently verify. (They sit in the graph only as bibliographic entries in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md); this node adds the method depth.)

## The unsolved half: WHEN/WHETHER, not just HOW

The anchor papers deliver **HOW** (schema-constrained triple extraction) but **always-extract unconditionally** — no trigger, no salience gate. For a real agent the capture decision decomposes into four parts the papers skip:

- **TRIGGER** — always-on background extraction (P2T's model) vs a dedicated model-invoked `save_memory`-style tool (agentic routing). Always-extract maximizes recall but pays a per-turn LLM call, floods the store, and widens the attack surface.
- **SELECT** — a write-time salience gate. This is *upstream* of [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md), which prunes *after* storage; consolidation *names* the need for write-time selectivity, capture is *where it belongs* — and the literature hasn't closed that gap. Hard constraints / explicit commitments must bypass any gate and copy forward losslessly.
- **VERIFY** — dedup / entity-resolution (P2T does no coreference; literal `"I"` is the subject), contradiction detection routed to **invalidate-not-delete** ([bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md); capture produces the atemporal triples that store as later versions), relative-date resolution against a clock (P2T never resolves "next Tuesday"), and [confirm-before-act](confirm-before-act.md) for consequential facts.
- **TRUST** — capture at interaction time reads directly from an **untrusted** channel (the prompt, relayed emails, tool results), so the capture step **is** the memory-poisoning write vector of [prompt-injection-and-isolation](prompt-injection-and-isolation.md) (cf. MINJA, AgentPoison). Ontology pre-storage validation ([ontology-as-validator-shacl](ontology-as-validator-shacl.md)) bounds the *shape* of a written fact, not its *truth or provenance*. Tag provenance at write time; never extract privileged triples from untrusted spans.

## A concrete write pipeline (practitioner)

One shipped instantiation (Iusztin, *Decoding AI*, 2026 — vendor-sponsored; [references-ontology-llm-agents](../references/references-ontology-llm-agents.md)) makes the VERIFY half concrete as a **7-stage path: chunk → extract → validate → resolve-names → embed → dedupe → upsert**. Two details generalize past the vendor:

- **Content-derived IDs make the write idempotent.** Deriving node/edge IDs from content (`{user_id}:{type}:{name}`, `{source}|{type}|{target}`) means re-extracting the same fact **upserts instead of duplicating** — the memory-write analogue of [idempotency-keys](idempotency-keys.md), and what lets extraction run at-least-once safely (the extractor "sees one chunk and nothing else," so retries and re-ingests are harmless).
- **Dedup is a band, not a threshold.** High embedding similarity auto-merges, low makes a new node, and a **middle zone is flagged for human review** rather than auto-merged — because **"a wrong merge is the only unrecoverable mistake"**: re-splitting two wrongly-merged entities is far harder than merging two later. This is the entity-resolution discipline the anchor papers skip (P2T does no coreference at all), and it is *asymmetric-risk by design* — bias toward under-merging.

## For a task-agent builder

Make capture a **first-class typed write** into your [domain-event-task-ontology](domain-event-task-ontology.md), not a byproduct of chat logging ([ontology-grounded-agent](ontology-grounded-agent.md) decides whether that ontology is worth building). Prefer schema-in-context zero/few-shot as the pragmatic default for an evolving domain vocabulary (avoids retraining per schema change); reserve fine-tuning for stable, high-volume relations. The reliability work is in **VERIFY and TRUST**, not extraction. Same typed store serves both paths: capture writes it, [text-to-sql-retrieval](text-to-sql-retrieval.md) / graph query reads it.

## References

Sits under [agent-memory](../topics/agent-memory.md); the write/commit boundary of [agent-native-memory-framework](agent-native-memory-framework.md)'s S phase. Primary: [arXiv:2402.00414](https://arxiv.org/abs/2402.00414) (P2T; synthetic-dataset results), ontology-driven follow-up [arXiv:2405.14012](https://arxiv.org/abs/2405.14012), KNOW ontology [arXiv:2405.19877](https://arxiv.org/abs/2405.19877) — all one Haltia program (self-corroborating). Reading list: [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
