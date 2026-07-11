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
status: living
created: 2026-07-10
summary: "the Model Context Protocol as the de-facto tool-interop standard — what it standardizes (JSON-RPC primitives + transport), the current 2025-11-25 spec, the stateless work that lives only in draft, and the client-side MUSTs an agent consuming external MCP servers must enforce."
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

Two things stay identical either way: the model-side JSON-Schema contract, and that a **result is untrusted data, not instructions** ([tool-result-grounding](tool-result-grounding.md)). Choose native for owned/trusted/latency-sensitive capability; MCP when interop/reuse beats latency and you accept a trust boundary.

## Current spec version: 2025-11-25

The current protocol version is **2025-11-25**, superseding **2025-06-18** (a common stale belief — including this node's origin brief — is that 2025-06-18 is current; it is not). Two facts: version strings are `YYYY-MM-DD` marking the last *backwards-incompatible* change (not semver); revisions are labelled only **Draft / Current / Final** — **there is no "RC" tier in MCP**, so any "MCP RC" reference is a category error. Notable 2025-11-25 additions: experimental **Tasks** (durable/pollable requests, SEP-1686), URL-mode elicitation (SEP-1036), JSON Schema 2020-12 as default dialect (SEP-1613), input-validation failures routed to Tool Execution Errors for model self-correction (SEP-1303). *(SEP numbers are changelog-verified; the changelog's SEP↔PR pairings look transposed, so treat specific PR numbers as unverified.)*

## The stateless direction — confirmed scope only

The current *published* protocol is **stateful** (initialize handshake, capability negotiation, server-initiated features) — that's what you build against today.

- **No shipped "stateless mode."** In Streamable HTTP, session management is *optional* — a server MAY assign a session ID. Statelessness is a *deployment posture*, not a spec toggle. SEP-1699 (2025-11-25) lets servers drop SSE streams so clients poll/reconnect — a scalability affordance, not stateless mode.
- **A genuinely stateless protocol exists only in the DRAFT**: SEP-2575 "Make MCP Stateless" (merged to draft 2026-05-11) moves protocol metadata into the message body; SEP-2322 "Multi Round-Trip Requests (MRTR)" (merged 2026-05-06) is the stateless replacement for server-initiated requests (the server response carries `inputRequests`; the *client* drives the follow-up).
- **As of 2026-07-10 there is no dated stateless release** — tracking issues open, SDK support partial. A "2026-07-28 stateless RC" is an unshipped future target (and MCP has no RC tier).

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

## How MCP maps onto the tool cluster

| Node | MCP instantiates it as… |
|---|---|
| [tool-schema-design](tool-schema-design.md) | the Tool object (`inputSchema`+`outputSchema`, JSON Schema 2020-12); MCP *is* the schema layer |
| [tool-selection-and-routing](tool-selection-and-routing.md) | `tools/list`+`listChanged` discovery, but **no native tool-search/routing** — the many-tools problem stays a client concern *above* MCP |
| [tool-result-grounding](tool-result-grounding.md) | `CallToolResult` = `content` + optional `structuredContent`; two-tier errors (Protocol vs Tool-Execution, `isError`), with SEP-1303 routing validation errors to the model "to enable self-correction" — errors-as-instructions confirmed |
| [paginated-tool-contract](paginated-tool-contract.md) | opaque `cursor`/`nextCursor`, server-set page size, invalid cursor → `-32602`. *Precision:* `page_size`/`filter`/`total_count` are **Anthropic authoring conventions, not MCP** — MCP standardizes only the cursor |
| [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) | the wire beneath large results (MCP's *security* sandbox of local servers ≠ that node's *context-saving* sandbox) |
| [agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md) | list/discovery + Resources/Prompts = the protocol-level analogue of surfacing capability on demand |

## New primitives worth naming (candidate future nodes)

- **Elicitation** — server-initiated structured user input mid-call: **form mode** (flat primitives; servers MUST NOT request secrets) and **URL mode** (SEP-1036, pushes sensitive input out-of-band). A protocol-level HITL primitive — strong candidate for its own node cross-linking [confirm-before-act](confirm-before-act.md).
- **Tasks** (SEP-1686, *experimental*) — durable/pollable long-running requests; widens the session-enumeration threat surface.

## See also

[tool-use-design](../topics/tool-use-design.md) (home topic MCP concretizes); [prompt-injection-and-isolation](prompt-injection-and-isolation.md) (the attack taxonomy this defers to); [paginated-tool-contract](paginated-tool-contract.md) / [tool-result-grounding](tool-result-grounding.md) (the nodes MCP most directly instantiates).
