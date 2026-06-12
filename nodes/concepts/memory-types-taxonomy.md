---
id: memory-types-taxonomy
type: concept
tags: [agent, memory, taxonomy, episodic, semantic, working, procedural, science-excellence]
summary: "the working / episodic / semantic / procedural split borrowed from cognitive science — what each holds, how they differ in write and decay, and when an agent needs more than one."
related:
  - [[agent-memory]]
  - [[memory-consolidation-and-forgetting]]
  - [[conversation-memory]]
  - [[memory-retrieval]]
  - [[run-state-model]]
status: living
created: 2026-06-12
---

# Memory-Types Taxonomy

Not all "memory" is the same kind of thing, and treating it as one undifferentiated store is the most common memory-design error. Cognitive science distinguishes four types; LLM-agent systems borrow the split because each type has a different write path, retrieval pattern, and decay policy.

## The four types

| Type | Holds | Example (support agent) | Write | Decay |
|---|---|---|---|---|
| **Working** | The active task's immediate state | "currently disputing txn T, awaiting confirm" | Per turn | Discarded at task end |
| **Episodic** | Specific past events, time-stamped | "on June 3 the user disputed a SHELL charge" | On event | Slow; may consolidate |
| **Semantic** | Generalized facts & preferences | "this user always disputes gas charges" | On consolidation | Very slow |
| **Procedural** | How to do recurring tasks | "dispute flow = fetch→check dup→confirm→file" | On learning | Rarely |

Working memory is essentially this-turn/this-run state — it overlaps the [run-state-model](run-state-model.md), not the durable store. The durable memory system is mostly **episodic** (what happened) and **semantic** (what's true), with **procedural** appearing in agents that learn task patterns.

## conversation-memory is a special case

[conversation-memory](conversation-memory.md)'s "three horizons" (this turn / this session / across sessions) maps onto this taxonomy: this-turn ≈ working, this-session ≈ episodic, across-sessions ≈ semantic. The taxonomy generalizes it — same idea, with the write/decay differences made explicit and procedural memory added for task-learning agents.

## When you need more than one type

Most chat agents need only **episodic + semantic**, and many need only a flat "facts about the user" store (semantic). Reach for the full split when:

- the agent must distinguish "what happened" from "what's generally true" (episodic vs. semantic) — e.g. one unusual event shouldn't overwrite a stable preference;
- the agent **learns procedures** from repetition (procedural) — most don't, so don't build it speculatively (YAGNI).

A premature four-store architecture for an agent that needs one flat preference table is the memory version of over-engineering.

## Why the split is load-bearing, not cosmetic

The types differ in the operations that matter:

- **Episodic → semantic is consolidation** ([memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md)): repeated episodes promote into a generalized fact. Without the distinction, you can't express "this happened 5 times, so now it's a pattern."
- **Decay rates differ by type.** A single episode can fade; a consolidated preference should not. One uniform TTL across all memory is wrong for at least one type.
- **Retrieval weights differ.** Semantic facts are almost always relevant when they match; episodic events are relevance-and-recency weighted. See [memory-retrieval](memory-retrieval.md).

## Pitfalls

- **One undifferentiated store.** Can't express consolidation or type-specific decay.
- **Speculative four-store build.** Procedural memory for an agent that never learns a procedure.
- **Working memory in the durable store.** Bloats it with transient task state that belongs in [run-state-model](run-state-model.md).
- **Episodic treated as semantic.** A one-off event hardens into a "fact" and misleads later turns.

## References

[memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md) is the episodic→semantic promotion and decay machinery; [references-context-and-memory](../references/references-context-and-memory.md) holds the cognitive-science and LLM-agent sources this split is drawn from.
