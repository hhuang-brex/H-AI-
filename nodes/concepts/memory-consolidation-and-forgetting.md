---
id: memory-consolidation-and-forgetting
type: concept
tags: [agent, memory, consolidation, forgetting, decay, science-excellence]
summary: "deciding what to keep, promote from episodic to semantic, and deliberately forget — because storing everything degrades retrieval as surely as remembering nothing."
related:
  - [[agent-memory]]
  - [[memory-types-taxonomy]]
  - [[memory-retrieval]]
  - [[context-compaction]]
  - [[references-context-and-memory]]
status: living
created: 2026-06-12
---

# Memory Consolidation & Forgetting

A memory system that only ever writes is a memory system that slowly stops working: retrieval quality falls as the store fills with stale, redundant, and trivial entries. Consolidation (compressing and promoting what matters) and forgetting (deliberately dropping what doesn't) are what keep a long-lived agent's memory useful. Forgetting is a feature, not a failure.

## Why writing everything breaks retrieval

Every stored memory is a candidate that [memory-retrieval](memory-retrieval.md) must rank against. Ten thousand low-value entries don't just waste storage — they dilute the ranker, raising the chance a trivial-but-similar memory outranks the one that mattered. Unbounded write monotonically degrades recall. So the write path must be as selective as the read path: not "remember this turn," but "is this worth remembering?"

## Consolidation: episodic → semantic

The key operation, borrowed from how human memory works: repeated or significant **episodic** events get compressed into a **semantic** generalization ([memory-types-taxonomy](memory-types-taxonomy.md)).

- Five separate episodes of "user disputed a gas charge" consolidate into one semantic fact: "this user routinely disputes gas charges."
- The raw episodes can then decay; the generalization persists.

This is the memory-scale analogue of [context-compaction](context-compaction.md): both replace many raw items with a denser representation that preserves what matters. Compaction operates within a run's history to fit the window; consolidation operates across the durable store to keep it lean. Same instinct, different timescale.

## Forgetting policies

| Policy | Mechanism | Fits |
|---|---|---|
| **Time decay** | Drop/down-weight by age unless re-accessed | Episodic events |
| **Redundancy collapse** | Merge near-duplicate memories | High-repetition domains |
| **Importance threshold** | Never store below a salience floor | Noisy input streams |
| **Supersession** | New fact overrides the old (preference changed) | Semantic facts that update |

Supersession is the subtle one: when a user's preference *changes*, the old semantic memory is wrong, not just old. Forgetting here means *correcting*, and it needs the same authority/recency reasoning as any belief update — keep an audit of the change rather than silently overwriting.

## What must never be forgotten

Mirror of [context-compaction](context-compaction.md)'s rule: consolidation may lossily compress *episodes*, but **stated hard constraints and explicit user commitments** are copied forward losslessly. "Never auto-dispute without asking me" is not an episode to decay — it's a standing instruction. Forgetting it is a safety failure, not a memory optimization.

## The science framing

Consolidation and decay are not engineering conveniences retrofitted with biology vocabulary — they're directly modeled on memory consolidation and the adaptive value of forgetting from cognitive science, and instantiated in LLM-agent memory systems (memory-stream reflection, OS-style eviction from main context to external store). Treat the empirical work as design source, not decoration; see *references-context-and-memory* (planned — pending fetch verification).

## Pitfalls

- **Write-only memory.** Retrieval quality decays as the store grows without bound.
- **Uniform TTL.** One decay rate forgets important semantic facts or hoards trivial episodes.
- **Silent supersession.** Overwriting a changed preference with no audit of the change.
- **Forgetting a constraint.** Decaying a standing user instruction as if it were an episode — a safety bug.
- **Consolidation that hallucinates.** The compress/promote step is an LLM call that can distort; test it, like [context-compaction](context-compaction.md)'s compactor.

## References

[memory-types-taxonomy](memory-types-taxonomy.md) defines the episodic/semantic distinction consolidation operates on; [context-compaction](context-compaction.md) is the in-run sibling; *references-context-and-memory* (planned — pending fetch verification) holds the cognitive-science and agent-systems sources.
