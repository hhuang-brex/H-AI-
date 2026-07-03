---
id: user-intent-to-task-grounding
type: concept
tags: [intent, task-grounding, dialogue-state, proactive, personalization, agents]
summary: "turn an under-specified user request — read against the user's activities/context — into an executable task, deciding act-vs-clarify; the bridge from 'what the user is doing/asking' to 'the task the engine runs'."
related:
  - [[task-agent-pattern]]
  - [[engine-vs-conversation-routing]]
  - [[domain-event-task-ontology]]
  - [[llm-as-autoformalizer-plus-solver]]
  - [[memory-retrieval]]
  - [[goal-decomposition]]
  - [[references-ontology-llm-agents]]
status: living
created: 2026-07-03
---

# User-Intent-to-Task Grounding

The bridge at the heart of an assistant: a user's utterance is usually **under-specified** ("move the review earlier"), and understanding it requires resolving it against **what the user is doing and has done** (their activities, state, history) and then mapping it onto an **executable task** the engine can run — while deciding whether to *act* or *ask first*. This is upstream of [goal-decomposition](goal-decomposition.md) (which sequences a task into steps); this node is getting from *request + context* to *the right task at all*.

## The pipeline

```
user utterance
  → retrieve relevant user context/activities (memory-retrieval, domain-event-task-ontology)
  → infer intent + resolve referents against that context
  → act vs. clarify?  (engine-vs-conversation-routing)
       clarify → ask the minimal disambiguating question
       act → map to an executable task (utterance → function/slot schema)
  → hand to planning / the decision engine
```

Each arrow is a documented research problem, not a given — and each maps to an existing node.

## Mechanisms (verified sources — [references-ontology-llm-agents](../references/references-ontology-llm-agents.md))

| Step | What it does | Anchor paper |
|---|---|---|
| **Utterance → executable task** | Reframe dialogue-state tracking as **function calling**: the utterance is parsed zero-shot onto a function + slot schema | FnCTOD ([arXiv:2402.10466](https://arxiv.org/abs/2402.10466)) — the [llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md) pattern for requests |
| **Clarify vs. execute** | Detect an under-specified ask and resolve it against context *before* planning (Clarification→Execution→Planning) | Ask-before-Plan ([arXiv:2406.12639](https://arxiv.org/abs/2406.12639)) |
| **Context → intent → act** | Sense open-world user context, infer intent, decide when to act, ground into a tool call | ContextAgent ([arXiv:2505.14668](https://arxiv.org/abs/2505.14668)); jointly optimizing proactivity + personalization ([arXiv:2511.02208](https://arxiv.org/abs/2511.02208)) |
| **Model the user's state** | Explicit belief-desire-intention user-state modeling to infer the relevant task/step | Satori ([arXiv:2410.16668](https://arxiv.org/abs/2410.16668)) |
| **Intent + out-of-scope routing** | Classify intent *and* reject out-of-scope requests instead of forcing a wrong task | Intent Detection in the Age of LLMs ([arXiv:2410.01627](https://arxiv.org/abs/2410.01627)) |

## Why grounding in activities matters

Intent detection in isolation treats a request as a one-shot classification. An assistant can't: "move the review earlier" only resolves if the agent knows *which* review (an [domain-event-task-ontology](domain-event-task-ontology.md) entity, retrieved from user memory) and its current state/time (best held in [bitemporal-fact-invalidation-memory](bitemporal-fact-invalidation-memory.md)). Grounding the request in the user's typed activities is what turns a vague utterance into an unambiguous, executable task — and is what lets the agent decide it has *enough* to act versus needing to ask ([engine-vs-conversation-routing](engine-vs-conversation-routing.md)).

## Pitfalls

- **Executing an under-specified ask.** Guessing the referent instead of clarifying is a top failure mode; Ask-before-Plan exists because "just do something" is worse than one good question.
- **Ignoring user context.** Resolving intent without the user's activities/history yields a generic task, not *their* task — the whole point of the goal.
- **No out-of-scope path.** Forcing every utterance into the nearest known task; needs an OOS/abstain route.
- **One-shot intent classification.** Treating grounding as a classifier rather than a resolution against state that the agent may need to *retrieve* first.
- **Skipping the schema.** Free-text "understanding" that never lands on an executable function/slot representation can't drive a reliable action ([llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md)).

## References

Sits under [task-agent-pattern](../topics/task-agent-pattern.md); routes via [engine-vs-conversation-routing](engine-vs-conversation-routing.md), grounds in [domain-event-task-ontology](domain-event-task-ontology.md) + [memory-retrieval](memory-retrieval.md), hands off to [goal-decomposition](goal-decomposition.md). Verified sources in [references-ontology-llm-agents](../references/references-ontology-llm-agents.md).
