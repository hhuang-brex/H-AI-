---
id: flat-channel-thread-tracking
type: concept
tags: [sms, chatbot, threading, routing, multi-thread]
related:
  - [[sms-multi-thread-chatbot]]
  - [[thread-disambiguation-prompts]]
  - [[sms-state-machine]]
  - [[sms-context-windowing]]
  - [[intent-and-disambiguation]]
status: living
created: 2026-06-08
---

# Flat-Channel Thread Tracking

The hardest problem in [sms-multi-thread-chatbot](../topics/sms-multi-thread-chatbot.md): deciding which open thread a new inbound SMS belongs to, when the channel itself carries no thread metadata.

## What you have to work with

For each inbound message:

| Signal | Strength | Caveat |
|---|---|---|
| Sender phone number | identifies the user | not the thread |
| Inbound timestamp | recency bias | useless if user replies hours later |
| Message body | the strongest signal | short, context-poor |
| The bot's prior message (most recent outbound) | strong default — most replies are to the latest prompt | breaks when user replies cold to old threads |
| Open-thread set for this user | the candidate space | size matters; 2 is easy, 7 is not |

## Detection ladder (cheapest to most expensive)

Run these in order; commit on the first confident hit.

1. **Single open thread.** If only one thread is open for this user, route there. Don't ask.
2. **Latest-prompt heuristic.** If exactly one thread is in `awaiting-user` state and was the last outbound to this user, default to it. Confirm only when other signals contradict.
3. **Explicit reference.** User replies with a recognizable token — order ID, transaction reference, "the dinner one." Pattern-match before LLM.
4. **Lexical similarity to thread context.** Cheap embedding or keyword overlap between inbound text and each open thread's recent context.
5. **LLM classifier.** Few-shot or fine-tuned classifier over (inbound text, list of open-thread summaries) → thread ID or "unknown."
6. **Ask the user.** Last resort — see [thread-disambiguation-prompts](thread-disambiguation-prompts.md).

The mistake is starting at (5). Most inbounds resolve at (1)–(3); paying the LLM cost on every message is wasteful and adds latency on the easy cases.

## Confidence thresholds

Detection should emit `(thread_id, confidence)`, not just `thread_id`. Action thresholds:

| Confidence | Action |
|---|---|
| High (single candidate, strong match) | Route silently |
| Medium (top match clearly above runners-up) | Route, but acknowledge — "About your dinner expense — …" |
| Low (multiple plausible) | Ask, see [thread-disambiguation-prompts](thread-disambiguation-prompts.md) |
| Zero open threads | Treat as new thread or out-of-scope |

The acknowledgment at medium is the cheap insurance: if the bot guessed wrong, the user corrects within one turn instead of after the bot has already acted.

## Anti-patterns

- **No explicit thread set.** "The bot just keeps everything in one big context window" — collapses threads into one mental thread; every reply contaminates all open work.
- **Recency-only routing.** "Whatever the user replies to is about the most recent outbound." Fails the moment a customer replies to a 3-day-old prompt — and they will.
- **Silent re-routing.** Bot decides this message is actually about Thread B without telling the user; user thinks they're on Thread A; both proceed in confusion.
- **One LLM-classifier-fits-all.** Shipping the classifier first, optimizing later. Latency and cost compound; cheap heuristics resolve most traffic.

## Eval

- **Routing accuracy** — labeled inbounds → correct thread ID. Per-confidence-tier breakdown, not just aggregate.
- **Acknowledgment correctness** — at medium confidence, assert the bot prefixes the response with the thread it picked.
- **Disambiguation trigger** — at low confidence, assert the bot asks rather than guesses. Tied to [intent-and-disambiguation](intent-and-disambiguation.md).
- **Adversarial cases** — user replies that lexically match thread B but actually concern thread A (a real failure mode). Catch by including these in the dataset, not by hoping.

## See also

- [thread-disambiguation-prompts](thread-disambiguation-prompts.md) — the recovery path when this fails.
- [sms-state-machine](sms-state-machine.md) — the open-thread set this consumes.
- [sms-context-windowing](sms-context-windowing.md) — what's loaded into the prompt once a thread is picked.
