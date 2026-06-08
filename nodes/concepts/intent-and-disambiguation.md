---
id: intent-and-disambiguation
type: concept
tags: [chatbot, conversation-design, intent, clarification]
related:
  - [[domain-chatbot-design]]
  - [[repair-and-clarification]]
  - [[scope-and-refusal]]
  - [[action-authority]]
status: living
created: 2026-06-08
---

# Intent & Disambiguation

The first thing a domain bot does on every turn: decide what the user actually wants. Get this wrong and every subsequent decision is wrong-on-a-foundation.

## The decision

For each user message, the bot must answer two questions before responding:

1. **Which intent is this?** (from a finite set defined by the domain)
2. **Is the intent specified well enough to act?** (or do I need to ask?)

Generic chatbots collapse this into "just respond fluently." Domain bots can't — acting on a misclassified intent in a healthcare bot is a clinical event; in a fintech bot it's a financial one.

## Confidence-tiered response

A useful framing — three tiers based on the bot's confidence:

| Confidence | Response |
|---|---|
| High (single intent, all slots filled) | Act |
| Medium (single intent, some slots missing) | Ask one targeted clarifying question |
| Low (multiple plausible intents, or unfamiliar phrasing) | Surface options + offer "none of these" |

The mistake is acting at low confidence to avoid sounding robotic. The asymmetric cost of wrong action ≫ cost of one extra clarifying turn.

## Slot-filling vs. open-ended

- **Slot-filling intents** — well-defined parameters needed (refund: order ID, amount, reason). Disambiguation is mechanical: list missing slots, ask for them.
- **Open-ended intents** — "explain this transaction," "help me think through X." No slot list; the bot must judge sufficiency itself.

Most domain bots over-invest in slot-filling for transactional flows and under-invest in disambiguation for open-ended ones. The open-ended ones are where misunderstanding compounds across turns.

## Common anti-patterns

- **Single clarifying question that's actually three questions.** "What's the order ID, the amount you want refunded, and the reason?" — users answer one and ignore the rest. Ask one slot at a time on critical paths.
- **Echo-confirmation as disambiguation.** "I think you want a refund, is that right?" without surfacing the alternative. Users say yes to be polite; the bot proceeds wrong.
- **Suppressed clarification.** The bot was tuned for "feels natural" and the model learned never to ask. Run an eval that *asserts* clarification on ambiguous inputs.

## Eval

- Classify a labeled set of user messages by intent — measure precision/recall per intent, especially on the rare ones.
- Inject deliberately ambiguous messages — assert the bot asks rather than guesses.
- Slot-extraction: assert correct slot values on filled inputs; assert "ask" behavior on partial inputs.

## See also

- [[repair-and-clarification]] — when the bot misunderstood; how recovery turns differ.
- [[scope-and-refusal]] — when the right answer is "I can't help with that," not "let me try."
- [[action-authority]] — high-authority intents need stronger disambiguation.
