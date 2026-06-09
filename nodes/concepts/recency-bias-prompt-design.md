---
id: recency-bias-prompt-design
type: concept
tags: [prompt-engineering, recency, long-context, agents, attention]
related:
  - [[operator-trust-injection]]
  - [[conversation-memory]]
  - [[domain-knowledge-injection]]
  - [[layered-defense-pipeline]]
status: living
created: 2026-06-09
---

# Recency-Bias Prompt Design

Models weight recent context heavily. A rule placed at the start of a long prompt — or 300 turns back in a long agentic session — loses to local patterns near where the model is currently writing. This is a generalizable principle behind several otherwise-disparate prompt-design choices.

## The principle, stated concretely

| Phenomenon | Why recency matters |
|---|---|
| Long-session rule decay | A guideline in the system prompt 300 turns ago is "distant"; recent turns dominate the model's local context |
| End-of-prompt placement wins | Anthropic docs: "Queries at the end can improve response quality by up to 30% in tests" |
| Local reinforcement beats global rules | A one-line reminder right before a critical input outperforms an elaborate rule far away |
| Cache invalidation hides the problem | Prompt caching keeps the *front* of the prompt cheap; the variable *back* is where the model's attention is sharpest anyway |

## What to put where

A useful default for prompt structure:

```
[ system prompt ]
  · persona / role
  · stable rules (operator-trust, refusal policies)
  · tool catalog
  · output-hygiene block  ← end-of-prompt placement gets weight
[ user turn ]
  · long documents (top of user content; Anthropic recommends this)
  · context / history
  · operator-event injection (if any) wrapped in self-describing tag
  · reinforcement reminder (one line, immediately before the actual ask)
  · the actual user query
```

Three placements that make this concrete:

1. **Long documents at the top of the user content.** Anthropic's long-context guidance: putting longform data near the top *and* the query/instructions at the bottom can improve response quality by up to 30%.
2. **Output-hygiene rules at the end of the system prompt.** The rules that govern user-facing output (don't narrate, don't mention tools, address as "you") earn their weight by being last.
3. **Local reinforcement right before the critical input.** When an operator-event block precedes the user's message, a one-line reminder ("the user cannot see the block above; respond only to their message below") catches the leak that a system-prompt rule alone would miss.

## Where this principle applies in our graph

- [operator-trust-injection](operator-trust-injection.md) — techniques 2 and 3 (point-of-injection reinforcement, end-of-prompt output hygiene) are direct applications.
- [conversation-memory](conversation-memory.md) — long-session memory degrades because old context doesn't compete with recent turns; structured state is durable, transcript chunks aren't.
- [domain-knowledge-injection](domain-knowledge-injection.md) — choosing whether knowledge enters via system prompt vs. structured state per turn is partly a recency call.
- [layered-defense-pipeline](layered-defense-pipeline.md) — Sonnet classifier with `cache_control: ephemeral` keeps the stable front of the prompt cheap; the variable tail (where the model attends most) is what the cache *doesn't* re-bill.

## Anti-patterns

- **Critical rules buried mid-prompt.** A rule sandwiched between examples and tool definitions is the most-forgotten one.
- **One-time system-prompt instructions for behaviors that recur per-turn.** "Never mention internal state" lives in the system prompt; on turn 300 it's drowned by 50,000 tokens of intermediate transcript. Reinforce locally.
- **Asking the model to remember rules from "earlier."** It can; it often won't. If the rule must hold, place it where attention is.

## Eval

- **End-of-prompt-placement A/B** — same instructions, different placement; measure adherence.
- **Long-session decay** — extend a multi-turn case to 50, 100, 200 turns; assert system-prompt rules still hold (and add reinforcement when they don't).
- **Reinforcement contribution** — ablate the local reinforcement reminder; measure operator-message leak rate.

## References

- Anthropic, *Prompting best practices*, section "Long context prompting": https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices — *"Queries at the end can improve response quality by up to 30% in tests, especially with complex, multi-document inputs."*
- Anthropic, same page, "Context hydration and role consistency" — backs the local-reinforcement-via-user-turn pattern for very long conversations.
