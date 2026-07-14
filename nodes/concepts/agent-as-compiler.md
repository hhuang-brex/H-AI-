---
id: agent-as-compiler
type: concept
tags: [agent, code-generation, abstraction, verification, natural-language, spec-driven, output-design]
summary: "the 'coding agent is the new compiler / English is the new programming language' thesis — a real reframing (Karpathy, Grove) that correctly spots intent rising up the abstraction stack, but a category error on the four properties that make a compiler valuable: determinism, semantics-preservation, verify-once, and fail-local; the builder's takeaway is that the prompt is NOT the source of truth — the checkable contract (code + tests/spec/types) is."
related:
  - [[tool-use-design]]
  - [[dsl-vs-code-vs-tool-calls]]
  - [[llm-as-autoformalizer-plus-solver]]
  - [[user-intent-to-task-grounding]]
  - [[prompt-time-knowledge-capture]]
  - [[forced-tool-call-output]]
  - [[schema-vs-validator]]
  - [[adversarial-eval]]
status: living
created: 2026-07-13
---

# Agent-as-Compiler (is English the new programming language?)

A popular reframing: the LLM/agent is a **compiler** that lowers a natural-language (or spec) "source" into code, so **English — or a DSL — is the new programming language**. The framing is real and well-sourced. As a *literal* engineering claim it is a **category error** — but the specific way it breaks is exactly what tells a builder where the durable artifact lives. This node owns the *analogy and the authored-artifact question*; the runtime "which language should the model emit" dial is [dsl-vs-code-vs-tool-calls](dsl-vs-code-vs-tool-calls.md), and the sound-guarantee escape hatch is [llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md).

## Who actually said what (verified 2026-07-13)

