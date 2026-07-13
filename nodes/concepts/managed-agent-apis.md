---
id: managed-agent-apis
type: concept
tags: [agent, harness, managed-runtime, build-vs-buy, api, anthropic, openai, mcp, lock-in, engineering-excellence]
summary: "build-vs-buy the agent loop: three tiers from a single Messages call, to a self-hosted loop (Tool Runner + server-side primitives), to a fully hosted harness (Claude Managed Agents / OpenAI Responses+Agents SDK) that runs the loop, sandbox, tools, and state for you — trading loop control (and ZDR/HIPAA + cloud-provider parity) for less code, not for tool openness."
related:
  - [[agent-harness]]
  - [[agent-control-loop]]
  - [[tool-use-design]]
  - [[mcp-tool-layer]]
  - [[context-storage-and-hydration]]
  - [[context-compaction]]
  - [[multi-agent-delegation]]
  - [[action-execution-safety]]
  - [[agent-state-persistence]]
  - [[self-improving-harness]]
  - [[background-agent-execution]]
status: living
created: 2026-07-10
---

# Managed Agent APIs (build-vs-buy the harness)

Every mechanism in the [agent-harness](../topics/agent-harness.md) cluster — the loop, tool execution, context management, state, permissions — is something you can now **buy as a hosted API instead of building**. This node names the build-vs-buy boundary and the concrete vendor surfaces that embody it. It owns *no mechanism*; it maps vendor API objects onto the graph nodes that already own each abstraction, and captures the tradeoffs of moving the boundary.

> **DOES vs CLAIMS.** Everything under "what the API does" is a doc-verifiable API fact (endpoints, headers, type identifiers) fetched from primary docs on platform.claude.com / developers.openai.com. Vendor **performance** statements ("high-quality, efficient outputs"; advisor "close to advisor-solo quality"; tool search ">85% token reduction") are marketing hypotheses the docs themselves hedge ("Results are task-dependent. Evaluate on your own workload") — benchmark them, don't trust them. Model ids (`claude-opus-4-8`, `claude-fable-5`, OpenAI `gpt-5.x`) are beyond training cutoff — reported as vendor-stated.

## The three tiers

| Tier | What it is | Who owns the loop / tools / state |
|---|---|---|
| **1 · Single call** | one Messages-API call — no loop, no tools, no state | you own nothing (there is no loop) |
| **2 · Build the loop** | Claude API + tool use; you run the loop, or the beta **Tool Runner** (`client.beta.messages.tool_runner`, "handles the agentic loop, error wrapping, and type safety") | **you** own the loop, tool execution, context, persistence — offload individual jobs with server-side primitives (below) |
| **3 · Buy the harness** | **Claude Managed Agents** (Anthropic runs it) or **OpenAI Responses API + Agents SDK / Agent Builder** | vendor owns the loop, sandbox, tool execution, and server-side state |

Anthropic frames it verbatim: Messages API = "Custom agent loops and fine-grained control"; Managed Agents "provides the harness and infrastructure … Instead of building your own agent loop, tool execution, and runtime, you get a fully managed environment." The doc's real decision signals: long-running/async, needs a sandbox, stateful sessions, scheduled cron, minimal infra → *buy*; custom loop / fine-grained control / provider portability → *build*. (The "complexity/value/viability/cost-of-error" four-axis framing is the general add-complexity-only-when-it-helps heuristic, not a doc artifact.)

### A hybrid inside Tier 2

Anthropic **server tools** run a *vendor-hosted inner loop* for Anthropic's own tools: a `server_tool_use` block (`srvtoolu_*`) executes on Anthropic infra, result returns same turn; long turns pause with `stop_reason: "pause_turn"`. But when a server tool and a *client* tool are called together, `stop_reason` is `"tool_use"` and you must run the client tool — so **you still host the outer loop**. Verified: `web_search_20250305`, `web_fetch_20250910` (ZDR-eligible); dynamic-filtering `_20260209`+ use code execution and aren't ZDR-eligible unless `allowed_callers: ["direct"]`.

## What Managed Agents actually runs for you

Four objects (verified verbatim, beta header `managed-agents-2026-04-01`):

- **Agent** — `POST /v1/agents`; a persistent, *versioned* config (model + system prompt + tools + MCP servers + skills). Created once, referenced across sessions.
- **Environment** — `POST /v1/environments`; the sandbox config — Anthropic-managed cloud sandbox **or a self-hosted sandbox on your own infra**. (Corrects the "session creates the container" mis-framing: the *Environment* defines the sandbox; a Session references an `environment_id`.)
- **Session** — `POST /v1/sessions` (`{agent, environment_id, …}`); a running instance — provisions the sandbox but does nothing until you send a `user.message`.
- **Events** — `POST /v1/sessions/{id}/events`; SSE stream (docs are internally inconsistent on the exact path — `/events/stream` vs `/stream`). `{domain}.{action}`: `user.message`/`user.interrupt` steer; `agent.message`/`agent.tool_use`/`session.status_idle` report; history persisted server-side.

On a user event the platform provisions the sandbox, **"runs the agent loop,"** executes tools **inside the hosted sandbox** (`agent_toolset_20260401`: bash/read/write/edit/glob/grep/web_fetch/web_search, per-tool `permission_policy`), streams events, emits `session.status_idle`. So Anthropic hosts **both the loop and the tool sandbox** — but you can self-host the *compute* (`self_hosted` environment) while it keeps orchestration, so "buy the harness" and "own the compute" are separable.

