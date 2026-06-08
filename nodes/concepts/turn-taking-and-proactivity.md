---
id: turn-taking-and-proactivity
type: concept
tags: [chatbot, conversation-design, turn-taking, proactivity, ux]
related:
  - [[domain-chatbot-design]]
  - [[repair-and-clarification]]
  - [[escalation-handoff]]
  - [[intent-and-disambiguation]]
status: living
created: 2026-06-08
---

# Turn-Taking & Proactivity

Who speaks when. The most under-designed dimension of chatbot UX, because in human conversation it's automatic — and in bot conversations the defaults are always wrong.

## The default is too reactive

Most bots only speak when spoken to. That makes them feel like a search bar with manners. Real assistants:

- **Greet** with intent — opening that previews what they can help with, not generic "How may I help you?"
- **Summarize** at natural breakpoints — after multi-step actions, after long retrievals, when handing off context.
- **Check in** during long-running operations — "Still working on that — should take another minute."
- **Volunteer** relevant follow-ups — "I noticed X is also unusual; want me to look at that?"

Each is proactive. Each can be wrong if overused — and "overuse" is domain-specific.

## When proactivity helps vs. annoys

| Action | Helps when | Annoys when |
|---|---|---|
| Greeting with intent | First contact, multi-purpose bot | User came in mid-flow; user is annoyed |
| Mid-action check-in | Operation > ~5s; user can't see progress | Operation is fast; status is visible elsewhere |
| Volunteered follow-up | Tightly relevant, low-risk to ignore | Tangential; user is task-focused; high signal-to-noise expectations |
| Closing with offer | Resolution achieved; user could leave | User clearly already left (no response after final action) |

The pattern: proactivity is **earned by relevance**. Generic proactive turns feel like upsells.

## Initiative on confirmation

Tied to [[action-authority]]. Tier-2/3 actions need confirmation — *who* asks?

- **User-initiated** action: bot proposes, asks "Should I?", waits.
- **Bot-suggested** action (proactive): bot must explicitly hand the decision to the user, never implicitly proceed.

A common bug: bot suggests an action and treats silence as consent. In high-authority contexts this is unacceptable.

## Long operations

For operations that take more than a few seconds:

- **Acknowledge intent** before starting ("OK — searching your last 90 days of transactions, this can take a moment").
- **Mid-operation update** for long ones (>10s).
- **Distinct completion turn** so the user knows they can act again.

Without these, the bot looks frozen. Users retry. Retries cause race conditions in agentic systems.

## Closing

Most bots never close. They keep "Anything else?"-ing forever. Real conversations have endings:

- Action completed + offer further help → wait once → if no response, fade gracefully (no follow-up nag).
- Hand off completed → close cleanly; do not "just check in" later.
- User explicit goodbye → close, no upsell.

## Eval

- **Initiative correctness** — labeled cases for when the bot should/shouldn't volunteer; assert behavior.
- **Long-operation acknowledgment** — for slow tool calls, assert mid-operation update appeared.
- **No-bluff-consent** — proactive suggestions on tier-2/3 actions: assert the bot waits for explicit consent.
- **Closing behavior** — assert the bot stops gracefully when the user ends, no follow-up nag.

## See also

- [[repair-and-clarification]] — repair turns shift initiative.
- [[escalation-handoff]] — escalation reverses turn flow temporarily.
- [[intent-and-disambiguation]] — opening turn is shaped by what the bot can usefully ask.
