---
id: native-thinking-vs-prompted-reasoning
type: concept
tags: [llm, reasoning, prompting, thinking, output-design, agents]
related:
  - [[llm-output-design]]
  - [[forced-tool-call-output]]
  - [[operator-trust-injection]]
  - [[decision-engine-contract]]
  - [[domain-knowledge-injection]]
  - [[recency-bias-prompt-design]]
  - [[llm-observability]]
status: living
created: 2026-06-09
summary: "frontier labs have moved away from prompted `<reasoning>` tags; native thinking APIs are the default."
source-thread: [[2026-06-09-reasoning-mode-research]]
---

# Native Thinking vs. Prompted Reasoning

Asking the model to emit reasoning in `<reasoning>` / `<thinking>` tags inside the response was canonical advice in 2023. By late 2025, frontier labs have moved away from it as the *primary* reasoning mechanism. Native reasoning APIs are the default; prompted-reasoning tags remain a fallback for non-reasoning models and a structuring device for prompts.

## The current state, by lab

| Lab | Native mechanism | Stance on prompted `<reasoning>` |
|---|---|---|
| Anthropic | Adaptive thinking (Opus 4.7/4.8 only mode supported); thinking content blocks separate from `content` | **Actively discouraged**. Claude Fable 5 can refuse with `stop_details.category: "reasoning_extraction"`. Manual `<thinking>`/`<answer>` retained as a fallback only when thinking is off. |
| OpenAI | `reasoning_effort` (minimal/low/medium/high) on o-series and GPT-5; reasoning items separated from content | **Avoid CoT prompts on reasoning models** — "unnecessary and can sometimes hinder." XML structuring tags (`<self_reflection>`, `<context_gathering>`, `<tool_preambles>`) still endorsed. |
| DeepSeek | `reasoning_content` field as sibling to `content`; R1 emits `<think>` natively | Native thinking is the protocol. **Forbids feeding `reasoning_content` back into context** (returns 400). |
| Google (Gemini) | Thinking mode | Documented as native; primary-source detail not verified in this pass — flag as unconfirmed. |

## Why native > prompted, structurally

Even when the *cost per token* of native thinking and inline-prompted reasoning is similar, native modes win on four structural axes:

1. **Separate billing & visibility.** Native thinking tokens are billed as output but stored separately; surfaces can render `content` and omit thinking without per-turn parsing. Prompted reasoning is in `content` — surfaces have to strip it. (Anthropic: "display: 'omitted' skips streaming over the wire." OpenAI: o-series shows model-generated *summaries* to users, not raw CoT.)

2. **Cache-friendly multi-turn.** Anthropic's prompt cache treats prior-turn thinking blocks as input tokens *when read from cache*. Inline-prompted reasoning that's part of `content` doesn't get this — it has to be regenerated or re-prompted.

3. **Inter-tool reasoning, automatic.** Adaptive thinking enables reasoning *between tool calls* without a beta header on Fable 5 / Mythos 5 / Opus 4.7+; OpenAI's Responses API with `previous_response_id` persists reasoning across the tool loop. Vendor-reported lift from this: TAU-Bench Retail 73.9% → 78.2% just by switching to the API that persists reasoning.

4. **Faithfulness / training pressure separation.** OpenAI's stated rationale for hiding raw CoT: *"the model must have freedom to express its thoughts in unaltered form, so we cannot train any policy compliance or user preferences onto the chain of thought."* Inline-prompted reasoning is in the same channel as user-facing output, so the same training pressures apply. Native thinking is structurally insulated.

## What "developer access to thinking" actually means in 2026

A correction to a common over-reading of the section above: when this node says "read the thinking blocks," what developers actually receive depends on the lab and is rarely the raw chain of thought. The detail matters for instrumentation:

- **Anthropic Claude 4 / Fable 5 / Mythos 5** default returns `display: "summarized"` thinking blocks — *summaries produced by a separate summarizer model*. Raw thinking is sales-gated. With `display: "omitted"`, the `signature` field carries opaque encrypted reasoning across turns.
- **OpenAI Responses API** explicitly does NOT expose raw reasoning tokens — only opt-in summaries (`reasoning.summary = auto/concise/detailed`). For stateless callers, `include: ["reasoning.encrypted_content"]` round-trips reasoning across turns; the content is opaque.
- **Google Gemini** returns summary `parts` via `includeThoughts: true`; raw thoughts are not API-accessible.
- **DeepSeek deepseek-reasoner** is the outlier — verbatim `reasoning_content` is returned, but echoing it back in subsequent calls returns a 400.

For the practical day-1 instrumentation workflow, see [llm-observability](llm-observability.md).

## The hard incompatibility worth knowing

**Extended thinking on Anthropic does NOT work with `tool_choice: "any"` or named tools** — only `auto` or `none`. From the docs: *"Using `tool_choice: {"type": "any"}` or `tool_choice: {"type": "tool", "name": "..."}` will result in an error because these options force tool use, which is incompatible with extended thinking."*

Implication for [forced-tool-call-output](forced-tool-call-output.md) and [template-rendered-output](template-rendered-output.md): an agent that combines (a) forced tool-call output rendering with (b) extended thinking has to drop one of them per turn. Common resolutions:

- Use forced tool-call only on first-touch / hard-surface turns; let conversational turns use auto + thinking.
- Run reasoning in a separate pass; render via forced tool-call without thinking.
- Use OpenAI / DeepSeek where the constraint is different.

## When prompted `<reasoning>` is still correct

Don't throw the technique out — just narrow its use:

