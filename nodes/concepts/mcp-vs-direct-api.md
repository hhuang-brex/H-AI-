---
id: mcp-vs-direct-api
type: concept
tags: [mcp, rest, openapi, tool-use, interop, architecture]
summary: "when to reach a service through an MCP server versus calling its REST API directly from your own tool: what MCP adds on top of an API, what it costs, and why most MCP servers are thin API wrappers."
related:
  - [[mcp-tool-layer]]
  - [[tool-schema-design]]
  - [[tool-result-grounding]]
  - [[paginated-tool-contract]]
  - [[code-execution-sandbox-pattern]]
  - [[tool-selection-and-routing]]
  - [[just-in-time-context]]
  - [[idempotency-keys]]
  - [[action-authority]]
  - [[confirm-before-act]]
  - [[prompt-injection-and-isolation]]
  - [[references-model-context-protocol]]
  - [[tool-use-design]]
  - [[skill-lifecycle-and-drift]]
  - [[run-state-model]]
  - [[background-agent-execution]]
  - [[agent-skills-progressive-disclosure]]
status: living
created: 2026-11-24
---

# MCP vs a Direct API

The question usually arrives as "MCP or REST?", but they are not alternatives at the same layer. A **REST API** is how a service exposes operations to any program. **MCP** is a protocol for how an AI application *discovers and calls* tools, and most MCP tools are themselves calls to a REST API underneath. The real choice is whether your agent reaches a service **through an MCP server** or **through a tool you write that calls the API directly**.

## What MCP adds on top of an API

