---
id: collaborative-agent-eval
type: concept
tags: [eval, agent, dual-control, multi-turn, conversation, user-simulator, reliability]
summary: "evaluating an agent that must act through a semi-autonomous user who also holds tools over a shared world — dual-control (τ²-Bench): solo→interactive gap, compositional verifiable tasks, environment-coupled user simulator, pass^k."
related:
  - [[llm-evaluation]]
  - [[simulated-user-eval]]
  - [[agent-trajectory-eval]]
  - [[eval-case-design]]
  - [[eval-dataset-quality]]
  - [[golden-snapshot-eval]]
  - [[human-in-the-loop-control]]
  - [[user-intent-to-task-grounding]]
  - [[escalation-handoff]]
status: living
created: 2026-07-07
---

# Collaborative / Dual-Control Agent Eval

Most conversational-agent benchmarks are **single-control**: only the agent has state-changing tools, and the simulated user is a passive information provider ([simulated-user-eval](simulated-user-eval.md)). But in real technical support the fix lives on the *user's* side — the agent can't reboot the phone or toggle airplane mode itself; it must diagnose, instruct, and steer a human who acts (and errs) in the world. **Dual-control eval** scores exactly that capability: acting *through* a semi-autonomous collaborator you cannot directly control.

The canonical instrument is **τ²-Bench** (Barres, Dong, Ray, Si, Narasimhan, [arXiv:2506.07982](https://arxiv.org/abs/2506.07982), Jun 2025; Sierra Research + Princeton/Mila), the dual-control successor to τ-bench ([arXiv:2406.12045](https://arxiv.org/abs/2406.12045)).

## The dual-control idea

Both agent **and** user hold their own tools over a **shared, mutable world state**, formalized as a two-player **Dec-POMDP**; the world splits into an agent-controlled part (CRM/backend) and a user-controlled part (phone/device status). Each turn is one player's tool call or message; reward is a **single global check on the final state**, verified against the *user's* database (is the user's data actually back on at 200 Mbps). The flagship dual-control domain is **Telecom** (device/network troubleshooting); retail and airline stay single-control.

## The solo→interactive gap (the number that matters)

The core move is an **ablation that isolates the coordination/communication tax** — run the same agent in three modes:

- **No-User** — agent controls *all* tools (incl. the user's); tests pure reasoning/tool-calling.
- **Default** — real dual-control; agent must guide an active user.
- **Oracle Plan** — agent is given the ground-truth call sequence; isolates execution given a known plan.

**No-User → Default** drops telecom pass^1 by **18% (gpt-4.1) / 25% (o4-mini)** (paper §4.2). Domain difficulty confirms it: gpt-4.1 pass^1 falls **74% (retail) / 56% (airline) → 34% (telecom)**. This capability — eliciting information from and steering a semi-autonomous actor — is **invisible to single-control benchmarks**. (Caveat: long-horizon is *also* a bottleneck — pass^1 nears 0 for >7-action tasks even in No-User; communication isn't the only failure.)

## Compositional verifiable tasks

Tasks are **objectively scorable without an LLM judge** ([golden-snapshot-eval](golden-snapshot-eval.md)). Each atomic subtask is a triple — **init** (set up the broken state), **solution** (the fixing tool calls), **assert** (conditions the final state must satisfy). Subtasks compose combinatorially (telecom: 15 groups → 2,285 tasks, subsampled to 114 balanced over intent×#subtasks×persona; **#subtasks is the difficulty axis**), auto-verified as not-pre-solved. Only assertion functions gate success, so scoring is **path-independent**.

## Trustworthy user simulator

LLM-played users invent world facts ([simulated-user-eval](simulated-user-eval.md)'s non-determinism pitfall). The fix is **coupling the simulator to the environment**: the user can only call constrained tools yielding human-readable outputs derived from actual world state, plans *reactively*, and keeps a **complexity asymmetry** (follows instructions, doesn't reason). Payoff: telecom user-sim **16% error / 6% critical** vs τ-bench retail **40% / 12%**. This is *instrument* reliability, not agent reliability ([eval-dataset-quality](eval-dataset-quality.md)) — the paper audits implementation/task-spec/user-sim errors *before* scoring agents.

## pass^k reliability

**pass^k** ("pass hat k") = the chance **all k i.i.d. trials of a task succeed** (complement of `pass@k`). It **decreases** with k, isolating **run-to-run robustness** on semantically identical tasks. Degradation is severe (τ-bench: >60% pass^1 → <25% pass^8 in retail). For a production agent, **pass^1 overstates deployability** — an agent fine on average can still fail most repeat encounters of the same issue; report the pass^k curve.

## When to use it for a domain agent

- The agent must **guide a user to act** on a surface it can't touch (device, another account, physical steps) — the defining trigger.
- You need to separate **reasoning failure from communication/coordination failure** (the No-User vs Default ablation).
- You want **path-independent, judge-free scoring** with the fix defined as a measurable end-state.
- Your domain has an **escalation path** ([escalation-handoff](escalation-handoff.md)) — τ²'s "transfer" class can't be solved by the agent alone.

## Pitfalls

- **Assuming single-control eval covers a collaborative agent.** It structurally can't measure steering a second actor.
- **Reporting pass^1 only.** Hides the reliability collapse.
- **Trusting a prompt-only user simulator.** Couple it to the environment or it invents device states.
- **Blaming the agent for benchmark noise.** Audit user-simulator / task-spec error first.
- **Symmetry confusion.** Dual-control is *not* co-evaluated multi-agent — only the agent is scored; the user is a deliberately-limited collaborator.
- **Vendor-number drift.** Paper numbers are frozen at v1; the live repo/leaderboard (τ³-bench: banking/RAG, voice, "75+ fixes") has moved past it — don't cite blog/leaderboard figures as paper claims.

## References

Sits under [llm-evaluation](../topics/llm-evaluation.md). Primary: τ²-Bench [arXiv:2506.07982](https://arxiv.org/abs/2506.07982); τ-bench [arXiv:2406.12045](https://arxiv.org/abs/2406.12045) (pass^k, single-control predecessor). Extends [simulated-user-eval](simulated-user-eval.md), [agent-trajectory-eval](agent-trajectory-eval.md), [eval-case-design](eval-case-design.md), [eval-dataset-quality](eval-dataset-quality.md). Sierra research-page framing is qualitative only (no numbers).
