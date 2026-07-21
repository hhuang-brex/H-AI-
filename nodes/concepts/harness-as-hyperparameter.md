---
id: harness-as-hyperparameter
type: concept
tags: [agent, harness, optimization, model-selection, evaluation, no-free-lunch, engineering-excellence]
summary: "there is no universally superior harness — the best loop/tool/context configuration is problem- and model-dependent, so treat harness choice as a tunable hyperparameter selected or adapted online rather than a fixed recipe."
related:
  - [[agent-harness]]
  - [[self-improving-harness]]
  - [[llm-evaluation]]
  - [[offline-prompt-optimization]]
  - [[agent-control-loop]]
  - [[agent-trajectory-eval]]
  - [[eval-statistical-significance]]
  - [[harness-token-economics]]
status: living
created: 2026-07-20
source-thread: [[2026-07-20-agent-harness-research]]
---

# Harness as Hyperparameter

There is **no universally superior harness**. The best configuration of the loop, tool surface, context policy, and delegation structure ([agent-harness](../topics/agent-harness.md)) depends on the *problem* and the *base model* — so harness choice behaves like a **tunable hyperparameter**, not a fixed recipe you commit to once. The engineering consequence: prefer **selecting or adapting the harness online** (guided by early performance or per-case experience) over hard-coding one scaffold and assuming it ports.

This is a distinct third stance in the harness-vs-model debate. It is neither "scaffolding **dissolves** as models scale" nor "scaffolding **persists** as a fixed durable layer" — it is "the *right* scaffolding is contingent, so allocate it adaptively."

## Why "no free lunch" holds for harnesses

**Automated Discovery Has No Universally Superior Harness** ([arXiv:2607.18235](https://arxiv.org/abs/2607.18235), 2026-07-20) is the load-bearing evidence. A component-level ablation over 30 budget-matched harness variants (3.1M+ rollouts, evaluated against a null distribution rather than raw win-rate) finds harnesses have a **"generalization problem"**: no fixed configuration reliably wins across problems, and the ranking reshuffles by task and model. Its prescription — treat harness choice as a hyperparameter and **allocate online**, letting early performance steer which configuration gets more budget, beats committing to any single fixed harness. (Scope: automated-discovery/search harnesses, adjacent to coding agents — the mechanism generalizes further than the benchmark proves.)

## Mechanics — how you actually adapt it

| Grain | What varies | Anchor |
|---|---|---|
| **Per-workload selection** | pick/allocate among a fixed set of harnesses by early signal (bandit-style) | Automated Discovery ([2607.18235](https://arxiv.org/abs/2607.18235)) |
| **Per-case adaptation** | tailor the control layer to each test case from the agent's own execution history, no test-time labels | MemoHarness ([arXiv:2607.14159](https://arxiv.org/abs/2607.14159), 2026-07-14) — an "adaptive harness optimization framework that learns from its own executions" |
| **Offline code edit** | rewrite the harness *code* against a held-out fitness function | [self-improving-harness](self-improving-harness.md) (propose-evaluate-accept; STOP/DGM/Self-Harness) |

The first two are the *online / inference-time* face of the same idea the third does *offline*. They compose: an offline loop can produce the candidate set that an online selector then allocates across.

## The compounding caveat

Online adaptation does **not** compound for free. **Do Agent Optimizers Compound?** ([arXiv:2607.14004](https://arxiv.org/abs/2607.14004), 2026-07-15, continual-learning eval on Terminal-Bench 2.0) finds harness-optimization gains persist across rounds *only* when regression control is built in as an inductive bias; without a held-out guard, one-shot gains fail to transfer and plateau. So "adapt the harness" inherits the same binding constraint as [self-improving-harness](self-improving-harness.md): a **cheap, trustworthy fitness function** and a capable base model. Adaptation without a held-out check is just overfitting the harness to the eval slice.

## Pitfalls

- **Overfitting the harness to the eval slice.** Per-case tuning with no held-out set produces a configuration that wins the benchmark and regresses in production — the compounding caveat above, and why this node leans on [eval-statistical-significance](eval-statistical-significance.md) and the reproducibility corollary in [agent-harness](../topics/agent-harness.md).
- **Assuming portability.** "No universal harness" cuts both ways: a scaffold tuned for one model/task family should be *expected* to regress on another. Re-select, don't reuse blindly.
- **Ignoring selection cost.** Online exploration burns rollouts/budget (the anchor spent 3.1M); the adaptation must be cheaper than the gain it buys — a [harness-token-economics](harness-token-economics.md) tradeoff, not a free lever.
- **Confusing it with [self-improving-harness](self-improving-harness.md).** That node edits harness *code* offline; this one is *configuration selection/adaptation*, often at inference time. They compose but answer different questions.

## References

- **Automated Discovery Has No Universally Superior Harness** — [arXiv:2607.18235](https://arxiv.org/abs/2607.18235) (2026-07-20). The no-free-lunch ablation + hyperparameter framing. *Verified 2026-07-20.*
- **MemoHarness: Agent Harnesses That Learn from Experience** — [arXiv:2607.14159](https://arxiv.org/abs/2607.14159) (2026-07-14). Per-case online adaptation from execution history. *Verified 2026-07-20.*
- **Do Agent Optimizers Compound?** — [arXiv:2607.14004](https://arxiv.org/abs/2607.14004) (2026-07-15). The regression-control-or-plateau caveat; pass-rate ranking is vendor-authored — cite the mechanism, not the numbers. *Verified 2026-07-20.*
