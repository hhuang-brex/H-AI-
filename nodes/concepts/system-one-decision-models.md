---
id: system-one-decision-models
type: concept
tags: [decision-model, system-one, typed-output, calibration, latency, cost, routing, judge]
summary: "models that return a probability per caller-defined option in one forward pass instead of generating text — why they are fast and cheap, where they match LLMs, and where speed stops helping an agent."
related:
  - [[references-system-one-decision-models]]
  - [[forced-tool-call-output]]
  - [[decision-engine-contract]]
  - [[tool-selection-and-routing]]
  - [[llm-as-judge]]
  - [[engine-vs-conversation-routing]]
  - [[native-thinking-vs-prompted-reasoning]]
  - [[prompt-injection-and-isolation]]
  - [[confirm-before-act]]
  - [[agent-trajectory-eval]]
  - [[cost-aware-eval]]
  - [[harness-token-economics]]
  - [[llm-output-design]]
  - [[task-agent-pattern]]
status: living
created: 2026-10-25
---

# System One Decision Models

**Definition.** A *System One decision model* answers a typed question about a piece of state by returning a probability for every option the caller declared, without generating text. The name borrows Kahneman's fast System 1 versus slow System 2. The category was popularized by **Jev**, a commercial model from TypeSafe AI, which its founder describes as "a frontier-intelligence function call: unstructured state in, typed probabilistic decisions out" ([launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev), Diogo Almeida, 2026-09-15, fetched 2026-10-25).