- **Karpathy — two *different* compiler analogies, often conflated.** *Software 2.0* (Nov 2017) is about **training**: "the process of training the neural network compiles the dataset into the binary — the final neural network" (dataset = source, weights = binary). *Software 3.0* ("Software Is Changing (Again)", YC AI Startup School, Jun 2025) is the new one: 1.0 = code / 2.0 = weights / **3.0 = natural-language prompts**. The slogan **"The hottest new programming language is English"** is a real dated X post (24 Jan 2023) — but its body is paywalled, so the exact wording is secondary-sourced, not fetched live. Karpathy himself attached caveats the meme drops: *"jagged intelligence," "keep AI on a tight leash," "Demo is `works.any()`, product is `works.all()`."*
- **Grove — "the spec is the new code."** In *The New Code* (Sean Grove, OpenAI, AI Engineer World's Fair, Jun 2025) he says **verbatim** "code itself is actually a lossy projection from the specification," uses a decompiled-C-binary image, and argues "whoever writes the spec … is now the programmer." **Contested:** the crisp tripartite *"spec = source, code = lossy binary, model = compiler"* is the *claimant's* synthesis — only the lossy-projection and decompiled-binary legs are Grove's words. And "spec is the durable artifact, code is disposable" is his **aspiration**, not current practice: code, not spec, is still the versioned executable artifact for essentially all software.
- **Dijkstra — the classic counter.** *EWD667, "On the foolishness of 'natural language programming'"* (~1978): formal symbolism is "an amazingly effective tool for ruling out all sorts of nonsense," and the danger of natural language is "the ease with which we can use [it] for making statements the nonsense of which is not obvious." Crucially, Dijkstra endorsed the *earlier* abstraction rungs (assembly→C→…) and rejected the NL leap as **different in kind** (imprecision), not as the same efficiency objection.

## The abstraction-ladder argument — and why it doesn't carry

The pro case: every rung up the ladder (assembly → C → high-level → "intent") drew the same "too slow / too imprecise" objection and was later judged progress; English is just the next rung. **This is overstated.** The historical objection to high-level languages was *efficiency*; the objection to NL-as-source is *imprecision* — a different kind of problem. Multiple critics (Keles, and others) argue NL is different in kind, not merely the next rung.

## Where the compiler analogy structurally breaks

A compiler is valuable because of four properties. An agent has **none** of them by construction:

| Compiler property | Agent reality |
|---|---|
| **Determinism / reproducible builds** | Stochastic — *but softer than the meme claims*: nondeterminism is **defeatable** (Thinking Machines / Horace He, Sep 2025: batch-invariant kernels made 1000 `t=0` completions bitwise-identical; root cause is FP batch-variance, not intrinsic randomness). Compilers, too, are only byte-identical via deliberate reproducible-builds discipline. |
| **Semantics-preservation** | No invariant maps NL intent → code. NL "doesn't come with precise semantics" (Keles), so it's hard even to *state* what functional correctness means. |
| **Verify-once, reuse-forever** | CompCert (Leroy, CACM 2009) ships "a machine-checked proof that the generated executable code behaves exactly as prescribed by the semantics of the source" — quantified over *all* inputs, once. An agent gives a **fresh, unverified translation every run**; trust doesn't amortize. |
| **Fail-local (reject ill-formed input at a known location)** | A type checker rejects pre-emission at a point; an agent emits plausible-wrong code that fails at runtime. *(Honest caveat: this error-locality contrast is common-sense but was **not** supported by the sources searched, and compilers also silently pass logic errors — partly apples-to-oranges.)* |

## What plays the role of the "type system"?

There is no built-in one. The candidates — **tests, a spec, types, human review** — are *incomplete oracles* (Dijkstra EWD249, 1970: "testing shows the presence, never the absence, of bugs"). "Correctness" for an agent is defined **relative to a downstream verifier** you rediscover after generation, not preserved by construction. The one rigorous compiler-side precedent for per-artifact trust is **Translation Validation** (Pnueli, Siegel, Singerman, TACAS 1998): treat the translator as untrusted, derive trust from a machine-checkable per-run equivalence certificate — the cleanest "untrusted producer + checkable witness" model an agent would need, *but* it presupposes formal semantics of source and target, which NL intent lacks.

## The one place the analogy genuinely recovers

**Autoformalize NL → a formal language + a sound solver/kernel** (Lean/Z3/PDDL), keeping the LLM as an untrusted, *checked* oracle: Wu et al. *Autoformalization with LLMs* (arXiv:2205.12615, ~25.3% perfect translations), *Draft-Sketch-Prove* (arXiv:2210.12283), DeepMind **AlphaProof** (Jul 2024, Lean, IMO-2024 silver). This relocates trust into a small verified kernel — but the **NL→formal step is itself unverified and low-accuracy**, so "restores a compiler-grade guarantee" is overstated; the spec-capture gap remains. This mechanism is owned by [llm-as-autoformalizer-plus-solver](llm-as-autoformalizer-plus-solver.md).

## For a builder: what is the durable artifact?

- **The prompt is not your source of truth.** NL underdetermines behavior — FormatSpread (Sclar et al., ICLR 2024, arXiv:2310.11324) shows meaning-preserving format edits swinging accuracy up to 76 points (an observed max on one model, not a typical spread), and generation shifts under weight updates you don't control. The prompt is a **brittle input, not a program**. The durable, reviewable, re-runnable artifacts are **committed code + its tests/types/spec** — that is where the contract lives.
- **Verification doesn't amortize.** Budget per-artifact review/CI/canary; treat the agent as a fast, fallible junior contributor whose output enters your existing verification stack, not a trusted oracle.
- **A DSL is a genuine middle option only** when the domain has fixed verifiable semantics *and* the DSL stays close to a well-trained language — else the low-resource-generation tax (arXiv:2410.03981) means the model fumbles the very artifact you wanted humans to author. This is the action-language dial of [dsl-vs-code-vs-tool-calls](dsl-vs-code-vs-tool-calls.md); this node adds only the durable-artifact/verification lens. Controlled Natural Language is decades-old prior art (Kuhn survey, 2014) with a cautionary lesson: a CNL precise enough to be unambiguous has effectively *become* a programming language.
- **Spec-driven tools operationalize "intent as source," but none forces it.** GitHub **spec-kit** ("specifications become executable" via multi-step refinement) and AWS **Kiro** (requirements/design/tasks before code) are AI-mediated *pipelines*, not deterministic compilers — and both allow free-form/"vibe" edits, so **spec↔code drift is the standing failure mode** you must police.

## Attribution hygiene (do NOT repeat these)

The discourse is littered with misattributions this node's verification caught: **Don Syme** ("On Natural Language Programming", 2025) is *pro*-NL (argues ambiguity can be useful), not a correctness-critic; **Marc Brooker**'s post is titled "On the *success* of natural language programming" and is *pro*-NL; the claim that Isaac Vando "reframes" Vivek Haldar's abstraction-only defense is ungrounded; and "a sufficiently precise spec simply *is* code" is unattributable folklore. Cite the verbatim-verified sources above, not the meme versions.

## References

Sits under [tool-use-design](../topics/tool-use-design.md) as the authored-artifact/verification sibling of [dsl-vs-code-vs-tool-calls](dsl-vs-code-vs-tool-calls.md). Upstream sibling: [user-intent-to-task-grounding](user-intent-to-task-grounding.md) (turning NL into an executable task — act-vs-clarify). Shares the "NL is an untrusted, underspecified input" theme with [prompt-time-knowledge-capture](prompt-time-knowledge-capture.md); "validity ≠ correctness" with [forced-tool-call-output](forced-tool-call-output.md) / [schema-vs-validator](schema-vs-validator.md); per-artifact skepticism with [adversarial-eval](adversarial-eval.md). Verified anchors: Karpathy Software 2.0 (2017) / 3.0 (2025) / English tweet (2023); Grove *The New Code* (2025); Dijkstra EWD667 (~1978), EWD249 (1970); CompCert (Leroy, CACM 2009); Translation Validation (Pnueli et al., TACAS 1998); FormatSpread (arXiv:2310.11324); Thinking Machines nondeterminism (He, 2025); autoformalization (arXiv:2205.12615, 2210.12283, AlphaProof); CNL survey (Kuhn, 2014); low-resource-DSL survey (arXiv:2410.03981); spec-kit + Kiro.
