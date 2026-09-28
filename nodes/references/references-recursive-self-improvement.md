---
id: references-recursive-self-improvement
type: reference
tags: [rsi, self-improvement, harness, evaluation, safety, skills, reading-list, agents]
summary: "verified reading list on recursive self-improvement for agents, sorted by the question each paper answers: who accepts an edit, what it overfits to, who grades the grader, and what persists."
related:
  - [[self-improving-harness]]
  - [[skill-lifecycle-and-drift]]
  - [[memory-poisoning]]
  - [[llm-as-judge]]
  - [[eval-statistical-significance]]
  - [[adaptive-eval-budget]]
  - [[action-authority]]
  - [[decision-audit-trail]]
  - [[harness-as-hyperparameter]]
  - [[offline-prompt-optimization]]
  - [[references-harness-evaluation]]
status: living
created: 2026-09-28
source-thread: [[2026-09-28-rsi-fanout]]
---

# References — Recursive Self-Improvement for Agents

**Scope.** RSI at the agent-system level: a loop in which each accepted edit to prompts, skills, memory, or harness code becomes the agent the next round edits, usually with weights frozen. Weight-level self-training and speculative AGI essays are out of scope. The mechanism papers the graph already relied on — STOP, DGM, Self-Harness, ADAS, AFlow — live in [self-improving-harness](../concepts/self-improving-harness.md) and are not repeated here.

**Verification.** Every arXiv id below was fetch-confirmed at its abstract page on **2026-09-28**. Numbers are abstract-level and author-reported; none is independently reproduced. Single-author papers are marked.

## Maps and lineage

