---
id: adaptive-eval-budget
type: concept
tags: [eval, statistics, budget, sequential-testing, bandit, psychometrics]
summary: "stop paying when the evidence suffices: confidence sequences for valid early stopping, best-arm allocation instead of uniform sampling, and informative-item selection — with a fixed gate of record kept deliberately non-adaptive."
related:
  - [[eval-statistical-significance]]
  - [[cost-aware-eval]]
  - [[test-pyramid-llm]]
  - [[eval-dataset-quality]]
  - [[llm-evaluation]]
  - [[offline-prompt-optimization]]
  - [[harness-as-hyperparameter]]
  - [[prompt-component-attribution]]
  - [[live-traffic-eval]]
  - [[references-adaptive-eval]]
status: living
created: 2026-08-31
source-thread: [[2026-08-31-adaptive-eval-fanout]]
---

# Adaptive Eval Budget

Almost every eval harness hands you `reps: 50` and `threshold: 0.95` — the repetition count and the gate are **configuration**, fixed before any evidence arrives. That is a punt, and the alternative is not a hunch: sequential testing, best-arm identification, and psychometrics each supply a piece of the machinery. This node is how to assemble them without breaking the statistics.

The framing that makes it tractable: **an eval budget is spent on two different things** — producing *learning signal* (which edit to make, which case is broken) and performing *selection* (ranking candidates you already have). Selection spend is the compressible half, and it is usually the larger one. GEPA's authors report that "the majority of GEPA's rollout budget is spent on validation, where scores are utilized solely for candidate selection and not for producing learning signals," and propose dynamically selected validation subsets as the fix ([worked-example-gepa-mechanism](../projects/worked-example-gepa-mechanism.md)).

## Three mechanisms

| Question | Mechanism | Anchor |
|---|---|---|
| *When do I stop sampling?* | **confidence sequences** — continuously monitored, so stopping early keeps the stated guarantee | AV-AIVAT ([arXiv:2608.06362](https://arxiv.org/abs/2608.06362)) |
| *Where do I spend the next call?* | **best-arm identification** — stop precisely estimating candidates already clearly worse | SySRs ([arXiv:2606.07726](https://arxiv.org/abs/2606.07726), ICML 2026) |
| *Which cases are worth running?* | **informative-item selection** — items differ in difficulty and discrimination | IRT ([arXiv:2608.05086](https://arxiv.org/abs/2608.05086), [arXiv:2607.25257](https://arxiv.org/abs/2607.25257)) |

### 1. Stop on evidence, with the guarantee intact

The statistical fact that makes naive adaptivity wrong: *"naive optional stopping with an ordinary confidence interval invalidates the stated level."* Fixed budgets fail in both directions — they "either keep paying after the result is settled or stop before the agents can be told apart."

The fix is a **confidence sequence** (valid under continuous monitoring) rather than a confidence interval (valid once). Pair it with variance reduction and the savings compound: AV-AIVAT combines conditional mean-zero corrections (a median **54× variance reduction** across 15 LLM agent configurations over 71,439 paired hands) with continuously monitored confidence sequences to reach **74× cheaper** evaluation with certified stopping. The domain is imperfect-information games, so transfer the *composition* — variance reduction first, then anytime-valid stopping — not the multiplier.

### 2. Allocate across candidates, not uniformly

Benchmarking every candidate on every case is "often wasteful: if a model clearly performs worse than others, there is no need to precisely estimate its performance." Successive-Rejects-style allocation redirects budget to contenders, and **SySRs** adds paired comparisons so the guarantees *improve* with similarity between candidates — which is the normal case when the candidates are prompt variants of one system.

Cheap proxies can enter without forfeiting validity: predict unobserved scores by low-rank factorization of the partially observed candidate×case matrix, then use **doubly robust estimators** so a biased prediction cannot flip the identification ([arXiv:2605.10405](https://arxiv.org/abs/2605.10405)). This is the principled version of "run the cheap check first," and it composes with [test-pyramid-llm](test-pyramid-llm.md) — formally, a multi-fidelity bandit, including the case where the cheap proxy *improves with use* ([arXiv:2605.08558](https://arxiv.org/abs/2605.08558)).

### 3. Cases are not interchangeable

Uniform sampling assumes every case carries equal information. It does not: benchmarks are "typically conceived as monolithic tasks, obscuring substantial variation in the demands of individual samples," with pronounced internal heterogeneity across five latent dimensions ([arXiv:2607.28801](https://arxiv.org/abs/2607.28801)).

Item Response Theory separates a model's latent **ability** from each item's **difficulty and discrimination**, which yields two things this node needs: **psychometrically selected items recover full benchmark scores with lower error than random selection** (fit across 8 safety benchmarks × 192 models), and posterior uncertainty over ability and item difficulty enables **Fisher-information-based item selection** — the classical adaptive-testing rule of asking the most informative next question ([arXiv:2607.25257](https://arxiv.org/abs/2607.25257)). Note the cost: IRT needs many models × items to fit, so it suits a stable in-house suite, not a suite you rewrite weekly.

## The design that stays auditable

Adaptivity and reproducibility conflict only if you apply them to the same layer. Split it:

| Layer | Allocation | Why |
|---|---|---|
| **Screening** (cheap deterministic checks, differential golden trajectories) | fully adaptive, state-driven | triage, not decisions; wasted reps are pure loss |
| **Gate of record** (ship / no-ship) | **fixed N, pinned instrument, pre-registered** | must be explainable months later |
| **Critical set** (safety, irreversible actions) | never adaptive — zero tolerance | one regression disqualifies at any *p* ([eval-statistical-significance](eval-statistical-significance.md)) |

**State the loop must carry:** per-case and per-metric history of pass rate and **measured** variance decomposed by source (seed, prompt format, judge, agent path, task order), cost per rep, a flake classification, the last-known-good baseline, and an **instrument fingerprint** — judge model + rubric version + template hash + dataset version — that invalidates the history when it changes ([eval-dataset-quality](eval-dataset-quality.md)). A baseline is only valid while the instrument is pinned.

**Log the decision, not just the number:** chosen N, stopping rule and reason, the noise band used, and the fingerprint. A run then isn't reproducible in its N but *is* reproducible in its reasoning, which is what an audit actually needs.

## Why tools punt this to configuration

Worth knowing so you can tell which objections are real:

- **Peeking breaks ordinary intervals** — legitimate, and the reason confidence sequences exist rather than a reason to avoid adaptivity.
- **State destroys run-to-run comparability** — legitimate, and answered by the layer split above.
- **The instrument moves** — legitimate; automating baselines means automating drift detection.
- **Budget predictability** — organizational, not statistical: dynamic reps make CI spend a random variable.
- **The gate encodes a loss function only you have** — the honest one. What a false ship costs versus a false block is domain knowledge no vendor can supply, which is why they hand you a threshold instead of a decision. It argues for *you* automating this, not for nobody automating it.

## Pitfalls

- **Confusing early stopping with peeking.** Stopping under a confidence sequence is valid; stopping when a *t*-test looks good is not. The machinery is the difference.
- **Adapting the gate of record.** If N and the threshold both move with history, "the eval passed" is unfalsifiable.
- **Trusting a proxy without a correction.** Predicted scores are biased; use doubly robust estimation or keep the proxy advisory.
- **Fitting IRT to a suite you keep editing.** Item parameters need stability; a churning suite gives you noise with psychometric vocabulary.
- **Optimizing selection spend while ignoring signal spend.** Halving selection cost is a win only if the learning signal survives — the measured variance floor is what tells you.
