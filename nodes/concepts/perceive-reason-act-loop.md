---
id: perceive-reason-act-loop
type: concept
tags: [agent, control-loop, react, reasoning, action]
summary: "the core agent iteration — observe state, decide one action, execute, observe result — and why each turn should commit to exactly one action."
related:
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[decision-engine-contract]]
  - [[native-thinking-vs-prompted-reasoning]]
  - [[stop-and-yield-conditions]]
status: living
created: 2026-06-11
---

# Perceive–Reason–Act Loop

The atomic cycle of an agent: **perceive** the current state, **reason** about what to do, **act** (usually a tool call), then **observe** the result and feed it back as the next iteration's perception. Popularized as "ReAct" (reason + act), the pattern is older than the name — it's just a sense-plan-act loop with an LLM as the planner.

## The shape

```
state ──▶ PERCEIVE ──▶ REASON ──▶ ACT ──▶ observe result
  ▲                                            │
  └────────────────────────────────────────────┘
```

Each iteration:
1. **Perceive** — assemble what the model sees this turn: goal, recent history, last tool result, relevant context. This is a context-assembly problem (every turn re-decides what's in the prompt).
2. **Reason** — the model decides the single next action. With modern APIs this is native thinking, not prompted `<reasoning>` tags — see [native-thinking-vs-prompted-reasoning](native-thinking-vs-prompted-reasoning.md).
3. **Act** — emit one tool call (or a user-facing message, which is itself an action). See [tool-use-design](../topics/tool-use-design.md).
4. **Observe** — the tool result becomes part of the next perception.

## One action per turn

The single most important discipline: **each iteration commits to exactly one action, then observes before deciding the next.** Models that emit a batch of actions ("call A, then B, then C") are guessing about B and C before seeing A's result. When A's output diverges from the model's assumption, B and C are already wrong. One-action-per-turn keeps the loop grounded in reality instead of in the model's prediction of reality.

The exception is genuinely independent actions with no data dependency — those can fan out in parallel. But sequential-dependent steps must observe between them.

## The action is structured, not prose

What "act" produces should be a typed decision the loop can execute deterministically — see [decision-engine-contract](decision-engine-contract.md). If the action lives only in the model's prose ("I'll now check the database"), the loop has to re-parse intent from text every turn, which is brittle. Force the action into a tool call or a structured decision object.

## Pitfalls

- **Acting on stale perception.** If step 2 reasons over a context that step 1 didn't refresh, the agent acts on yesterday's state. Re-perceive every turn.
- **Reasoning that doesn't constrain action.** Long thinking followed by an action that ignores it. The action schema should force the model to reference what it just reasoned about.
- **No observation step.** Emitting an action and immediately emitting the next without ingesting the result — this is the batch-action anti-pattern in disguise.
- **Conflating "reason" with "the answer."** The reasoning is forensic, not the deliverable — see [cot-as-forensic-artifact](cot-as-forensic-artifact.md).

## References

The loop is the substrate; [stop-and-yield-conditions](stop-and-yield-conditions.md) decides when it ends, and [step-budget-and-runaway-control](step-budget-and-runaway-control.md) bounds how long it may run.
