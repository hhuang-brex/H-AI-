---
id: prompt-injection-and-isolation
type: concept
tags: [agent, security, prompt-injection, isolation, least-privilege, safety, threat-model]
related:
  - [[action-execution-safety]]
  - [[action-authority]]
  - [[confirm-before-act]]
  - [[escalation-handoff]]
  - [[tool-result-grounding]]
  - [[layered-defense-pipeline]]
  - [[code-execution-sandbox-pattern]]
  - [[hard-surface-irrevocability]]
  - [[adversarial-eval]]
  - [[dry-run-and-preview]]
  - [[safety-rails-domain-specific]]
  - [[mcp-tool-layer]]
  - [[memory-poisoning]]
  - [[skill-lifecycle-and-drift]]
  - [[agent-skills-progressive-disclosure]]
status: living
created: 2026-07-10
summary: "the threat model for agents that act — you cannot reliably detect injected instructions, so the boundary is architectural: least-privilege isolation of what a compromised session CAN do (lethal trifecta / Agents Rule of Two)."
---

# Prompt Injection and Isolation

Every other node in [action-execution-safety](../topics/action-execution-safety.md) assumes the agent's *decision* is well-intentioned and hardens the *execution* against accidental failure — retries, crashes, replans. Prompt injection is the opposite failure class: **the decision itself is attacker-controlled.** Untrusted text the agent ingested — a web page, a document, a tool result, an MCP tool description, a poisoned memory — carries instructions the model follows as if they came from the user. Idempotency, rollback, and dry-run don't help; they faithfully execute an attacker's intent exactly once.

The load-bearing claim: **you cannot reliably detect injected instructions in content, so detection cannot be your trust boundary. The durable boundary is architectural — constrain what a *compromised* agent is allowed to do.** Assume the prompt is already injected and bound the blast radius.

## The root cause: data and instructions share one channel

Prompt injection (Simon Willison, ~Sept 2022) is **"mixing together trusted and untrusted content in the same context"** — named after SQL injection for the identical root cause. Greshake et al.'s foundational *indirect* injection paper ([arXiv:2302.12173](https://arxiv.org/abs/2302.12173), 2023) put it: **"LLM-Integrated Applications blur the line between data and instructions,"** and showed adversaries can exploit them *remotely* via retrieved content (demonstrated against Bing Chat). Mechanistically, *Prompt Injection as Role Confusion* (arXiv:2603.12277, ICML 2026) finds LLMs "perceive the source of text from how it *sounds*, not its labeled role" — **"sounding like a role is indistinguishable from being one."** A filter reading the same untrusted stream inherits the same weakness. *(The 2603 arXiv prefix vs. a reported Feb-2026 date is inconsistent — treat the exact date as uncertain.)*

## Why detection fails: the attacker moves second

