---
id: skill-injection-decision
type: concept
tags: [skills, context-engineering, routing, eval, cost, agents]
summary: "whether to load a skill at all is a measurable decision per (skill, task, model) triple — public-skill injection has been measured as net-negative, so route or invoke as a subagent instead of always-loading, and audit with a length-matched control."
related:
  - [[context-engineering]]
  - [[agent-skills-progressive-disclosure]]
  - [[skill-text-authoring]]
  - [[skill-lifecycle-and-drift]]
  - [[subagent-context-isolation]]
  - [[context-budget-allocation]]
  - [[harness-token-economics]]
  - [[agent-trajectory-eval]]
  - [[prompt-component-attribution]]
  - [[tool-selection-and-routing]]
  - [[when-to-delegate]]
  - [[eval-statistical-significance]]
  - [[references-agent-skill-authoring]]
status: living
created: 2026-09-11
source-thread: [[2026-09-11-industry-trend-catchup]]
---

# Skill Injection Decision

[agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md) answers *how* a skill loads; [skill-text-authoring](skill-text-authoring.md) answers *what it says*. Both assume the skill should be loaded. This node is the prior question: **should this skill enter this task's context at all — and if so, as text or as a subagent?**

The reason it deserves its own decision is that injection is not free and not reliably positive. Every injected skill expands the prompt of every query it touches, so "an effective Skill benchmark must determine not only whether an agent can solve a task, but whether the Skill should have been injected at all" ([arXiv:2608.23067](https://arxiv.org/abs/2608.23067)).

## The measured default is neutral-to-negative

A controlled study of **31 public WebDev skills × 50 Web-Bench projects × 1,000 ordered tasks × 4 models** reports that injecting the *topically matched* skill:

| Effect | Magnitude |
|---|---|
| Mean Pass@2 | **−1.3% to −4.2%** |
| Token cost | **+72% to +394%** |
| Skill-project pairs that improved | only **17%–36%** |
| Task completion depth | lower |

Losses concentrate on **easy early tasks**, and skill rankings **transfer weakly across models**. The authors' reframing is the durable part: a matched skill is "a hypothesis about a particular Skill-project-model triple rather than a portable asset."

**Scope, honestly:** these are third-party public skills in a web-development coding-agent setting, not a hand-written playbook for your own domain. It does not show your skill hurts. It does establish that the *burden of proof* runs the other way, and it is now the second independent negative control in this graph — in-context learning already measured comparably to explicit skill maintenance on average ([arXiv:2608.03874](https://arxiv.org/abs/2608.03874), cited in [skill-text-authoring](skill-text-authoring.md)).

## Two failure modes, separable only with a length-matched control

The study's key design move is a **length-matched irrelevant control**: an equally long skill with no bearing on the task, plus leave-one-out ablations, plus mounting auxiliary files in the workspace so only `SKILL.md` occupies the prompt. That separates two failures that look identical in aggregate:

- **Length-distracted** — the equally long *irrelevant* skill reproduces most of the loss. The cost is context occupancy; the content is incidental.
- **Content-misled** — prompt length is neutral, but skill content still lowers Pass@2 by 1.1%–1.4%. The text actively steers the agent wrong.

Only the second is fixable by editing prose. Without the control you will rewrite text to fix a problem that was token budget, or trim tokens to fix a problem that was content. This is the same instrument the per-unit valuation work needs for the same reason — deletion changes content *and* length at once ([prompt-component-attribution](prompt-component-attribution.md)).

One authoring consequence transfers directly: within *helpful* skills, **anti-pattern rules outperformed example-heavy content**. Prohibitions are cheap and specific; examples are long and generalize unpredictably.

## Three alternatives to always-loading

| Option | Mechanism | When it wins |
|---|---|---|
| **Route** | retrieve a small subset by execution-backed relevance rather than loading the library | many skills, most irrelevant per task |
| **Invoke as subagent** | spawn a fresh context that solves the subtask and returns a result | the skill has a clear input→output contract |
| **Inject** | load `SKILL.md` into the working context | the agent must interleave the guidance with its own reasoning |

**Routing** has a training-free instance: SE-GoS evolves an existing skill-retrieval graph from execution traces — topology, edge weights, and the retrieval-facing *descriptions* — with no change to the retrieval algorithm or the skill content. One evolution round moved task reward **52.4% → 59.4%** while cutting input tokens by roughly a third versus full skill loading, and the evolved graph transferred to a disjoint held-out split for **+5.4 points** over the static baseline ([arXiv:2609.08228](https://arxiv.org/abs/2609.08228); three LLMs on SkillsBench, gains vary by model family). Note what it optimizes: the *description*, which this graph already calls the routing contract.

**Subagent invocation** is the option that inverts the usual assumption. Loading skill instructions into the main context "becomes increasingly brittle" as task horizons grow, because reasoning quality degrades as information accumulates; invoking the skill package as a subagent spawns a fresh window per subtask instead. Subagent execution **outperformed in-context skill execution when the package exposes a clear input-output contract and its instructions encode the procedural knowledge needed to fulfill that contract** — the cost being extra coordination tokens between parent and child ([arXiv:2609.09233](https://arxiv.org/abs/2609.09233); no numbers in the abstract, no venue yet). See [subagent-context-isolation](subagent-context-isolation.md) and [when-to-delegate](when-to-delegate.md).

The design rule that falls out: **an I/O contract is what makes a skill delegable.** A skill written as a contract ("given a filled dispute record, return the decision plus rationale") can run isolated; one written as ambient advice cannot, and must pay context rent.

## Measuring it without a pass/fail blind spot

A binary verifier cannot see most of what a skill does, because "a skill can alter execution without changing the final outcome." Scoring 1,946 matched with/without-skill pairs under grounded checklist partial credit, among the **879 pairs whose binary outcome did not change, 20.9% improved by more than 0.10 while 18.7% regressed by the same margin** ([arXiv:2608.27487](https://arxiv.org/abs/2608.27487)). Pass@1 reports "no effect" for both halves. See [agent-trajectory-eval](agent-trajectory-eval.md) for the instrument.

## Pitfalls

- **Treating injection as a write-time decision.** Whether to load is per-deployment and per-model, not settled once when the skill is authored.
- **Skipping the length-matched control.** Then every result confounds content with occupancy, and the fix you pick is a coin flip.
- **Porting a skill ranking across models.** Rankings transfer weakly; re-audit per deployed model.
- **Measuring on hard tasks only.** The measured losses concentrated on *easy* early tasks — the ones a skill was least needed for and most able to derail.
- **Assuming a subagent is free.** It trades context pressure for coordination tokens and a serialization boundary; without an I/O contract you pay both.
