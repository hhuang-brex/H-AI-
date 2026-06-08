---
id: sms-multi-thread-chatbot
type: topic
tags: [sms, chatbot, multi-thread, flat-channel, conversation-design]
related:
  - [[domain-chatbot-design]]
  - [[llm-output-design]]
  - [[flat-channel-thread-tracking]]
  - [[async-conversation-pacing]]
  - [[message-segmentation-160]]
  - [[thread-disambiguation-prompts]]
  - [[sms-context-windowing]]
  - [[sms-state-machine]]
  - [[sms-recovery-and-reentry]]
  - [[hard-surface-irrevocability]]
  - [[conversation-memory]]
status: living
created: 2026-06-08
---

# SMS Multi-Thread Chatbot Design

Designing a chatbot that holds **multiple concurrent conversations with one user over SMS only**. SMS is a hard surface (irrevocable, see [hard-surface-irrevocability](../concepts/hard-surface-irrevocability.md)) and a *flat* channel (one linear stream, no threading, no quoting, no rich affordances, ~160 chars per segment). The mismatch between flat channel and multi-thread workload is the entire design problem.

## The constraint, stated bluntly

| What you have | What you don't have |
|---|---|
| A phone number ↔ user binding | Threads, channels, replies, quotes |
| Linear timeline of messages | Reactions, read receipts (mostly) |
| ~160 chars (or 1600 with segmentation) | Rich UI, buttons, attachments-as-affordance |
| Async timing — replies in seconds, hours, or days | Real-time backpressure cues |
| One sender ID (the bot's number) | Per-thread sender identity |

A chat UI hides the threading problem inside the product. SMS exposes it: every inbound message is "from this user, on this number, at this timestamp" — *which conversation it's about is up to you to figure out*.

## Why this is its own design space

The chatbot patterns that work in Slack/Discord/Intercom assume:

- A thread/channel ID arrives with the message.
- The user can scroll and see context.
- The bot can use rich UI (buttons, cards, modals).
- Replies happen in seconds.

None of those hold over SMS. Every concept below exists because *removing* one of those affordances forces an explicit design decision the chat-UI version got for free.

## The decision surface

| Decision | Failure mode if wrong | Concept |
|---|---|---|
| Which thread is this message about? | Bot answers about Thread A while user is on Thread B | [flat-channel-thread-tracking](../concepts/flat-channel-thread-tracking.md) |
| What if it's been days since the last turn? | Stale context, jarring re-entry, missed urgency | [async-conversation-pacing](../concepts/async-conversation-pacing.md) |
| How does the message fit in the channel's character budget? | Truncated send, malformed segment chains | [message-segmentation-160](../concepts/message-segmentation-160.md) |
| When detection fails, how does the bot ask? | User has to re-state everything; gives up | [thread-disambiguation-prompts](../concepts/thread-disambiguation-prompts.md) |
| What context loads into the LLM call for this turn? | Either too little (forgets) or too much (token blow-up, distracted answer) | [sms-context-windowing](../concepts/sms-context-windowing.md) |
| What's the durable per-thread state? | Threads leak into each other; expiry policy is ad-hoc | [sms-state-machine](../concepts/sms-state-machine.md) |
| How does the bot recover when the user is confused? | Two confused parties; conversation collapses | [sms-recovery-and-reentry](../concepts/sms-recovery-and-reentry.md) |

Every node above is a separable failure mode. A chatbot that nails 6 of 7 still leaks on the seventh.

## How this connects to the rest of the graph

- **Output side:** SMS is the canonical hard surface in the [output-surface-taxonomy](../concepts/output-surface-taxonomy.md); the first-touch notification on each thread should be schema-enforced (see [forced-tool-call-output](../concepts/forced-tool-call-output.md)). Follow-up turns are conversational and need free-text + validator.
- **Conversation design:** Every node in [domain-chatbot-design](domain-chatbot-design.md) applies — but [turn-taking-and-proactivity](../concepts/turn-taking-and-proactivity.md) and [repair-and-clarification](../concepts/repair-and-clarification.md) are reshaped by the async, flat-channel reality.
- **Memory:** [conversation-memory](../concepts/conversation-memory.md)'s three horizons are visible at the surface here — turn-local context is small, session is per-thread, cross-session is explicit (the user owns the timeline; the bot owns the state).
- **Eval:** Multi-thread cases are exactly the multi-turn drift coverage [agent-trajectory-eval](../concepts/agent-trajectory-eval.md) flags as under-tested.
