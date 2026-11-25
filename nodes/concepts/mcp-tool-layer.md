---
id: mcp-tool-layer
type: concept
tags: [agent, tool-use, mcp, protocol, interop, standards, transport]
related:
  - [[tool-use-design]]
  - [[tool-schema-design]]
  - [[tool-selection-and-routing]]
  - [[tool-result-grounding]]
  - [[paginated-tool-contract]]
  - [[prompt-injection-and-isolation]]
  - [[code-execution-sandbox-pattern]]
  - [[agent-skills-progressive-disclosure]]
  - [[managed-agent-apis]]
  - [[references-model-context-protocol]]
  - [[skill-injection-decision]]
  - [[just-in-time-context]]
  - [[confirm-before-act]]
  - [[run-state-model]]
  - [[mcp-vs-direct-api]]
  - [[mcp-tasks-long-running-tools]]
status: living
created: 2026-07-10
summary: "the Model Context Protocol as the de-facto tool-interop standard — what it standardizes, the current stateless 2026-07-28 spec, the client-side MUSTs, and what 2026 papers show about failures and security."
---

# MCP Tool Layer

The rest of the [tool-use-design](../topics/tool-use-design.md) cluster teaches tool principles generically — schema, selection, grounding, pagination. **The Model Context Protocol (MCP) is the concrete standard those principles are most often shipped through.** This node names it: what MCP standardizes on the wire, which version is current, where the "stateless" story really stands, and — the genuinely un-owned part — what an agent that *consumes external MCP servers* is normatively required to enforce as the client/host.

Security-attack *taxonomy* is **not** owned here — tool-poisoning / rug-pull / tool-shadowing and the blast-radius argument live in [prompt-injection-and-isolation](prompt-injection-and-isolation.md); this node covers only the protocol-level client obligations the spec writes down.

## What MCP standardizes

MCP is a client-server protocol over **JSON-RPC 2.0** with an `initialize` handshake and capability negotiation. Its primitives:

| Side | Primitive | What it is |
|---|---|---|
| **Server** | Tools | model-invokable functions (`name`+`title`+`description`+`inputSchema`+optional `outputSchema`) |
| | Resources | readable context (files, records) addressed by URI |
| | Prompts | reusable prompt templates the user/host invokes |
| **Client** (server-initiated) | Sampling | server asks the host's model to complete (nested/agentic behavior) |
| | Roots | server inquires about the client's URI/filesystem boundaries |
| | Elicitation | server requests structured user input mid-call |

Transport is **stdio** (local subprocess) and **Streamable HTTP** (remote). Discovery calls (`tools/list`, `resources/list`, `prompts/list`) are cursor-paginated, with `listChanged` notifications. MCP is the *transport + discovery + schema* layer; it deliberately does **not** solve which-of-40-tools-to-fire (that stays a client/vendor concern).

## Native tool call vs MCP tool call

At the model layer these are **identical** — the LLM always emits a *tool call* (name + JSON args). MCP is not a different model primitive; it's a choice of **where the tool lives and how it's reached**:

| | Native / in-process tool | MCP tool |
|---|---|---|
| Defined by | you, in your harness ([tool-schema-design](tool-schema-design.md)) | a separate server, advertised via `tools/list` (can change under you) |
| Executed | in-process, your code | out-of-process, often third-party, over JSON-RPC |
| Trust | trusted | **trust boundary** — the description is model-visible & mutable → [prompt-injection-and-isolation](prompt-injection-and-isolation.md) |
| Payoff | low latency, tight coupling | plug in *any* MCP server without bespoke glue; + resources/prompts/elicitation |

Two things stay identical either way: the model-side JSON-Schema contract, and that a **result is untrusted data, not instructions** ([tool-result-grounding](tool-result-grounding.md)). Choose native for owned/trusted/latency-sensitive capability; MCP when interop/reuse beats latency and you accept a trust boundary. The full decision, with evidence, is in [mcp-vs-direct-api](mcp-vs-direct-api.md).

## Current spec version: 2026-07-28

