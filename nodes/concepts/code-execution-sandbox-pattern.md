---
id: code-execution-sandbox-pattern
type: concept
tags: [chatbot, code-execution, sandbox, mcp, context-window]
related:
  - [[chatbot-pagination]]
  - [[paginated-tool-contract]]
  - [[truncated-pyramid-results]]
  - [[domain-knowledge-injection]]
  - [[cost-aware-eval]]
status: living
created: 2026-06-09
---

# Code-Execution Sandbox Pattern

For genuinely large result sets, the right move isn't smaller pages — it's keeping the rows out of the model's context entirely. Run code in a sandbox; let the agent see only what the code explicitly logs or returns.

## The shape (verified, Anthropic engineering)

```
agent ──── tool_call(execute) ──► sandbox ──► query_db(filter=...)
                                    │
                                    ├── full result: 10,000 rows (stays in sandbox)
                                    │
                                    ├── computed summary: counts, totals, top-5
                                    │
                                    └── log/return: ONLY what was explicitly emitted

agent ◄──── tool_result(summary + 5 rows) ──── sandbox
```

Anthropic's worked example:

```javascript
const pendingOrders = await queryDb({status: "pending"})  // 10,000 rows
console.log(pendingOrders.slice(0, 5))                     // 5 rows visible
```

The agent sees five rows. The other 9,995 stay sandboxed.

## Why this is its own pattern, not just "good pagination"

[paginated-tool-contract](paginated-tool-contract.md) solves the case where the agent could in principle want any of the rows. The sandbox pattern handles the case where the agent **provably never needs the rows**, only an aggregate or sample. Examples:

- "Total spend last quarter" — needs a sum; doesn't need the rows.
- "Any anomalous transactions?" — needs an outlier filter; doesn't need the bulk.
- "Group customers by region" — needs aggregates; doesn't need the row-level data.
- "PII redaction at the boundary" — sensitive fields can be tokenized inside the sandbox, never crossing into the model's context.

Pagination would still pull the rows in, page by page. Sandbox keeps them out.

## Token economics (the reason this exists)

Tool_result blocks are billed as **input tokens on every subsequent turn** that includes them. Anthropic's documented cost example:

> A 2-hour sales-meeting transcript could add ~50,000 tokens to the agent's context. Even larger documents may exceed context window limits, breaking the workflow.

The sandbox replaces "50,000 tokens of transcript in the prompt" with "150 tokens of summary in the prompt, transcript in the sandbox." Across an agent loop, the difference compounds — and unlike pagination, the cost doesn't grow with the size of the underlying data.

## When to reach for sandbox vs paginate

| Question | Mechanism |
|---|---|
| "Does the agent need any specific row from this set?" | If no → sandbox. If yes → paginated tool contract. |
| "Is the data so large it threatens context window?" | Sandbox |
| "Is the data sensitive (PII, financial details)?" | Sandbox — keeps it out of model context entirely |
| "Will the user want to drill into individual rows?" | Paginated tool contract (sandbox can still summarize first; specific rows fetched on demand) |
| "Is this a one-shot aggregate?" | Sandbox — most efficient |

The two patterns compose: a sandbox can return summary + select-N exemplars (the [truncated-pyramid-results](truncated-pyramid-results.md) payload) without the model ever seeing the full set, then *if* the user drills in, the sandbox or a paginated tool fetches the specific row.

## Sandbox > tools for compositional queries

Sandbox isn't only about pagination. It's the right answer whenever the work is **compositional**: filter → sort → group → top-K. Doing this through tool calls means N round-trips, each blowing intermediate results into context. Doing it in code means one round-trip and one logged final answer.

Anthropic's `code-execution-with-mcp` blog frames this as the broader pattern; pagination/data-volume management is one of its strongest applications.

## Anti-patterns

- **Logging everything in the sandbox "for debugging."** Defeats the purpose; everything logged crosses back into the agent's context.
- **Sandbox returning unfiltered raw data.** Sandbox is for transformation, not transport. Filter and aggregate before logging.
- **Treating sandbox as eval bypass.** Code-execution sandboxes don't need to escape eval scrutiny — the slice/aggregate logic still has to be correct, and tested.
- **PII through tool calls "because tools are structured."** Structured ≠ private. PII should be tokenized inside the sandbox, never returned to the model.

## Eval

- **Sandbox-only large queries** — for queries above N rows, assert no tool call ever returns more than M rows directly.
- **Aggregate fidelity** — assert sandbox-computed aggregates match a ground-truth direct computation. Functional check, not LLM-judged.
- **Token-budget assertion** — tool_result token count for sandbox-mediated calls stays bounded regardless of input data size. Tied to [cost-aware-eval](cost-aware-eval.md).
- **PII-in-context test** — adversarial cases where PII appears in the underlying data; assert it does not appear in the agent's prompt context.

## See also

- [paginated-tool-contract](paginated-tool-contract.md) — the alternative when the agent does need specific rows.
- [domain-knowledge-injection](domain-knowledge-injection.md) — sandbox pattern is a fourth knowledge-injection mechanism alongside system prompt / RAG / structured state / fine-tuning.
- [forced-tool-call-output](forced-tool-call-output.md) — same structural-vs-content discipline applied at the tool boundary.
