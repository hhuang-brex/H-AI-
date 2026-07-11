---
id: tool-selection-and-routing
type: concept
tags: [agent, tool-use, routing, selection, scale]
summary: "helping the model pick the right tool when there are many — disambiguation, hierarchical routing, and keeping the active set small."
related:
  - [[references-task-agent-design]]
  - [[tool-use-design]]
  - [[tool-schema-design]]
  - [[tool-result-grounding]]
  - [[intent-and-disambiguation]]
  - [[recency-bias-prompt-design]]
  - [[mcp-tool-layer]]
status: living
created: 2026-06-11
---

# Tool Selection & Routing

With a handful of tools, the model picks correctly from the schema alone. As the toolset grows, selection accuracy falls off a cliff — the model confuses similar tools, ignores the right one buried in a long list, or freezes. Routing is how you keep selection sharp at scale.

## Selection degrades with count

Empirically, accuracy drops as the number of in-context tools rises, well before any hard limit. The mechanism is the same as any long-context problem: middle-of-list tools get less attention, and near-synonym tools compete. Two levers fight this — fewer tools in context, and sharper boundaries between the ones that remain.

## Keep the active set small

The highest-leverage move is **not showing the model every tool every turn.** Options, cheapest first:

| Technique | How | When |
|---|---|---|
| **Static subsetting** | Only load tools relevant to the current task/phase | Toolset partitions cleanly by phase |
| **Hierarchical routing** | A cheap first call picks a *category*; only that category's tools are exposed next | Many tools in a few clear groups |
| **Retrieval over tools** | Embed tool descriptions; surface top-k for the current intent | Large, flat, weakly-grouped toolset |

Most agents need only static subsetting. Reach for retrieval-over-tools only when the catalog is genuinely large and unstructured (YAGNI).

## 2026 update — the tool search tool makes retrieval-over-tools first-class

The "retrieval over tools" row above is now a server-side primitive. Anthropic's **tool search tool** (`tool_search_tool_regex_20251119` / `tool_search_tool_bm25_20251119`) lets you mark tools `defer_loading: true`; Claude searches their names/descriptions/arg-names on demand and the API expands only the **3–5 most relevant** `tool_reference` blocks into full definitions — cutting tool-definition tokens by **>85%** (a ~55k-token multi-server setup loads only what the request needs). Deferred tools are *appended*, not swapped into the prefix, so **prompt caching is preserved**. It also quantifies this node's headline claim: selection accuracy "degrades significantly once you exceed 30–50 available tools," and on-demand surfacing keeps it high across thousands (max 10,000). Source: [tool-search-tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool).

A complementary lever for the *round-trip* cost (not selection): **programmatic tool calling** — Claude writes code that invokes tools inside a code-execution container, so intermediate results are filtered *before* entering the context window and N sequential calls collapse into one script. Reported +11% on agentic-search benchmarks at **24% fewer input tokens** ([docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)). Reach for it when chaining many calls or when intermediate payloads are large.

## Disambiguation is mostly a schema job

Before adding a router, fix the descriptions. Two tools that could fire for the same intent must each say what distinguishes them — this is covered in [tool-schema-design](tool-schema-design.md) and is the cheapest accuracy gain available. Routing infrastructure compensates for *scale*, not for *vague schemas*.

## Selection is intent classification

Picking a tool is the same problem as picking a user's intent — see [intent-and-disambiguation](intent-and-disambiguation.md). When the intent is ambiguous, the right move may be to *ask* rather than guess a tool, especially if the candidate tools differ in reversibility.

## Pitfalls

- **Adding a router before fixing schemas.** You'll route to a category and still coin-flip inside it.
- **Ordering effects.** Tool list order biases selection; the model over-picks early and late entries. See [recency-bias-prompt-design](recency-bias-prompt-design.md).
- **Routing that hides the needed tool.** An over-aggressive subsetter that drops the one tool the task needed — the agent then can't act and doesn't know why.
- **No "none of these" option.** If the right answer is "no tool applies, ask the user," the model needs that as an explicit choice or it will force a wrong call.

## References

[tool-schema-design](tool-schema-design.md) determines whether selection is even possible; [tool-result-grounding](tool-result-grounding.md) is what happens after the pick.
