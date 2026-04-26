# 1. CURRENT STATE.

CLP-1.0 is a local TypeScript library for persistent cognitive profiling. It records decisions, assumptions, predictions, reflections, corrections, insights, and creation events as hash-chained `LedgerEntry` records, then derives bias detections, longitudinal patterns, generative prompts, and shareable `ReasoningProfile` summaries. The package metadata exposes `dist/index.js` and `dist/index.d.ts`, ships source under `src/`, and describes the project as "persistent cognitive profiling, bias detection, reasoning patterns."

The current schema is compact and operational: `LedgerEntry` stores domain, event type, content, emotional state, energy level, time pressure, stated/calibrated confidence, optional outcome accuracy, alternatives, assumptions, evidence links, detected biases, visibility, source, hash, and previous hash. `BiasDetection`, `CognitivePattern`, `GenerativePrompt`, and `ReasoningProfile` are derived structures. Hash verification currently recomputes each entry from `content`, `previous_hash`, and `timestamp`, so integrity covers the narrative content and chain position but not every structured field.

The README positions CLP against Clearpath: Clearpath audits individual decisions, while CLP profiles the decision-maker across decisions over time. Tests cover ledger creation, clamping, chain integrity, tamper detection, outcome recording, bias detection, pattern analysis, prompts, profiles, JSON roundtrip, markdown export, filtering, and source tracking. The codebase has `node_modules`, `dist`, a Jest config, TypeScript strict mode, and release notes for `1.0.1` stating no protocol schema or runtime semantics were intentionally changed.

# 2. RESEARCH LANDSCAPE (2025-2026).

Recent faithfulness research strengthens the case that CLP should not frame raw chain-of-thought text as ground truth. 2025 work on parametric faithfulness, including Faithfulness by Unlearning Reasoning Steps (FUR), treats reasoning steps as candidates for causal testing rather than explanations to be accepted at face value. The key design lesson is that plausibility and faithfulness diverge: human-readable steps can look reasonable while failing to identify what actually drove a model's answer.

Other 2025 work moves from measurement toward intervention. FRIT-style approaches generate faithful/unfaithful reasoning pairs through step interventions, then train models to prefer causally consistent reasoning. FaithAct-style multimodal work separates behavioral faithfulness from perceptual faithfulness and enforces step-level evidence checks before allowing reasoning to proceed. The shared pattern is step-level verification, not post-hoc narrative trust.

The strongest fit for CLP v2 is PC-CoT, arXiv:2510.01069, "Typed Chain-of-Thought: A Curry-Howard Framework for Verifying LLM Reasoning." It proposes Proof-Carrying Chain-of-Thought with typed natural-language steps, Typed Faithfulness Certificates, and Typed Reasoning Graphs. A TRG is a bipartite multigraph of typed statement nodes and rule nodes, with edges encoding typed dataflow from premises through operations to conclusions. Certification metrics include coverage, evidence validity rate, unit validity ratio, path existence, and minimal path size. The reported strict gate reaches 91.6% run-level precision on certified GSM8K runs, versus 42.4% for rejected runs, making type certification a useful precision filter rather than a blanket guarantee.

2026 agent accountability writing converges on the same operational stance: audit trails need structured records, correlation/trace identifiers, input/output hashes, identity, delegation, policy checks, and human gates. Self-reported reasoning should be treated as advisory context unless backed by verifiable structure. For CLP, this means a v2 schema should distinguish "the actor stated this rationale" from "this step is typed, evidence-linked, and certified under an explicit gate."

# 3. SCHEMA DECISION.

CLP-2.0 should add a faithfulness layer, not replace the existing cognitive ledger. The core ledger remains a longitudinal record of decisions and reasoning behavior; v2 adds optional typed reasoning evidence that can be verified, scored, and framed honestly.

The schema decision is to introduce a `faithfulness` object on each ledger entry and a `reasoning_steps` array whose elements are explicitly typed. This keeps CLP-1.0 entries usable while allowing higher-assurance entries to carry PC-CoT-inspired certificates. The v2 public claim should be: CLP records cognitive behavior over time and can mark which reasoning traces have typed support. It should not claim to reveal a model's internal reasoning process.

Certification should be local and transparent. Each certification result must name its method, version, gate, metrics, and status. A failed or absent certificate should not invalidate the ledger entry; it should lower the faithfulness status of the reasoning trace. Outcome accuracy, bias detection, and calibration remain separate from faithfulness certification because a faithful trace can still be wrong, and an unfaithful trace can still lead to a correct answer.

# 4. PROPOSED SCHEMA CHANGES.

Add these v2 types conceptually:

```ts
type ReasoningStepKind =
  | "premise"
  | "observation"
  | "assumption"
  | "inference"
  | "calculation"
  | "tool_result"
  | "counterfactual"
  | "conclusion"
  | "reflection";

type ReasoningValueType =
  | "text"
  | "boolean"
  | "number"
  | "probability"
  | "quantity"
  | "money"
  | "duration"
  | "date"
  | "category"
  | "evidence_ref"
  | "decision";

type FaithfulnessStatus =
  | "not_assessed"
  | "self_reported"
  | "evidence_linked"
  | "typed_checked"
  | "certified"
  | "rejected";
```

Extend `LedgerEntry` with optional fields:

