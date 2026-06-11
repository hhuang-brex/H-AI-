---
id: 2026-06-09-chatbot-pagination-research
type: thread
tags: [chatbot, pagination, research, thread]
related:
  - [[chatbot-pagination]]
  - [[truncated-pyramid-results]]
  - [[paginated-tool-contract]]
  - [[code-execution-sandbox-pattern]]
  - [[references-chatbot-pagination]]
status: archived
created: 2026-06-09
summary: "deep-research on chatbot pagination UX + technical patterns."
---

# Thread — Chatbot Pagination Research (2026-06-09)

Conversation goal: research how to handle pagination for large result sets when a user queries from inside a chatbot — both product/UX view and technical/implementation view.

## Method

Ran the deep-research workflow:

- **Scope**: 5 angles (product UX patterns; technical impl; vendor docs; anti-patterns; reading list).
- **Search**: 5 parallel web-search agents.
- **Fetch**: ~20 sources fetched and de-duped (NN/g articles, Anthropic engineering blog, MCP spec at two revisions, OpenAI function calling guide, Glean engineering, ToolRegistry docs, ChatForest, MCP issue tracker, OpenAI community forum).
- **Verify**: 3-vote adversarial refutation on every claim (kill on 2/3 refute).
- **Synthesize**: 98 claims extracted → 25 verified → 19 confirmed → 6 killed → 12 after dedup synthesis.

Stats: 102 subagents · ~2.25M subagent tokens · ~71 minutes wall time.

## Outputs

- [chatbot-pagination](../nodes/topics/chatbot-pagination.md) — new umbrella topic.
- [truncated-pyramid-results](../nodes/concepts/truncated-pyramid-results.md) — UX concept (summary first, refinement buttons, inline disclosure).
- [paginated-tool-contract](../nodes/concepts/paginated-tool-contract.md) — tool-side concept (opaque cursors, verbosity enum, filter parameters, structured response).
- [code-execution-sandbox-pattern](../nodes/concepts/code-execution-sandbox-pattern.md) — for genuinely large result sets, keep rows out of model context entirely.
- [references-chatbot-pagination](../nodes/references/references-chatbot-pagination.md) — verified reading list.

## Key findings

- **Invert traditional list pagination**: don't show "page 1 of N raw rows." Deliver summary + select-N + refinement buttons. NN/g's "truncated-pyramid rule," verified across two NN/g sources.
- **UX shape and tool shape are coupled**: clickable refinement buttons map to filter parameters; expand/collapse maps to a verbosity enum; "show next page" maps to an opaque cursor. The right pagination design is chosen jointly across the chat surface and the tool contract.
- **MCP standardized opaque cursor-based pagination**, not numbered pages. Clients MUST NOT parse/modify cursors.
- **Verbosity enum is the highest-leverage cheap win**: Anthropic's worked Slack example shows ~3× token reduction (206 → 72) for CONCISE vs DETAILED, with IDs stripped from CONCISE.
- **Token economics drive design**: tool_result blocks re-enter context as input tokens on every turn. A 2-hour transcript at the bulk tier could add ~50,000 tokens to a single agent turn.
- **Sandbox > tools for very large or compositional queries**: keep rows in the execution environment; agent sees only logged/returned slices. Anthropic's `slice(0, 5)` example: 5 rows visible, 9,995 stay sandboxed.
- **Filter > paginate**: a filtered first page is a better first answer than rows 1–10 of the unfiltered set. Anthropic recommends targeted retrieval tools over bulk list endpoints.

## Refuted claims (do not cite)

- "Users prefer AI summaries over full result lists for complex queries." (1–2 vote; NN/g research did not generalize this.)
- "Users prefer aggregated summaries over enumerated lists when result sets are large." (0–3 unanimous refute.)
- "MCP mandates opaque cursor pagination for ALL list operations" (split-voted; the spec recommends but doesn't strictly mandate for all cases).
- "MCP page size is fixed by the spec." (0–3 unanimous; page size is server-determined.)
- "OpenAI advises offloading pagination state to application code, not the model." (0–3 unanimous; the function-calling guide doesn't say this.)

## Open questions

1. What pagination/refinement patterns do **Intercom Fin, Glean chat, Salesforce Einstein, ServiceNow Now Assist, Klarna AI** document? No primary engineering posts surfaced. Vendor product behavior is observable; the engineering write-ups are absent in this pass.
2. **SMS / voice channels** can't use buttons or expand/collapse. Verified UX patterns assume rich chat surface. SMS pagination is genuinely harder — partially addressed in [sms-multi-thread-chatbot](../nodes/topics/sms-multi-thread-chatbot.md) but worth a focused follow-up.
3. **Streaming partial paginated results vs batch** — Anthropic covers round-trip cost but not streaming-specific guidance for paginated tool outputs.
4. **Row-count threshold for escalating chat → CSV / dashboard** — no source defined this precisely.

## Connection to existing graph

- New cluster sits beside the existing chatbot/conversation-design clusters; cross-links into [domain-chatbot-design](../nodes/topics/domain-chatbot-design.md), [llm-output-design](../nodes/topics/llm-output-design.md), [domain-knowledge-injection](../nodes/concepts/domain-knowledge-injection.md), [cost-aware-eval](../nodes/concepts/cost-aware-eval.md), [forced-tool-call-output](../nodes/concepts/forced-tool-call-output.md), [sms-multi-thread-chatbot](../nodes/topics/sms-multi-thread-chatbot.md).
- The sandbox pattern is now a **fourth knowledge-injection mechanism** alongside system prompt / RAG / structured state / fine-tuning — worth a future revision to [domain-knowledge-injection](../nodes/concepts/domain-knowledge-injection.md) to cite it explicitly.