**OpenAI's altitude is lower.** The **Responses API** (`POST /v1/responses`) is server-*stateful* (`store` default ~30d; chain via `previous_response_id` / `conversation`) and runs hosted tools, but **the caller still drives each turn** — not a hosted loop. The hosted loop lives in the **Agents SDK**, which runs *in your process*. **Agent Builder** is the visual buy surface (vendor-stated shutdown 2026-11-30 — flagged, single-source).

## Server-side primitives that offload harness work (Tier 2)

Each takes over one hand-coded job. **Deduped** — the memory tool and server-side compaction are owned by context nodes, referenced not re-owned:

| Primitive | Identifier | Offloads (owning node) |
|---|---|---|
| Server-side compaction | `compact_20260112` | rolling-summary compaction → [context-compaction](context-compaction.md) |
| Memory tool | `memory_20250818` (GA) | cross-session memory → [context-storage-and-hydration](context-storage-and-hydration.md) (client-side; distinct from Managed Agents' server-side memory stores) |
| Context editing | `clear_tool_uses_20250919` | stale-tool-result pruning → [context-engineering](../topics/context-engineering.md) |
| Task budgets | `output_config.task_budget` (`task-budgets-2026-03-13`) | loop cost control → [step-budget-and-runaway-control](step-budget-and-runaway-control.md). **Advisory** (soft; `max_tokens` is the hard cap) |
| Advisor tool | `advisor_20260301` | in-loop model escalation (fast executor consults a stronger advisor) — relates to [multi-agent-delegation](../topics/multi-agent-delegation.md) but is a single-request mechanism, not a sub-agent |
| Tool search | `tool_search_tool_*_20251119` (GA) | dynamic tool-catalog / tool-RAG → [tool-selection-and-routing](tool-selection-and-routing.md) (`defer_loading: true`) |

*(Flagged: advisor / task-budgets / context-editing are verified as **Messages-API Tier-2** features; whether they're exposed *inside* the Managed Agents surface was not confirmed.)*

## Tradeoffs

- **Compliance (hard, not perf).** Managed Agents is **stateful by design → NOT ZDR- or HIPAA-BAA-eligible.** A self-hosted Tier-2 loop on the stateless Messages API can be ZDR-eligible, and the Tier-2 helpers are individually ZDR-eligible.
- **Cloud-provider parity — the buy tier doesn't travel.** Managed Agents + server-side tools are **NOT on Amazon Bedrock / Google Vertex / Microsoft Foundry** (those get Messages API + *client-executed* tools only; Vertex uniquely adds server-side `web_search`). But **"Claude Platform on AWS"** (Anthropic-operated) *does* carry Managed Agents — so it's **"not on Bedrock," not "not on AWS."** Portability rule: to stay cross-cloud, confine the design to Messages API + client-executed tools and run your own loop.
- **Lock-in is symmetric.** OpenAI's `store`/`previous_response_id`/`conversation` + hosted tools are equally proprietary; only the Agents SDK layer is provider-agnostic. Buying *any* managed harness is a category cost, not an Anthropic-specific one.

## Positioning vs MCP / A2A / frameworks (they compose, they don't compete)

- **vs MCP** — MCP is the tool/context interop *protocol*; a managed runtime is a first-class MCP **client** (Managed Agents `mcp_servers[]` + `{type:"mcp_toolset"}`; OpenAI `type:"mcp"`). **Buying the harness does NOT lock you out of MCP or custom tools** — Managed Agents also runs developer-defined `type:"custom"` tools. You trade **loop control**, not **tool openness**. See [mcp-tool-layer](mcp-tool-layer.md).
- **vs A2A** — the open agent-to-agent protocol is **not referenced in either vendor's fetched docs** (flagged). Anthropic's cross-agent story is *proprietary in-session* multi-agent (coordinator + context-isolated threads, depth 1, ≤20 agents) — an instance of [multi-agent-delegation](../topics/multi-agent-delegation.md), not A2A.
- **vs DIY frameworks** — LangGraph / the standalone Agents SDK are what you drop to for custom control-flow, custom persistence, or portability. The managed outcomes/grader loop (`user.define_outcome` + rubric in a separate context window) is a vendor instance of the [self-improving-harness](self-improving-harness.md) propose-evaluate pattern.

## The one rule

**Name the boundary, then buy above it.** Draw the line between what the vendor runs (loop, sandbox, state) and what you keep (tools, MCP servers, custom logic). Buying the harness costs loop control, ZDR/HIPAA eligibility, and cross-cloud portability — but not tool openness. If those three don't bind, the managed API deletes the most harness code; if any one binds, stay at Tier 2 and offload individual jobs with server-side primitives.

## See also

[agent-harness](../topics/agent-harness.md) (the artifact this decides whether to build or buy), [mcp-tool-layer](mcp-tool-layer.md) (tool interop that survives either choice), [self-improving-harness](self-improving-harness.md) (the managed grader loop is one instance), [action-execution-safety](../topics/action-execution-safety.md) (`permission_policy`, credential vaults, the compliance tradeoffs).