Jev exposes three question types ([docs](https://docs.typesafe.ai/introduction), fetched 2026-10-25):

| Primitive | Returns | Typical use |
|---|---|---|
| **Choice** | the chosen option, a probability per option, a confidence | route a request, pick a tool, classify intent |
| **Score** | a position on an ordered scale, with probabilities | rate against a rubric, set urgency |
| **Noul** | a probability between 0 and 1 that a statement is true | "does this evidence support the claim?" |

Many questions about one state go in one request and are "evaluated in parallel and in isolation."

## Why it is faster and cheaper

The speed is structural, not a smaller model:

- **No decoding.** A generative LLM writes its answer one token at a time, each step waiting on the last. A decision model reads the whole input in one parallel pass and reads the answer off the result. Independent work puts one such call "one to two orders of magnitude cheaper than a same-scale generative language model" ([2610.07716](https://arxiv.org/abs/2610.07716)).
- **Nothing to parse.** The answer is already a typed value, so there is no JSON to extract and no malformed output to retry. This is the same goal as [forced-tool-call-output](forced-tool-call-output.md), reached without generation.
- **Questions share one read of the state.** Asking a second question about the same record does not reread it.
- **Pricing follows the shape.** Jev charges $0.042 per million input tokens and calls output "too cheap to meter." The vendor reports 70–500 ms end to end.

**Read the vendor multipliers carefully.** TypeSafe's "193.6x faster, 444.6x cheaper" comes from four workflows its own team wrote, scored against frontier-model answers as the reference. The post itself says the multipliers "are on the higher end of real world gains" and "We can't prove it isn't subsidized." Independent measurements are smaller but still large:

| Setting | Finding | Source |
|---|---|---|
| 37 public datasets, zero-shot | 346,009 requests for under $10; beat Qwen3.8-27B on 27 of 37 | [2609.37647](https://arxiv.org/abs/2609.37647) |
| RAG claim verification | Statistically tied with a frontier LLM at a **187×** cost difference | [2610.20634](https://arxiv.org/abs/2610.20634) |
| Clinical-output judging | Frontier judges cost 73–294× more and took 7–57× longer | [2610.28826](https://arxiv.org/abs/2610.28826) |
| 92k decisions, 30 models | Large System One models match fast closed LLMs at a quarter of the latency | [2610.21244](https://arxiv.org/abs/2610.21244) |

## Why it is a big deal

Most of what an agent harness decides is a small multiple-choice question: which tool next, is this retrieved passage relevant, does this input carry an injection, should this run stop. Today each of those costs a full LLM call. A model built for exactly that shape changes the economics of every one of them, and it returns a probability the code can threshold, sort, or escalate on — which a generated "yes" never gave you.

**The capability is not exclusive to Jev.** Open instruction-tuned models read at the answer letter match it without training, and a LoRA fine-tune beat it by about 4 points on its own benchmark ([2610.17205](https://arxiv.org/abs/2610.17205), [2610.02076](https://arxiv.org/abs/2610.02076)). One team replaced a frontier judge costing about $1,000 per pass with a self-hosted readout at roughly 1% of the cost ([2610.29052](https://arxiv.org/abs/2610.29052)). The pattern is portable; the vendor is one implementation.

## Where it stops working

- **Multi-step reasoning.** Jev answered 97.5% of items a single forward pass of a reference LLM solves, but only 74% of those needing written intermediate steps ([2610.24929](https://arxiv.org/abs/2610.24929)). On math word problems it trailed all 19 LLMs tested ([2610.11978](https://arxiv.org/abs/2610.11978)).
- **It trusts a stale input and doesn't know it.** Its confidence flags its own errors but not errors inherited from a wrong summary of the state.
- **Probabilities depend on the option list.** Adding an irrelevant option moved the odds between the top two answers in a pre-registered test of 299,463 calls ([2610.16655](https://arxiv.org/abs/2610.16655)). In open replicas, the short option label often outweighed the written definition ([2610.02586](https://arxiv.org/abs/2610.02586)).
- **Typed output narrows injection; it does not stop it.** Attacker-controlled context flipped decisions in 81.5% of 228 real Jev applications ([2610.18612](https://arxiv.org/abs/2610.18612)). The attacker can only pick among your options — but one of your options may be "approve." See [prompt-injection-and-isolation](prompt-injection-and-isolation.md).

## Faster decisions do not make a faster agent

This is the finding that matters most for a task agent. Plugged into agent loops, local savings repeatedly failed to become end-to-end savings:

- In ALFWorld and AndroidWorld, decision cost fell for all five agents, but recovery steps and premature completion absorbed it; cost per *successful* task rose for one agent ([2610.13092](https://arxiv.org/abs/2610.13092)).
- As a controller for a Terminal-Bench agent, Jev raised cost per attempt **19%** at an identical pass rate. It ranked finished runs well but was badly calibrated — 0.50 mean probability of "complete" when 87% had passed — so it kept asking for unnecessary verification ([2610.24649](https://arxiv.org/abs/2610.24649)).
- On τ-bench, faster local decisions lowered task success as errors accumulated over long trajectories ([2610.03935](https://arxiv.org/abs/2610.03935)).
- Most wrong actions followed a *correct* reading of the state: the model saw every fact and failed to combine them ([2610.18579](https://arxiv.org/abs/2610.18579)).

What worked was a **confidence threshold fitted per decision on the agent's own trajectories**, with the LLM deciding below it: 81–89% cheaper and up to 2.5× faster without losing 3 points of success ([2610.21412](https://arxiv.org/abs/2610.21412)).

## For a conversing task agent

The graph's rule, synthesized from the above: **use a decision model for leaf decisions whose answer is in the evidence, never for the step that commits an irreversible action.**

| Good fit | Poor fit |
|---|---|
| Intent and route classification | Multi-step calculation or planning |
| "Is this passage relevant?" gating | Anything that needs current state checked first |
| Rubric scoring of a finished output | The final yes on a payment or send |
| First-pass judge, escalating low confidence | Long-horizon control of the loop itself |

Fit the escalation threshold on held-out traffic, not in-sample: naive thresholds exceeded the target risk in about half of settings ([2610.19811](https://arxiv.org/abs/2610.19811)). Keep the option list fixed per decision, since the probabilities are relative to it. And measure the agent end to end — cost per delivered outcome, not per call ([cost-aware-eval](cost-aware-eval.md)).

## References

All sources are in [references-system-one-decision-models](../references/references-system-one-decision-models.md). Vendor pages were fetched 2026-10-25 and describe mechanism and self-reported numbers; arXiv entries were read at the abstract only.
