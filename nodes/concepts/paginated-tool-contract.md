---
id: paginated-tool-contract
type: concept
tags: [chatbot, tool-use, pagination, mcp, schema, tokens]
related:
  - [[chatbot-pagination]]
  - [[truncated-pyramid-results]]
  - [[code-execution-sandbox-pattern]]
  - [[forced-tool-call-output]]
  - [[cost-aware-eval]]
status: living
created: 2026-06-09
summary: "opaque cursors, verbosity enum, filter parameters; ~3× token savings."
---

# Paginated Tool Contract

The tool-side mechanism that makes [truncated-pyramid-results](truncated-pyramid-results.md) possible: tools that return *structured*, *bounded*, *resumable* responses instead of bulk row dumps.

## The shape (Anthropic + MCP, verified)

A tool that may return large result sets should support some combination of:

| Parameter | Purpose |
|---|---|
| `cursor` (opaque) | Resume from prior call. MCP spec: opaque string token; clients **must not** parse, modify, or persist across sessions. |
| `page_size` | Per-call limit. Server-determined upper bound; client may request smaller. |
| `filter` (multiple) | Narrow before paginating. Maps directly to refinement buttons in the UI. |
| `response_format` (enum) | DETAILED vs CONCISE. ~3× token reduction in Anthropic's worked Slack example (206 → 72 tokens). |

Response shape:

```json
{
  "items": [...],
  "next_cursor": "opaque-string-or-null",
  "total_count": 3492,
  "summary": { "sum": 48210, "avg": 14, "categories": 11 }
}
```

Three things the response carries that a naive list endpoint doesn't:

1. **`total_count`** — lets the bot say "you have 3,492 results" before showing rows.
2. **`summary`** — pre-computed aggregates so the LLM doesn't have to summarize 3,492 rows itself.
3. **`next_cursor`** — opaque token for the next page; missing cursor signals end of results.

## Why opaque cursors, not offsets

MCP standardized opaque cursors over numbered pages for a reason:

- **Clients can't break the contract.** No "what if I add 1 to the cursor" hacks.
- **Server is free to change pagination strategy** (offset → keyset → tombstone) without breaking clients.
- **No silent page-drift.** When the underlying data changes between calls, opaque cursors can encode anchor state; offsets get inconsistent results.

Offset pagination remains common in REST APIs but is the wrong default for tool-call APIs an LLM consumes. The model has no business reasoning about page numbers.

## Verbosity enum is the highest-leverage cheap win

Anthropic's worked example: a Slack message-fetch tool with `response_format: DETAILED` returns 206 tokens; `CONCISE` returns 72 tokens — same content, IDs (channel_id, user_id, thread_ts) stripped from CONCISE.

Across an agent loop with many tool calls, this compounds:

- A bot that calls 10 tools at DETAILED costs 2,060 tokens *per turn that includes them in context*.
- The same bot at CONCISE costs ~720 tokens.
- Multiplied by every subsequent turn (tool_result blocks re-enter context every turn), the gap is real money.

The bot should default to CONCISE and switch to DETAILED only when the upcoming step needs the omitted fields (a write operation that requires an ID, a citation that needs a timestamp).

## Filter > paginate

If the tool exposes filters, the bot should reach for filtering *before* paginating. A filtered first page is a better first answer than an unfiltered first page:

- "Last 7 days, top 5 by amount" beats "rows 1–10 of 3,492 sorted by ID."
- Filter parameters map cleanly to the UX refinement buttons.
- One filtered round-trip costs less than three paginated round-trips that the user abandons after page 2.

Anthropic's tool-authoring guidance reinforces this: prefer **targeted retrieval tools** (`search_contacts`, `search_logs`) over bulk list endpoints. Don't make the LLM page through to find the row it needs.

## Token economics, made concrete

| Mechanism | Tokens |
|---|---|
| Bulk: dump 500 rows × 10 fields × ~5 tokens | ~25,000 / turn |
| Paginated: page 1 of 50 rows | ~2,500 / turn |
| Filtered: 7 matching rows | ~350 / turn |
| Summary + select-5: aggregates + 5 exemplars | ~150 / turn |

And every one of those numbers is paid on **every subsequent turn that includes the tool_result block in context** — Anthropic's pricing doc confirms tool_use and tool_result are billed as input tokens.

A 2-hour customer-support transcript at the bulk tier could add ~50,000 tokens to a single agent turn (Anthropic's own example). Even larger queries can break the context window outright.

## Anti-patterns

- **Offset pagination on tool-call APIs.** The model has no business reasoning about page numbers; opaque cursors hide a contract you don't want exposed.
- **One verbosity for everything.** Either the bot pays DETAILED costs always, or it can't fetch IDs when it actually needs them.
- **No `total_count`.** Without it, the bot can't honestly say "you have 3,492 results — let's narrow."
- **Bulk list endpoint with no filter parameters.** Forces the LLM to page-and-grep; forces every paginated turn to re-include the cumulative result block in context.
- **Letting the LLM emit cursors.** Clients **must not** synthesize cursors; they should be passed through opaquely. An LLM emitting structured cursor strings is a hallucination waiting to happen — see [forced-tool-call-output](forced-tool-call-output.md) for the structural-vs-content mistake.

## Eval

- **Verbosity discipline** — for read-only queries, assert CONCISE was chosen.
- **Cursor pass-through** — assert the cursor on call N+1 byte-equals the `next_cursor` returned by call N. No model edits.
- **Filter before paginate** — for filterable queries, assert the bot's first call set filters before paginating.
- **Token-budget snapshot** — assert tool_result token counts stay under per-tool budgets. Tied to [cost-aware-eval](cost-aware-eval.md).

## See also

- [truncated-pyramid-results](truncated-pyramid-results.md) — the UX that consumes these tool responses.
- [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) — for very large result sets, even structured tool responses go straight into a code sandbox before reaching the model.
- [forced-tool-call-output](forced-tool-call-output.md) — same structural-discipline principle, applied to inputs (tool calls) rather than outputs (user messages).
