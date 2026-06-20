---
id: references-memory-theory
type: reference
tags: [memory, theory, reading-list, associative-memory, forgetting, editing, science-excellence]
summary: "verified primary sources behind the memory-theory cluster — Hopfield/attention, complementary learning systems, catastrophic forgetting, model editing, and experiential learning."
related:
  - [[agent-memory]]
  - [[associative-memory-and-attention]]
  - [[complementary-learning-systems]]
  - [[interference-and-catastrophic-forgetting]]
  - [[parametric-memory-and-editing]]
  - [[experiential-memory-substrates]]
  - [[references-context-and-memory]]
status: living
created: 2026-06-19
---

# References — Memory Theory

The scientific grounding for the *theory-of-memory* sub-cluster under [agent-memory](../topics/agent-memory.md). Where [references-context-and-memory](references-context-and-memory.md) covers the systems precedent (MemGPT, generative agents, lost-in-the-middle), this list covers the **foundational theory** those systems rest on: why associative stores have a capacity wall, why shared-parameter memory forgets, and what cognitive science actually established.

> **Verification provenance.** These citations were fetch-confirmed against primary sources during a dedicated theory research pass on **2026-06-19** (a fan-out of 7 researchers, each claim adversarially cross-checked by an independent verifier — 29 agents, ~360 web/source lookups). Claims are tagged **[supported]** (verified against the primary source), **[contested]** (verified but disputed by another primary source), or **[heuristic]** (a non-rigorous result, e.g. replica-method mean-field). This is stronger than single-pass recall but weaker than the author re-reading every PDF; treat the **[contested]** items as live debates, not settled fact.

## Associative memory & the capacity wall

- **[supported]** **Hopfield, "Neural networks and physical systems with emergent collective computational abilities"** — *PNAS* 79(8):2554–2558 (1982), DOI 10.1073/pnas.79.8.2554. Content-addressable memory as attractor dynamics; the famous **~0.15N capacity is empirical** (N=30/100 simulations), not a theorem. Grounds [associative-memory-and-attention](../concepts/associative-memory-and-attention.md).
- **[heuristic]** **Amit, Gutfreund & Sompolinsky** — *Phys. Rev. Lett.* 55(14):1530 (1985); full phase diagram *Annals of Physics* 173:30–67 (1987). Replica-method critical load **α_c ≈ 0.138**, above which retrieval collapses into a spin-glass phase. Mean-field, non-rigorous.
- **[supported]** **McEliece, Posner, Rodemich & Venkatesh** — *IEEE Trans. Inf. Theory* 33(4):461–482 (1987). Rigorous information-theoretic bound: **N/(2 ln N)** patterns (vanishing error tolerated), **N/(4 ln N)** (all patterns exact fixed points). Sub-linear, and differently defined from the 0.14N figure.
- **[supported]** **Krotov & Hopfield, "Dense Associative Memory for Pattern Recognition"** — NeurIPS (2016), arXiv:1606.01164. Higher-order energy → **super-linear** capacity K_max = α_n·N^(n−1).
- **[supported]** **Demircigil et al.** — *J. Stat. Phys.* 168(2):288–299 (2017), arXiv:1702.01929. *Rigorously proves* the dense scaling, and **exponential** capacity exp(αN) for an exponential interaction while keeping order-N basins.
- **[supported]** **Ramsauer et al., "Hopfield Networks is All You Need"** — ICLR (2021), arXiv:2008.02217. Continuous-state log-sum-exp energy whose update **is transformer attention by exact algebraic identity** (one attention pass = one retrieval step); proves exponential capacity in dimension. *Caveat: theorems about the idealized energy, not a claim that trained transformers exploit this capacity.*

## Attention & weights as key-value memory

