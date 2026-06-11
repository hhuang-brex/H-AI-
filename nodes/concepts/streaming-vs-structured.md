---
id: streaming-vs-structured
type: concept
tags: [llm, output, streaming, ux, structured-output]
related:
  - [[llm-output-design]]
  - [[forced-tool-call-output]]
  - [[schema-vs-validator]]
status: living
created: 2026-06-07
summary: "token-by-token UX vs. structured output trade-off."
---

# Streaming vs. Structured Output

A real trade-off, not a preference. Token-by-token streaming and constrained-shape output are at odds because users see incremental tokens as they arrive, but a structured object only becomes meaningful when complete.

## The trade-off

| Property | Streaming free-text | Constrained structured output |
|---|---|---|
| Time-to-first-token UX | yes — user sees typing | no — object only valid when complete |
| Perceived latency | low | high (must buffer) |
| Wire-format guarantee | none | strong |
| Suits chat UI | yes | poor unless rendered post-hoc |
| Suits batch / async | irrelevant | yes |

## Where this matters

- **Chat UI with typing indicator** — users have a strong expectation of incremental rendering. Forced tool-call fights this.
- **Voice / IVR** — streaming TTS is similar in spirit; partial structured output is an unsolved UX problem.
- **SMS / email / webhooks** — non-streaming; the trade-off vanishes; structured output is fine.

## Mitigations (when you want both)

1. **Streaming-then-render.** Generate free-text streaming, then post-process into structure for downstream wire consumers. Doubles cost but preserves UX.
2. **Streamed structured output.** Some APIs (OpenAI, Anthropic) emit partial JSON deltas during tool-call generation. Useful for "is the assistant typing?" indicator, but still fails the "render meaningfully partway" bar.
3. **Two-phase output.** First emit a free-text "thinking" stream visible to the user; then emit a structured tool-call for the wire side. The user-facing surface stays streamed; the wire-facing surface stays typed.
4. **Token-budget tags.** Free-text with `<answer>...</answer>` style tags + a streaming parser. Pragmatic but brittle.

## Decision

If a surface needs both streaming UX and structured wire output, you almost always want **two surfaces** — see [output-surface-taxonomy](output-surface-taxonomy.md). The chat UI gets free-text + validator; the wire-facing render is computed downstream from the same agent state.
