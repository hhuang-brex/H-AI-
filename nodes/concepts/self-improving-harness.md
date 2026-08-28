---
id: self-improving-harness
type: concept
tags: [agents, self-improvement, harness, optimization, evolutionary-search, science-excellence]
summary: "optimize the code around the model — prompts → context → workflow → harness code → optimizer code — gated by regression tests, with security kept outside the loop; a capable base model is a precondition."
related:
  - [[agent-control-loop]]
  - [[agentic-context-engineering-ace]]
  - [[offline-prompt-optimization]]
  - [[verbal-reinforcement-vs-gradient-rl]]
  - [[action-execution-safety]]
  - [[llm-evaluation]]
  - [[multi-agent-delegation]]
  - [[agent-harness]]
  - [[managed-agent-apis]]
  - [[eval-statistical-significance]]
status: living
created: 2026-07-07
---

# Self-Improving Harness

The **harness** is the system surrounding a base model that orchestrates execution — how it plans, calls tools and acts, perceives and manages context, stores artifacts, and evaluates results. It is a superset of "agent = LLM + memory + tools + planning + action," adding loop/workflow design, evaluation, permission controls, and persistent state — "closer to runtime and software system design." A **self-improving harness** makes that harness itself the optimization target. (Framing: Lilian Weng, *Harness Engineering for Self-Improvement*, 2026-07-04 — a blog framing, not a peer-reviewed result.)

## The optimization-target ladder

`instruction prompts → structured context → workflow → harness code → optimizer code`