From the [MCP architecture docs](https://modelcontextprotocol.io/docs/learn/architecture) (fetched 2026-11-24):

| MCP adds | A direct API gives you instead |
|---|---|
| **Discovery at runtime** — `tools/list` returns names, descriptions, and JSON schemas the model reads, and lists can change | A fixed set of tools you define in your harness |
| **One client for every server** — the same protocol for local (stdio) and remote (HTTP) tools | A bespoke client per API |
| **Primitives beyond actions** — resources for context, prompts as templates, and elicitation to ask the user mid-call | Only the operations the API exposes |
| **Agent-shaped extras** — change notifications, cacheable list results, the Tasks extension for long jobs, and skills shipped with the server | Whatever you build yourself |

At the model layer the two are identical: the model emits a tool call with a name and JSON arguments either way ([mcp-tool-layer](mcp-tool-layer.md)).

## What the evidence shows

- **Most MCP servers are thin API wrappers.** Of 116 official servers, 88.6% are fully or partly backed by REST, and 92% implement tools as bare API wrappers. They expose a median of **19%** of the underlying operations ([2507.16044](https://arxiv.org/abs/2507.16044)). The value is the packaging, not new capability.
- **A wrapped API inherits the API's documentation problems.** One company exposing 16 production APIs (about 600 endpoints) through MCP saw systematic failures in planning, tool choice, and payload construction. An audit found 2,450 documentation and REST "smells," present in every endpoint ([2605.14312](https://arxiv.org/abs/2605.14312)). Fix the API description before blaming the model.
- **Error messages written for developers break agents.** In 150 popular MCP servers, about a third of 3,001 error messages tell the caller what to do next, often something an agent can't do: run a terminal command, edit a config, or "wait before retrying." Naming a server tool in the error raised credential-error recovery from 45% to 84% ([2609.35381](https://arxiv.org/abs/2609.35381)).
- **The harness matters more than the interface.** On one git task across seven agent scaffoldings, two with no MCP support finished every run through the command line and were 5–28× cheaper than the scaffoldings that support MCP ([2608.08654](https://arxiv.org/abs/2608.08654)). A separate study found identical capabilities behaved differently through MCP versus a CLI in 94.3% of paired episodes ([mcp-tool-layer](mcp-tool-layer.md)).
- **Loading many tool definitions is the main cost.** Context use grows with every registered tool, so real deployments expose only a fraction of an organization's APIs ([2605.05247](https://arxiv.org/abs/2605.05247)). OpenAPI itself is verbose for a model: a compact format cut tokens 85.5% versus OpenAPI YAML across five production specs ([2602.18541](https://arxiv.org/abs/2602.18541)).
- **Security risks differ in kind, not just in degree.** Across 3,250 attack scenarios, in-process function calling had a higher overall attack success rate (73.5% vs 62.6%), but MCP had more model-side exposure such as prompt injection ([2507.06323](https://arxiv.org/abs/2507.06323), 2025 preprint).

## Skills, tasks, and elicitation move MCP up the stack

By late 2026 an MCP server can supply more than actions: skills (public beta in Claude), long-running tasks through the Tasks extension, and pauses to ask the user through elicitation ([announcement](https://claude.com/resources/articles/skills-over-mcp-tasks-and-more), 2026-11-24). Anthropic's framing is that Claude can treat a server "more like it works with another agent."

| Agent layer | Before | Now |
|---|---|---|
| Knowledge | Tool names, descriptions, schemas | Plus skills — procedures that load only when needed |
| Planning | The agent works out how to combine tools | Skills spell out the procedure; a task can run a whole agent loop server-side |
| Action | One call, one result, and the agent waits | A task returns a handle; the agent keeps working and polls with `tasks/get` |
| Human approval | Only the host decides whether to ask | The server can pause a call for user input |
| State | Protocol sessions | Removed in 2026-07-28; state travels as server-issued handles, task handles included |

The graph's reading of what this means for a builder — not a claim the sources make:

- **The trust boundary widens.** A third-party server now puts instructions (skills) into your context and can prompt your user. All of it is untrusted text ([prompt-injection-and-isolation](prompt-injection-and-isolation.md)).
- **Behavior can change without you changing anything.** Skills update with the server, so re-run evals when a server you depend on updates ([skill-lifecycle-and-drift](skill-lifecycle-and-drift.md)).
- **The loop must handle waiting.** Store task handles in the [run-state-model](run-state-model.md) and decide what the agent does while a task runs ([background-agent-execution](background-agent-execution.md)).
- **Approval is split, and gaps fall between the halves.** About 90% of destructive tools lack server-side confirmation and 32 of 41 hosts don't ask by default ([2611.02527](https://arxiv.org/abs/2611.02527)). Keep your own gate for irreversible actions.
- **The case for MCP strengthens for vendor services.** A server shipping skills, tasks, and confirmations is far more than a thin wrapper. For a service you own that only your agent calls, a direct tool is still simpler.

Support varies by client: the features are in the open spec, but each host implements them separately.

## The decision

The graph's rule, synthesized from the above:

| Situation | Prefer |
|---|---|
| You own the service, it is latency-sensitive, and only your agent calls it | **A direct tool** in your harness — tighter schemas, no extra process, no third-party trust boundary |
| You need a vendor's capability and they maintain an official MCP server | **The MCP server** — someone else keeps it in sync with the API |
| Many agents or clients need the same tools | **MCP** — write once, every compatible host can use it |
| The agent can already reach the service through a CLI or SDK in a sandbox | **Code or the CLI** — usually cheaper, and the [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) keeps large results out of context |
| Hundreds of endpoints | **A gateway or code mode over a compact spec**, not one MCP tool per endpoint — see [tool-selection-and-routing](tool-selection-and-routing.md) |
| The action is irreversible | Either — but enforce approval in *your* host, because most MCP servers and hosts don't ([confirm-before-act](confirm-before-act.md)) |

## Pitfalls

- **Wrapping every endpoint as a tool.** A median server exposes about a fifth of its API for a reason: each tool costs context and selection accuracy.
- **Passing through raw API errors.** Rewrite them so the next step names a tool the agent can actually call.
- **Trusting a generated server.** Automated generation from OpenAPI is imperfect and drifts as the API changes; regenerate incrementally and test.
- **Forgetting idempotency.** An MCP wrapper rarely adds retry safety the API lacks — see [idempotency-keys](idempotency-keys.md).
- **Treating server descriptions as trusted.** A third-party server's tool descriptions and results are untrusted text in your context ([prompt-injection-and-isolation](prompt-injection-and-isolation.md)).

## References

Sources and the wider MCP literature are in [references-model-context-protocol](../references/references-model-context-protocol.md). All arXiv numbers are author-reported and were read at the abstract only, fetched 2026-11-24.
