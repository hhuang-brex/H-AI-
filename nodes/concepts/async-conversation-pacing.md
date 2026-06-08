---
id: async-conversation-pacing
type: concept
tags: [sms, chatbot, async, pacing, timing]
related:
  - [[sms-multi-thread-chatbot]]
  - [[sms-state-machine]]
  - [[turn-taking-and-proactivity]]
  - [[sms-recovery-and-reentry]]
status: living
created: 2026-06-08
---

# Async Conversation Pacing

SMS replies arrive in seconds, hours, or days. The bot must hold open state across gaps measured in calendar time — and decide what "still relevant" means as the gap grows.

## Why pacing is its own concept

In a chat UI, the user is "in the conversation" while the window is open. On SMS, there is no window. Each reply is a cold inbound from days of unrelated life. The bot can't assume context is hot in the user's head.

## Time-since-last-turn matters

A useful framing — bracket the gap and adjust behavior:

| Gap | What's likely true | Bot's default |
|---|---|---|
| < 2 min | User is actively typing | Treat as same turn-set; minimal restating |
| 2 min – 1 hour | User is engaged but split-attention | Light context reminder if needed |
| 1 hour – 24 hours | User has moved on; replying when reminded | Restate the thread topic on bot's next turn |
| 1 – 7 days | User probably needs the original prompt re-anchored | Re-anchor explicitly: "About the $48 charge from Tuesday — …" |
| > 7 days | The thread may no longer be actionable on the bot side | Verify the thread is still open before acting; consider expiry |

These brackets are starting points. Tune per domain — fintech alerts vs. appointment reminders vs. customer support each have different "stale" thresholds.

## Re-anchoring is cheap; not re-anchoring is expensive

The dominant failure mode: the bot replies as if no time has passed. User sees "Got it, I'll process that" 4 days after their last message and has no idea what "that" refers to. They reply "what?", or just disengage.

Pattern that works for re-entry on aged threads:

```
Got it — about the $48 Salesforce charge from Tuesday,
I'll mark it as "Software" and we're done. Sound good?
```

Three things in two short sentences: thread anchor (Salesforce/Tuesday), action being taken, confirmation request. Costs ~20 tokens; eliminates a confusion turn.

## Expiry policy

Open-forever threads accumulate as ghost state. A working policy:

- **Soft expiry**: thread enters `dormant` state after N days without inbound. Bot doesn't proactively send; if user replies, bot re-anchors aggressively.
- **Hard expiry**: thread enters `expired` state after M days. New inbounds spawn a new thread or trigger out-of-scope handling.
- **Action expiry**: some threads expire faster because the underlying action does (a payment hold, an offer with a deadline).

The expiry policy must be visible — "Last call on this — by Friday or it'll close" — not silent. Silent expiry causes the next user message to land on a confused bot.

## Bot-initiated nudges

If the bot is awaiting user input on a thread and the user goes silent:

- **One nudge** is usually enough. Two feels naggy. Three is a UX bug.
- **Nudge content matters.** "Still there?" wastes the nudge. "Quick reminder — Friday deadline on tagging that $48 charge" earns it.
- **Honor opt-out.** "Stop bugging me about this" must move the thread to dormant/expired, not just suppress this nudge.

## Anti-patterns

- **Time-blind responses.** Bot reply on day 4 reads identical to bot reply on minute 4.
- **No expiry.** Open threads accumulate; cross-thread routing ([flat-channel-thread-tracking](flat-channel-thread-tracking.md)) gets harder; user retention of "what was this about" decays past the bot's compensation budget.
- **Aggressive nudges to drive resolution.** Optimizes for thread-close metric at the cost of user trust.

## Eval

- **Re-anchor presence on aged threads** — assert reply includes thread topic when gap > threshold.
- **Time-correctness** — labeled cases at each gap bracket; assert behavior matches policy.
- **Nudge cap** — assert no more than N nudges per dormant thread.
- **Expiry routing** — inbound on expired thread routes to new-thread / out-of-scope path, not the expired one.

## See also

- [sms-state-machine](sms-state-machine.md) — `dormant` and `expired` are states in that machine.
- [turn-taking-and-proactivity](turn-taking-and-proactivity.md) — nudges are the SMS instance of proactive turns.
- [sms-recovery-and-reentry](sms-recovery-and-reentry.md) — handling cold inbound on stale threads.
