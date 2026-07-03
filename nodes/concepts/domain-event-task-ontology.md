---
id: domain-event-task-ontology
type: concept
tags: [ontology, domain-modeling, events, tasks, activities, schema, agents]
summary: "model the user's world — entities, events, tasks, activities and their typed relations/states — as a lightweight domain ontology the agent grounds understanding on and acts over; scope it with competency questions."
related:
  - [[task-agent-pattern]]
  - [[ontology-grounded-agent]]
  - [[run-state-model]]
  - [[memory-types-taxonomy]]
  - [[decision-engine-contract]]
  - [[bitemporal-fact-invalidation-memory]]
  - [[agent-native-memory-framework]]
  - [[references-ontology-llm-agents]]
status: living
created: 2026-07-03
---

# Domain Event / Task / Activity Ontology

For an assistant-class agent, "understanding the user" concretely means mapping messy natural language onto a **typed model of the user's world** it can act on: who and what (**entities**), what happened when (**events**), what work is intended and in what state (**tasks**), and what is ongoing or recurring (**activities**). That typed model — classes, typed relations, and lifecycle states — is a domain ontology. It is the substrate [ontology-grounded-agent](ontology-grounded-agent.md) decides *whether* to build; this node is *what to put in it and how much*.

## What to model (the core classes)

| Class | Holds | Carries | Example |
|---|---|---|---|
| **Entity** | Durable things | identity, attributes | person, org, account, resource, document |
| **Event** | Something that happened at a time | timestamp, participants | "invoice #42 was disputed on Jun 3" |
| **Task** | Intended work | state, owner, due, dependencies | "file the dispute — blocked on user confirm" |
| **Activity** | Ongoing / recurring | cadence, status | "weekly expense triage" |

Plus **typed relations** (`task blocks task`, `event about entity`, `activity produces event`) and **state machines** (task: `open→in-progress→done|abandoned`). This is deliberately small — a *lightweight* ontology (controlled vocabulary + shallow hierarchy + a few typed relations + cardinality/range constraints), not heavyweight OWL DL.

## Why a typed model earns its place

- **Shared vocabulary across the stack.** The same typed `event`/`task` resolves in the user's utterance, the agent's [run-state-model](run-state-model.md), its memory ([memory-types-taxonomy](memory-types-taxonomy.md) — episodic events, semantic entity facts), and its [decision-engine-contract](decision-engine-contract.md) outputs. "The review" is one object everywhere, so the agent reasons about dependencies/states/time instead of re-parsing prose each turn.
- **Extraction target.** It is the schema for schema-constrained extraction (module S of [agent-native-memory-framework](agent-native-memory-framework.md)) — raw dialogue → typed entities/events; enforcement is *soft* (unmapped things still captured), which is the right default.
- **Actionability.** Typed tasks with states and dependencies are what a planner or solver operates on ([llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md)), and what validation checks against ([ontology-as-validator-shacl](ontology-as-validator-shacl.md)).
- **Time is first-class.** Tasks and events *change* — status flips, meetings move — so the store that holds them wants [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md) (invalidate-not-delete), not overwrite.

## How much ontology is enough

**Scope from competency questions**: list the questions the agent must answer / actions it must take ("what's blocking task X?", "what changed on this account since Tuesday?"), and model *only* the classes/relations those require. Stop there. Evidence caveat: this "lightweight beats heavyweight" guidance rests on OWL-profile design rationale and competency-question practice, **not** a controlled head-to-head study ([references-ontology-llm-agents](../references/references-ontology-llm-agents.md)) — so treat it as sound engineering heuristic, not measured law.

## Pitfalls

- **Modeling the domain, not the decisions.** An ontology no competency question needs is maintenance debt; build backward from what the agent must do.
- **Hard-enforcing extraction.** Rejecting unmapped facts loses signal — capture soft, type opportunistically.
- **Static types for a changing world.** Without lifecycle states + temporal validity, a "done" task and a moved event become stale-but-asserted facts (the "hallucinations of the past" failure — see [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md)).
- **Assuming the LLM will build it.** LLMs are strong at *typing* known terms but weak at *authoring* axioms (F1 ~0.13); the schema is largely a human/design artifact.

## References

Sits under [task-agent-pattern](../topics/task-agent-pattern.md); the whether-to-formalize decision is [ontology-grounded-agent](ontology-grounded-agent.md). Prior art you can build on rather than inventing from scratch: **PROV-O** (W3C Rec 2013) gives the `Agent`/`Activity`/`Entity` + time backbone for events/activities, and **KNOW** ([arXiv:2405.19877](https://arxiv.org/abs/2405.19877)) is an open everyday-life ontology (spacetime + social) built specifically to augment LLM personal assistants; prompt-time capture into such a schema is demonstrated by Çöplü et al. ([arXiv:2405.14012](https://arxiv.org/abs/2405.14012)). Sources in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
