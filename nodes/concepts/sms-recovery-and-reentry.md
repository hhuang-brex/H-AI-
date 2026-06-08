---
id: sms-recovery-and-reentry
type: concept
tags: [sms, chatbot, recovery, repair, multi-thread]
related:
  - [[sms-multi-thread-chatbot]]
  - [[flat-channel-thread-tracking]]
  - [[thread-disambiguation-prompts]]
  - [[async-conversation-pacing]]
  - [[repair-and-clarification]]
  - [[sms-state-machine]]
status: living
created: 2026-06-08
---

# SMS Recovery & Re-entry

The user is confused, or you are. Recovery on SMS is structurally harder than in chat UI because the user can't scroll, can't see thread metadata, and may be re-engaging cold. The recovery pattern set is small; using the wrong one is what breaks SMS bots in production.

## The five recovery scenarios

Each has a distinct cause and a distinct fix:

| Scenario | What happened | Fix |
|---|---|---|
| **Cold inbound on stale thread** | User replies to a 4-day-old prompt without context | Re-anchor explicitly; see [async-conversation-pacing](async-conversation-pacing.md) |
| **"What?" / unclear inbound on no-active-thread** | User sends "what?" with nothing pending | Surface what *might* be relevant; offer fresh start |
| **Mixed-thread inbound** | One message touches two open threads | Acknowledge both; pick one to act on; explicitly hold the other |
| **Wrong-thread routing** | Bot replied on Thread A; user meant Thread B | Bot must take the L: cleanly switch, restate target thread, undo if action was taken |
| **User-initiated reset** | "Stop / start over / never mind" | Move thread to `superseded` or appropriate terminal state; do not bargain |

Generic chatbots collapse all five into a single "I'm sorry, could you clarify?" path. SMS bots can't afford to — segment budget is too small to spend on apology, and the user has no UI to bail to.

## Cold inbound on stale thread

User replies to a 4-day-old prompt:

```
User: "yeah"
Bot: ?
```

Wrong: "Yeah to what?" — forces user to remember.

Right: re-anchor from state.

```
Bot: Got it — confirming "$48 Salesforce, marked as Software."
     Done. Anything else on this?
```

The bot uses [sms-state-machine](sms-state-machine.md) state to fill in what "yeah" referred to. The user gets confirmation without having to remember.

## "What?" with no active thread

User sends "what?" — bot has nothing pending. Two failure modes:

- **Bluff**: bot answers as if it had said something. User more confused.
- **Silent**: bot ignores. User more confused.

Right: acknowledge the no-context state, offer the most likely intent.

```
Bot: Hi — nothing pending here. Were you asking about a recent
     charge or your spend limit? Or reply "menu" for options.
```

Cheap; honest; offers a path.

## Mixed-thread inbound

```
User: "yes to the dinner one but actually can you change my limit to $5k"
```

Two threads in one message. The bot must:

1. **Acknowledge both.** "Got both."
2. **Pick the actionable one to do now.** Probably the simpler/faster one first.
3. **Explicitly hold the other.** "Logging the dinner; back to you on the $5k limit shortly."

Failing to acknowledge both is the bug. The user *will* assume the unacknowledged thread didn't land.

## Wrong-thread routing

Detection picked Thread A; user meant Thread B. The user signals it ("no, the OTHER thing").

Right pattern:

1. **Apologize briefly.** Not a spiral — one short acknowledgment.
2. **Restate the target.** "OK, switching to your spend-limit thread."
3. **Reverse if needed.** If the bot already took action on Thread A based on the misroute, surface what's reversible. See [repair-and-clarification](repair-and-clarification.md).
4. **Adjust thread state**: Thread A back to its prior state; Thread B becomes active.

The mistake to avoid: arguing. "I thought you meant…" wastes the segment and erodes trust.

## User-initiated reset

```
User: "stop"
User: "never mind"
User: "forget all that"
```

Each can mean different things. Default policy: treat as a thread-level supersede unless the user clearly means account-level (`STOP` is also the carrier-mandated unsubscribe keyword — that has its own legal handling).

Don't bargain ("are you sure? we were almost done"). Honor the reset; if the user comes back, treat as cold inbound.

## Anti-patterns

- **Apology spiral.** "I'm so sorry, my mistake, please let me know how I can help" eats segments and signals weakness without recovering.
- **Silent re-routing on wrong-thread.** Bot decides this is actually about Thread B and just acts. User has no idea what happened.
- **No state change on reset.** Bot says "no problem!" and leaves thread in `awaiting-user`. Next inbound routes to the abandoned thread.
- **Treating "what?" as out-of-scope.** It's recoverable; out-of-scope routing burns the inbound.

## Eval

- **Cold-inbound re-anchor** — assert reply restates thread topic when state shows recent inactivity.
- **Mixed-thread handling** — adversarial cases with two-thread inbounds; assert both are acknowledged, exactly one is actioned now.
- **Wrong-thread switch** — assert apology + target restatement + state correction in the next bot turn.
- **Reset honor** — assert "stop" / "never mind" / etc. transition the thread to terminal state, not just suppress the next outbound.

## See also

- [repair-and-clarification](repair-and-clarification.md) — recovery in the general chatbot framing; this is the SMS-specific instance.
- [flat-channel-thread-tracking](flat-channel-thread-tracking.md) — most recovery is about detection that went wrong.
- [async-conversation-pacing](async-conversation-pacing.md) — cold inbound is the pacing-driven scenario.
