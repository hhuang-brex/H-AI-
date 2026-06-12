---
id: agent-memory
type: topic
tags: [agent, memory, retrieval, consolidation, context, science-excellence]
summary: "the semantic memory system that lets a talking agent recall across turns and sessions — memory types, retrieval, and consolidation/forgetting — distinct from the this-turn context window and the run-state for resume."
related:
  - [[context-engineering]]
  - [[agent-state-persistence]]
  - [[conversation-memory]]
  - [[memory-types-taxonomy]]
  - [[memory-retrieval]]
  - [[memory-consolidation-and-forgetting]]
  - [[domain-knowledge-injection]]
  - [[references-context-and-memory]]
status: living
created: 2026-06-12
---

# Agent Memory

A talking task agent needs to remember — what the user said three turns ago, what they prefer across sessions, how a recurring task usually goes. Agent memory is the system that stores those things durably and surfaces the right ones at the right moment. It is the *substrate* that [context-engineering](context-engineering.md) draws from: memory decides what *could* be recalled; context-assembly decides what actually enters this turn's window.

## Three things that are NOT each other

The graph has three "remembering" ideas that are routinely conflated; keeping them distinct is the first engineering win:

| System | Holds | Lifespan | Node |
|---|---|---|---|
| **Context window** | What the model sees *this turn* | One inference call | [context-engineering](context-engineering.md) |
| **Run state** | Where an in-flight *task* is, for resume | One run (until done) | [agent-state-persistence](agent-state-persistence.md) |
| **Memory** (this topic) | What the agent *knows*, across turns & sessions | Indefinite; decays by policy | here |

Context is volatile and reconstructed every turn; run state is durable but task-scoped and discarded on completion; memory outlives both. A "fact the user told us last week" lives in memory, gets *retrieved* into run state when relevant, and is *assembled* into the context window for the turn that needs it.

## The three decisions

| Decision | Question | Concept |
|---|---|---|
| What kinds of memory exist? | Working vs. episodic vs. semantic vs. procedural — and do you need all four? | [memory-types-taxonomy](../concepts/memory-types-taxonomy.md) |
| How do you surface the right memory? | Out of thousands of stored items, which few enter the prompt? | [memory-retrieval](../concepts/memory-retrieval.md) |
| What gets kept, promoted, or forgotten? | Writing everything is as broken as remembering nothing | [memory-consolidation-and-forgetting](../concepts/memory-consolidation-and-forgetting.md) |

## The science angle: memory is a cognitive-systems borrowing

The engineering here is unusually well-served by reaching to the empirical literature, because two bodies of work constrain the design:

- **Retrieval is bounded by attention limits.** Long-context models degrade on information buried mid-context (the widely-reported "lost in the middle" effect) and on raw context length generally ("context rot"). This is *why* memory exists as a separate retrieval layer rather than "just put everything in the context window" — a longer window does not rescue recall. See [memory-retrieval](../concepts/memory-retrieval.md) and the empirical grounding in *references-context-and-memory* (planned — pending fetch verification).
- **Human memory architecture is a tested design source.** The working/episodic/semantic/procedural split, consolidation (promoting episodic experiences into semantic knowledge), and decay/forgetting are borrowed from cognitive science and have been instantiated in LLM-agent systems (OS-style tiered memory, generative-agent memory streams). These are not metaphors for flavor — they are load-bearing architectural choices with published precedent.

## The governing principle: remembering is a precision problem, not a capacity problem

The naive instinct is "store more, recall more." Both halves are wrong. Storing everything fills retrieval with noise; recalling everything (or recalling by recency alone) surfaces the wrong items. A good memory system is *selective* on both write and read — it forgets deliberately and retrieves by relevance, not volume. Capacity is cheap; precision is the hard part.

## Connections

- **Context:** memory is the store; [context-engineering](context-engineering.md) is the per-turn selection from it. [conversation-memory](../concepts/conversation-memory.md)'s "three horizons" is a special case of [memory-types-taxonomy](../concepts/memory-types-taxonomy.md).
- **Knowledge injection:** [domain-knowledge-injection](../concepts/domain-knowledge-injection.md) (RAG, prompt-stuffing) is *external-knowledge* retrieval; memory is *experience* retrieval. Same machinery (embed + rank), different source and write path.
- **Persistence:** durable memory needs the same storage discipline as [agent-state-persistence](agent-state-persistence.md) — versioned, atomic, reconstructable.