| Use prompted reasoning when | Use native thinking when |
|---|---|
| Model is a non-reasoning GPT (no o-series / 4.x / Fable / Mythos) | Reasoning model is available |
| Thinking is explicitly off (cost / latency floor) | Tool-using agent loop with multi-turn reasoning |
| Few-shot examples need to *show* a reasoning pattern | First-class auditability needed (read thinking blocks) |
| `reasoning_effort=minimal` and you need a CoT *summary* (OpenAI's own recommendation for that mode) | Production agent where users shouldn't see reasoning |
| Quick prototyping where the API surface change is overhead | API + caching benefits matter |

## XML tags are NOT deprecated for prompt *structure*

The deprecation is narrow: prompted *reasoning extraction* in response text. XML-style structuring tags inside the *prompt* are still actively endorsed:

- Anthropic: `<documents>`, `<example>`, `<context>`, `<input>` for prompt organization.
- OpenAI GPT-5 prompting guide: `<self_reflection>`, `<context_gathering>`, `<tool_preambles>`, `<persistence>`, `<code_editing_rules>` — Cursor's testimony in the official guide: structured XML specs improved instruction adherence.

The pattern that's deprecated: "First reason in `<reasoning>` tags, then answer." The pattern that's still alive: structured XML inside the prompt to organize *instructions*.

## Replacement pattern for non-reasoning models

If you're stuck on a non-reasoning model and want auditability + reasoning-quality lift:

1. **Structured `analysis` / `reasoning` field in tool args, NOT user-facing.** The tool definition has a `reasoning: string` field; downstream renderer never displays it. Same pattern as `reasoning` in [decision-engine-contract](decision-engine-contract.md) — audit-only, durable, separate from user output.
2. **Multi-step prompts (separate API calls).** First call: generate analysis. Second call: generate user-facing answer using analysis as context. Higher latency, cleaner separation, and the second call can use forced tool-call where the first cannot.
3. **`<thinking>` + harness-strips.** Manual `<thinking>` tags in response with a deterministic post-render filter that strips them. See [operator-trust-injection](operator-trust-injection.md) for the same defense-in-depth pattern.

## Anti-patterns

- **Adding `<reasoning>` tags on top of native thinking.** Diminishing returns; Anthropic explicitly notes "prompting for the model works similarly in both modes." On Fable 5 it can be refused outright.
- **Treating prompted reasoning as audit trail.** It's in the user-facing channel; structurally indistinguishable from prose. For real audit, native thinking blocks (Anthropic) or `reasoning_content` (DeepSeek) or reasoning items (OpenAI) — and store them in a [decision-audit-trail](decision-audit-trail.md).
- **Feeding DeepSeek `reasoning_content` back into the next request.** Returns 400. Strip it before next turn.
- **Forcing tool_choice + extended thinking on Anthropic.** Returns an error. Pick one per turn.
- **Showing raw native thinking to users.** OpenAI explicitly hides it; Anthropic provides `display: "omitted"`. The trace isn't UX-grade.

## Eval

- **No-leakage assertion.** For surfaces that shouldn't show reasoning, mechanically assert thinking-block / `<reasoning>` content never appears in rendered output.
- **Reasoning-mode A/B.** Same task, same model, same prompts: with native thinking on vs. off vs. prompted `<reasoning>`. Measure correctness and latency; the gap should be near-zero on simple tasks (where thinking is overkill) and large on multi-step tasks.
- **Forced-tool-call + thinking matrix.** Catch the Anthropic incompatibility before it ships — assert no path combines forced tool_choice with extended thinking on supported models.

## References (verified primary sources, late 2025 / early 2026)

- Anthropic, *Adaptive thinking* — https://platform.claude.com/docs/en/docs/build-with-claude/adaptive-thinking — the `reasoning_extraction` refusal category, interleaved-thinking guidance.
- Anthropic, *Extended thinking* — https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking — billing, `display: omitted`, forced tool_choice incompatibility.
- Anthropic, *Use XML tags* — https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/use-xml-tags — manual `<thinking>` retained as fallback.
- Anthropic, *Prompt caching* — https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching — thinking blocks cached as input tokens when in prior assistant turns.
- OpenAI, *Reasoning best practices* — https://developers.openai.com/api/docs/guides/reasoning-best-practices — "Avoid chain-of-thought prompts" on reasoning models.
- OpenAI, *GPT-5 prompting guide* — https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide — XML structure tags still endorsed; CoT summary recommended for `reasoning_effort=minimal`.
- OpenAI, *Learning to reason with LLMs* — https://openai.com/index/learning-to-reason-with-llms/ — rationale for hiding raw CoT.
- DeepSeek, *Reasoning model API* — https://api-docs.deepseek.com/guides/reasoning_model — `reasoning_content` shape; 400 on feedback.
- DeepSeek-R1 model card — https://huggingface.co/deepseek-ai/DeepSeek-R1 — `<think>` enforcement at start of output.

## See also

- [forced-tool-call-output](forced-tool-call-output.md) — the incompatibility constraint above lives here too.
- [operator-trust-injection](operator-trust-injection.md) — same hard line: reasoning never crosses to user-facing output. Native thinking is the structurally-clean implementation.
- [decision-engine-contract](decision-engine-contract.md) — `reasoning` field as audit-only is the equivalent pattern at the engine-output level.
- [recency-bias-prompt-design](recency-bias-prompt-design.md) — XML structuring tags inside the prompt are still endorsed and benefit from end-of-prompt placement for instructions.
