---
id: context-assembly-per-turn
type: concept
tags: [agent, context, prompt-assembly, perceive, engineering-excellence]
summary: "constructing each turn's prompt from typed parts — system, goal, history, tools, results — instead of resending a growing transcript."
related:
  - [[context-engineering]]
  - [[context-budget-allocation]]
  - [[perceive-reason-act-loop]]
  - [[recency-bias-prompt-design]]
  - [[domain-knowledge-injection]]
status: living
created: 2026-06-11
---

# Context Assembly Per Turn

The prompt the model sees each turn should be *built*, not *accumulated*. Assembly means: every iteration, you select and order a set of typed parts into the context window, each part chosen because this turn needs it — not because it happened to be in the transcript.

## The parts

A typical agent turn assembles from:

| Part | Source | Volatility |
|---|---|---|
| System instructions | Static config | Never changes |
| Goal / task | Set at run start | Per-run |
| Tool definitions | Tool registry (possibly subset) | Per-phase |
| Relevant history | Prior turns, selected/compacted | Per-turn |
| Last observation | Most recent tool result | Every turn |
| Retrieved knowledge | RAG / lookup for this turn's need | Per-turn |

The skill is selection: history is *selected and compacted*, tools are *subset to the relevant ones*, knowledge is *retrieved for this turn's need*. Only the system block and goal are roughly constant.

## Order matters

Placement changes how much weight the model gives each part — the recency/primacy effect. Stable instructions near the top, the live task and most-relevant material near the bottom (closest to generation). See [recency-bias-prompt-design](recency-bias-prompt-design.md). A correct set of parts in a bad order still underperforms.

## Assembly is the "perceive" step

In [perceive-reason-act-loop](perceive-reason-act-loop.md), assembly *is* perception. If you don't re-assemble each turn — refreshing the last observation, re-selecting relevant history — the model reasons over a stale snapshot and acts on yesterday's world. Re-perceive every iteration.

## Make it inspectable

The practical test of good assembly: you can dump, for any turn, the exact list of parts and why each is present. A prompt built by string-concatenating a transcript can't pass this test. A prompt built by an assembler that takes typed inputs and returns a window can. Inspectability is what lets you debug "why did it miss that fact?" — usually the answer is "the fact wasn't assembled in," which is invisible without the dump.

## Pitfalls

- **Append-only transcript.** The default that quietly breaks at scale; resend cost grows with length.
- **Static tool block at full size.** Shipping all 40 tools every turn when 5 are relevant — see [tool-selection-and-routing](tool-selection-and-routing.md).
- **Unselected history.** Dumping all prior turns instead of the relevant ones; buries the signal.
- **Knowledge stuffed once at the top.** Injecting all domain facts up front rather than retrieving per-turn — see [domain-knowledge-injection](domain-knowledge-injection.md).

## References

[context-budget-allocation](context-budget-allocation.md) decides how much room each part gets; [context-compaction](context-compaction.md) is how history is shrunk to fit its allocation.
