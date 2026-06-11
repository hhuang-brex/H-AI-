---
id: context-compaction
type: concept
tags: [agent, context, compaction, summarization, memory, engineering-excellence]
summary: "shrinking a long history to fit the window without losing the decisions that matter — rolling summaries, structured state, and what never to compact."
related:
  - [[context-engineering]]
  - [[context-budget-allocation]]
  - [[conversation-memory]]
  - [[decision-audit-trail]]
  - [[agent-control-loop]]
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