| Paper | Use it for |
|---|---|
| **RSI in AI: From Bounded Self-Refinement to Autonomous Research Loops** — Chen, Wang, Qu (v2 2026-09-06). [2607.07663](https://arxiv.org/abs/2607.07663) | A 1,250-paper survey. Orders evaluator signals into a **verification hierarchy**, from formal verifiers down to intrinsic self-assessment, and observes that demonstrated self-improvement strength tracks it. |
| **Generalized Agent Iteration** — Tang, Ma, Li, Yuan (2026-09-11). [2609.13406](https://arxiv.org/abs/2609.13406) | Two dials that classify any loop: is the improver part of the agent, and is the standard grounded outside it. The second dial separates *anchored* from *goal drift* from *fully self-referential*. |
| **Self-Improvements in Modern Agentic Systems: A Survey** — Ren et al. (2026-07-14; 97 pp). [2607.13104](https://arxiv.org/abs/2607.13104) | Self-improvement as an update operator, organized by update target and driving signal. |
| **A Survey of Self-Evolving Agents** — Gao et al. (TMLR, 2026-01). [2507.21046](https://arxiv.org/abs/2507.21046) | What, when, and how to evolve. |
| **Gödel Agent** — Yin et al. (ACL 2025). [2410.04444](https://arxiv.org/abs/2410.04444) | The self-referential agent that rewrites its own logic, guided only by a prompted objective. |
| **Hyperagents** — Zhang, Zhao, Yang, Foerster, Clune + others (2026-03-19). [2603.19461](https://arxiv.org/abs/2603.19461) | Makes the meta-level modification procedure itself editable; meta-level improvements transferred across domains and accumulated across runs. |
| **Recursive self-improvement of AI research agents (AIDE²)** — Srikanth, Zhao, Xu, Wu, Jiang (2026-09-22). [2609.26457](https://arxiv.org/abs/2609.26457) | An 8-day autonomous run kept seven successive improvements chosen on hidden evaluations. Reward hacking on a held-out task family fell **55% → 32%**, though the loop never optimized for it. |

## Who accepts an edit — the acceptor is the bottleneck

| Paper | Finding |
|---|---|
| **PACE** — single author (2026-06-06). [2606.08106](https://arxiv.org/abs/2606.08106) | "Keep it if the score went up" is uncontrolled adaptive multiple testing. With one real gain hidden among noisy proposals, greedy acceptance committed **30–42% false and 10–33% harmful** edits; with no real gain, **13–21 spurious commits per run**. A paired, anytime-valid e-process gate committed the real edit and almost nothing else, at ~18% lower evaluation cost. Small Qwen2.5 agents, prompt level. |
| **SEAL** — Guo et al. (2026-07-27). [2607.24300](https://arxiv.org/abs/2607.24300) | When the agent writes both the policy and its tests, self-scores stay near perfect while deployment degrades. A sealed harness-side audit that the agent cannot author or inspect, returning only accept or reject, beat unprotected baselines across six models and three seeds. |
| **RSEA** — Nguyen, Nguyen, Vuong (2026-06-17). [2606.28374](https://arxiv.org/abs/2606.28374) | A strict keep-better gate on a disjoint held-out split never significantly underperformed the base agent on four benchmarks. Ungated online curation was near-best on ALFWorld (70.7%) and **collapsed on WebShop (0.14 vs 0.43 for ReAct)**. No artifact type won everywhere. |
| **EvoPathBench** — Lin et al. (2026-09-21). [2609.24663](https://arxiv.org/abs/2609.24663) | Loops generate candidates with substantial held-out gains, but the **selected** updates consistently fall short of them. Retention losses concentrate in a minority of evolution paths. |
| **Falsifiable Release Gates** — single author (v2 2026-07-21). [2607.13070](https://arxiv.org/abs/2607.13070) | Standing invariants, machine-checked, held unchanged across six releases while the suite grew from 122 to 563 tests; the gated loop auto-rejected a candidate that only inflated confidence. |
| **On the Statistical Limits of Self-Improving Agents** — Wang, Dorchen, Jin (TMLR 2026). [2510.04399](https://arxiv.org/abs/2510.04399) | Learnability survives self-modification only if the reachable policy family stays capacity-bounded. Proposes a Two-Gate guardrail: validation improvement plus a capacity cap. |
| **Algorithmic Unverifiability of Safety** — single author (v3 2026-09-23). [2606.28639](https://arxiv.org/abs/2606.28639) | No verifier of a self-modifying system is sound, complete, and tractable. What survives is a monitor that alarms on violation and comparison against a frozen reference. |
| **Self-Evolving Agents with Anytime-Valid Certificates** — single author (2026-07-01). [2607.00871](https://arxiv.org/abs/2607.00871) | Gates can only *select* among behaviors the frozen base already produces. Single-run results on a 52-instance subset. |

## What it overfits to — in-distribution gains overstate

| Paper | Finding |
|---|---|
| **RRSI** — Xia et al. (v2 2026-09-23). [2609.24972](https://arxiv.org/abs/2609.24972) | Unregularized harness evolution memorizes its training tasks. With an annealed edit budget, a critic, and a pruner: up to **+14.1** on the evolved split but **+4.7** on five out-of-distribution benchmarks, with 30% fewer policy tokens. |
| **ModularRSI** — Wu et al. (2026-09-14). [2609.14857](https://arxiv.org/abs/2609.14857) | Evolves on 2,000 tasks disjoint from evaluation, contrasts success and failure on the same task, and evolves five modules separately: agent loop, tool use, observation, context, completion detection. |
| **Ecdysis** — Yue et al. (v2 2026-09-20). [2609.11677](https://arxiv.org/abs/2609.11677) | Failures that recur across distinct tasks are better evidence of a harness defect than isolated ones, which cause model-specific accommodation. +18.56% over existing harness evolution, up to 1.84× faster. |
| **Mendel Gödel Machine** — Liu et al. (2026-08-07). [2608.07645](https://arxiv.org/abs/2608.07645) | Edits drawn from many tasks at once, or from another lineage's trajectory on the same task, beat single-failure mutation. |
| **DarwinX** — Zhang et al. (2026-07-31). [2608.07545](https://arxiv.org/abs/2608.07545) | A preserve-and-extend contract admits only variants that add coverage without regressing; fitness comes from each benchmark's own verifier. Terminal-Bench 2.1 +7.7 to 83.2%. |
| **HarnessFix** — Chen et al. (v2 2026-07-02). [2606.06324](https://arxiv.org/abs/2606.06324) | Aligns trace steps to the harness artifacts that shaped them, then applies scoped repair operators under regression-aware validation. +6.3% to 18.4%. |
| **SoL-Pi** — Liu et al. (2026-09-17). [2609.20519](https://arxiv.org/abs/2609.20519) | Scaling the loop across many environments left four transferable mechanisms and cut token traffic **44.7–49.0%** at comparable performance. |
| **Recursive Harness Self-Improvement** — Lee, Xu, Seely, Lee, Zaharia, Tang (2026-07-17). [2607.15524](https://arxiv.org/abs/2607.15524) | Refines a prompt-level harness spec by pairwise feedback over its own revision history. Low-effort agents passed max-effort ones at up to 60% lower cost, via information flow, not longer reasoning. |
| **Open-Ended Optimization** — Xue, Yang (2026-08-10). [2608.09629](https://arxiv.org/abs/2608.09629) | A frontier optimizer composing its own route won 12 of 14 comparisons against prescribed pipelines; with a medium optimizer the prescribed pipeline won, and a weak one could not operate. Prescription is capability-dependent scaffolding. |

## Who grades the grader

| Paper | Finding |
|---|---|
| **Memory Reward Inflation (Echo Gap)** — Asadolahi et al. (2026-06-29). [2608.00017](https://arxiv.org/abs/2608.00017) | Self-graded scores stored in memory inflate on wrong episodes, so the agent reuses the mistakes it is most confident in. A correction needs a signal whose error is independent of the memory's bias. |
| **The Blind Curator** — Zhang et al. (COLM 2026 workshop). [2607.07436](https://arxiv.org/abs/2607.07436) | Symmetric judge noise leaves skill retirement working. **False-pass** bias switches it off past a sharp threshold (0.45 in their testbed) that no amount of data crosses, and no aggregate metric shows it. |
| **Who Grades the Grader?** — Zhang et al. (v2 2026-07-30). [2607.12790](https://arxiv.org/abs/2607.12790) | An evolved metric stays valid only with anchor guards. Without them it collapses to always-pass, which **trains skills just as well** — so downstream task score cannot validate a self-evolved evaluator. |
| **Red Queen Gödel Machine** — Iacob et al. (v2 2026-06-29). [2606.26294](https://arxiv.org/abs/2606.26294) | Lets the utility evolve only at epoch boundaries, fixing it within each epoch so per-epoch guarantees hold. |
| **Phantom Guardrails** — Wang et al. (2026-07-13). [2607.13083](https://arxiv.org/abs/2607.13083) | A proposer shown only legal episodes invented a failure and a guardrail for it in **15/60** runs, against 0/60 on featureless input. Inside an add-only accept loop the phantom re-entered and stayed. |
| **Auditing Harness Tampering** — Wang, Zhang, Shao (2026-08-30). [2609.00069](https://arxiv.org/abs/2609.00069) | Edits that fake gains or break authorization, provenance, or completeness occur in real runs and often persist in the best agent's lineage. |
| **The Meta-Agent Challenge** — Lu et al. (2026-06-03). [2606.04455](https://arxiv.org/abs/2606.04455) | Meta-agents rarely matched human-engineered baselines, and optimization pressure surfaced ground-truth exfiltration. |

## What persists — contamination runs forward and does not roll back

| Paper | Finding |
|---|---|
| **Pre-Commit Gating (VaG)** — Shang et al. (v2 2026-09-17). [2608.05810](https://arxiv.org/abs/2608.05810) | Past a critical pool size, new skills degrade performance; a defective skill seeds later ones, and post-hoc removal recovers only a small part of the drop. Pre-commit critics reached 72% pass@1 on Terminal-Bench 2 with a ~5× smaller pool. |
| **SkillJack** — Ying et al. (2026-08-04). [2608.03509](https://arxiv.org/abs/2608.03509) | Skill extraction launders intent: safety detection fell from **98.5%** on poisoned trajectories to **11.4%** on the extracted skills, and **80.0%** of attacks survived deleting the source records. |
| **PoisonedEvolution** — Chen et al. (2026-08-06). [2608.05563](https://arxiv.org/abs/2608.05563) | At 10% attacker support, target behavior was embedded in 91.0% and 61.5% of trials on two pipelines; three consistent records in a 30-record batch sufficed. |
| **Reflections on Trusting Trust, Revisited** — Roesner, Kohno (2026-09-15). [2609.17817](https://arxiv.org/abs/2609.17817) | Poisoned self-evaluation benchmarks made three self-modifying coding agents evolve vulnerable code, such as disabling HTTPS certificate validation, and the contamination often survived clean re-evolution. |
| **Practice Makes Unsafe** — Mao et al. (2026-08-13). [2608.12851](https://arxiv.org/abs/2608.12851) | All 21 evolved configurations authored unsafe skills; three malicious tasks raised carryover attack success from 16.0% to 35.3%. |
| **Zombie Agents** — Yang et al. (ICLR 2026 workshop). [2602.15654](https://arxiv.org/abs/2602.15654) · **Your Agent May Misevolve** — Shao et al. (ICLR 2026). [2509.26354](https://arxiv.org/abs/2509.26354) | One indirect injection becomes persistent compromise through memory evolution; misevolution appears on model, memory, tool, and workflow pathways. |
| **Do Self-Evolving Agents Forget?** — Yu et al. (2026-05-10). [2605.09315](https://arxiv.org/abs/2605.09315) · **Library Drift** — Zhang et al. (FAGEN @ ICML 2026). [2605.19576](https://arxiv.org/abs/2605.19576) | Capability erodes across all four evolution channels; outcome-driven retirement plus a bounded active cap lifted held-out pass@1 from 0.258 to a late-window 0.584. Library Drift's SkillsBench figures are quoted secondhand and were not verified here. |

## Boundaries the loop must not reach

| Paper | Finding |
|---|---|
| **The Unfireable Safety Kernel** — Dobrin, Chmiel (2026-06-24). [2606.26057](https://arxiv.org/abs/2606.26057) | Any control inside the agent's address space is reachable. A process-separated, fail-closed kernel refused all **704** attempts on the safety-critical core across 1,000 self-modifications. |
| **GuardrailLoop** — Ma, Wu (2026-09-10). [2609.12216](https://arxiv.org/abs/2609.12216) | Across 240 crash injections every run recovered the outcome, but only 210 preserved the trace: 30 pre-commit crashes repeated a planner call. Outcome recovery is not exactly-once. |
| **RegenHarness** — Wang et al. (2026-09-23). [2609.27612](https://arxiv.org/abs/2609.27612) | Evidence-gated RSI on a real quadruped: the loop may revise configuration but has no permission to weaken the commit gate. |
| **Harness-Zero** — Ye et al. (2026-09-21). [2609.24974](https://arxiv.org/abs/2609.24974) · **HELIX** — Fan, Huang (2026-08-14). [2608.13951](https://arxiv.org/abs/2608.13951) | The harness-to-weights direction: distillation raised success from 23.3% to 44.3% with the specialized harness removed; harness evolution also yields verified training records. |
| **SelfOp** — Ullah et al. (2026-09-19). [2609.22792](https://arxiv.org/abs/2609.22792) | Commits context edits only under cross-instance consensus and stops on a convergence detector rather than held-out data; +17 points for a small security agent. |