*The Attacker Moves Second* ([arXiv:2510.09023](https://arxiv.org/abs/2510.09023); Nasr, Carlini, Tramèr et al., 14 authors, DeepMind/OpenAI/academia): adaptive attacks (gradient descent, RL, random search, human red-teaming) **bypassed 12 recently-published defenses at >90% attack success for most (100% via human red-teaming) — even though most had originally reported near-zero.** Static-eval robustness collapses against an adversary who adapts. *Established.*

> **Honest scope:** no source says detection is *worthless* — vendors and this graph's [layered-defense-pipeline](layered-defense-pipeline.md) ship classifiers as *one* layer. The defensible claim is narrower: **detection is not *sufficient* and cannot be a hard trust boundary.** (Willison, opinion: "in web application security 95% is very much a failing grade.")

## Risk model 1 — the lethal trifecta (risk identification)

Willison's *lethal trifecta* (2025-06-16) — practitioner framing, not a theorem, but the dominant industry model. An agent becomes exploitable when it combines all three:

1. **Access to private data**
2. **Exposure to untrusted content**
3. **The ability to externally communicate** (exfiltrate)

**"Any time you combine those three lethal ingredients together you are ripe for exploitation."** Vendors historically fixed real attacks not by detecting bad text but "by locking down the exfiltration vector" — i.e. **cutting a leg**.

## Risk model 2 — the Agents Rule of Two (buildable design rule)

Meta's *Agents Rule of Two* (2025-10-31; vendor guidance, "a supplement — and not a substitute" for least-privilege) makes it prescriptive: an agent should satisfy **no more than two** of the following **within a session**:

- **[A]** process untrustworthy inputs
- **[B]** access to sensitive systems or private data
- **[C]** change state or communicate externally

**"If an agent requires all three without starting a new session (fresh context window), then the agent should not be permitted to operate autonomously"** — it "at a minimum requires supervision." Two refinements over the trifecta: leg **[C] is broader** ("change state *or* communicate") so it covers destructive/irreversible actions that leak nothing; and it is scoped **per session / fresh context window**, not per configuration.

### Applying it to a domain action-agent

An acting agent almost always has **[C]** (it acts) and usually **[B]** (it touches domain data) — that spends the budget, so **eliminate [A]**: sanitize/allowlist inputs; or **split sessions** (an untrusted-*reader* session with no tools hands *structured* results to a privileged *actor* session — a fresh window resets the count); or **require HITL** on the state-changing step ([confirm-before-act](confirm-before-act.md) / [escalation-handoff](escalation-handoff.md)) when all three are unavoidable.

## The injection vectors (it rarely arrives in the user's message)

*Indirect* injection — attacker text arriving through content the agent **retrieves** — is the dangerous class:

| Vector | What it is | Tier |
|---|---|---|
| **Tool-result / retrieved-content** | Instructions hidden in a fetched page, doc, RAG hit, API response | Established (Greshake 2023) |
| **MCP tool-description poisoning** | Malicious instructions embedded in tool descriptions invisible to users but visible to the model; plus **rug-pull** (description changed post-approval) and **tool-shadowing** | Vendor research, reproduced (Invariant Labs 2025-04) |
| **Skill / harness supply chain** | A third-party skill, instruction file, hook or MCP declaration installed from a marketplace, running with the developer's privileges — no lockfile, no install-time check | Established (measured at scale, 2026) |
| **Memory poisoning** | Untrusted content written into persistent memory/RAG as a delayed trigger — AgentPoison ([arXiv:2407.12784](https://arxiv.org/abs/2407.12784), >80% ASR at <0.1% poison rate); MINJA ([arXiv:2503.03704](https://arxiv.org/abs/2503.03704), *any user* can poison shared memory via normal queries) | Established (academic) |

> **Don't conflate:** the normative MCP *Security Best Practices* (a living doc) does **not** name "tool poisoning / rug-pull / shadowing" — those are Invariant Labs *research*. It enumerates **eight** client/server attack sections (confused-deputy, token-passthrough, SSRF, session-hijacking, local-server-compromise, OAuth-URL validation, stdio-proxy, scope-minimization). Its genuine **MUSTs** are token-audience checks (RFC 8707) and consent-with-untruncated-command on one-click local launch; least-privilege scoping, sandboxing, and egress allowlists are **SHOULD**, and tool-invocation HITL consent is a principle the spec says it "cannot enforce." Details in [mcp-tool-layer](mcp-tool-layer.md).

### The harness itself is an unaudited dependency layer

Three 2026 results make the skill/harness row above concrete, and they escalate.

**Misconfiguration is common and mostly boring.** Across **3,171 public GitHub repositories** (2,660 setups combining two or more component types), **16.0% carried a security defect** decidable from the bytes alone: **9.8%** install an MCP server with **no version pinned**, **3.1%** pre-approve arbitrary execution behind a *scoped-looking* grant such as `Bash(python:*)`, and **3.8%** ship a skill that pre-approves the shell for whoever installs it — the last visible to a marketplace scan, and present in 3.7% of published collections ([arXiv:2609.07360](https://arxiv.org/abs/2609.07360)). No credential-exfiltration path was confirmed. Note the instrument discipline worth borrowing: a **raw scanner rate of 25.5%** fell to 16.7% confirmed after independent re-derivation and adjudication — most of a naive scan's findings did not survive validation.

**The dangerous version is not malware.** SkillShift formalizes **Skill Policy Integrity** — a skill-induced policy must stay aligned with its declared functionality — and then breaks it: a skill that **preserves the declared task and a valid output interface while covertly redirecting decisions** toward an undisclosed objective. Reported attacker-favored selection rates of **81.33%** (agentic commerce) and **63.33%** (software dependency choice) at a **100% utility-preserving rate**, with frozen policies transferring across LLM backends and agent environments, and **the evaluated scanners failing to detect them** ([arXiv:2609.02564](https://arxiv.org/abs/2609.02564)). This is the injection analogue of a thumb on the scale rather than a hijack, and it is invisible to output-validity checks by construction.

**Detection does not generalize across sources.** On a consolidated benchmark of 9,740 skills (7,505 malicious / 2,235 benign, deduplicated to 4,588 structural families from 13 sources), learned text detectors score **0.882–0.932 macro-F1 under random splits but only 0.653–0.665 source-disjoint**; the strongest keeps 95.6% malicious recall at a **62.4% benign false-positive rate** on held-out sources ([arXiv:2608.19901](https://arxiv.org/abs/2608.19901)). Off-the-shelf scanners trade recall for precision without escaping the tradeoff.

Consistent with this node's thesis: scanning skill *text* is Tier 4. The controls that hold are architectural — pin the closure rather than the directory ([skill-lifecycle-and-drift](skill-lifecycle-and-drift.md)), refuse scope-shaped grants that are actually unbounded ([action-authority](action-authority.md)), and audit the **behavior** a skill induces rather than the prose it contains ([skill-text-authoring](skill-text-authoring.md) step 6).

## The mitigation ladder: architectural > compositional > prompt-level

**Tier 1 — Architectural (the only tier with measured resistance).** Constrain what a compromised agent *can do*, not what it believes.
- **Control/data-flow separation.** CaMeL — *Defeating Prompt Injections by Design* ([arXiv:2503.18813](https://arxiv.org/abs/2503.18813), DeepMind) — enforces a capability policy so "untrusted data ... can never impact the program flow"; **"remains secure even if the underlying model itself is vulnerable."** Measured 77% of AgentDojo tasks *with provable security* vs 84% undefended (~7-pt utility cost). *Preprint.*
- **Dual LLM** (Willison): a privileged LLM with tools + a quarantined LLM for untrusted content that never touches tools and whose output is passed only as symbolic references.
- **Least-privilege scoping + egress allowlists.** Remove leg 3 / property [C]: an agent that *cannot reach* an attacker endpoint cannot exfiltrate. Sharpens [action-authority](action-authority.md).
- **Security sandboxing** (OS/container isolation of tool execution — a *different* concept from the context-saving [code-execution-sandbox-pattern](code-execution-sandbox-pattern.md)).

**Tier 2 — Compositional invariants.** The trifecta / Rule of Two: cap capability co-occurrence per session (design-time checklist, not a runtime filter).

**Tier 3 — Human-in-the-loop on trust-boundary crossings.** [confirm-before-act](confirm-before-act.md) (gate scaled to reversibility × blast radius) + [dry-run-and-preview](dry-run-and-preview.md); the injection angle specifies *which* crossings matter — those influenced by untrusted content.

**Tier 4 — Prompt-level / detection (weak; necessary, never sufficient).** "Ignore injected instructions" + classifier guardrails — defense-in-depth for accidental input, not a boundary against an adaptive adversary. (Anthropic's Claude-for-Chrome injection success dropped 23.6%→11.2% after mitigations — better, still materially non-zero — and its real controls are *containment*: per-site permissions, action confirmations, blocked categories.)

## Mapping to the existing cluster

| Node | Relationship |
|---|---|
| [action-execution-safety](../topics/action-execution-safety.md) | Home topic — adds the *adversarial* failure class to its accidental-failure mechanics. |
| [tool-result-grounding](tool-result-grounding.md) | **Gap it fills:** tool results are an untrusted *instruction* channel, not just a budget/shape problem — provenance-tag, never elevate to instructions. |
| [layered-defense-pipeline](layered-defense-pipeline.md) | **Tension:** its classifier layers are insufficient as the *primary* control against adversarial input — subordinate detection to architectural containment. |
| [action-authority](action-authority.md) | Sharpened: least-privilege = minimizing the standing privilege a compromised session can abuse. |
| [confirm-before-act](confirm-before-act.md) / [escalation-handoff](escalation-handoff.md) | The HITL mechanism for Rule-of-Two's "all three → supervise." |
| [adversarial-eval](adversarial-eval.md) | Test defenses against *adaptive* attacks, not static single-string evals. |

## Evidence tiers

Established (empirical): indirect injection (Greshake), adaptive-attack bypass (Attacker Moves Second), memory poisoning (AgentPoison/MINJA), role confusion. Measured-but-preprint: CaMeL's provable-security-at-a-utility-cost. Vendor/standards guidance: Rule of Two, MCP MUSTs. Opinion/framing: the lethal trifecta. **No source shows "2-of-3 is safe"** — both risk models are prescriptive, not measured. The one universal: there is no reliable content-level solution, which is *why* the boundary must be architectural.

## See also

[action-execution-safety](../topics/action-execution-safety.md) (accidental→adversarial), [tool-result-grounding](tool-result-grounding.md) (untrusted-channel gap), [layered-defense-pipeline](layered-defense-pipeline.md) (subordinate detection to isolation), [action-authority](action-authority.md) / [confirm-before-act](confirm-before-act.md) / [escalation-handoff](escalation-handoff.md), [adversarial-eval](adversarial-eval.md). Adjacent not-yet-nodes: **memory-poisoning** (delayed-persisted vector) and possibly a **capability-gating** node for the Rule of Two.
