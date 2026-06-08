---
id: sms-context-windowing
type: concept
tags: [sms, chatbot, context, prompt-engineering, multi-thread]
related:
  - [[sms-multi-thread-chatbot]]
  - [[flat-channel-thread-tracking]]
  - [[sms-state-machine]]
  - [[conversation-memory]]
  - [[domain-knowledge-injection]]
  - [[cost-aware-eval]]
status: living
created: 2026-06-08
---

# SMS Context Windowing

Once [flat-channel-thread-tracking](flat-channel-thread-tracking.md) picks a thread, what actually goes into the LLM call? The answer is not "all messages from this user" and not "just the latest exchange." Multi-thread SMS forces an explicit context-windowing policy that single-thread chat UIs hide.

## The naive approaches and why they fail

| Approach | Failure |
|---|---|
| Last N messages from this phone number | Cross-thread contamination — Thread B's last 3 messages distract from Thread A's question |
| All messages from this phone number | Token blow-up; the latest distraction dominates; the model gets confused |
| Just the current inbound | Loses the bot's prior turn; loses any slot values filled earlier; bot acts blind |
| The current thread's full transcript | Fine for short threads; explodes for long ones; not all turns are relevant |

The right answer is per-thread, structured, bounded.

## A working policy

For each inbound, after thread selection:

1. **Thread state** — durable structured state from [sms-state-machine](sms-state-machine.md): open intent, filled slots, prior commitments, current step. Loaded as structured JSON, not transcript.
2. **Recent thread turns** — last K messages from *this thread only*, not the user's overall message history. K is small (3–5).
3. **Selected cross-thread context** — only what's referenced. If the user's reply mentions Thread B while replying on Thread A, include a one-line summary of B; don't dump it.
4. **Account / user context** — same as any domain bot ([domain-knowledge-injection](domain-knowledge-injection.md)).
5. **The inbound** — the message that triggered this turn.

The skill is making (1) durable and rich enough that you don't need a long (2). Structured state survives summarization; transcript chunks don't.

## Why "this thread only" matters

The most important rule. A user who has Threads A, B, C open should see, on Thread A, replies that act as if A is the only conversation happening. Mixing transcript from B into A's prompt:

- Causes the model to reference B in A's reply ("about the dinner — I mean the Salesforce charge — …").
- Pulls token budget away from A's actual context.
- Creates evaluation chaos because behavior depends on unrelated threads.

Per-thread context is the surface contract; the infrastructure (which is shared) shouldn't leak through.

## Token budget per turn

A useful default for an SMS multi-thread bot:

| Component | Token budget |
|---|---|
| System prompt (persona, rules, tool catalog) | 500–1500 |
| Account state | 100–500 |
| Thread structured state | 200–500 |
| Last K thread turns (K=3–5) | 200–1000 |
| Cross-thread one-liners (only if referenced) | 50–200 |
| Inbound message | < 200 |
| **Total** | **~1500–4000** |

That's small by modern model standards — and intentionally so. Latency on SMS reply matters less than chat (users don't watch the typing indicator), but cost compounds when the same user has many turns and there are many users. See [cost-aware-eval](cost-aware-eval.md).

## Sliding-window vs. summary

For threads that exceed the K-turn budget:

- **Sliding window only**: last K turns verbatim, drop the rest. Loses information from earlier in the thread.
- **Summary + window**: a structured summary of pre-K turns, plus last K verbatim. More expensive to maintain (summary needs updating), but durable.
- **Structured-state only**: lean entirely on [sms-state-machine](sms-state-machine.md) for durable memory; let the K-turn window be only the very recent messages. Cheapest to maintain; requires the state machine to capture everything that matters.

The third option scales best for long-running threads (a customer's spend-limit-question thread that lasts weeks). Structured state is the durable memory; the transcript is just the latest turns.

## Anti-patterns

- **One global context per user.** Easy to ship; impossible to make multi-thread coherent.
- **Truncation by token count, not by thread.** Drops the *oldest* messages; on a long thread that drops exactly the slots the user filled three turns ago.
- **Lazy summarization.** Re-summarizing the full thread on every turn — expensive and the summary drifts.
- **Cross-thread leakage as a feature.** "The bot remembered something from another thread" feels magical until it remembers the wrong thing.

## Eval

- **No-cross-thread-leak** — adversarial cases where Thread B has distinctive content; assert the response on Thread A doesn't reference it.
- **Slot preservation** — assert slot values filled N turns ago survive into the current prompt.
- **Token-budget snapshot** — for representative thread lengths, assert prompt size stays within budget. Tied to [cost-aware-eval](cost-aware-eval.md).
- **Summary fidelity** — when summarization is in play, assert key facts survive; assert no fabrication.

## See also

- [sms-state-machine](sms-state-machine.md) — the durable per-thread state this loads.
- [conversation-memory](conversation-memory.md) — the general framing; this is the SMS-specific instance.
- [domain-knowledge-injection](domain-knowledge-injection.md) — non-thread context (account state, policies) injects here too.
