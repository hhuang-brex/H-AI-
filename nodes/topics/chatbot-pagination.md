---
id: chatbot-pagination
type: topic
tags: [chatbot, pagination, ux, tool-use, conversation-design]
related:
  - [[domain-chatbot-design]]
  - [[llm-output-design]]
  - [[truncated-pyramid-results]]
  - [[paginated-tool-contract]]
  - [[code-execution-sandbox-pattern]]
  - [[domain-knowledge-injection]]
  - [[cost-aware-eval]]
  - [[forced-tool-call-output]]
  - [[sms-multi-thread-chatbot]]
status: living
created: 2026-06-09
summary: "handling large result sets in a chatbot; UX shape and tool shape chosen jointly."
source-thread: [[2026-06-09-chatbot-pagination-research]]
---

# Chatbot Pagination

How a chatbot handles "show me my last 90 days of transactions" or "find every customer in California with >$10k spend" — when the answer is 500 to 50,000 rows.

## The thesis (verified across NN/g and Anthropic primary sources)

**Invert the traditional list-pagination model.** Don't show "page 1 of N raw rows." Deliver a summary-first answer, expose refinement as clickable buttons or natural-language follow-ups, and keep the raw rows out of the model's context entirely until they're explicitly requested.

The implementation maps tightly to the UX:

| UX surface (what the user sees) | Tool contract (what the model calls) |
|---|---|
| Summary first, drill-down on click ([truncated-pyramid-results](../concepts/truncated-pyramid-results.md)) | Filter/search tools that return summaries + select-N exemplars |
| Inline expand/collapse for "more details" | `response_format` enum (`DETAILED` vs `CONCISE`) ([paginated-tool-contract](../concepts/paginated-tool-contract.md)) |
| Refinement buttons ("filter by category", "last week only") | `filter` parameters in the tool schema |
| "Show next page" cue | Opaque cursor returned by previous call (MCP spec) |
| Carrying selected chips into the input | Filter state preserved in tool arguments |

UX shape and technical shape are not independent decisions — they're chosen jointly across the chat surface and the tool contract.

## Why this is its own topic

Pagination on a search-results page is a UX pattern (page numbers, "load more"). Pagination in a chatbot is also a **token-economics pattern** — every paginated tool result re-enters context on every turn and is billed as input. A naive "show me 50 rows" tool call is both expensive (multiplies token count per turn) and risky (may exceed context window outright). The constraints on the chat surface and the constraints on the model run together.

## The decision surface

| Decision | Failure mode | Concept |
|---|---|---|
| What does the user see when results are large? | Wall-of-text dump; user gives up | [truncated-pyramid-results](../concepts/truncated-pyramid-results.md) |
| What does the tool actually return? | Bulk dump of all rows breaks context window | [paginated-tool-contract](../concepts/paginated-tool-contract.md) |
| Where do intermediate / unfiltered rows live? | They land in the prompt and bloat tokens | [code-execution-sandbox-pattern](../concepts/code-execution-sandbox-pattern.md) |
| When do we leave chat for a real UI (table, CSV)? | Chat compresses what wants to be a spreadsheet | covered in [truncated-pyramid-results](../concepts/truncated-pyramid-results.md) |

## How this connects to the rest of the graph

- **Output design**: Same per-surface logic as [output-surface-taxonomy](../concepts/output-surface-taxonomy.md). The tool *contract* and the chat *surface* are two surfaces; they need separate decisions and they compose.
- **Conversation design**: The "refine via button" pattern is the [turn-taking-and-proactivity](../concepts/turn-taking-and-proactivity.md) cousin for data-heavy queries — proactive UX, earned by relevance.
- **SMS / voice constraints**: Buttons and inline expand-collapse aren't available. SMS pagination is genuinely harder; see [sms-multi-thread-chatbot](sms-multi-thread-chatbot.md) context windowing notes — open question still partly unresolved.
- **Cost**: Drives the design. See [cost-aware-eval](../concepts/cost-aware-eval.md) — token-budget snapshots on tool responses are how you catch pagination regressions before customers do.