- **[supported]** **Geva et al., "Transformer Feed-Forward Layers Are Key-Value Memories"** — EMNLP (2021), arXiv:2012.14913. FF layer = unnormalized key-value neural memory; keys detect interpretable patterns, values induce next-token distributions.
- **[supported]** **Geva et al., "Transformer Feed-Forward Layers Build Predictions by Promoting Concepts in the Vocabulary Space"** — EMNLP (2022), arXiv:2203.14680.
- **[supported]** **Olsson et al., "In-context Learning and Induction Heads"** — Anthropic / Transformer Circuits (2022). Induction heads proven to drive ICL in 2-layer toy models; **[contested]** at scale (six correlational arguments the authors call "preliminary and indirect").
- **[supported]** **Bietti et al., "Birth of a Transformer"** — NeurIPS (2023), arXiv:2306.00802. Weights as outer-product associative memories; GD recovers the structure in a fixed order.
- **[supported]** **Arora et al., "Zoology" / MQAR** — arXiv:2312.04927 (2023). Associative recall is the capability separating attention from SSM/gated-conv; explains 82% of the Pile perplexity gap.

## Complementary learning systems & consolidation

- **[supported]** **McClelland, McNaughton & O'Reilly** — *Psychological Review* 102(3):419–457 (1995). CLS: fast hippocampal + slow neocortical learning, an explicit response to catastrophic interference; interleaving is the solution. Grounds [complementary-learning-systems](../concepts/complementary-learning-systems.md).
- **[supported]** **Kumaran, Hassabis & McClelland, "What Learning Systems do Intelligent Agents Need? CLS Theory Updated"** — *Trends in Cognitive Sciences* 20(7):512–534 (2016). Recasts replay as goal-dependent/prioritized; explicitly bridges to AI.
- **[supported]** Replay evidence: **Wilson & McNaughton** (*Science*, 1994, reactivation in sleep); **Ji & Wilson** (*Nat. Neurosci.*, 2007, coordinated cortical-hippocampal replay); **Girardeau et al.** (*Nat. Neurosci.*, 2009, **causal**: suppressing sharp-wave ripples impairs consolidation).
- **[supported]** ML lineage: **Lin** (1992, experience replay) → **Mnih et al.** (*Nature*, 2015, DQN replay buffer for decorrelation/stability).

## Interference & catastrophic forgetting

