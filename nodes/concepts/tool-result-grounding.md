---
id: tool-result-grounding
type: concept
tags: [agent, tool-use, grounding, context, results]
summary: "feeding tool output back into the loop so the model can act on it — trimming, shaping, and distinguishing error from success."
related:
  - [[tool-use-design]]
  - [[tool-schema-design]]
  - [[code-execution-sandbox-pattern]]
  - [[grounding-and-citation]]
  - [[perceive-reason-act-loop]]
status: living
created: 2026-06-11
---

# Tool Result Grounding

A tool call is only half the action; the other half is getting its result back into the loop in a form the model can use. Done badly, results blow the context budget, hide errors as success, or arrive in a shape the model can't reason over — and the agent acts on garbage.

## Three things the result must do

1. **Fit the budget.** A tool that returns 4,000 rows can't dump them into context. Summarize, paginate, or keep the data out of the model entirely.
2. **Be unambiguously success-or-failure.** The model must be able to tell "this worked, here's the data" from "this failed, here's why." A 200-with-empty-body and a 500 must look different.
3. **Match how the model will use it.** Return the fields the next decision needs, named clearly — not the raw API envelope.

## Keep large results out of the model

The strongest pattern for big results is to never put them in context: the agent operates on a *handle* (a file, a table reference, a cursor) and runs code against it, pulling only summaries or specific rows into the prompt. See [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) and [paginated-tool-contract](paginated-tool-contract.md). This is the single biggest lever on both cost and accuracy for data-heavy agents.

## Errors are perceptions too

In [perceive-reason-act-loop](perceive-reason-act-loop.md), the tool result is the next turn's perception — and that includes errors. An actionable error ("rate limited, retry after 30s" / "no expense with id X") lets the model correct course. A bare `"error: failed"` leaves it to retry the same call or hallucinate a recovery. Design tool errors as instructions to the next iteration, not as dead ends. (This is the input side of the error contract in [tool-schema-design](tool-schema-design.md).)

## Grounding claims in results

When the agent then *tells the user* something based on a tool result, that statement must be anchored to what the tool actually returned — not to the model's memory of what it expected. This is [grounding-and-citation](grounding-and-citation.md) applied to tool output: cite the result, don't paraphrase from prior belief.

## Pitfalls

- **Raw dump.** Pasting the full JSON response into context; works in demos, OOMs the budget in production.
- **Silent empty results.** "Found 0 matches" formatted identically to "found matches" — the model reports success on nothing.
- **Lossy summarization that drops the needed field.** Over-trimming a result so the one value the next step needed is gone.
- **Stale-result reuse.** Acting on a result from three turns ago as if still current. Re-perceive — see [perceive-reason-act-loop](perceive-reason-act-loop.md).

## References

[code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) and [paginated-tool-contract](paginated-tool-contract.md) are the concrete techniques for fitting large results into a bounded context.
