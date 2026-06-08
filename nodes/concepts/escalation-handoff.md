---
id: escalation-handoff
type: concept
tags: [chatbot, conversation-design, escalation, handoff, support]
related:
  - [[domain-chatbot-design]]
  - [[action-authority]]
  - [[scope-and-refusal]]
  - [[safety-rails-domain-specific]]
  - [[conversation-memory]]
status: living
created: 2026-06-08
---

# Escalation & Handoff

When and how a domain bot hands off to a human. The escalation path is part of the product, not a fallback.

## When to escalate (the trigger taxonomy)

Five distinct trigger classes, each with its own detection logic:

1. **Authority exceeded** — request is in a tier the bot doesn't have. Deterministic; tied to [[action-authority]].
2. **Capability exceeded** — request is in-domain but bot doesn't know how. "I can't, let me get someone who can."
3. **Confidence collapse** — repeated misunderstanding, stuck loop, low-similarity retrieval. The bot detects its own inability to progress.
4. **User signal** — explicit ("can I talk to a human?"), implicit (frustration markers, profanity uptick), or distress (urgent / safety language). Distress signals override everything else, including in-flight actions.
5. **Policy mandate** — domain rules require human review (regulated advice, certain product categories, identity-sensitive flows). Triggered at intent-classification time, not after.

The mistake: collapsing all five into one "escalate when stuck" path. Each has different urgency, different routing, and different what-to-tell-the-user.

## The handoff contract

A good handoff transfers four things to the human:

1. **The user's apparent goal** (intent classification, even if uncertain).
2. **What's been tried** (turns, tool calls, what worked, what didn't).
3. **The current state** (any partial actions, holds, drafts).
4. **Why escalation triggered** (which of the 5 classes, with evidence).

Generic handoffs transfer only the chat transcript. Humans then re-ask everything. This is the most common cause of "the bot was useless" feedback — the bot wasn't useless; the handoff was.

## Latency and waiting

- **Acknowledge before connecting.** "I'm getting someone — this usually takes ~3 minutes." Silence during routing is perceived as bot stuck.
- **Set expectation for the wait surface.** Will they get a follow-up email? Stay in this chat? Different SLAs need different acknowledgments.
- **Bot-still-listening?** During the wait, does the bot still take user input? If yes, it must clearly mark "still waiting for human" in every reply, not pretend it's the human.

## Reverse handoff (human → bot)

Often forgotten: when the human resolves the immediate issue, the bot should be able to take over again for follow-up tasks. The conversation memory ([[conversation-memory]]) must survive the human turn-segment, and the human's actions must be visible to the bot's later responses.

## Eval

- **Trigger correctness** — labeled cases for each of the 5 trigger classes; assert the bot escalates on positives and doesn't on negatives.
- **Handoff completeness** — generated handoff payload includes goal + history + state + reason; LLM-judged or schema-validated.
- **No-pretend rule** — during handoff wait, every bot turn must include a "still waiting for a human" marker. Mechanical check.

## See also

- [[action-authority]] — tier 4 actions auto-escalate.
- [[scope-and-refusal]] — refusal and escalation are different; refusal closes, escalation routes.
- [[safety-rails-domain-specific]] — distress signals trigger immediate escalation paths.