- **[supported]** **McCloskey & Cohen, "Catastrophic Interference in Connectionist Networks"** — *Psych. of Learning and Motivation* 24:109–165 (1989). Sequential training overwrites prior knowledge. **[contested]** framing: the "stability-plasticity dilemma" term is Grossberg/ART; the "representational overlap" account is more properly **French** (*TiCS* 3:128–135, 1999).
- **[supported]** **Kirkpatrick et al., "Overcoming catastrophic forgetting" (EWC)** — *PNAS* 114:3521 (2017), arXiv:1612.00796. Quadratic anchor weighted by **diagonal Fisher information** (a Laplace approximation to the prior task's posterior precision). Grounds [interference-and-catastrophic-forgetting](../concepts/interference-and-catastrophic-forgetting.md).
- **[supported]** **Zenke et al., "Synaptic Intelligence"** — ICML (2017). EWC-like importance computed *online* via a path integral over the trajectory.
- **[supported]** **Lopez-Paz & Ranzato, "GEM"** — NeurIPS (2017). Gradient-projection replay; introduced BWT/FWT metrics.
- **[supported]** **van de Ven & Tolias** (2019): three CL scenarios; regularization-only (EWC) fails class-incrementally where replay is needed.
- **[supported]** Parameter-isolation: **Rusu et al., Progressive Networks** (2016); **Mallya & Lazebnik, PackNet** (2018).
- **[supported]** **Doan et al.** — AISTATS (2021), arXiv:2010.04003. In the NTK regime, **forgetting is governed by the NTK overlap matrix** — interference rises as tasks align; orthogonal representations minimize it.
- **[supported]** **Farajtabar et al., "Orthogonal Gradient Descent"** — AISTATS (2020). Projects new-task gradients orthogonal to stored past-task gradients.

## Parametric memory & model editing

- **[supported]** **Meng et al., "Locating and Editing Factual Associations in GPT" (ROME)** — NeurIPS (2022), arXiv:2202.05262. Causal tracing localizes facts to mid-layer MLPs over the last subject token; rank-one edit of the projection matrix. Grounds [parametric-memory-and-editing](../concepts/parametric-memory-and-editing.md).
- **[supported]** **Meng et al., "Mass-Editing Memory in a Transformer" (MEMIT)** — arXiv:2210.07229 (2022/2023). Spreads a least-squares update across critical layers; thousands of edits at once.
- **[contested]** **Hase et al., "Does Localization Inform Editing?"** — NeurIPS (2023), arXiv:2301.04213. Causal-tracing localization **does not** predict the best layer to edit — dissociates *where a fact is read* from *where it is editable*.
- **[contested]** **Geva et al., "Dissecting Recall of Factual Associations"** — arXiv:2304.14767 (2023). Recall = early-MLP subject enrichment + attention-based extraction; partly relocates "memory" into attention.
- **[contested]** **Hernandez et al., "Linearity of Relation Decoding" (LRE)** — ICLR (2024). Many relations are affine-decodable, but many are not — no universal mechanism.
- **[supported]** **Gupta et al.** — ACL Findings (2024), arXiv:2401.07453. **Sequential** ROME/MEMIT editing → gradual-then-catastrophic forgetting (the editing analogue of catastrophic interference).
- **[supported]** **Gu et al., "Model Editing Harms General Abilities" (RECT)** — EMNLP (2024), arXiv:2401.04700. Editing degrades general ability via excessive weight change; RECT is an EWC-style importance constraint transplanted into editing.
- **[supported]** **Dai et al., "Knowledge Neurons in Pretrained Transformers"** — ACL (2022). Integrated-gradients attribution of facts to FFN neurons.

## Experiential learning & memory substrates

- **[supported]** **von Oswald et al., "Transformers Learn In-Context by Gradient Descent"** — arXiv:2212.07677 (2022). *Constructive proof*: one linear self-attention layer = one GD step on a regression loss ("mesa-optimization"). Theorem for linear attention; empirical for trained transformers.
- **[supported]** **Sun et al., "Test-Time Training"** — ICML (2020), arXiv:1909.13231. The weights-side experiential branch: update parameters on a self-supervised task per test sample. Grounds [experiential-memory-substrates](../concepts/experiential-memory-substrates.md).
- **[supported]** **Shinn et al., "Reflexion"** — arXiv:2303.11366 (2023). Verbal reinforcement: improve by storing self-generated reflective text, not by updating weights. See [verbal-reinforcement-vs-gradient-rl](../concepts/verbal-reinforcement-vs-gradient-rl.md).
- **[supported]** **Suzgun et al., "Dynamic Cheatsheet"** — arXiv:2504.07952 (2025). Persistent self-curated memory reused at inference; test-time learning without weight updates. *Metrics are self-reported.*
- **[supported]** **Zhang, Hu et al., "Agentic Context Engineering (ACE)"** — arXiv:2510.04618 (2025). Generator/Reflector/Curator playbook; documents **context collapse** and **brevity bias**, fixed by incremental delta-merge. See [agentic-context-engineering-ace](../concepts/agentic-context-engineering-ace.md). *Metrics are self-reported.*
- **[supported]** **Agrawal et al., "GEPA"** — arXiv:2507.19457 (2025). Reflective prompt evolution beats policy-gradient RL with far fewer rollouts. *Metrics are self-reported.*

## Reading this list against the cluster

The concept nodes are **engineering distillations**: they extract the *build decision* each result informs (externalize memory vs. enlarge the window; edit weights vs. retrieve; text vs. weights vs. activations). The papers establish the *phenomena, theorems, and limits*; the nodes add the *agent-building discipline*. Where a result is mean-field heuristic or disputed by a later paper, the node says so rather than overstating — per the repo's [evidence standard](../../AGENTS.md).
