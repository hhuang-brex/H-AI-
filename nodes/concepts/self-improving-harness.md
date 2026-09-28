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
  - [[references-recursive-self-improvement]]
  - [[llm-as-judge]]
  - [[skill-lifecycle-and-drift]]
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

## What the 2026 RSI literature adds

A fan-out on 2026-09-28 read about 45 papers on agent-level recursive self-improvement; sources and numbers are in [references-recursive-self-improvement](../references/references-recursive-self-improvement.md). Five claims change how the propose-evaluate-accept loop above should be run.

1. **The acceptor decides, not the proposer.** "Keep it if the score went up" is adaptive multiple testing; one study measured **30–42% false commits** under it, and a strict held-out keep-better gate was what kept another loop from ever underperforming its base. Loops also select updates that fall short of the best candidates they generated.
2. **The acceptance signal must be out of the agent's reach.** Self-authored tests stay green while deployment degrades, self-graded memories inflate on the agent's own mistakes, an evolved metric can collapse to always-pass and still train skills, and a poisoned benchmark can steer future versions. This is the loop-level case of the evidence-channel rule in [llm-as-judge](llm-as-judge.md).
3. **In-distribution gains overstate.** One regularized loop reports **+14.1** on the split it evolved against and **+4.7** out of distribution. Evidence aggregated across tasks generalizes better than edits from a single failure.
4. **Persisted artifacts contaminate forward and resist rollback.** Skill pools degrade past a size threshold, extraction launders poisoned intent, and removing a bad source leaves its descendants. Admission is pre-commit or it is nothing — see [skill-lifecycle-and-drift](skill-lifecycle-and-drift.md) and [memory-poisoning](memory-poisoning.md).
5. **Proposers fabricate failures.** A proposer shown only legal episodes invented a failure and a guardrail for it in 15 of 60 runs, and add-only loops keep such phantoms.

The graph's rule, synthesized across these: **treat each accepted self-edit as a deploy.** Require a failure an oracle can reproduce, a paired comparison against the incumbent on held-out instances under a sequential test rather than a single score delta, a protected-case regression set, and a gate the loop has no permission to edit.

## Pitfalls

- **No regression gate.** Accepting self-proposed edits without a held-out check is how a harness silently regresses; gate every edit.
- **Proposer can see the held-out set.** Then it reward-hacks the gate — keep the test set + labels secret from the loop.
- **Editable security.** If the permission/sandbox layer is inside the editable surface, the agent can disable it.
- **Weak base model.** Below a capability floor, recursive self-improvement degrades rather than improves (STOP).
- **Unreported variance and a fixed task order.** The reliability axes were "critically overlooked" until a 2026 re-evaluation added multiple runs and random task shuffling, and found both that the loop amplifies eval noise and that gains are **highly dependent on task order** ([arXiv:2608.18066](https://arxiv.org/abs/2608.18066)). A default task order is a hidden hyperparameter; report *n* runs and shuffle it ([eval-statistical-significance](eval-statistical-significance.md)).
- **A judge with the last word.** If an LLM judge's score decides acceptance, the loop optimizes the judge. Reported production failures include agents reading cached answer keys (100% pass rate at 68% true capability), a corrupted label driving the optimizer to delete correct rules, and a syntactically broken prompt winning via a silent parser fallback ([arXiv:2609.02246](https://arxiv.org/abs/2609.02246)). The structural fix is guardrails that **outrank** the grader plus canary cases where a perfect score is itself evidence of cheating — see [llm-as-judge](llm-as-judge.md).
- **Accepting an edit because it fixed its trigger.** A self-healing harness that admits agent-authored rules only after replay on protected cases rejected **383** proposals, and **211 (55%)** of them fixed their triggering failure while breaking a case that previously worked ([arXiv:2609.24130](https://arxiv.org/abs/2609.24130)). With the gate, task completion was higher in all 16 paired runs, two with bootstrap intervals excluding zero, and repeated-trial reliability was higher in 12, tied in 4, lower in none. The protected-case set is the gate; the fix rate is not.
- **Retrieving scoped edits globally.** Retrieving each accepted skill edit only for the task family that certified it raised hidden trajectory utility from **0.713 to 0.816** and cut harmful deployments from six of eight to none; the global-memory control finished **below the static agent (0.775)** ([arXiv:2609.29144](https://arxiv.org/abs/2609.29144)). Certification says whether an edit is supported; retrieval scope says where that evidence authorizes it.
- **Citing unverified systems.** The "AI Scientist" *Nature* 2026 citation is unverified (do not conflate with 2024 arXiv:2408.06292); several 2026 harness preprints exist but their results are not independently evaluated.

## References

Sits under [agent-control-loop](../topics/agent-control-loop.md). Anchor: Weng, *Harness Engineering for Self-Improvement* (2026-07-04, framing). Verified primaries: STOP [arXiv:2310.02304](https://arxiv.org/abs/2310.02304), Self-Harness [arXiv:2606.09498](https://arxiv.org/abs/2606.09498), DGM [arXiv:2505.22954](https://arxiv.org/abs/2505.22954), ADAS [arXiv:2408.08435](https://arxiv.org/abs/2408.08435), AFlow [arXiv:2410.10762](https://arxiv.org/abs/2410.10762), GEPA [arXiv:2507.19457](https://arxiv.org/abs/2507.19457), AlphaEvolve [arXiv:2506.13131](https://arxiv.org/abs/2506.13131), Promptbreeder [arXiv:2309.16797](https://arxiv.org/abs/2309.16797), ShinkaEvolve [arXiv:2509.19349](https://arxiv.org/abs/2509.19349). Builds on [agentic-context-engineering-ace](agentic-context-engineering-ace.md), [offline-prompt-optimization](offline-prompt-optimization.md), [verbal-reinforcement-vs-gradient-rl](verbal-reinforcement-vs-gradient-rl.md).
