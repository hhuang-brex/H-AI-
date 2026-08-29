---
id: skill-text-authoring
type: concept
tags: [skills, prompt-engineering, playbook, authoring, context-engineering, eval]
summary: "how to improve a skill's instruction text by hand: cut what the model already knows, match specificity to task fragility, structure for partial reads, keep rule sets small and unnested, and gate every edit on an eval."
related:
  - [[agent-skills-progressive-disclosure]]
  - [[offline-prompt-optimization]]
  - [[agentic-context-engineering-ace]]
  - [[prompt-component-attribution]]
  - [[eval-statistical-significance]]
  - [[context-budget-allocation]]
  - [[context-engineering]]
  - [[domain-knowledge-injection]]
  - [[recency-bias-prompt-design]]
  - [[template-rendered-output]]
  - [[action-execution-safety]]
  - [[dry-run-and-preview]]
  - [[references-agent-skill-authoring]]
status: living
created: 2026-08-08
source-thread: [[2026-08-08-skill-text-authoring-fanout]]
---

# Skill-Text Authoring

[agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md) covers how a skill is *packaged*; [offline-prompt-optimization](offline-prompt-optimization.md) covers how a machine *searches* its text. This node covers the part a human still does: **deciding what the text should say**. It matters because the automated loop optimizes what you give it — a well-structured skill is what makes attribution and search cheap, and a badly-structured one makes both expensive.

## Rule 0: earn the tokens

The default failure is writing an explainer. Anthropic's authoring guidance states the test bluntly — "the context window is a public good," the default assumption is that the model "is already very smart," and every paragraph must answer *"does this justify its token cost?"* Their worked contrast is ~50 tokens (name the library, show the three-line call) versus ~150 tokens that explain what a PDF is.

Concretely, cut: definitions of standard concepts, motivation prose, restatements of the model's general competence. Keep: **your** conventions, **your** identifiers and schemas, the non-obvious rule ("always exclude test accounts"), and the exact command that must run.

## Match specificity to fragility, not to importance

The most transferable idea in the vendor guidance is **degrees of freedom** — how prescriptive to be is a function of how *fragile* the operation is, not how much you care about it:

| Freedom | Form | Use when | Example |
|---|---|---|---|
| **High** | prose heuristics | multiple valid approaches; decisions are context-dependent | "analyze structure, check edge cases, suggest improvements" |
| **Medium** | pseudocode / parameterized script | a preferred pattern exists, some variation is fine | a `generate_report(data, format=…)` skeleton |
| **Low** | one exact command, no options | operation is fragile, consistency is critical, sequence matters | `python scripts/migrate.py --verify --backup` and "do not modify the command" |

Their analogy: a narrow bridge with cliffs gets guardrails; an open field gets a direction. Over-specifying an open field is how skills become brittle and long; under-specifying a narrow bridge is how they cause incidents. Note the corollary for [action-execution-safety](../topics/action-execution-safety.md): irreversible steps belong at *low* freedom, in a script, not in prose the model may paraphrase.

## Structure for partial reads

Assume the reader is an agent that may `head -100` your file rather than read it whole. That single assumption drives most structural rules:

- **Body under ~500 lines**; split beyond that (vendor guidance, for "optimal performance").
- **References exactly one level deep from SKILL.md.** Nested pointers (`SKILL.md → advanced.md → details.md`) are where content silently goes unread, because the agent previews rather than reads.
- **Table of contents on any reference file over ~100 lines**, so a partial read still reveals the full scope.
- **Descriptive filenames** (`form_validation_rules.md`, not `doc2.md`) — the filename is the retrieval signal for a file the agent hasn't opened.
- **One term per concept.** Mixing "field" / "box" / "element" makes the model's matching job harder for zero benefit.

## Keep the rule set small, flat, and non-conflicting

Three 2026 results say the same thing from different directions: **rules interact, and the interaction is where behavior breaks.**

