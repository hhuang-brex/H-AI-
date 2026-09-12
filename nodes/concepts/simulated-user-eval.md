---
id: simulated-user-eval
type: concept
tags: [eval, agent, testing, simulated-user, multi-turn, conversation, science-excellence]
summary: "evaluating a chatting agent by driving it with a scripted or LLM-played user across multi-turn scenarios — interruptions, corrections, abandonment — not just single-turn replies."
related:
  - [[llm-evaluation]]
  - [[agent-trajectory-eval]]
  - [[human-in-the-loop-control]]
  - [[mid-task-steering]]
  - [[llm-as-judge]]
  - [[collaborative-agent-eval]]
  - [[intent-and-disambiguation]]
  - [[references-multi-turn-agent-eval]]
status: living
created: 2026-06-11
---

# Simulated-User Eval

A chatting task agent can only be exercised by *conversation* — and real conversations interrupt, correct, go quiet, and change their mind mid-task. Simulated-user eval drives the agent with a counterpart (scripted or LLM-played) across multi-turn scenarios, scoring how the agent handles the messy interaction patterns that single-turn evals never reach. It's the conversational counterpart to [execution-invariant-testing](execution-invariant-testing.md)'s safety-property focus.

## Why single-turn eval misses the point

Scoring "given prompt X, was reply Y good?" tests the agent as a chatbot. But a task agent's hardest behaviors are *interactional*: does it honor a mid-task correction, does it re-confirm after the user changed the target, does it resume gracefully when the user returns hours later, does it not double-act when the user impatiently re-sends. None of these are visible in a one-shot reply — they only appear across turns. This is why simulated-user eval sits above [agent-trajectory-eval](agent-trajectory-eval.md): trajectory eval scores the agent's *own* tool path; this scores the agent's response to an *adversarial counterpart*.

## Scripted vs. LLM-played users

| Counterpart | Strength | Use for |
|---|---|---|
| **Scripted** | Deterministic, fast, exact reproduction | Specific interaction patterns: "correct mid-task," "abandon," "impatient re-send" |
| **LLM-played persona** | Covers the long tail of phrasings | Robustness: many ways to say "actually, the Tuesday one" |

Start scripted — deterministic scenarios are debuggable and non-flaky. Add LLM-played personas for breadth once the scripted core passes. An LLM-played user is itself non-deterministic, so its scenarios need [llm-as-judge](llm-as-judge.md)-style scoring rather than exact-match.

**A flat role description is not a persona.** "You are an angry customer" produces near-identical conversations regardless of scenario, which is why LLM-played breadth so often fails to buy coverage. The parameterized alternative that has been measured: a persona *vector* — categorical demographics (channel, language proficiency, time availability…), continuous behavioral traits sampled around curated base profiles (patience, assertiveness, digital literacy…), and emotional states that **shift in response to scenario context** — plus an orthogonal query-complexity overlay controlling how vaguely the user phrases things. Across 64,698 multi-turn conversations it produced a **15.8-percentage-point spread in agent goal achievement across personas**, and the *same* persona behaved differently across scenarios ([arXiv:2609.08592](https://arxiv.org/abs/2609.08592), author-reported over 3 production corpora). Two takeaways: the vagueness axis is worth separating from the personality axis, because it is what actually stresses [intent-and-disambiguation](intent-and-disambiguation.md); and a persona set that yields no spread in outcomes is not testing anything.

## The scenarios that matter for a chatting task agent

These map directly onto [human-in-the-loop-control](../topics/human-in-the-loop-control.md) and [mid-task-steering](mid-task-steering.md):

- **Mid-task correction** — user redirects mid-investigation; assert the agent replans, doesn't restart, doesn't act on the stale target.
- **Abandonment** — user goes silent; assert the agent yields/expires cleanly rather than acting unconfirmed.
- **Impatient re-send** — user repeats the request; assert no double-action (ties to the idempotency invariant).
- **Confirmation refusal** — user says "no" at the gate; assert the irreversible action doesn't fire.
- **Cross-session resume** — user replies after a simulated process restart; assert the agent continues, not restarts.

## Score behavior, not just outcome

A simulated-user run produces a transcript *and* a trajectory. Score both: did it reach the right outcome (filed the right dispute / correctly resolved) *and* did it behave well getting there (asked before the irreversible step, didn't thrash on corrections). Outcome-only scoring passes an agent that reached the right answer by a dangerous path. This is the multi-turn extension of [agent-trajectory-eval](agent-trajectory-eval.md)'s "score the path, not just the end-state."

## Pitfalls

- **Single-turn eval for a multi-turn agent.** Misses every interactional failure.
- **Only LLM-played users.** Non-deterministic and slow as the regression core; keep a scripted deterministic spine.
- **Outcome-only scoring.** Rewards reaching the goal via an unsafe path.
- **No adversarial scenarios.** Testing only the cooperative user; real ones interrupt and abandon.

## References

[execution-invariant-testing](execution-invariant-testing.md) is the safety-property sibling; [agent-trajectory-eval](agent-trajectory-eval.md) is the single-agent path-scoring this builds on; [human-in-the-loop-control](../topics/human-in-the-loop-control.md) defines the interaction patterns worth simulating.
