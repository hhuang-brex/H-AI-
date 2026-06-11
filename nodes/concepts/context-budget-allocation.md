---
id: context-budget-allocation
type: concept
tags: [agent, context, token-budget, eviction, cost, engineering-excellence]
summary: "splitting a fixed token window across system, history, tools, and results — with an explicit eviction policy for when it overflows."
related:
  - [[context-engineering]]
  - [[context-assembly-per-turn]]
  - [[context-compaction]]
  - [[cost-aware-eval]]
  - [[step-budget-and-runaway-control]]
status: living
created: 2026-06-11
---

# Context Budget Allocation

The context window is finite and the bill is linear in how much of it you use. Budget allocation is deciding, up front, how many tokens each part of the prompt may consume — and what gets evicted when the total would overflow. Without an allocation policy, the largest part (usually history or tool results) silently crowds out everything else until something important falls off the edge.

## Allocate by role, with reserves

Split the window into named allotments rather than first-come-first-served:

| Allotment | Typical share | Notes |
|---|---|---|
| System + goal | Small, fixed | Never evicted; the contract |
| Tool definitions | Bounded by subsetting | Cap by routing to a relevant subset |
| Working history | Largest flexible block | Compacted to fit, not truncated blindly |
| Last observation | Reserved | The current tool result must always fit |
| Output headroom | Reserved | Leave room for the model to actually respond |

The two reservations that get forgotten: **output headroom** (a full input window leaves no room to generate) and **last observation** (the freshest, most decision-relevant data must never be the thing evicted).

## Eviction is a policy, not an accident

When the assembled parts exceed the window, *something* leaves. Make that choice explicit:

- **Evict oldest history first** — usually right; recent turns are more relevant.
- **Never evict the goal, system, or last observation** — these are load-bearing.
- **Compact before you evict** — shrinking history ([context-compaction](context-compaction.md)) preserves information that hard truncation destroys.
- **Surface what was dropped** — log evictions so "the agent forgot X" is debuggable, not mysterious.

Silent truncation at the API boundary (the platform drops the overflow for you) is the worst case: you don't control *what* is lost and you don't know it happened.

## Budget is a cost lever, not just a fit constraint

Tokens are the bill and the clock. Tightening allocations isn't only about fitting the window — a leaner prompt is cheaper and faster on every single turn, multiplied across every iteration of every run. The same sample-size/cost reasoning as [cost-aware-eval](cost-aware-eval.md) applies: measure tokens-per-run and treat regressions as bugs. This is the per-prompt sibling of the per-run ceiling in [step-budget-and-runaway-control](step-budget-and-runaway-control.md).

## Pitfalls

- **No output reservation.** The input fills the window; generation gets truncated mid-answer.
- **First-come allocation.** Early-turn tool results squat in context for the whole run.
- **Hard truncation over compaction.** Chopping the oldest N tokens mid-sentence instead of summarizing them.
- **Relying on platform truncation.** Letting the API decide what to drop — you lose control and visibility.

## References

[context-compaction](context-compaction.md) is the technique that lets history fit its allotment without losing information; [context-assembly-per-turn](context-assembly-per-turn.md) is what consumes the budget.
