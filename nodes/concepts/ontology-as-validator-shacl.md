---
id: ontology-as-validator-shacl
type: concept
tags: [ontology, validation, shacl, schema, output-design, agents]
summary: "validate an agent's structured output/state against a domain ontology's constraints (SHACL/OWL) — a domain-semantic layer atop schema-vs-validator that catches type/cardinality/range violations, but checks structure, not truth."
related:
  - [[llm-output-design]]
  - [[schema-vs-validator]]
  - [[ontology-grounded-agent]]
  - [[domain-event-task-ontology]]
  - [[decision-engine-contract]]
  - [[references-ontology-llm-agents]]
status: living
created: 2026-07-03
---

# Ontology as Validator (SHACL)

[schema-vs-validator](schema-vs-validator.md) frames the choice between schema-enforced output and free-text-plus-post-hoc-validator. This node is the **domain-semantic** end of the validator side: check the agent's structured output/state against a domain **ontology's constraints** — not just "is this valid JSON" but "does this satisfy the *meaning* of the domain" (a task can't be `done` with an open blocker; an event's participants must be known entities; a due date must post-date creation).

## The concrete tool: SHACL

**SHACL** (Shapes Constraint Language) is a **W3C Recommendation (2017-07-20)** for validating RDF graphs against shapes: node/property shapes with cardinality, value-type, range, pattern, and logical constraints, plus targets. For a [domain-event-task-ontology](domain-event-task-ontology.md), SHACL shapes are the machine-checkable expression of its rules — run the agent's proposed state/action through the validator before committing. Constraint *strength* is a dial: **OWL 2 profiles** (EL/QL/RL, W3C Rec 2012) trade expressivity for tractability, so you buy only as much reasoning as the checks need.

## What it catches — and what it does not

- **Catches:** structural and constraint violations — wrong type, missing required field, out-of-range value, illegal state transition, cardinality breach. This is exactly the class of error a free-text LLM output silently commits.
- **Does NOT catch: truth.** A structurally valid, constraint-satisfying answer can still be factually wrong. Neither SHACL (structure) nor RAGAS-style faithfulness (an LLM-judge *entailment estimate*, [arXiv:2309.15217](https://arxiv.org/abs/2309.15217)) is a truth oracle — a "validated, high-faithfulness" answer is still *unverified*. Don't let a green validator imply correctness.

## When it earns its cost

- **Yes:** the agent emits/updates structured domain data that must satisfy machine-checkable rules before it drives an action ([decision-engine-contract](decision-engine-contract.md) outputs, state writes, tool inputs with domain semantics). This is the [hard-surface-irrevocability](hard-surface-irrevocability.md) case — validate before the irreversible send.
- **No:** free-form conversational text, or where a plain JSON-Schema shape check already covers the failure modes — adding an RDF/SHACL layer is then overhead.

## Pitfalls

- **Confusing validation with truth.** The most dangerous read — structural conformance is necessary, not sufficient; pair with grounding + human review on high stakes.
- **RDF-shaping data that isn't RDF.** SHACL is worth it when your domain data is already graph/triple-shaped; forcing plain JSON into RDF just to use SHACL is a poor trade — a JSON-Schema + custom domain-constraint checks may be lighter.
- **Over-constraining.** Rules stricter than the domain actually requires reject valid agent outputs; derive shapes from the ontology's real constraints, not aspiration.

## References

Sits under [llm-output-design](../topics/llm-output-design.md); the domain-semantic extension of [schema-vs-validator](schema-vs-validator.md); the validation arm of [ontology-grounded-agent](ontology-grounded-agent.md). Sources in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
