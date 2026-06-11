---
id: conversation-memory
type: concept
tags: [chatbot, conversation-design, memory, context, privacy]
related:
  - [[agent-state-persistence]]
  - [[context-engineering]]
  - [[sms-multi-thread-chatbot]]
  - [[domain-chatbot-design]]
  - [[domain-knowledge-injection]]
  - [[escalation-handoff]]
  - [[repair-and-clarification]]
status: living
created: 2026-06-08
summary: "three horizons; what to remember, what not to."
---

# Conversation Memory

What persists across turns and across sessions. The privacy/utility/cost trade-off lives here, and most teams under-design it until a session-boundary bug exposes the gap.

## Three memory horizons

| Horizon | Scope | Examples |
|---|---|---|
| **Turn-local** | Current model call | Last message, last tool output, current draft |
| **Session** | Until conversation ends | User's stated intent this session, slots filled, bot's prior commitments |
| **Cross-session** | Across conversations | Preferences, prior issues, account state, persistent corrections |

Each horizon has different storage, different invalidation rules, and different privacy implications. Conflating them is the source of most "the bot remembered something it shouldn't have" / "the bot forgot something it should have" bugs.

## What to remember (and what not to)

A useful default: **remember commitments, not content**.

- Yes: "User wants a refund — open thread."
- Yes: "I told them I'd follow up Tuesday."
- Yes: "Bot already escalated this once."
- No: full transcript verbatim across sessions.
- No: free-form "interesting facts about the user."

Free-form memory across sessions is where most domain bots leak privacy. A user mentions a sensitive detail in turn 2; six sessions later the bot brings it back up unexpectedly.

## Compression and summarization

For long sessions, the transcript exceeds context window. Two strategies:

1. **Rolling summary.** Compress older turns into a summary; keep recent turns verbatim. Cheap, lossy, biased toward "what the summarizer thought important."
2. **Structured state.** Maintain explicit slot values (intent, filled fields, commitments, escalations). Verbatim transcript fades; structured state is the durable memory.

Structured state scales better in domains because most useful memory is enumerable — exactly the same logic as [forced-tool-call-output](forced-tool-call-output.md) applied to memory.

## Privacy / right-to-forget

In regulated domains, memory has legal constraints:

- User-requested deletion must propagate to memory store, not just chat history.
- Some categories (health, payment data) shouldn't be stored at all — even in summaries.
- Audit: what memory contributed to which response? Often required for compliance review.

## Recency in long sessions

Long agentic sessions have a structural problem distinct from "what to remember": the model attends most strongly to recent context. A rule placed in the system prompt 300 turns ago competes with thousands of intervening tokens. See [recency-bias-prompt-design](recency-bias-prompt-design.md).

Practical implication: rules that *must hold* in long sessions need either (a) reinforcement injected at the point they apply (see [operator-trust-injection](operator-trust-injection.md)) or (b) durable structured state the model reads on every turn. Trusting a single placement in the system prompt is the failure mode.

## Eval

- **State preservation** — multi-turn cases where information given on turn 1 must survive to turn 5. Assert it.
- **State contamination** — adversarial cases where state from session A must not appear in session B. Assert it doesn't.
- **Summary fidelity** — compress N turns; assert key facts survive; assert no fabrication.
- **Forget-on-request** — request deletion mid-session; assert subsequent turns don't reference deleted info.

## See also

- [domain-knowledge-injection](domain-knowledge-injection.md) — how external knowledge enters the prompt; memory is the *internal* counterpart.
- [escalation-handoff](escalation-handoff.md) — handoff payloads draw from session memory; coverage gaps surface here.
- [repair-and-clarification](repair-and-clarification.md) — repair turns rely on remembering what the bot said wrong.
- [operator-trust-injection](operator-trust-injection.md) — runtime mid-conversation context that has to compete with existing memory.
- [recency-bias-prompt-design](recency-bias-prompt-design.md) — why placement and reinforcement matter as much as what's stored.
