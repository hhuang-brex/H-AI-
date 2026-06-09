---
id: truncated-pyramid-results
type: concept
tags: [chatbot, ux, pagination, progressive-disclosure, results]
related:
  - [[chatbot-pagination]]
  - [[paginated-tool-contract]]
  - [[turn-taking-and-proactivity]]
  - [[domain-chatbot-design]]
status: living
created: 2026-06-09
---

# Truncated-Pyramid Results

The dominant UX pattern for showing large result sets in a chatbot. Named by Nielsen Norman Group: deliver only the essential answer first, then expose the rest through clickable follow-ups and inline disclosure.

## The shape

```
┌─────────────────────────────────────────────────┐
│ You have 3,492 transactions in the last 90 days │
│ — total $48,210, average $14, 11 categories.    │  ← summary first
│                                                 │
│ Top 5 by amount:                                │
│   • Salesforce  $5,200                          │  ← select-N exemplars
│   • United  $1,840                              │
│   • ...                                         │
│                                                 │
│ [ Filter by category ]  [ Last 30 days ]        │  ← refinement buttons
│ [ Group by merchant ]   [ Download as CSV ]     │
└─────────────────────────────────────────────────┘
```

Three anchored decisions in this one reply:

1. **Summary first** — counts, totals, distribution. Catches the most common questions ("how much?", "how many?") without the user paging through anything.
2. **Select-N exemplars** — top 5 by some salient axis (amount, recency, anomaly). Enough to feel concrete; small enough to scan.
3. **Refinement as buttons, not prose** — the user sees the next-step path, doesn't have to invent it.

NN/g calls this the **truncated-pyramid rule**: "give only the essential answer first, then offer relevant follow-up prompts."

## Why this beats raw list pagination

A search-results page can afford raw "page 1 of N" because the user has rich UI affordances: scroll, sort headers, column selection, filter sidebar. A chatbot has none of those. Showing a 50-row table in chat:

- Pushes everything else out of view.
- Has no native sort/filter.
- Costs 50× the tokens of a summary on every turn that re-includes it.
- Strands the user — what's their next move?

Summary-first inverts this: the user sees the answer to the implicit question (`how much? how many? top examples?`), and only escalates to detail if they need it.

## Refinement buttons > free text

NN/g's research (Williams Sonoma, Redfin) found users prefer **multiple-choice options over typing**. Reasons:

- Button label = visible affordance for what the bot can do; user doesn't have to guess.
- Click = single token-efficient turn; typing = more characters, more error.
- State carries over: clicked filters become tool arguments preserved across turns. See [paginated-tool-contract](paginated-tool-contract.md).

Inline expand/collapse is the same idea applied to the *current* item — open the details below the row, not as a new chat message at the bottom (Amazon Rufus's documented anti-pattern: "More details" pushed the result list out of view).

## When to leave chat entirely

Three signals that the answer wants a separate surface:

1. **The user asks for a list, not a question.** "Show me everything" and "let me browse" are spreadsheet shapes, not chat shapes.
2. **The result set is bigger than ~20 rows even after filtering.** Past that, scrolling beats paginating.
3. **The user wants to act on rows.** Multi-select, bulk update, comparison — chat has no native support for these.

The bot's job at that point is **escalation, not chat compression**: "I'll open this in a table view" / "Here's the full set as CSV." A polite escape hatch, not a defeat.

## What about totals before refinement?

The "you have 3,492 results — let's narrow" pattern is doing real work:

- Surfaces that the result set is too large for chat.
- Volunteers refinement options instead of demanding them.
- Sets expectation — "3,492" tells the user the answer's shape before they decide how to proceed.

Without the total, the user doesn't know if there are 5 results or 5,000, and can't make a useful next-step choice.

## Anti-patterns

- **Raw list dump.** "Here are your 3,492 transactions: [50 rows]" — user gives up.
- **"More details" as a new message.** Pushes context out of view.
- **Numbered pagination cues** ("page 4 of 70") — chat has no scrollback affordance to make page numbers meaningful.
- **Open-ended refinement asks.** "Would you like to filter?" without surfacing the filters wastes a turn.

## Eval

- **Summary-first assertion** — for queries with > N rows in the result, assert the response contains aggregate stats before any per-row content.
- **Refinement-button presence** — assert clickable refinement options for queries that exceed a row threshold.
- **No-bulk-dump** — adversarial cases with 500+ rows; assert the bot summarizes rather than lists.
- **Escalation correctness** — given queries that should leave chat (export-shaped, multi-select-shaped), assert the bot offers the alternate surface.

## See also

- [paginated-tool-contract](paginated-tool-contract.md) — the tool-side mechanism behind summary + refinement.
- [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md) — keeping the unsummarized rows out of the model's context.
- [turn-taking-and-proactivity](turn-taking-and-proactivity.md) — refinement-button UX is proactivity earned by relevance.
