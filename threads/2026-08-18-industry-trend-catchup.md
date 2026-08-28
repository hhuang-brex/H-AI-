---
id: 2026-08-18-industry-trend-catchup
type: thread
tags: [meta, research, trend-scan, eval, skills, memory, security]
related:
  - [[eval-statistical-significance]]
  - [[self-improving-harness]]
  - [[live-traffic-eval]]
  - [[skill-text-authoring]]
  - [[references-prompt-optimization]]
  - [[references-prompt-attribution]]
  - [[references-agent-skill-authoring]]
status: snapshot
created: 2026-08-18
summary: "10-day arXiv trend scan (2026-08-08 → 08-18): cluster volumes, 11 verified papers, 4 landings — task-order variance, CAPO, TRACE, TRUSS."
---

# Thread — Industry Trend Catch-Up (2026-08-08 → 2026-08-18)

## Goal

Catch up on the ten days since the [skill-text-authoring fan-out](2026-08-08-skill-text-authoring-fanout.md), and land only what changes an existing claim.

## Method

Seven date-bounded arXiv queries (`submittedDate:[202608080000 TO 202608182359]`) across this graph's clusters, capturing `opensearch:totalResults` per cluster as a volume proxy, then `id_list` verification of 11 standouts. Volumes are keyword-proxy only — "agentic" and "context engineering" distribute differently — so read them as directional.

| Cluster (abstract keyword) | Hits in the window |
|---|---|
| LLM agent + benchmark/evaluation | 74 |
| tool use / MCP / tool calling | 48 |
| agent skills / skill library | 29 |
| agent memory / long-term memory | 25 |
| prompt injection / agent security | 25 |
| multi-turn dialogue / conversational agent | 14 |
| prompt optimization | 8 |

**The ratio that matters: agent skills (29) outweighs prompt optimization (8) roughly 4:1.** The field's unit of work moved from a prompt string to a skill artifact with a generation, retrieval, and security story.

## Landed

| Change | Node | Source |
|---|---|---|
| New variance row: **task order** in online/self-improving streams; pitfall that a learning loop amplifies the noise beneath it | [eval-statistical-significance](../nodes/concepts/eval-statistical-significance.md) | [arXiv:2608.18066](https://arxiv.org/abs/2608.18066) |
| Pitfall: unreported variance + fixed task order as a hidden hyperparameter | [self-improving-harness](../nodes/concepts/self-improving-harness.md) | same |
| New section: mining trajectories for **implicit dissatisfaction signals** (corrections, rephrasing, abandonment) to localize which context source failed | [live-traffic-eval](../nodes/concepts/live-traffic-eval.md) | [arXiv:2608.09153](https://arxiv.org/abs/2608.09153) |
| Loop step: **accept on behavior, not on text** — static safety gate then a shadow agent with brokered tools recording every action | [skill-text-authoring](../nodes/concepts/skill-text-authoring.md) | [arXiv:2608.17588](https://arxiv.org/abs/2608.17588) |
| CAPO — constraint-*satisfaction* framing of prompt optimization, by the ProTeGi author | [references-prompt-optimization](../nodes/references/references-prompt-optimization.md) | [arXiv:2608.16068](https://arxiv.org/abs/2608.16068) |
| TRACE + fragility entries; TRUSS + Skill2Query entries | the two reference nodes | above |

## Key insights

- **Reliability is now the critique of self-improvement.** Two independent 2026-08 papers make variance the headline: the fragility re-evaluation (multiple runs + shuffled task order; loop amplifies noise; gains order-dependent) and DIVE ([arXiv:2608.12486](https://arxiv.org/abs/2608.12486)), which evolves several skill trajectories in parallel specifically to damp "optimization variance."
- **Prompt optimization reframed from maximize to satisfy.** CAPO optimizes system prompts under *explicit operational constraints* (tool use, conciseness, safety/formatting policy) toward "empirically feasible operating points" — the machine-side answer to instruction stacking, and notable for being co-authored by Reid Pryzant of the 2023 textual-gradient paper.
- **Agents shifted from reading to acting, with a number attached.** In the MCP ecosystem the share of deployed tools that modify external state rose **27% → 65%** ([arXiv:2608.17275](https://arxiv.org/abs/2608.17275), Web3 attack-surface survey) — which explains the security volume and the appearance of least-privilege work (task-conditioned tool exposure; [arXiv:2608.17433](https://arxiv.org/abs/2608.17433) treats harness provisioning as resource-matching, i.e. [harness-as-hyperparameter](../nodes/concepts/harness-as-hyperparameter.md) with a cost objective).
- **Skill text is now judged by induced behavior.** TRUSS's framing — artifact review and final task score both leave the *actions and side effects* unresolved — is the gap in this graph's authoring loop, now closed.

## Verified but deliberately not landed

- **SP-Mem** ([arXiv:2608.16551](https://arxiv.org/abs/2608.16551)) — privacy-aware conversational memory governing the full life cycle of sensitive values rather than sanitizing records. This *answers* the privacy gap recorded in [2026-08-06-multi-turn-eval-survey-fanout](2026-08-06-multi-turn-eval-survey-fanout.md), but deserves its own concept node rather than a bullet; next candidate.
- **ECP** ([arXiv:2608.19263](https://arxiv.org/abs/2608.19263)) — early-stage vendor-neutral eval contract; too early to build on, worth watching.
- **FACA** ([arXiv:2608.17499](https://arxiv.org/abs/2608.17499)) — credit assignment from the *next user turn* as locally normalized reaction advantage; relevant to multi-turn eval but RL-side.
- Unverified, so uncited: JailbreakSkill, SkillEffect, MELD, ArborMem, CABLE, D²ACCI.

## Process notes

- `opensearch:totalResults` on a date-bounded arXiv query is a cheap trend metric; keep the window and phrasing identical across sweeps for comparability.
- The arXiv API 429s after ~3 rapid calls; 4–5s spacing held for 9 consecutive queries this session.
