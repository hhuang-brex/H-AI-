---
id: references-chatbot-pagination
type: reference
tags: [reading-list, chatbot, pagination, tool-use, anthropic, mcp, nngroup]
related:
  - [[chatbot-pagination]]
  - [[truncated-pyramid-results]]
  - [[paginated-tool-contract]]
  - [[code-execution-sandbox-pattern]]
status: living
created: 2026-06-09
summary: "pagination reading list (Anthropic Writing Tools / Code Execution, MCP cursor spec, NN/g UX patterns)."
---

# Chatbot Pagination — Reading List

Verified-source reading list for the [chatbot-pagination](../topics/chatbot-pagination.md) cluster. Sources verified live during deep-research workflow on 2026-06-09 (3-vote adversarial verification on every claim drawn from them).

## Anthropic — primary engineering guidance

- 🔑 **Writing Tools for Agents** — Anthropic. https://www.anthropic.com/engineering/writing-tools-for-agents — Verbatim guidance: "implement some combination of pagination, range selection, filtering, and/or truncation with sensible default parameter values for any tool responses that could use up lots of context." Also documents the DETAILED/CONCISE response_format enum and the worked Slack example (206 vs 72 tokens, ~3× reduction).
- 🔑 **Code Execution with MCP** — Anthropic. https://www.anthropic.com/engineering/code-execution-with-mcp — The sandbox pattern in detail: 50,000-token transcript example, "agent only sees what you explicitly log or return," `slice(0, 5)` worked example.
- 🔑 **Tool Use Overview** — Anthropic. https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview — Pricing reference: tool_use and tool_result blocks billed as input tokens; the foundational economics that drive everything else.
- 🔑 **How Tool Use Works** — Anthropic. https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/how-tool-use-works — "Every tool call is a round trip" + the structured-output schema discipline ("parsing free-form text to recover structured intent is a sign the structure belongs in the schema").

## Model Context Protocol — the cursor contract

- 🔑 **MCP Pagination Spec (2025-03-26)** — modelcontextprotocol.io. https://modelcontextprotocol.io/specification/2025-03-26/server/utilities/pagination — Opaque cursor-based pagination as the standard; clients MUST treat cursors as opaque, MUST NOT parse/modify/persist across sessions; missing nextCursor signals end of results.
- 🔑 **MCP Pagination Spec (2025-06-18)** — modelcontextprotocol.io. https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/pagination — Updated revision; same cursor contract.

## OpenAI — function calling (less prescriptive, useful baseline)

- 🔑 **Function Calling Guide** — OpenAI. https://developers.openai.com/api/docs/guides/function-calling — Tool result format is developer's choice (JSON, plain text, error codes); model interprets the string. Less opinionated than Anthropic on pagination shape, but compatible.

## Nielsen Norman Group — the UX side

- **Less Chat, More Answer** — Nielsen Norman Group. https://www.nngroup.com/articles/less-chat-more-answer/ — Names the **truncated-pyramid rule**: "give only the essential answer first, then offer relevant followup prompts."
- **AI Chatbot Design Guidelines** — Nielsen Norman Group. https://www.nngroup.com/articles/ai-chatbots-design-guidelines/ — Guideline 4 (suggested questions as **buttons, not text**) and Guideline 6 (**progressive disclosure** to keep chat short, with the documented Amazon Rufus anti-pattern).
- **GenUI: Buttons and Checkboxes** — Nielsen Norman Group. https://www.nngroup.com/articles/genui-buttons-and-checkboxes/ — Selected items as state carried into followup prompts (Google AI Mode hotel-selection example).

## Adjacent / lower-altitude

- **Shape of AI — Follow-up Pattern** — shapeofai.com. https://www.shapeofai.com/patterns/follow-up — Pattern catalog entry for follow-up suggestions.
- **MCP Pagination Patterns** — chatforest.com. https://chatforest.com/guides/mcp-pagination-patterns/ — Practitioner-blog walk-through of the MCP cursor contract.
- **Glean engineering blog (Agent Sandbox / Cowork MCP / Waldo posts)** — https://glean.com/blog/agent-sandbox-2026 ; https://glean.com/blog/cowork-mcp-eval ; https://glean.com/blog/waldo-launch — Vendor write-ups of sandbox patterns and tool-use eval.

## What's *not* on this list

The deep-research workflow specifically looked for vendor engineering blogs from **Intercom Fin, Salesforce Einstein, ServiceNow Now Assist, Klarna AI, Notion AI, ChatGPT data-analysis, Slack AI** documenting pagination patterns. **None surfaced.** The product behaviors are observable, but no public engineering write-ups from those vendors documented their pagination/refinement contracts as of this pass. Open question for future research.

## If you only read three

For an engineer building an LLM chatbot that hits real data:

1. **Anthropic — Writing Tools for Agents.** Single most actionable reference; covers verbosity enum, filter discipline, pagination defaults.
2. **Anthropic — Code Execution with MCP.** The sandbox pattern; how to handle the 50,000-row case.
3. **NN/g — Less Chat, More Answer.** The UX side; the truncated-pyramid rule that everything else hangs off.

## Refuted claims worth knowing

These plausible-sounding ideas were **refuted** during 3-vote adversarial verification — do not cite them:

- "Users prefer AI summaries over full result lists for complex queries." NN/g's research did not support this generally.
- "MCP page size is fixed by the spec." Page size is server-determined; clients can request smaller.
- "Suggested follow-up prompts are a primary pagination mechanism." Refinement, yes; pagination, no — these are different roles.
