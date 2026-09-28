---
id: step-budget-and-runaway-control
type: concept
tags: [agent, control-loop, budget, cost, safety, runaway]
summary: "hard ceilings on loop iterations, tokens, wall-clock, and tool calls so a stuck agent fails loudly instead of running forever."
related:
  - [[agent-control-loop]]
  - [[stop-and-yield-conditions]]
  - [[cost-aware-eval]]
  - [[action-execution-safety]]
  - [[llm-observability]]
  - [[context-compaction]]
  - [[mcp-tool-layer]]
  - [[prompt-injection-and-isolation]]
status: living
created: 2026-06-11
---

# Step Budget & Runaway Control

An agent loop is an unbounded process driven by a non-deterministic decider. Without hard limits it *will* eventually loop forever, repeat a failing action, or quietly spend hundreds of dollars on one task. Runaway control is the backstop that turns "infinite hang" into "loud, bounded failure."

## The budgets worth enforcing

| Budget | Bounds | Typical failure it catches |
|---|---|---|
| **Max iterations** | Loop count | Thrashing between two actions forever |
| **Token budget** | Cumulative input+output tokens | A single task draining the spend |
| **Wall-clock** | Elapsed time | A hung tool call stalling the whole run |
| **Tool-call count** | Total or per-tool | Retry storms against an API |
| **Repeat detection** | Identical action N times | The model re-issuing a failing call verbatim |

A run carries all of these as a shared, decrementing pool. When any ceiling is hit, the loop halts and reports *why* — it does not silently truncate and pretend success.

## Hard ceiling, not advisory

The budget is a **hard stop**, enforced by the loop harness in code — not a polite request in the prompt. Models ignore "try to be efficient" under pressure. The ceiling lives outside the model: the loop checks remaining budget before each iteration and refuses to continue when exhausted.

## Repeat detection is the cheap win

The most common runaway isn't exotic — it's the model re-issuing the *same* failing tool call because the error didn't change its plan. A trivial guard ("this exact action failed twice already → stop or replan") catches a large fraction of real hangs for almost no code. Tie it into replanning: a repeated failure should trigger [plan-execute-replan](plan-execute-replan.md), not another identical attempt.

## Spend is an attack surface, not only a runaway (2026)

A token budget assumes the spend is the agent's own doing. *Persistent Billable State* ([arXiv:2609.28585](https://arxiv.org/abs/2609.28585), 2026-09-23) shows it need not be: when a runtime carries an external tool return into later model inputs, the provider meters it again every turn, so an admitted malicious tool can turn untrusted data into **recurring victim-billed processing** without credentials or local privilege. Across 243 executions, maximum per-session cumulative input reached **14,293×** the session's first-call input, and retaining raw history alone raised mean effective session cost **21.2–35.9%**. Compression preserved **10/12 and 11/12** history-dependent tasks against **2/12** for deletion, so dropping history is not the safe default either.

The defense moves the budget check. Four host-side invariants bound prompt mass, context growth, recursive opportunity, and cumulative spend **before each re-ingestion**, and they contained every recurring attack in a 123-evaluation replay corpus. A **progress-authorized** budget reached 22/24 oracle-verified task successes with no pre-completion interruptions, against **13/24 under a fixed cap** — which qualifies "set ceilings near expected cost": a fixed cap is the weak form. Only 71 of 3,830 scanned MCP server and transport repositories showed any code-visible safeguard.

## Pitfalls

- **Budget too generous to matter.** A 1000-iteration cap "for safety" never fires before the user has given up. Set ceilings near the *expected* cost, not the catastrophic one.
- **Silent truncation.** Hitting the cap and returning whatever's half-done as if complete. The cap must surface as an explicit failed/blocked outcome — see [stop-and-yield-conditions](stop-and-yield-conditions.md).
- **No per-run telemetry.** If you don't log iterations/tokens/tool-calls per run, you can't tune the ceilings or spot the runs that flirt with them. See [llm-observability](llm-observability.md).
- **Checking the budget per iteration only.** Retained tool output is re-billed every turn; check cumulative spend before re-ingesting it.
- **Budget without backpressure.** When near the ceiling, the agent should wrap up or yield gracefully, not get guillotined mid-irreversible-action — a concern for action-execution safety (a planned Tier-2 concept; see `related:`).

## References

Sizing the token budget is the same sample-size/cost math as [cost-aware-eval](cost-aware-eval.md). The graceful-degradation side connects to action-execution safety (a planned Tier-2 concept, kept as an intent marker in `related:`).