```ts
reasoning_steps?: ReasoningStep[];
faithfulness?: FaithfulnessAssessment;
trace_id?: string;
parent_entry_ids?: string[];
external_evidence_hashes?: string[];
```

Define `ReasoningStep` as a typed, addressable unit:

```ts
interface ReasoningStep {
  id: string;
  index: number;
  kind: ReasoningStepKind;
  statement: string;
  value_type: ReasoningValueType;
  value?: string | number | boolean;
  unit?: string;
  depends_on: string[];
  evidence_refs: string[];
  rule?: string;
  rule_signature?: string;
  typecheck: {
    valid: boolean;
    errors: string[];
  };
}
```

Define `FaithfulnessAssessment` as explicit certification metadata:

```ts
interface FaithfulnessAssessment {
  status: FaithfulnessStatus;
  method: "none" | "manual" | "evidence_link" | "typed_reasoning_graph" | "external";
  method_version: string;
  assessed_at: string;
  metrics?: {
    coverage?: number;
    evidence_validity_rate?: number;
    unit_validity_ratio?: number;
    path_exists?: boolean;
    minimal_path_size?: number;
  };
  gate?: {
    name: string;
    passed: boolean;
    thresholds: Record<string, number | boolean>;
  };
  certificate_hash?: string;
  assessor?: string;
  notes?: string;
}
```

Add `ReasoningProfile` aggregates without merging them into accuracy calibration:

```ts
faithfulness_summary?: {
  assessed_entries: number;
  certified_entries: number;
  rejected_entries: number;
  average_coverage?: number;
  average_evidence_validity_rate?: number;
  average_unit_validity_ratio?: number;
};
```

Hashing should be upgraded in v2 to canonicalize and hash the full integrity-bearing entry payload, not only `content`, `previous_hash`, and `timestamp`. For compatibility, this can be introduced as `schema_version: "2.0"` plus `hash_version: "entry-canonical-v2"` while preserving v1 verification for existing entries.

# 5. PUBLIC FRAMING UPDATE.

The README and package description should move from "tracks how a person or agent thinks" toward "records structured evidence about reasoning behavior over time." That is still strong, but it avoids implying direct access to hidden cognition or model internals.

Suggested public framing:

> Cognitive Ledger Protocol (CLP-2.0) is a local, tamper-evident ledger for longitudinal reasoning accountability. It records decisions, assumptions, outcomes, context, and optional typed reasoning steps, then separates three signals: outcome accuracy, behavioral patterns, and faithfulness evidence.

Suggested faithfulness framing:

> CLP-2.0 does not assume that a stated rationale is faithful. A rationale starts as self-reported. It can be upgraded when steps are evidence-linked, type-checked, or certified through a typed reasoning graph. Certification is a verifiable support signal, not proof of inner cognition.

Suggested Clearpath relationship:

> Clearpath audits a decision trace. CLP audits the reasoner over time. When connected, Clearpath supplies event-level provenance and CLP supplies longitudinal calibration, bias, pattern, and faithfulness summaries.

# 6. CROSS-PROTOCOL RELATIONSHIPS.

Clearpath/CAP should remain the event-level decision audit partner. A CLP entry can reference a Clearpath decision trace by `source`, `trace_id`, or an explicit external evidence hash. CAP answers whether the specific decision path was captured and tamper-evident; CLP answers whether the actor's long-run reasoning pattern is calibrated, biased, improving, or faithfulness-certified.

PC-CoT should be treated as a certification inspiration, not a dependency. CLP can store typed steps and TRG-like metrics without implementing the full PC-CoT pipeline in v2. If a future `@omega/pc-cot` package exists, CLP should accept its certificate output through `FaithfulnessAssessment` rather than baking one verifier into the ledger core.

Agent accountability protocols should connect through trace and authority fields. CLP should be able to reference action logs, tool-call receipts, approval gates, delegation chains, and policy decisions while avoiding responsibility for storing all operational telemetry. CLP is the cognitive profile; external audit ledgers are the operational substrate.

OMEGA protocol framing should present CLP-2.0 as the longitudinal reasoning-accountability layer in a broader trust stack: event provenance, typed reasoning evidence, cognitive pattern analysis, and public/private profile export.

# 7. IMPLEMENTATION SCOPE.

Minimal v2 implementation scope:

- Add `schema_version`, `hash_version`, optional `reasoning_steps`, optional `faithfulness`, optional `trace_id`, optional `parent_entry_ids`, and optional `external_evidence_hashes` to entry types and inputs.
- Add faithfulness summary fields to generated profiles.
- Add canonical v2 entry hashing while keeping v1 verification for old serialized ledgers.
- Add tests for JSON roundtrip, v1 compatibility, v2 canonical hash tamper detection, typed-step storage, faithfulness summary aggregation, and markdown/profile rendering.
- Update README/package framing after the schema lands.

Out of scope for first v2:

- Full TRG construction engine.
- Model-parametric faithfulness tests such as unlearning/intervention.
- Multimodal perceptual grounding.
- Agent identity, delegation credentials, approval-token infrastructure, or external audit storage.
- Claims that CLP proves hidden model cognition.

# 8. RECOMMENDATION one-line.

Ship CLP-2.0 as a backwards-compatible faithfulness-aware schema: keep the ledger simple, add optional typed reasoning steps and explicit certification metadata, and publicly frame certification as typed support rather than proof of inner thought.
