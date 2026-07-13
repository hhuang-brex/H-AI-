---
id: proactive-memory-intervention
type: concept
tags: [agent, memory, intervention, long-horizon, reliability, science-excellence]
summary: "memory as an active PUSH intervention, not passive PULL retrieval — a separate memory agent watches an unmodified action agent and each step decides whether to inject a reminder or stay silent, to counter 'behavioral state decay' (state that stops steering behavior even while still in context)."
related:
  - [[agent-memory]]
  - [[memory-retrieval]]
  - [[context-compaction]]
  - [[memory-consolidation-and-forgetting]]
  - [[agent-native-memory-framework]]
  - [[memory-types-taxonomy]]
  - [[multi-agent-delegation]]
  - [[agent-harness]]
  - [[self-improving-harness]]
  - [[collaborative-agent-eval]]
status: living
created: 2026-07-12
---

# Proactive Memory Intervention

The memory nodes in this graph are about **recall from a store**: what to keep, how to rank it, when the agent *asks*. This node is about the opposite axis — memory as an **active PUSH intervention** the agent never requested. Source: *Remember When It Matters: Proactive Memory Agent for Long-Horizon Agents* (Wu, Zhang, Zhou, Wang, Peng, Li, Fan, Zhao; [arXiv:2607.08716](https://arxiv.org/abs/2607.08716), 9 Jul 2026). **All numbers below are self-reported from one lab under its own harness — no independent replication.**

## Behavioral state decay — the failure mode it targets

The paper coins **behavioral state decay**: decision-relevant state (task requirements, environment facts, prior attempts, failure diagnoses, open subgoals) stops influencing the next decision. The sharp distinction — the information *"may still be present"* in the transcript or even the context window but *"no longer exerts reliable control over behavior."* So it is a **salience/control failure, not a capacity or recall failure** — which is exactly why the nodes below don't cover it. It is a concrete primary instance of the 'long-horizon degradation from context accumulation' cluster in [agent-failure-modes](agent-failure-modes.md).

## Memory as intervention: push, not pull

*"We study memory as an active intervention mechanism rather than passive retrieval."* A **separate memory agent runs alongside an unmodified, unaware action agent**, maintains a structured memory bank from the recent trajectory, and each step decides *"whether to inject a memory-grounded reminder or remain silent"* — silence is **an explicit action**. Pitched as **plug-and-play** with frontier action agents and existing harnesses (a composition-level bolt-on; no retraining/re-prompting of the action model) — a specialized asymmetric watcher/advisor flavor of [multi-agent-delegation](../topics/multi-agent-delegation.md) and a harness component ([agent-harness](../topics/agent-harness.md)): the delegate observes and advises but never acts.

## What it is explicitly NOT (dedup)

- vs [memory-retrieval](memory-retrieval.md) — retrieval is query-driven PULL ranking deciding *what to surface when asked*; this decides *whether to inject unprompted and when* (the paper ablates against Mem0 general retrieval and beats it).
- vs [context-compaction](context-compaction.md) — compaction is capacity-driven window-fitting; decay happens **while the info is still in context**, so the lever is *re-activate at the decision point*, not *pack better*. Extends [memory-retrieval](memory-retrieval.md)'s lost-in-the-middle note toward active re-surfacing.
- vs [memory-consolidation-and-forgetting](memory-consolidation-and-forgetting.md) — that owns the WRITE/lifecycle path; this is DELIVERY/act-path *timing*. The bank's knowledge/procedural split maps onto [memory-types-taxonomy](memory-types-taxonomy.md); its save/update/delete tools extend the U phase of [agent-native-memory-framework](agent-native-memory-framework.md) but add an *intervention* phase R/S/Q/U doesn't name.

## Results and the caveats to keep

Benchmarks: **Terminal-Bench 2.0** and **τ²-Bench** ([collaborative-agent-eval](collaborative-agent-eval.md)); memory agent = Claude Opus 4.6. Headline pass@1 gains are for the **weaker** action agent (Sonnet 4.5): Terminal-Bench **+8.3pp** (37.6→45.9), τ²-Bench **+6.8pp** (55.0→61.8).

- **The headline is the best case, not the typical.** The stronger action agent (Opus 4.6) gains only ~+2.4/+2.5pp — ~⅓ the weaker-agent gain. Value shrinks as the base model improves (same capability-gating as [self-improving-harness](self-improving-harness.md)'s "intelligence is still the core").
- **Selectivity is load-bearing but the margins are small.** In τ²-Bench ablations, selective injection beats always-on by <1pt on macro (within run variance); the clearer results are that *advisor-only-without-a-bank can hurt* and general retrieval sits near baseline. Read: selectivity's real payoff over always-on is **fewer injections (cost/latency)**, not accuracy.
- **Open-weight arm is weak-transfer.** A Qwen3.5-27B memory agent (SFT then GRPO on "SETA") lifts validation reward 0.709→0.734 and Terminal-Bench 37.6→41.1 (+3.5pp); an *untrained* 27B memory agent *hurts*. A cross-link to [self-improving-harness](self-improving-harness.md), not a co-headline.

## Open questions

**Cost/latency is unpriced** — a per-step frontier-model memory call roughly doubles inference; no token/$/latency numbers are reported. Is +6–8pp on a weak agent cheaper than just upgrading the action model? (a [cost-aware-eval](cost-aware-eval.md) question). Also: does the memory agent's own summarization inherit the compaction failure it means to counter, and does behavioral state decay persist at the frontier or obsolete itself with the next stronger base model?

## References

Sits under [agent-memory](../topics/agent-memory.md). Primary: [arXiv:2607.08716](https://arxiv.org/abs/2607.08716) (self-reported). Cross-links: [agent-failure-modes](agent-failure-modes.md) (names the cluster), [collaborative-agent-eval](collaborative-agent-eval.md) (τ²-Bench).
