---
id: repair-and-clarification
type: concept
tags: [chatbot, conversation-design, repair, recovery]
related:
  - [[domain-chatbot-design]]
  - [[intent-and-disambiguation]]
  - [[conversation-memory]]
  - [[turn-taking-and-proactivity]]
status: living
created: 2026-06-08
---

# Repair & Clarification

When the bot misunderstood. Recovery turns are not initial turns — they have different rules, and most domain bots botch them.

## What "repair" actually is

Borrowed from conversation analysis: any turn where the conversation has gone off-track and one party tries to put it back. In chatbots, three causes dominate:

1. **Bot misclassified intent** — acted on wrong understanding.
2. **Bot missed information** — user said it; bot didn't use it.
3. **User changed mind / re-scoped** — original goal evolved mid-session.

Each needs a different repair shape.

## Repair patterns that work

| Cause | Bot's repair turn |
|---|---|
| Misclassified intent | Acknowledge the mis-read explicitly, name the new intent, ask if it's right before re-acting |
| Missed information | Surface what was missed, restate the action that incorporated it, proceed |
| Re-scope | Confirm the new scope, summarize what's now stale, ask whether prior progress should be kept or dropped |

Generic chatbots collapse all three into "Sorry, let me try again." That answers none of them.

## Anti-patterns

- **Same-action retry.** User says "no, I meant X" and bot does the same thing slightly differently. Diagnostic of intent collapse — repair must rebuild understanding, not retry execution.
- **Apology spiral.** "I'm sorry. Let me try again. Sorry. Could you clarify?" Empty apologies lower trust faster than the original error did.
- **Clean slate that wasn't.** Bot says "Let's start over" but its memory still carries the wrong intent — the next turn produces the same mistake.

## Repair for high-authority actions

If the bot took a tier-2/3 action ([action-authority](action-authority.md)) and the user signals it was wrong, repair includes:

1. **Halt** any in-flight action immediately.
2. **Reverse** what's reversible; surface what isn't.
3. **Diagnose** — the misunderstanding caused real-world effects, so the repair owes the user a clear "this is what happened, this is what I'm doing about it."
4. **Escalate** if reversal exceeds bot authority — don't bluff a successful recovery.

## Where memory matters

Repair turns rely on [conversation-memory](conversation-memory.md). The bot must know what it said, what action it took, and what the user's prior turn was, to repair coherently. Sessions that compress aggressively often break here.

## Eval

- **Repair-trigger detection** — labeled cases of "bot got it wrong"; assert repair rather than continuation.
- **Repair-quality scorer** — LLM-judge: did the bot acknowledge, re-establish, and only then retry?
- **No same-action-retry** — mechanical: after a "no, you misunderstood" turn, the bot's next tool call must differ from the previous one.

## See also

- [intent-and-disambiguation](intent-and-disambiguation.md) — disambiguation prevents many repairs from being needed.
- [conversation-memory](conversation-memory.md) — the substrate repair runs on.
- [turn-taking-and-proactivity](turn-taking-and-proactivity.md) — repair changes who should speak next.