- **Stacking.** Follow rate degrades non-linearly as constraints accumulate — ~96% → as low as 20% across 24 verifier-checked instructions, with reproducible pairwise conflicts (a single "output JSON" constraint jointly unsatisfiable with nine others) ([arXiv:2608.02639](https://arxiv.org/abs/2608.02639)). Adding a rule can silently break an existing one.
- **Nesting.** "A is required UNLESS B applies, UNLESS C overrides B" triggers **exception chain collapse** in frontier models ([arXiv:2607.23386](https://arxiv.org/abs/2607.23386)). Write conditions as a flat decision table, or push them into deterministic code — the same paper's remedy is to have the model author rules and a solver execute them ([llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md)).
- **Scoping.** When a skill specifies a layered artifact, constraints attach to *sections*, not to the whole response; flat constraint lists can't express that ([arXiv:2607.27912](https://arxiv.org/abs/2607.27912)). Attach each rule to the part of the output it governs.

Practical upshot: prefer a decision table to nested prose, cap the number of hard constraints, and re-run the suite after *adding* a rule — not only after removing one.

## Close the loop

Authoring is not a one-shot write. The loop that the evidence supports:

1. **Baseline without the skill.** Run representative tasks with no skill and record the failures. Vendor guidance is explicit: build evaluations *before* writing extensive documentation, so the text addresses observed gaps rather than imagined ones. This is also the honest control — **in-context learning performed comparably to explicit skill maintenance on average** in one 2026 benchmark, with much of the apparent gain coming from adaptation to prior context and feedback rather than reusable skill acquisition ([arXiv:2608.03874](https://arxiv.org/abs/2608.03874)). A skill that doesn't beat the no-skill baseline is overhead.
2. **Write the minimum that closes the gap**, then test with the models you actually deploy (guidance for weaker models differs from what a frontier model needs).
3. **Observe navigation, not just outcomes.** Unexpected read order, references never followed, a bundled file never opened, one file read every run — each is a signal about structure. A file the agent never opens is either unnecessary or badly signposted; a file it reads every time belongs in the body.
4. **Attribute before editing.** Which unit earned its place is measurable: **SkillSV** scores a skill's internal units (rules, examples, scripts, heuristics) with structure-aware Shapley values, using paired deletion plus **length-neutral padding to separate content value from context cost** and respecting unit dependencies so only *valid* counterfactual skills are evaluated ([arXiv:2608.04562](https://arxiv.org/abs/2608.04562)). That last detail is the trap in naive ablation: deleting a rule also shortens the prompt, so you measure two changes at once. See [prompt-component-attribution](prompt-component-attribution.md).
5. **Gate on a real delta.** Format and ordering variance can swamp a small improvement — [eval-statistical-significance](eval-statistical-significance.md).
6. **Accept on behavior, not on text.** Reviewing the artifact — or even its final task score — "leaves unresolved which actions the equipped agent will perform and which side effects those actions will produce" ([arXiv:2608.17588](https://arxiv.org/abs/2608.17588), 2026 preprint). The pattern worth copying: a **static gate** over named safety properties, then load the candidate into a **shadow agent** in a controlled environment where brokered tools expose every requested action to policy enforcement and record it. For a skill that touches an irreversible surface, that recorded action list — not the prose — is the acceptance artifact ([action-execution-safety](../topics/action-execution-safety.md), [dry-run-and-preview](dry-run-and-preview.md)).
7. **Edit in small, individually evaluable steps.** Framing skill improvement as *sequential edits, each separately scorable*, is exactly what makes the loop learnable rather than a rewrite gamble ([arXiv:2608.01678](https://arxiv.org/abs/2608.01678)).

## Which artifact is worth the investment

Two 2026 empirical studies of open-source repositories answer this with adoption data, and they disagree by two orders of magnitude:

| Artifact | Found in the wild | Source |
|---|---|---|
| **Static config prompt files** (`.cursorrules`-style project rules) | **12,110 files across 11,427 repositories**, with characterized distribution, evolution, and maintenance | [arXiv:2608.10622](https://arxiv.org/abs/2608.10622) (ICSOFT 2026) |
| **Per-task agent plans** (plan files committed to the repo) | **85 plan files in 10 repositories**, from **36,710 repositories screened** — "a highly concentrated corpus" | [arXiv:2608.04661](https://arxiv.org/abs/2608.04661) (ESEM 2026) |

The durable, maintained artifact is the **standing instruction file**; per-task plans are written and discarded. So the authoring effort described in this node — earning tokens, degrees of freedom, structure for partial reads, flat rule sets — belongs on the standing file, and a plan is best treated as scaffolding for one run rather than something to polish or version. (Both are open-source-repository studies; internal practice may differ, and neither measures whether the files *work*.)

## Pitfalls

- **Explaining instead of instructing.** The most common bloat, and it crowds out the conventions only you know.
- **Nested exceptions.** See above; flatten or externalize.
- **Offering options.** "Use pypdf, or pdfplumber, or PyMuPDF…" defers a decision the skill exists to make. Give one default plus a named escape hatch.
- **Time-bound text.** "Before August 2025, use the old API" rots. Put superseded material in an explicit *old patterns* section instead of a date conditional.
- **Deleting a rule because one run went wrong.** That is instance attribution used as population evidence — the error [prompt-component-attribution](prompt-component-attribution.md) is about.
- **Letting an optimizer own the prose unsupervised.** Automated optimization exhibits **brevity bias** — collapse toward short, generic instructions that drop domain specifics ([agentic-context-engineering-ace](agentic-context-engineering-ace.md)). The human's job is precisely the domain detail an optimizer discards; keep a length floor and diff what it removed.
- **Diagnosing greedily.** When a skill fails, a single sparse outcome conflates several possible causes; refining one incumbent guess repeatedly is an **exploitation trap** that burns the budget on an early misdiagnosis ([arXiv:2608.05628](https://arxiv.org/abs/2608.05628)). Turn the hypothesis into a falsifiable test first.
- **Treating skill text as inert.** A skill folder is instructions *plus scripts* that an agent will execute — an injection and supply-chain surface, not documentation ([agent-skills-progressive-disclosure](agent-skills-progressive-disclosure.md), [prompt-injection-and-isolation](prompt-injection-and-isolation.md)).

## References

Vendor guidance, the 2026 agent-skills literature, and what each claim rests on: [references-agent-skill-authoring](../references/references-agent-skill-authoring.md).