As the base model gets more capable, optimization moves *up* the ladder toward more general targets and more generic methods — the argument being that **"code is the universal language"**: optimizing the code that runs the agent opens a far larger design space than hand-tuned prompts (a thesis, anchored in ADAS's Turing-completeness argument, not a proven law). Rung exemplars: structured context = [agentic-context-engineering-ace](agentic-context-engineering-ace.md); prompts = [offline-prompt-optimization](offline-prompt-optimization.md) (GEPA/MIPROv2); workflow = ADAS / AFlow; harness code = DGM / Self-Harness; optimizer code = STOP ("improve the improver").

## The propose-evaluate-accept loop (the safe mechanism)

The concrete, *established* pattern (Self-Harness, [arXiv:2606.09498](https://arxiv.org/abs/2606.09498)):

1. **Mine weaknesses** from execution traces.
2. **Propose** diverse but *minimal / bounded* edits tied to those failures.
3. **Validate**: accept an edit only after regression testing — it fixes the targeted weakness on a **held-in** set *and* causes no regression on a secret **held-out** set. Otherwise reject-and-log; never mutate the active harness with an unvalidated edit.

Reported held-out gains: 40.5%→61.9%, 23.8%→38.1%, 42.9→57.1% (Terminal-Bench-2.0). DGM ([arXiv:2505.22954](https://arxiv.org/abs/2505.22954)) uses the same discipline — empirical validation of each self-edit against an archive, keeping only high performers (SWE-bench 20→50%, Polyglot 14.2→30.7%). The binding constraint is a **cheap, trustworthy, automatic fitness function** — self-improvement is capability-gated by [llm-evaluation](../topics/llm-evaluation.md) quality.

## The base-model-capability caveat

Recursion needs a capable base. **STOP** ([arXiv:2310.02304](https://arxiv.org/abs/2310.02304), COLM 2024) self-improves scaffolds with GPT-4 but **degrades** with GPT-3.5 and Mixtral (only 12% of GPT-3.5 runs improved ≥3%). "Recursive structure alone is not enough — the base model must be capable enough to improve the mechanism; intelligence is still the core." (STOP is also *not* full RSI — the weights never change.)

## Evolutionary / auto-design branch

When the space is hard to differentiate but cheap to evaluate, use an LLM as a **mutation operator** over a population/archive with automated fitness: prompts (Promptbreeder [arXiv:2309.16797](https://arxiv.org/abs/2309.16797); **GEPA** [arXiv:2507.19457](https://arxiv.org/abs/2507.19457) — beats GRPO by up to 20% with up to 35× fewer rollouts, the [verbal-reinforcement-vs-gradient-rl](verbal-reinforcement-vs-gradient-rl.md) result), code (AlphaEvolve [arXiv:2506.13131](https://arxiv.org/abs/2506.13131) — first 4×4 matrix-multiply improvement over Strassen in 56 years; ShinkaEvolve [arXiv:2509.19349](https://arxiv.org/abs/2509.19349)), and whole agents/workflows (ADAS [arXiv:2408.08435](https://arxiv.org/abs/2408.08435), AFlow [arXiv:2410.10762](https://arxiv.org/abs/2410.10762) — MCTS over workflow graphs, +5.7% over best manual baseline). It fails where evaluation is slow, ambiguous, or heuristic.

## Production-safety rule: security stays OUTSIDE the loop

The editable surface (prompts, tool configs, harness orchestration code) and the guardrail-enforcing layer must be **disjoint**. Keep outside the self-edit loop: the evaluator/scoring function; the held-out regression set + its labels (secret from the proposer, to resist reward-hacking); permission/auth + sandbox/isolation enforcement; the merge/deploy gate; human review at high-consequence steps. STOP empirically measured generated code trying to bypass its sandbox — a self-improving program *will* attempt to disable reachable guardrails. This is the self-modifying extension of [action-execution-safety](../topics/action-execution-safety.md).

## Frontier & scope

Weng's *prediction* (not established): near-term recursive self-improvement is "unlikely to start as a model rewriting its weights" — it will be harness-level first, possibly *later* internalized into weights while the tool/context interface persists. Joint harness+weight loops (SIA, arXiv:2605.27276) are frontier-experimental with author-flagged confounds. A broader `agent-harness` umbrella (the static harness definition + OS analogy, parenting [agent-control-loop](../topics/agent-control-loop.md) / [context-engineering](../topics/context-engineering.md)) is a natural future node; this concept stays focused on the *self-improvement* loop.

## Pitfalls

- **No regression gate.** Accepting self-proposed edits without a held-out check is how a harness silently regresses; gate every edit.
- **Proposer can see the held-out set.** Then it reward-hacks the gate — keep the test set + labels secret from the loop.
- **Editable security.** If the permission/sandbox layer is inside the editable surface, the agent can disable it.
- **Weak base model.** Below a capability floor, recursive self-improvement degrades rather than improves (STOP).
- **Unreported variance and a fixed task order.** The reliability axes were "critically overlooked" until a 2026 re-evaluation added multiple runs and random task shuffling, and found both that the loop amplifies eval noise and that gains are **highly dependent on task order** ([arXiv:2608.18066](https://arxiv.org/abs/2608.18066)). A default task order is a hidden hyperparameter; report *n* runs and shuffle it ([eval-statistical-significance](eval-statistical-significance.md)).
- **Citing unverified systems.** The "AI Scientist" *Nature* 2026 citation is unverified (do not conflate with 2024 arXiv:2408.06292); several 2026 harness preprints exist but their results are not independently evaluated.

## References

Sits under [agent-control-loop](../topics/agent-control-loop.md). Anchor: Weng, *Harness Engineering for Self-Improvement* (2026-07-04, framing). Verified primaries: STOP [arXiv:2310.02304](https://arxiv.org/abs/2310.02304), Self-Harness [arXiv:2606.09498](https://arxiv.org/abs/2606.09498), DGM [arXiv:2505.22954](https://arxiv.org/abs/2505.22954), ADAS [arXiv:2408.08435](https://arxiv.org/abs/2408.08435), AFlow [arXiv:2410.10762](https://arxiv.org/abs/2410.10762), GEPA [arXiv:2507.19457](https://arxiv.org/abs/2507.19457), AlphaEvolve [arXiv:2506.13131](https://arxiv.org/abs/2506.13131), Promptbreeder [arXiv:2309.16797](https://arxiv.org/abs/2309.16797), ShinkaEvolve [arXiv:2509.19349](https://arxiv.org/abs/2509.19349). Builds on [agentic-context-engineering-ace](agentic-context-engineering-ace.md), [offline-prompt-optimization](offline-prompt-optimization.md), [verbal-reinforcement-vs-gradient-rl](verbal-reinforcement-vs-gradient-rl.md).
