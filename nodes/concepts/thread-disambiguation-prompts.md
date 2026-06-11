---
id: thread-disambiguation-prompts
type: concept
tags: [sms, chatbot, disambiguation, multi-thread, ux]
related:
  - [[sms-multi-thread-chatbot]]
  - [[flat-channel-thread-tracking]]
  - [[intent-and-disambiguation]]
  - [[message-segmentation-160]]
  - [[repair-and-clarification]]
status: living
created: 2026-06-08
summary: "how to ask \"which thread?\" in 160 chars."
---

# Thread Disambiguation Prompts

When [flat-channel-thread-tracking](flat-channel-thread-tracking.md) returns low confidence, the bot has to ask. *How* it asks determines whether the user re-engages or gives up.

## The constraint

You have ~160 characters. You have a user who shouldn't have to remember context. You have multiple open threads, each with their own state. Asking "which one?" badly is the most common failure of multi-thread SMS bots.

## What works

A good disambiguation prompt does three things in one short message:

1. **Anchors each option** with enough context that the user doesn't have to remember.
2. **Lets the user pick cheaply** — single token, ideally a digit.
3. **Includes an escape hatch** for "neither" without making the user explain.

Template that fits in one segment:

```
Quick check — was that about:
1) the $48 Salesforce charge
2) your spend limit on travel
Reply 1, 2, or "new" for something else.
```

123 chars. Both anchors visible. One-token reply. Escape hatch.

## What doesn't work

| Anti-pattern | Why it fails |
|---|---|
| "Which thread?" | User doesn't think in "threads." They don't know what's open. |
| "Could you provide more context?" | Forces them to re-state. They'll often abandon. |
| Three+ options in one message | Doesn't fit; users skim and reply to the first one. |
| Open-ended "what's this about?" | Loses the candidate set; bot has to start from scratch on the reply. |
| "Are you still there?" before the question | Wastes a turn. Just ask. |

## Beyond two options

Past two open threads, the segment budget breaks down. Options:

- **Drop to two most likely** based on detection's top-2; offer "other" for the rest. Most disambiguation requests resolve in the top-2 anyway.
- **Two-stage disambiguation**: first ask the broad category, then narrow. Costs an extra round-trip; only worth it for high-stakes threads.
- **Hold the easy ones**: if the user has 5 open threads and detection is low-confidence, the bot probably has bigger problems — the [sms-state-machine](sms-state-machine.md) should have expired or auto-resolved threads before reaching this volume.

## Push-back handling

Users sometimes reply with neither a number nor "new" — they just restate their original message. Treat that as evidence: re-run [flat-channel-thread-tracking](flat-channel-thread-tracking.md) with the new text as additional signal. Don't reprompt with the same options; the user already told you they didn't fit.

## Asymmetric stakes

Disambiguation matters more when the bot is about to act on a tier-2/3 action ([action-authority](action-authority.md)). For a read-only response, a wrong guess is annoying; for a state-changing action, it's a failure. Lower the confidence threshold for asking when the next step is high-authority.

## Eval

- **Disambiguation-quality scorer** — LLM-judge with a rubric: anchors present, option count ≤ 2 (or 3 with override), escape hatch present, fits in one segment.
- **Resolution rate** — what fraction of disambiguation prompts get a clear reply within one turn?
- **Fall-through behavior** — when the user replies neither "1" nor "2" nor "new," assert the bot re-detects rather than re-prompts.
- **Segment budget** — every disambiguation outbound asserted ≤ 160 chars.

## See also

- [flat-channel-thread-tracking](flat-channel-thread-tracking.md) — what produces the ambiguity this resolves.
- [intent-and-disambiguation](intent-and-disambiguation.md) — the broader pattern; this is the SMS-specific shape.
- [repair-and-clarification](repair-and-clarification.md) — disambiguation is repair when detection failed.
