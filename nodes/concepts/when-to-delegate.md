---
id: when-to-delegate
type: concept
tags: [agent, multi-agent, delegation, cost, decision, engineering-excellence]
summary: "the test for spawning a sub-agent — independent parallelism, context isolation, or adversarial separation — and why most decomposition shouldn't be agents."
related:
  - [[multi-agent-delegation]]
  - [[subagent-context-isolation]]
  - [[task-planning]]
  - [[agent-control-loop]]
  - [[step-budget-and-runaway-control]]
status: living
created: 2026-06-11
---

# When to Delegate

Spawning a sub-agent is expensive — a fresh context to fill, tokens multiplied across children, a merge step to get wrong, and a harder-to-debug execution tree. So the question is not "how do I decompose into agents?" but "does this work clear the bar for *being* a separate agent at all?" Most decomposition doesn't.

## The bar: three valid reasons

A sub-agent is justified when at least one holds:

| Reason | Test | Example |
|---|---|---|
| **Independent parallelism** | Pieces have no data dependency and can run concurrently | Read 20 sources; migrate 30 files |
| **Context isolation** | A piece would pollute the parent's window with detail it never needs again | Deep-dive one subsystem, return a 3-line verdict |
| **Adversarial separation** | A judge must not see the thing it judges' reasoning | Verifier that independently refutes a claim |

If none applies, the "sub-tasks" are sequential and share state — they are **functions in one loop**, not agents. Keep them in a single [agent-control-loop](agent-control-loop.md).

## The anti-pattern: role-play decomposition

The seductive wrong move is splitting by anthropomorphic role — "a planner agent hands to a writer agent hands to a critic agent" — because it reads like a tidy org chart. If those roles run in sequence and pass state down the line, you've added spawn cost, context-handoff overhead, and merge risk to get... a pipeline you could write as three function calls in one loop. Org-chart decomposition is the multi-agent version of premature abstraction.

## Cost is real and multiplies

Each child has its own context to assemble and its own token bill; a coordinator over 10 children can 10× your spend for a task that wasn't 10× faster. Delegation interacts directly with [step-budget-and-runaway-control](step-budget-and-runaway-control.md) — a fan-out is the fastest way to blow a budget, and a coordinator that spawns children that spawn children needs an explicit depth cap. Budget the fleet, not just each agent.

## Measure before committing to a topology

Whether delegation pays is an empirical question, not an aesthetic one. Benchmark single-loop vs. delegated on the real task: wall-clock, total tokens, and quality. Often a well-context-engineered single loop matches a multi-agent design at a fraction of the cost. Spawn when the measurement says so.

## Pitfalls

- **Role-play agents.** Sequential, state-sharing "agents" that should be functions.
- **Unbounded spawn depth.** Children spawning children with no cap — a runaway in a new shape.
- **Delegating the cheap part.** Spawn overhead exceeds the work the child does.
- **Topology by intuition.** Committing to multi-agent without measuring it beats one loop.

## References

[subagent-context-isolation](subagent-context-isolation.md) is how you scope a child once you've decided to spawn it; [task-planning](task-planning.md)'s dependency structure tells you what can fan out in parallel.
