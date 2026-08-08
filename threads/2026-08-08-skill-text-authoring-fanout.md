---
id: 2026-08-08-skill-text-authoring-fanout
type: thread
tags: [meta, research, fan-out, skills, authoring, eval]
related:
  - [[skill-text-authoring]]
  - [[references-agent-skill-authoring]]
  - [[agent-skills-progressive-disclosure]]
  - [[agentic-context-engineering-ace]]
  - [[offline-prompt-optimization]]
  - [[prompt-component-attribution]]
status: snapshot
created: 2026-08-08
summary: "fan-out on improving LLM skill text: Anthropic's authoring guidance + 9 verified 2026 agent-skills papers, one new concept, one reference node, three deepenings, one provenance check."
---

# Thread — Skill-Text Authoring Fan-Out (2026-08-08)

## Goal

"How to improve LLM skill text." The graph already had skill *packaging* ([agent-skills-progressive-disclosure](../nodes/concepts/agent-skills-progressive-disclosure.md)), *automated* text search ([offline-prompt-optimization](../nodes/concepts/offline-prompt-optimization.md), [agentic-context-engineering-ace](../nodes/concepts/agentic-context-engineering-ace.md)), and *measurement* ([prompt-component-attribution](../nodes/concepts/prompt-component-attribution.md)). Missing: the craft — what a human should actually write, cut, and restructure.

## Method

arXiv full-text search on `abs:"agent skills" OR abs:"skill library" OR abs:"SKILL.md" OR abs:"AGENTS.md"` sorted by date, which surfaced a dense 2026-08 cluster (~18 hits in the first page alone); then batch verification via the arXiv API, plus a fetch of Anthropic's authoring page. Note the doc redirect: `docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices` → `platform.claude.com/docs/en/...`.

## Outputs

- New: [skill-text-authoring](../nodes/concepts/skill-text-authoring.md) — earn-the-tokens test, degrees-of-freedom-vs-fragility table, structure-for-partial-reads rules, rule-interaction limits, and a 6-step improvement loop.
- New: [references-agent-skill-authoring](../nodes/references/references-agent-skill-authoring.md) — vendor guidance + 9 verified 2026 papers.
- Deepened [agent-skills-progressive-disclosure](../nodes/concepts/agent-skills-progressive-disclosure.md): a hard-constraints table (name ≤64, description ≤1,024 + third person, body <500 lines, references one level deep, TOC >100 lines), the negative-boundary upgrade to "description is the routing function," a measured retrieval ceiling, and the malicious-skill benchmark on the action-surface pitfall.
- Tightened the brevity-bias provenance note in [agentic-context-engineering-ace](../nodes/concepts/agentic-context-engineering-ace.md).

## Key insights

- **Match specificity to fragility, not importance.** The vendor guidance's degrees-of-freedom framing (high = prose heuristics, low = one exact command with "do not modify") is the most transferable authoring rule, and it has a safety corollary: irreversible steps belong at low freedom, in a script, not in prose the model may paraphrase.
- **Write for an agent that may `head -100` your file.** That single assumption generates the structural rules — body under 500 lines, references one level deep (nested references are where content silently goes unread), TOC above 100 lines, descriptive filenames.
- **Rules interact; the interaction is the failure.** Stacking degrades follow rate ~96% → 20% ([arXiv:2608.02639](https://arxiv.org/abs/2608.02639)); nested exceptions ("A UNLESS B UNLESS C overrides B") trigger **exception chain collapse** ([arXiv:2607.23386](https://arxiv.org/abs/2607.23386)); flat constraint lists cannot scope a check to an output section ([arXiv:2607.27912](https://arxiv.org/abs/2607.27912)). So: decision tables over nested prose, and re-run the suite after *adding* a rule.
- **Naive ablation of a rule measures two changes at once.** SkillSV's fix — **paired deletion with length-neutral padding** to separate content value from context cost, respecting unit dependencies so only valid counterfactual skills are evaluated ([arXiv:2608.04562](https://arxiv.org/abs/2608.04562)) — is the missing detail in "just delete it and see."
- **The sobering control:** in-context learning performed **comparably to explicit skill maintenance on average**, with much of the gain attributable to adaptation to prior context rather than reusable skill acquisition ([arXiv:2608.03874](https://arxiv.org/abs/2608.03874)). Baseline without the skill before investing in its text.
- **Discovery, not authoring, is the ceiling at scale.** Over 690 skills, a hybrid ranker hit top-5 **73.5% ± 8.0** and a typed knowledge graph was 11.2 points worse at matched budget ([arXiv:2608.06196](https://arxiv.org/abs/2608.06196)). A document should therefore carry a **negative boundary** — which neighbors should win instead ([arXiv:2608.04482](https://arxiv.org/abs/2608.04482)).
- **Model drift moves the target silently.** "Several failure cells closed silently under the same model alias, with no version bump (GPT-5.4 … 96.6% to 100%, same prompt and harness)" — so a skill validated once is not validated forever ([arXiv:2607.23386](https://arxiv.org/abs/2607.23386)).

## Provenance check performed

The graph attributed "brevity bias" to Gao et al. ([arXiv:2501.01329](https://arxiv.org/abs/2501.01329)). Verified against both papers: **the attribution holds as ACE frames it** — ACE coins no term, defines brevity bias as "the tendency of optimization to collapse toward short, generic prompts," credits Gao et al. with *documenting the effect*, and cites GEPA as a counter-case highlighting brevity as a strength. Added precision: Gao et al.'s setting is **test-case generation** specifically, and its abstract frames its findings as diversity and domain-knowledge deficits rather than shortness — so the general claim rests on ACE's reading of it, not on a general result.

## Open gaps

- Unverified and therefore uncited: SkillTrace (two distinct papers share the name — [arXiv:2608.05204](https://arxiv.org/abs/2608.05204) provenance auditing and [arXiv:2608.02356](https://arxiv.org/abs/2608.02356) query-skill graph), SkillSentry, Behavioral Skill Reconstruction, SkillZip's evaluation numbers, and the agent-plans study ([arXiv:2608.04661](https://arxiv.org/abs/2608.04661)) that may be the closest thing to an empirical study of real `AGENTS.md`-style artifacts.
- No node yet on **skill versioning and drift-retesting** as a practice, which the Confidently Wrong drift result argues for.
- Nothing here is validated against an in-house skill; the concept node is a distillation of vendor guidance plus unreproduced 2026 preprints.
