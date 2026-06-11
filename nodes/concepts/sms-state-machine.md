---
id: sms-state-machine
type: concept
tags: [sms, chatbot, state-machine, multi-thread, infrastructure]
related:
  - [[sms-multi-thread-chatbot]]
  - [[flat-channel-thread-tracking]]
  - [[async-conversation-pacing]]
  - [[sms-context-windowing]]
  - [[action-authority]]
  - [[conversation-memory]]
status: living
created: 2026-06-08
summary: "five states per thread; the durable substrate."
---

# SMS Thread State Machine

Make each thread a small explicit state machine. The reason: every other SMS-multi-thread concept ([flat-channel-thread-tracking](flat-channel-thread-tracking.md), [async-conversation-pacing](async-conversation-pacing.md), [sms-context-windowing](sms-context-windowing.md)) consumes per-thread state. Without a uniform model of *what state a thread can be in*, every consumer ends up with its own ad-hoc rules.

## Minimum viable state set

```
                 ┌──────────┐
   spawn ──────► │   open   │
                 └────┬─────┘
                      │
            (bot prompts user)
                      ▼
              ┌────────────────┐
              │ awaiting-user  │ ◄──── inbound (relevant)
              └────┬───────────┘
       │           │            ▲
       │           │  silence > N days
       │           ▼            │
       │   ┌────────────┐       │
       │   │  dormant   │ ──────┘
       │   └────┬───────┘
       │        │ silence > M days
       │        ▼
       │  ┌────────────┐
       │  │  expired   │  (no longer routes)
       │  └────────────┘
       │
       │ user/bot acts
       ▼
 ┌──────────────────┐
 │ awaiting-system  │  (bot is doing tool work)
 └────┬─────────────┘
      ▼
 ┌──────────────────┐
 │     resolved     │
 └──────────────────┘
```

Five states. Most threads spend their lives bouncing between `open` ↔ `awaiting-user` ↔ `awaiting-system` and end at `resolved`.

## Why explicit states matter

| State | Tells the rest of the system |
|---|---|
| `open` | Eligible for thread routing; bot has not yet prompted |
| `awaiting-user` | Default routing target for the next inbound on that line |
| `awaiting-system` | Bot is busy; new inbounds may be premature; nudge if the user re-asks |
| `dormant` | Not the default route; re-anchor required if user replies |
| `expired` | Not a routing candidate; new inbound is a new thread |
| `resolved` | Closed; reference-only |

Detection ([flat-channel-thread-tracking](flat-channel-thread-tracking.md)) consumes this directly: only `awaiting-user` and `dormant` are real routing candidates; `awaiting-system` is unusual; `expired` and `resolved` should not route at all.

## Per-thread durable record

Beyond the state, each thread carries:

- `thread_id`, `user_id`, `created_at`, `state`, `state_changed_at`
- `intent` — what this thread is about (slot for [flat-channel-thread-tracking](flat-channel-thread-tracking.md) summaries)
- `slots` — structured filled values (merchant, amount, category, etc.)
- `last_outbound_id`, `last_inbound_id` — for recency and ordering
- `nudge_count` — guard against nag spirals (see [async-conversation-pacing](async-conversation-pacing.md))
- `authority_tier_pending` — if the next bot action is high-authority, gate it ([action-authority](action-authority.md))

This is the durable memory the LLM call consumes — not the transcript. See [sms-context-windowing](sms-context-windowing.md).

## Transitions are events, not free-form

Every transition is one of:

- `prompted` — bot sent a question; `open → awaiting-user`
- `responded` — user replied relevantly; `awaiting-user → open` (next bot turn) or `→ awaiting-system`
- `acted` — bot took a tool action; `awaiting-system → open` or `→ resolved`
- `timed_out_soft` — silence threshold hit; `awaiting-user → dormant`
- `timed_out_hard` — long silence threshold hit; `dormant → expired`
- `resolved` — explicit close
- `superseded` — user explicitly drops thread (e.g., "never mind")

Free-form state transitions are how state machines drift. Keep the event set small and named.

## Concurrency on one phone number

A user can have multiple threads in non-terminal states simultaneously. The state machine is per-thread; the *user record* aggregates threads:

```
user_record {
  user_id
  open_threads: [thread_id, ...]    # state ∈ {open, awaiting-user, awaiting-system, dormant}
  recent_resolved: [thread_id, ...] # for reference
}
```

Routing reads `open_threads` to build the candidate set. Beyond ~5 simultaneous threads on one number, UX degrades fast even with perfect routing — consider whether the bot is opening too many threads at once.

## Anti-patterns

- **Implicit state in prompt strings.** "The bot remembers because the prompt says it does" — works in dev, leaks in prod.
- **Two states only (open / closed).** Loses dormant vs. expired vs. awaiting-system distinctions; nudge policy collapses; routing degrades.
- **Mutable state without an event log.** When something goes wrong, no one can reconstruct what happened. Append-only event log is cheap and indispensable.
- **State stored only in the LLM context.** Every retry / reseed / model change loses it. State is durable infrastructure; the LLM is a function over it.

## Eval

- **State-transition correctness** — labeled scenarios; assert the right transition fires.
- **No-skip transitions** — assert thread can't go `open → resolved` without an `acted` or `superseded` event.
- **Concurrent threads** — multi-thread cases; assert each thread's state evolves independently.
- **Routing-from-state** — given a user record, assert the candidate set produced for routing matches expected.

## See also

- [flat-channel-thread-tracking](flat-channel-thread-tracking.md) — primary consumer of the state.
- [async-conversation-pacing](async-conversation-pacing.md) — drives the soft/hard timeout transitions.
- [sms-context-windowing](sms-context-windowing.md) — what the structured state is loaded into the prompt as.
