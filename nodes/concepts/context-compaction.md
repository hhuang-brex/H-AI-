---
id: context-compaction
type: concept
tags: [agent, context, compaction, summarization, memory, engineering-excellence]
summary: "shrinking a long history to fit the window without losing the decisions that matter — rolling summaries, structured state, and what never to compact."
related:
  - [[agent-memory]]
  - [[context-engineering]]
  - [[context-budget-allocation]]
  - [[conversation-memory]]
  - [[decision-audit-trail]]
  - [[agent-control-loop]]
  - [[agent-native-memory-framework]]
  - [[tool-result-grounding]]
status: living
created: 2026-06-11
---

# Context Compaction

A long-running agent generates more history than fits in any window. Compaction is how you keep the *information* from that history while spending far fewer tokens on it — replacing raw turns with a denser representation. Done well, the agent at turn 100 still knows what it decided at turn 5 without resending all 100 turns. Done badly, it forgets the one constraint that mattered.

## Three compaction strategies

| Strategy | What it keeps | Best for |
|---|---|---|
| **Rolling summary** | An LLM-written digest of older turns, refreshed periodically | Free-form conversational history |
| **Structured state** | A typed object (decisions made, facts learned, open loops) updated each turn | Task agents with a clear state shape |
| **Reference + retrieve** | Older turns live outside context; pull specific ones back on demand | Long histories with occasional callbacks |

Structured state is the strongest for a *task* agent: instead of summarizing prose, you maintain a small object — "decisions so far, facts established, open questions" — and carry only that forward. This is the engine-side analogue of [conversation-memory](conversation-memory.md), and it dovetails with the durable [decision-audit-trail](decision-audit-trail.md): the audit record *is* a compact, replayable history.

## Productized primitives (2026)

Two Anthropic API features instantiate strategies above; both are **beta** and worth knowing as off-the-shelf compaction (identifiers verified 2026-07-02):

- **Context editing** (`clear_tool_uses_20250919`, beta header `context-management-2025-06-27`) is *reference-and-evict* applied to tool results: once the prompt crosses a `trigger` (default 100k input tokens), the API clears the **oldest tool results first**, replacing each with a placeholder, keeping the most recent `keep` (default 3) tool-use pairs; you can `exclude_tools` and optionally clear tool *inputs*. It runs **server-side before the prompt reaches the model, while your client keeps the full unmodified history** — so it's a window-fitting eviction, not a durable-store edit. Pair it with the memory tool ([context-storage-and-hydration](context-storage-and-hydration.md)) so the agent writes anything important to `/memories` *before* it's cleared. (A sibling strategy `clear_thinking_20251015` evicts thinking blocks.)
- **Server-side compaction** (`compact_20260112`) is a managed **rolling summary**: the API summarizes older conversation context automatically as it nears the window limit. Anthropic now recommends it over the deprecated client-side `compaction_control` SDK path. It carries this node's core risk — a summarizer that can drop a constraint — so the *what-you-must-never-compact* rule below applies to it exactly as to a hand-rolled compactor; treat the managed summary as an untrusted component and assert on it.

The bounded-scope lesson from [agent-native-memory-framework](agent-native-memory-framework.md) applies: context editing (localized eviction) is cheap; a compactor that rewrites the whole state each pass risks the context-collapse degradation, so summarize incrementally where you can.

## What you must never compact away

- **The goal.** Summarizing the task into vagueness is how agents drift off-objective.
- **Hard constraints the user stated.** "Never charge over $50 without asking" must survive every compaction verbatim — paraphrase loses the edge.
- **Unresolved commitments.** Open loops (a question asked, a step deferred) must persist until closed, or the agent silently drops them.

A safe rule: compaction may lossily summarize *narrative*, but *constraints, commitments, and the goal* are copied forward losslessly.

## Compaction has a failure mode evals must catch

Summarization is itself an LLM call that can hallucinate, drop, or distort. A compaction that quietly invents a "fact" or omits a constraint corrupts every downstream turn. Treat the compactor as a component with its own correctness bar — golden-snapshot checks on "does the summary preserve the stated constraints?" are cheap insurance. The bug is invisible in any single turn and only shows up as gradual drift, which makes it exactly the kind of thing to test deterministically.

## Pitfalls

- **Summarizing the goal into mush.** The agent forgets precisely what it's doing.
- **Lossy on constraints.** A paraphrased rule loses its teeth ("don't spend much" ≠ "never over $50").
- **Compacting too eagerly.** Summarizing turns that are still actively referenced; pay a little to keep recent turns raw.
- **Trusting the compactor blindly.** No check that the summary preserved what mattered — drift creeps in unmonitored.

## References

[context-budget-allocation](context-budget-allocation.md) decides *when* compaction must run (history exceeds its allotment); [conversation-memory](conversation-memory.md) is the cross-session sibling of in-run compaction.
