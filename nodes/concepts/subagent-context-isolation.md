---
id: subagent-context-isolation
type: concept
tags: [agent, multi-agent, context, isolation, prompt, engineering-excellence]
summary: "giving a sub-agent exactly the scoped context it needs and a compact return contract — so children stay focused and don't leak state back to the parent."
related:
  - [[multi-agent-delegation]]
  - [[when-to-delegate]]
  - [[context-engineering]]
  - [[context-assembly-per-turn]]
  - [[result-aggregation-and-trust]]
status: living
created: 2026-06-11
---

# Sub-Agent Context Isolation

A sub-agent's value comes from its *clean, scoped* context — it does one thing without the parent's accumulated history diluting it. Isolation is the discipline of constructing exactly that scope: brief the child like a smart colleague who just walked in, and define a compact contract for what it returns. Done badly, children inherit bloat, leak state, or hand back their entire working context.

## Brief the child; don't inherit the parent

The wrong default is passing the parent's whole conversation/context down to the child. That defeats the purpose: the child's context bloats with irrelevant history, costs more, and reasons worse. Instead **construct** the child's prompt from scratch ([context-assembly-per-turn](context-assembly-per-turn.md)) with only:

- the specific task (self-contained — the child has no memory of the parent's session),
- the minimal inputs it needs,
- the return contract (what shape to hand back).

This is the same "assemble, don't accumulate" rule as [context-engineering](context-engineering.md), applied across the spawn boundary. A child briefed in three sentences outperforms one handed a 50-turn transcript.

## The return contract: compact, structured

A sub-agent should return a *result*, not a *transcript*. The parent doesn't want the child's reasoning, dead ends, or working notes — it wants the answer in a known shape (a verdict, a list, a value). Define that contract up front, ideally as a schema. This keeps the parent's context from re-bloating with N children's working state — the whole isolation win is lost if each child dumps its window back.

## Isolation enables adversarial independence

Some delegation exists *because* the child must not see something — a verifier that independently judges a claim must be isolated from the generator's reasoning, or its "independent" check just echoes the original ([result-aggregation-and-trust](result-aggregation-and-trust.md)). Context isolation is the mechanism that makes adversarial separation real rather than nominal.

## Children can't share mutable state casually

Parallel children writing to the same resource is the multi-agent version of a data race. If children must produce side effects, isolate those too — separate scopes, or a merge step the parent owns. Read-only fan-out is safe; write fan-out needs the same care as any concurrent mutation (and ties into [action-execution-safety](action-execution-safety.md)).

## Pitfalls

- **Inheriting the parent's context.** Bloated, expensive, unfocused children.
- **No return contract.** Children hand back transcripts; parent context re-bloats.
- **Fake independence.** A "verifier" that was shown the generator's reasoning isn't independent.
- **Unscoped parallel writes.** Children racing on shared state.

## References

[context-engineering](context-engineering.md) is the single-agent version of this discipline; [result-aggregation-and-trust](result-aggregation-and-trust.md) is what the parent does with the compact results children return.