The current protocol version is **2026-07-28**, released as stable on 2026-07-28 after a release candidate on 2026-05-29; it supersedes **2025-11-25** ([versioning](https://modelcontextprotocol.io/specification/versioning), [changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog), fetched 2026-11-20). Version strings are `YYYY-MM-DD` marking the last backwards-incompatible change. *Correction: an earlier version of this node said MCP had no release-candidate tier and that 2026-07-28 was an unshipped target. Both were wrong; the project published a 2026-07-28 RC and then the stable release.*

**MCP is now stateless at the protocol level.** The changes a task-agent builder must know:

| Change | What it means for you |
|---|---|
| No `initialize` handshake; version and client capabilities travel in every request's `_meta` (SEP-2575) | No per-connection setup to keep alive. A mandatory `server/discover` call returns versions, capabilities, and identity. |
| No protocol sessions or `Mcp-Session-Id` header (SEP-2567) | State that spans calls goes in "explicit, server-minted handles passed as ordinary tool arguments." Store those handles in your [run-state-model](run-state-model.md). |
| Server-initiated requests replaced by **multi round-trip requests** (SEP-2322) | The server returns `input_required` with `inputRequests`, and the client retries the original call with answers. Elicitation and confirmation prompts now flow through this. |
| Tasks moved to an extension, `io.modelcontextprotocol/tasks` (SEP-2663) | Long-running work is polled with `tasks/get`. |
| `tools/list` SHOULD return a fixed order; list results carry `ttlMs` and `cacheScope` (SEP-2549) | Stable order protects the prompt cache — see [harness-token-economics](harness-token-economics.md). |
| Credentials bound to the issuing authorization server; clients MUST check `iss` (SEP-2352, SEP-2468) | Never reuse a token with another server. |
| Deprecated: Roots, Sampling, Logging, the HTTP+SSE transport, and Dynamic Client Registration | Still work during a 12-month window; plan migrations. |

**Release cadence is now fixed.** Starting with **2027-03-30**, specs ship on the last Tuesday of March and September, and proposals that miss a cutoff move to the next release ([release-cycle post](https://blog.modelcontextprotocol.io/posts/mcp-release-cycle/), 2026-11-11). Which features land in 2027-03-30 is not yet published; an early file upload/download extension was announced 2026-11-10.

## What an MCP-consuming task agent MUST enforce

Client/host-side normative MUSTs (from the *Security Best Practices* living doc + transport spec) — the genuinely new material:

| Obligation | Requirement |
|---|---|
| **Token audience** | MUST implement Resource Indicators (RFC 8707) to scope tokens to the specific server. |
| **OAuth URL validation** | MUST validate auth URLs; allow only `http(s):`; **reject `javascript:`/`data:`/`file:`/`vbscript:`**; MUST NOT use shell commands to open URLs. |
| **SSRF on discovery** | Server-side clients MUST consider SSRF when fetching OAuth discovery URLs. (Blocking `169.254.0.0/16` etc. is a SHOULD, per RFC 9728.) |
| **One-click local launch** | MUST get consent *and* **show the exact command without truncation** before executing (sandboxing the local server is a SHOULD). |
| **Transport hygiene** | MUST send `MCP-Protocol-Version` header; MUST `Accept` both `application/json` and `text/event-stream`; MUST handle session IDs securely; MUST start a new session on HTTP 404. |

Keep the strength honest: **HITL consent before tool invocation is a *principle* the spec says it "cannot enforce"** (SHOULD), not a protocol MUST; **least-privilege / scope-minimization is SHOULD**. The only all-caps consent MUST is the one-click-local-launch case. The strongest MUSTs are *server-side* (no token passthrough, non-deterministic session IDs, `Origin` validation) — a consuming agent's leverage is **server selection**: treat them as a trust checklist. The spec's one hook to the poisoning literature: tool descriptions/annotations "should be considered untrusted, unless obtained from a trusted server," and the behavioral hints (`readOnlyHint`, `destructiveHint` [default true], `idempotentHint`, `openWorldHint`) are **advisory only** — authority is enforced at the tool boundary, never read off the annotation (→ [prompt-injection-and-isolation](prompt-injection-and-isolation.md)).

## What the late-October 2026 papers add

Sources in [references-model-context-protocol](../references/references-model-context-protocol.md); abstracts fetched 2026-11-01, numbers author-reported.

- **Plan for tool failure; a bigger model will not absorb it.** Injecting faults drawn from 57,240 real MCP issue threads cut task completion 60%, and a 120B model kept no larger share of its fault-free score than a 20B one. Treat timeouts, errors, and partial results as normal traffic.
- **The interface changes behavior even when capabilities match.** The same operations exposed through MCP and through a command line produced different success, cost, and recovery in 94.3% of 2,004 paired episodes. Test both before choosing.
- **Approving a call can grant more than the call.** A local server's process often has broad filesystem access: 16.4% of triaged servers that claimed no filesystem function could reach host files, yielding 13 security advisories. Sandbox local servers to their declared scope.
- **A tool's description is not its identity.** Over eleven weeks, 7 of 59 real tools changed behavior despite version pins. Probing a tool's responses against a trusted reference catches a swapped implementation; description matching does not.
- **Tool metadata is an injection channel, and so are traces.** A logging instruction hidden in tool metadata made agents leak the query and responses in 62.6–100% of model-server pairs while the real task still succeeded. Separately, tool-call traces alone let an observer infer user attributes well above chance.
- **Multi-tool retrieval fails silently.** With four or more required tools, retrievers returned the full set only 8–17% of the time at k = 10, against 58–67% for single-tool queries. Measure whether the *whole* set came back.

## What the November 2026 papers add

From [references-model-context-protocol](../references/references-model-context-protocol.md); abstracts fetched 2026-11-20.

- **Destructive tools mostly have no human gate.** In a sample of the official registry, an estimated 90% of destructive tools had no server-side confirmation, and 32 of 41 popular hosts and SDKs had no default approval step. Enforce approval in your own host for anything not annotated read-only — see [confirm-before-act](confirm-before-act.md).
- **Writing code against tools beat calling them directly.** Across 12 servers and up to 1,958 distractor tools, code mode cut tokens 70–90%; adding a tool-preselecting router in front of it did not help significantly.
- **Defenses live in the model, not the framework.** Across 12 agent frameworks, nine sat within 23–26% attack success, and none implemented an intentional defense against tool poisoning.

## How MCP maps onto the tool cluster

| Node | MCP instantiates it as… |
|---|---|
| [tool-schema-design](tool-schema-design.md) | the Tool object (`inputSchema`+`outputSchema`, JSON Schema 2020-12); MCP *is* the schema layer |
| [tool-selection-and-routing](tool-selection-and-routing.md) | `tools/list`+`listChanged` discovery, but **no native tool-search/routing** — the many-tools problem stays a client concern *above* MCP |
| [tool-result-grounding](tool-result-grounding.md) | `CallToolResult` = `content` + optional `structuredContent`; two-tier errors (Protocol vs Tool-Execution, `isError`), with SEP-1303 routing validation errors to the model "to enable self-correction" — errors-as-instructions confirmed |
| [paginated-tool-contract](paginated-tool-contract.md) | opaque `cursor`/`nextCursor`, server-set page size, invalid cursor → `-32602`. *Precision:* `page_size`/`filter`/`total_count` are **Anthropic authoring conventions, not MCP** — MCP standardizes only the cursor |
| [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) | the wire beneath large results (MCP's *security* sandbox of local servers ≠ that node's *context-saving* sandbox) |
| [agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md) | list/discovery + Resources/Prompts = the protocol-level analogue of surfacing capability on demand |

## A server that wraps tools the agent can already run (2026)

An MCP server earns its cost when it exposes something the agent cannot reach otherwise: a remote API, credentials it must not hold, or state that lives elsewhere. When it only wraps command-line tools the agent can already call from a shell, it adds tool definitions to the context and a layer of indirection for no new capability.

One measured case, from the agent-tooling ecosystem around reverse-engineering software. The `leanrea` project ([README](https://github.com/aicodeking/leanrea), fetched 2026-10-19) replaced a large MCP server with a single 8 KB skill file that tells the agent which existing command to run. Its own benchmark reports:

| Arm | Wall time | Cost | Score |
|---|---|---|---|
| Skill file only | 388 s | $2.17 | 74/75 |
| MCP server plus its skill | 627 s | $3.36 | 75/75 |
| No skill | — | — | 67/75 |

That is 38% less time and 35% lower cost at near-equal accuracy, and the author puts the context cost of a trivial prompt at 400.7k tokens with the server versus 34.5k without. **Treat it as one data point:** the author is a competing project, and the README states "Only 3 reps per cell, one model, one machine." It also concedes the plain model was "already good at this" — the skill beat no skill by a smaller margin than it beat the server.

The graph's reading: before adding an MCP server, ask whether it provides access or only description. Description belongs in a skill ([skill-injection-decision](skill-injection-decision.md)); access belongs in a tool. Tool search narrows the gap by deferring definitions ([just-in-time-context](just-in-time-context.md)), but the indirection remains.

**Servers now ship skills, tasks, and confirmation prompts in Claude.** As of 2026-11-24, MCP servers can deliver skills alongside tools (public beta), run long-running work through the Tasks extension, and pause for user input through elicitation — for example, Supabase confirming destructive SQL and GitHub requiring the repo name before deletion ([announcement](https://claude.com/resources/articles/skills-over-mcp-tasks-and-more)). Anthropic reports over 700 million monthly SDK downloads and over 10,000 connectors for Claude. See [agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md).

## New primitives worth naming (candidate future nodes)

- **Elicitation** — server-initiated structured user input mid-call: **form mode** (flat primitives; servers MUST NOT request secrets) and **URL mode** (SEP-1036, pushes sensitive input out-of-band). A protocol-level HITL primitive — strong candidate for its own node cross-linking [confirm-before-act](confirm-before-act.md).
- **Tasks** — now the `io.modelcontextprotocol/tasks` extension (SEP-2663); covered in [mcp-tasks-long-running-tools](mcp-tasks-long-running-tools.md).

## See also

[tool-use-design](../topics/tool-use-design.md) (home topic MCP concretizes); [prompt-injection-and-isolation](prompt-injection-and-isolation.md) (the attack taxonomy this defers to); [paginated-tool-contract](paginated-tool-contract.md) / [tool-result-grounding](tool-result-grounding.md) (the nodes MCP most directly instantiates).
