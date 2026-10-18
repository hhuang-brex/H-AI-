---
id: references-rsi-2026-10
type: reference
tags: [rsi, self-improvement, harness, evaluation, safety, reading-list, agents]
summary: "second RSI fan-out: verified lineage from Weng's harness post, the Darwin Gödel Machine write-up, and 2026-09-26 → 10-17 papers on gates, baselines, harness-vs-weights, and safety."
related:
  - [[recursive-self-improvement]]
  - [[references-recursive-self-improvement]]
  - [[self-improving-harness]]
  - [[llm-as-judge]]
  - [[eval-statistical-significance]]
  - [[skill-lifecycle-and-drift]]
  - [[action-authority]]
  - [[harness-as-hyperparameter]]
status: living
created: 2026-10-18
---

# References — Recursive Self-Improvement, October 2026

Continues [references-recursive-self-improvement](references-recursive-self-improvement.md) (2026-09-28). Every page and arXiv abstract below was fetched on **2026-10-18**. Numbers are author-reported and abstract-level; no full texts were read. The arXiv sweep over 2026-09-26 → 10-17 returned about 200 new titles; 36 were opened.

## 1. Framing and lineage

| Source | Contribution |
|---|---|
| **Harness Engineering for Self-Improvement** — Lilian Weng (2026-07-04). [link](https://lilianweng.github.io/posts/2026-07-04-harness/) | The ladder "instruction prompts → structured context → workflow → harness code → optimizer code." Keeps "the evaluator and permission control … outside the loop," and predicts "Humans should move up the stack, not be removed from the loop." The graph previously cited this post secondhand; it is now read directly. |
| **The Darwin Gödel Machine** — Sakana AI with Jeff Clune's lab (2025-05-30). [link](https://sakana.ai/dgm/) | Drops the Gödel machine's proof requirement for empirical validation over an archive. SWE-bench 20.0% → 50.0%. Records two hacks: a faked test log "making it look like it had run the tests," and removal of "the markers we use in the reward function to detect hallucination." |
| **Meta-Harness** — Lee, Nair, Zhang, Lee, Khattab (2026-03-30). [2603.28052](https://arxiv.org/abs/2603.28052) | Searches harness code with a proposer that reads all prior candidates' code, scores, and traces through a filesystem; +7.7 points at 4× fewer context tokens on one task. |
| **Agentic Harness Engineering (AHE)** — Lin et al. (v4 2026-05-18). [2604.25850](https://arxiv.org/abs/2604.25850) | Every edit carries "a self-declared prediction" checked next round. Terminal-Bench 2 69.7% → 77.0%. Gains came from tools, middleware, and memory, "rather than the system prompt." |
| **Harness Updating Is Not Harness Benefit** — Lin et al. (2026-05-28). [2605.30621](https://arxiv.org/abs/2605.30621) | Proposing good edits is flat in model capability — a 9B model's edits gained about as much as Claude Opus 4.6's. Benefiting is non-monotonic: mid-tier models gain most. |
| **Why LLMs Aren't Scientists Yet** — Trehan, Chopra (2026-01-06). [2601.03315](https://arxiv.org/abs/2601.03315) | Six failure modes from four autonomous research attempts, including "overexcitement that declares success despite obvious failures." |

## 2. Do reported gains survive a fair comparison?

| Paper | Finding |
|---|---|
| **Rethinking the Evaluation of Harness Evolution** — Wang et al. (v4 2026-10-05). [2607.12227](https://arxiv.org/abs/2607.12227) | Prior work searched on the same tests it reported. With matched budgets and held-out tasks, harness evolution "fails to outperform simple test-time scaling" on Terminal-Bench 2.1. It beat the search baseline by 80% on ARC-AGI-3 games. |
| **Does Failure Feedback Direct Agent Self-Modification?** — Rong He, single author (2026-10-10). [2610.14662](https://arxiv.org/abs/2610.14662) | Across 145 public DGM edits, "no detectable target-specific advantage." Controlled feedback raised targeted repair 20 points for one small model, but target repair "did not reliably imply held-out improvement." |
| **Trace Evolution Bench** — Li et al. (2026-10-10). [2610.15055](https://arxiv.org/abs/2610.15055) | A model that never updates moved 7.5, 5.0, and 12.5 points across seeds. Measured against that band, "No method stays above its own band on every seed of all three models." |
| **Agent Plasticity** — Singh et al. (2026-10-06). [2610.08902](https://arxiv.org/abs/2610.08902) | Measures how efficiently experience becomes held-out gains. The best final agent "need not be the one that improves most efficiently." |
| **Re-executing Coding-Agent Evaluations** — Ding et al. (2026-10-10). [2610.14460](https://arxiv.org/abs/2610.14460) | Re-running 1,929 DGM archive evaluations preserved the best-agent selection and variant ranking. Rebuilt images changed 0.83% of majority verdicts. A preregistered negative result on grader drift. |

## 3. The gate, made statistical

| Paper | Finding |
|---|---|
| **REUSE** — Sun, Zeng, She, Wang (v2 2026-09-29). [2609.33180](https://arxiv.org/abs/2609.33180) | Reusing one benchmark lets the search overfit adaptively. Limiting the feedback returned cut false promotions "from up to 20.7% to 0%." |
| **SAGE: A Statistical Acceptance Gate** — Wang et al. (2026-09-28). [2609.36043](https://arxiv.org/abs/2609.36043) | Aggregate-score gates admit "permanent regressions" and suffer the Optimizer's Curse. Per-item paired testing cut regressions from 36.5% to 0% on LiveMath and had the highest final score in all 20 settings. |
| **Admission gate in credit pipelines** — Akhtyamov, single author (2026-10-07). [2610.10629](https://arxiv.org/abs/2610.10629) | Simulation only. A hash-chained held-out gate admitted 144 of 7,449 changes with none worse on history; the naive "fewer recent errors" check admitted 309 harmful ones. |
| **TeSearch** — Cheng et al. (NeurIPS 2026 workshop). [2610.15964](https://arxiv.org/abs/2610.15964) | Evolved small test suites rejected 59.9% of behavior-changing rewrites, against 25.3% for the repository's own tests. |
| **Who Verifies the Verifier?** — Zhang et al. (NeurIPS 2026 workshop). [2610.11464](https://arxiv.org/abs/2610.11464) | Repeats the September finding: a collapsed always-pass verifier "trains skills just as well," so "Downstream task score cannot certify a self-evolved verifier." |
| **Theory** — [2609.08175](https://arxiv.org/abs/2609.08175), [2610.18813](https://arxiv.org/abs/2610.18813), [2610.10611](https://arxiv.org/abs/2610.10611), [2610.03243](https://arxiv.org/abs/2610.03243) | The reliable-improvement ceiling is set by verification cost; admission needs "fresh, independent validation data"; bounded self-modification under a fixed protocol stays within the same verification class; the evaluator "must stay outside the population." |

## 4. Harness first, weights second

| Paper | Finding |
|---|---|
| **Harness Evolution Hits a Ceiling** — Tian et al. (2026-10-08). [2610.11655](https://arxiv.org/abs/2610.11655) | Label each failure by its first signal. Harness edits fix process failures (loops, blocked calls, exhausted budgets); weights fix content failures. LoRA trained on evolved-harness trajectories internalized the gain; a placebo adapter "falls below the base model." |
| **Evo²** — Xu et al. (2026-10-09). [2610.13025](https://arxiv.org/abs/2610.13025) | Weight-harness co-evolution: 82.1% Polyglot and 48.3% SWE-bench Verified, against 62.6% and 41.0% for the strongest baseline. |
| **VERSE** — Wang et al. (2026-10-02). [2610.02616](https://arxiv.org/abs/2610.02616) | Optimizer self-evolution "fails to improve performance without execution-based verification" and does best with it. |
| **Predict Before You Modify** — Xie et al. (v2 2026-10-15). [2610.13991](https://arxiv.org/abs/2610.13991) | A model predicts each edit's task-level outcome before evaluation; up to 46% better than HyperAgents. |

## 5. Safety across generations

| Paper | Finding |
|---|---|
| **Safety Must Survive Self-Improvement** — Zhang et al. (2026-10-01). [2610.01073](https://arxiv.org/abs/2610.01073) | After a new dependency invalidated tested optimizations, historical scores kept unsafe programs in **22 of 48** histories although a correct alternative existed in every archive. Refreshing scores and validated rollback fixed it. |
| **Compositional Safety Failures in Harness Evolution** — Zhang et al. (v2 2026-09-29). [2609.33123](https://arxiv.org/abs/2609.33123) | Individually safe updates produced **43 pairwise and 18 irreducible 3-way** unsafe interactions. |
| **SEABench** — Das et al. (v2 2026-09-29). [2609.35596](https://arxiv.org/abs/2609.35596) | Without any adversary, self-evolution raised task completion "but often at the cost of safety failures" absent in paired non-evolving agents. |
| **Skill-Policy Co-evolution Trap** — Feng et al. (2026-10-14). [2610.20845](https://arxiv.org/abs/2610.20845) | When skills drift after deployment, worst-case success erases **52–93%** of the co-evolved bank's gain. |
| **Authorization for Self-Modifying Agent Populations** — Zhu, Wang (2026-09-29). [2610.00347](https://arxiv.org/abs/2610.00347) | Per-successor authorization fails for populations: forks can duplicate quotas or combine permissions. Rollback must not restore spent authority, a property the paper calls "rollback non-reminting." Feeds [action-authority](../concepts/action-authority.md). |
| **ReSI: Recursive Safety Improvement** — Zheng et al. (2026-10-08). [2610.12233](https://arxiv.org/abs/2610.12233) | The loop pointed at safety: X-Teaming attack success fell from 86.01% to 31.45% across four models. |

## 6. Speculative and theoretical

- **The Singularity Has a Distribution** — Li et al. (2026-10-13). [2610.18445](https://arxiv.org/abs/2610.18445) — A stochastic model of explosive growth; "a fixed deployment delay prevents explosion" in the delayed-feedback models. The authors say its numbers "are not empirical forecasts."
- **Pre-Registered Genesis Accounting** — Mao, Zou (2026-10-10). [2610.14843](https://arxiv.org/abs/2610.14843) — Separates gains from designer-provided mechanisms and from machine-authored ones. Its honest tally on blind exams is zero.

## What failed to verify

- **Weng's post contradicts itself on one model.** For the Lin et al. capability study, its text names Qwen3.5-9B as the smallest model and its figure caption names Qwen2-32B. The paper's abstract names Qwen3.5-9B.
- **The AI Scientist *Nature* 2026 citation** appears in Weng's references without an id. It stays unverified here, as it was in [self-improving-harness](../concepts/self-improving-harness.md).
- **Volume is not a trend signal.** Many October titles add "RSI" to an ordinary method or domain paper. The count measures naming fashion, not progress.
