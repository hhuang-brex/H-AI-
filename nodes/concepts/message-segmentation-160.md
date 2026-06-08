---
id: message-segmentation-160
type: concept
tags: [sms, chatbot, segmentation, character-limits, mms, rcs]
related:
  - [[sms-multi-thread-chatbot]]
  - [[forced-tool-call-output]]
  - [[hard-surface-irrevocability]]
status: living
created: 2026-06-08
---

# Message Segmentation & the 160-Character Reality

SMS messages are physically 160 GSM-7 characters per segment (70 for UCS-2 / Unicode). Longer messages are concatenated by carriers and reassembled by the recipient device — usually correctly, sometimes not. The bot's output shape has to respect this.

## What the limits actually are

| Encoding | Max chars / single segment | When it kicks in |
|---|---|---|
| GSM-7 (basic Latin) | 160 | Default for ASCII-ish messages |
| GSM-7 with extension chars (`{}[]\^~|€`) | counts as 2 chars each | Sneaks in via emoji-adjacent punctuation |
| UCS-2 (any Unicode incl. emoji, non-Latin) | 70 | One emoji or accent ⇒ entire message switches encoding |
| Concatenated (multi-part) | 153 (GSM-7) or 67 (UCS-2) per part | Headers eat 7 chars per segment for reassembly |
| MMS | ~1600 chars + media | Carrier-dependent; not all phones treat well |
| RCS | ~unlimited + rich | Modern; not universal; falls back to SMS |

Carrier billing and deliverability behavior depend on segment count, not absolute length. A 161-char message is two segments and costs (and risks) accordingly.

## What this means for output

- **Budget is real.** A 4-segment message takes 4× the carrier cost, and increases reassembly-failure risk on edge devices.
- **Encoding switches surprise.** A single emoji turns a 159-char GSM message into a 2-segment UCS-2 message. Plan for this; don't let the model emoji-bomb without budget awareness.
- **Order isn't guaranteed.** Concatenated segments are *usually* reassembled, but for a small fraction of devices they arrive split or out of order. Critical info should fit in segment 1.
- **Truncation is silent.** Some carrier integrations truncate at a fixed byte budget without warning. Always assert post-render length.

## Design implications

1. **Single-segment first.** For first-touch transactional notifications, target ≤ 160 GSM-7. Discipline the schema so the renderer can fit. Tied to [forced-tool-call-output](forced-tool-call-output.md) — the schema can include a `single_segment_safe: boolean` invariant the renderer enforces.
2. **Front-load critical info.** Merchant + amount + the ask. Disclaimers, niceties, and follow-up framing go after.
3. **Soft cap on outbound length.** Even when MMS/long-form is available, the user reads on a phone — keep it scannable.
4. **Reply-truncation expectation.** Users reply briefly. Don't ask for 3 things in one message; ask one.

## MMS / RCS fallback

| Channel | Use when | Caveat |
|---|---|---|
| SMS | default; universal | character-limited |
| MMS | image/PDF receipt attachment, longer copy | not all carriers/devices render media well; some users have MMS disabled |
| RCS | rich card, button affordances | not everyone; falls back to plain SMS — design for the fallback, not the rich case |

Building features that *require* MMS or RCS to work is a deliverability failure waiting to happen. Treat richness as nice-to-have; SMS plain is the contract.

## Anti-patterns

- **Markdown in SMS.** `**bold**` and `[link](url)` show as literal characters. Send plain text and bare URLs.
- **Long-form bot replies.** A 6-segment essay where 1 segment would do. Costs money, costs attention.
- **Emoji-as-affordance.** "Reply 👍 to confirm" looks clean; users on older Android send back `<U+1F44D>` or nothing. Use plain text for action prompts.
- **Asking for structured info inline.** "Reply with the date, amount, and category, separated by commas." Users won't.

## Eval

- **Length assertion** — every outbound message: GSM-7 ≤ 160 chars OR explicit override flagged. Mechanical check on rendered output.
- **Encoding assertion** — assert encoding before send; flag UCS-2 escalations against budget.
- **Segment count cap** — outbound > N segments fails the eval unless explicitly allow-listed.
- **Critical-info-in-segment-1** — for transactional templates, assert the merchant + amount appear in the first 153 chars.

## See also

- [forced-tool-call-output](forced-tool-call-output.md) — schema can constrain single-segment safety as a structural invariant.
- [hard-surface-irrevocability](hard-surface-irrevocability.md) — segmentation failures are exactly the hard-surface failure mode.
