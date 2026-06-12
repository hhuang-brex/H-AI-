---
id: memory-retrieval
type: concept
tags: [agent, memory, retrieval, ranking, embedding, science-excellence]
summary: "surfacing the few relevant memories out of many — recency × relevance × importance scoring — and why a bigger context window doesn't replace it."
related:
  - [[agent-memory]]
  - [[memory-types-taxonomy]]
  - [[context-assembly-per-turn]]
  - [[domain-knowledge-injection]]
  - [[references-context-and-memory]]
status: living
created: 2026-06-12
---

# Memory Retrieval

Storage is easy; *recall* is the hard part. An agent with a thousand stored memories must surface the handful relevant to this turn — and get it wrong in two directions: miss the memory that mattered (under-recall) or flood the context with loosely-related ones (over-recall). Retrieval is the ranking function that decides what enters the prompt.

## A bigger window does not replace retrieval

The tempting shortcut — "context windows are huge now, just put all the memories in" — fails on the empirical findings that motivate this whole topic:

- Models attend unevenly across a long context; information in the middle is recalled worse than at the ends ("lost in the middle").
- Performance degrades with raw context length even when the relevant fact is present ("context rot").

So stuffing all memory into a long window *lowers* the odds the right one is used, and costs more per turn. Retrieval — select few, place well — beats dump-everything on both accuracy and cost. (Sources in [references-context-and-memory](../references/references-context-and-memory.md).)

## The scoring function: recency × relevance × importance

A robust memory ranker (popularized by the generative-agents line of work) scores each candidate on three axes and combines them:

| Axis | Measures | Typical signal |
|---|---|---|
| **Relevance** | Semantic match to the current situation | Embedding similarity to the query/context |
| **Recency** | How long ago it was last accessed | Exponential decay over time |
| **Importance** | How significant the memory is, independent of the query | A learned/assigned salience score |

Relevance alone surfaces topically-similar but stale junk; recency alone forgets important older facts; importance alone ignores the current situation. The combination is what makes retrieval feel intelligent — a months-old but *important and relevant* memory beats a recent trivial one.

## Retrieval is the same machinery as RAG, different source

Embed-and-rank over a memory store is mechanically the same as [domain-knowledge-injection](domain-knowledge-injection.md)'s RAG over a document store. The difference is the *source and write path*: RAG retrieves curated external knowledge; memory retrieves the agent's own accumulated experience, which it also wrote. The retrieval/ranking concerns (chunking, embedding drift, top-k tuning) transfer directly.

## What retrieval feeds

Retrieved memories don't go straight to the model — they're candidates for [context-assembly-per-turn](context-assembly-per-turn.md), which budgets them against everything else competing for the window. Retrieval proposes; assembly disposes. Over-recall here directly pressures [context-budget-allocation](context-budget-allocation.md).

## Pitfalls

- **Recency-only retrieval.** The cheapest ranker, and it forgets important older facts the moment they age out.
- **Relevance-only retrieval.** Surfaces stale-but-similar memories; no notion that newer or more important should win ties.
- **Dump-all-into-the-window.** Defeated by lost-in-the-middle and context rot; expensive too.
- **Untuned top-k.** Retrieving 50 memories "to be safe" floods assembly and buries the few that mattered.

## References

[memory-types-taxonomy](memory-types-taxonomy.md) determines what's in the store to retrieve from; [context-assembly-per-turn](context-assembly-per-turn.md) is what consumes the retrieved set; empirical grounding for the attention-limit claims is in [references-context-and-memory](../references/references-context-and-memory.md).
