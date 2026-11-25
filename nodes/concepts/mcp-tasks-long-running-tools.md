---
id: mcp-tasks-long-running-tools
type: concept
tags: [mcp, tasks, async, long-running, tool-use, state, human-in-the-loop]
summary: "The MCP Tasks extension for tool calls that take minutes or need user input mid-flight: the handle-and-poll contract, its lifecycle and security rules, and what a conversing agent must do while it waits."
related:
  - [[mcp-tool-layer]]
  - [[mcp-vs-direct-api]]
  - [[background-agent-execution]]
  - [[run-state-model]]
  - [[interrupt-and-resume]]
  - [[crash-recovery-consistency]]
  - [[async-conversation-pacing]]
  - [[stop-and-yield-conditions]]
  - [[step-budget-and-runaway-control]]
  - [[confirm-before-act]]
  - [[idempotency-keys]]
  - [[turn-outcome-signal]]
  - [[references-model-context-protocol]]
status: living
created: 2026-11-24
---

# MCP Tasks: Long-Running Tool Calls

Some tool calls do not return in seconds: a CI pipeline, a batch import, a report generator, or a step that waits for a human to approve. The **MCP Tasks extension** (`io.modelcontextprotocol/tasks`) lets a server answer such a call with a **durable handle** instead of a result. The client polls for progress, answers questions the task raises, and fetches the result later, even after reconnecting ([overview](https://modelcontextprotocol.io/extensions/tasks/overview), [schema](https://github.com/modelcontextprotocol/ext-tasks/blob/main/schema/2026-07-28/schema.ts), fetched 2026-11-24). It became an extension in the 2026-07-28 revision (SEP-2663), moving out of the core protocol.

## Why not just block

The docs give four reasons: client and proxy timeouts make long-held connections impractical; a task ID survives a client crash; status messages give progress; and a task can pause for input without a second connection. The server decides per request whether to create a task, so the client opts in once and handles whichever result comes back.

## The contract

```
client: tools/call  (declares the tasks extension in _meta capabilities)
server: CreateTaskResult  { resultType: "task", taskId, status: "working", ttlMs, pollIntervalMs }
client: tasks/get   (every pollIntervalMs)          → status
server: status = input_required, inputRequests {…}
client: tasks/update { inputResponses {…} }         → ack
client: tasks/get                                   → status = completed, result
```

| Status | Meaning |
|---|---|
| `working` | In progress |
| `input_required` | Waiting on the client; `inputRequests` holds elicitations keyed by ID |
| `completed` | `result` has exactly what the synchronous call would have returned |
| `failed` | `error` holds the JSON-RPC error |
| `cancelled` | Cancelled — "not always honored" |

The last three are terminal. Rules worth knowing:

- **Only `tools/call` can return a task** today.
- **The server must not return a task to a client that didn't declare support**; it blocks normally or returns error `-32021`.
- **The task must exist before the server replies**, so a returned ID is always pollable.
- **`ttlMs` can change, and the server may discard the task after it expires.** A `null` TTL means unlimited.
- **Cancellation is cooperative.** `tasks/cancel` is acknowledged, but the task may still finish as `completed` or `failed`.
- **Notifications are optional.** Servers may push `notifications/tasks` through `subscriptions/listen`; polling is the default.

## Security as designed

Task IDs are "generated with sufficient entropy to prevent enumeration, and may serve as bearer tokens for stored state," and there is deliberately no `tasks/list`, "so one caller's tasks are not visible to another" ([spec site](https://tasks.extensions.modelcontextprotocol.io), fetched 2026-11-24). Two consequences: **treat a task ID like a credential** — don't log it in plain text or put it in a shared transcript — and **the client is the only index of its own tasks**, so losing the ID loses the task.

## What a conversing agent must do

The protocol handles the wire; the agent still has to decide what to do while it waits. This is the graph's synthesis:

1. **Persist the handle immediately.** The docs say to "Store task IDs durably." Put the task ID, the original request, and the TTL in the [run-state-model](run-state-model.md) before replying to the user, so a crash or restart can resume polling ([crash-recovery-consistency](crash-recovery-consistency.md)).
2. **Tell the user the turn is not finished.** A pending task is an open commitment, not a completed action. Record it as such in [turn-outcome-signal](turn-outcome-signal.md) and say when you'll follow up ([async-conversation-pacing](async-conversation-pacing.md)).
3. **Poll off the main loop.** Honor `pollIntervalMs`, and move polling to a cheap background worker; at Uber, notification turns were about a third of spend in the costliest sessions ([background-agent-execution](background-agent-execution.md)).
4. **Route `input_required` through your own approval gate.** The server is asking for user input; your host decides how that is shown and whether the model may answer it. Never let the model auto-fill an approval ([confirm-before-act](confirm-before-act.md)).
5. **Don't assume cancel worked.** After cancelling, keep polling until a terminal state, and handle a late `completed` — the side effect may have happened.
6. **Bound the wait.** A task with a null TTL can run forever; apply your own deadline from [step-budget-and-runaway-control](step-budget-and-runaway-control.md).

## What research says about waiting

None of these papers use MCP Tasks; they study the same problem.

- **Agents handle delay poorly.** AsyncTool finds delayed tool feedback "poses substantial" challenges for agents running several tasks at once ([2605.27995](https://arxiv.org/abs/2605.27995)).
- **Waiting is a skill to measure.** SentinelBench argues many long tasks need "sustained attention" — notice an event and respond — rather than continuous action, and scores reaction time and cost ([2606.05342](https://arxiv.org/abs/2606.05342)).
- **Work can overlap the wait.** Running predicted tool calls speculatively cut task time 43.5% ([2603.18897](https://arxiv.org/abs/2603.18897)); running them out of order in sandboxes and committing only after validation gave 1.27–1.35× speedups with zero false accepts in 4,010 audited commits ([2609.38201](https://arxiv.org/abs/2609.38201)).
- **Suspend, don't idle.** A middleware that checkpoints agent state and resumes from a callback avoids paying for idle wait on long MCP calls ([2601.14735](https://arxiv.org/abs/2601.14735)).

## Pitfalls

- **Losing the task ID.** No `tasks/list` means no recovery.
- **Treating `working` as done.** The user hears "done" before anything happened.
- **Polling faster than `pollIntervalMs`.** Wastes calls and may be throttled.
- **Retrying the original call instead of polling.** A second `tools/call` can start a second job; see [idempotency-keys](idempotency-keys.md).
- **Assuming client support.** The extension is opt-in on both sides, and host support varies.

## Not verified here

The schema, overview, and spec-site front page were read; SEP-2663 and the full specification page were not. Exactly what changed from the experimental Tasks in 2025-11-25 is taken from the core changelog (polling with `tasks/get` replaced a blocking `tasks/result`, `tasks/update` was added, and `tasks/list` was removed), not from the extension's own docs.
