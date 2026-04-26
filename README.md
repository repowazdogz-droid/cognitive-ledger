# Cognitive Ledger Protocol (CLP-2.0)

Local, tamper-evident reasoning accountability for humans and AI agents.

CLP records structured evidence about reasoning behavior over time. Every entry is hash-chained and can include decisions, assumptions, outcomes, context, typed reasoning steps, and record-level faithfulness certification metadata. CLP separates three signals that are often confused: outcome accuracy, longitudinal reasoning patterns, and faithfulness evidence.

Clearpath audits a decision trace. CLP audits the reasoner over time.

## CLP-2.0

CLP-2.0 adds a faithfulness-aware schema inspired by PC-CoT: "Typed Chain-of-Thought: A Curry-Howard Framework for Verifying LLM Reasoning", arXiv:2510.01069.

The protocol does not assume that a stated rationale is faithful. A rationale starts as self-reported or unverified. It can be upgraded when its steps are structurally checked, externally verified, or certified by consensus. Certification is a verifiable support signal, not proof of hidden cognition.

New in 2.0:

- Typed reasoning steps with explicit input types, output types, operation types, rule schemas, dependencies, evidence references, and runtime typecheck metadata.
- Record-level `FaithfulnessCertification`, separate from event-level or per-node audit protocols.
- `schema_version` and `hash_version` on entries.
- Canonical v2 entry hashing over the full integrity-bearing payload, including reasoning step types and faithfulness certification.
- Dual-mode verification for legacy CLP-1.x chains and new CLP-2.0 chains.
- Migration helpers for reading valid v1 chains into v2 entries.

## Install

```bash
npm install
npm run build
```

## Quick Start

```javascript
const { CognitiveLedger } = require("./dist/index");

const ledger = new CognitiveLedger("surgeon-1");

ledger.record({
  domain: "clinical",
  event_type: "decision",
  content: "Staged approach: epidural injection first, surgery preserved",
  emotional_state: "calm",
  energy_level: 0.7,
  time_pressure: 0.5,
  stated_confidence: 0.71,
  alternatives_considered: ["Immediate microdiscectomy", "Extended conservative"],
  assumptions: ["Comorbidity interaction not yet verified"],
  evidence_used: ["MRI imaging", "Clinical notes 12wk"],
  source: "spine-case",
  trace_id: "clearpath:case-123",
  external_evidence_hashes: ["sha256:mri-report-hash"],
  reasoning_steps: [
    {
      id: "step-1",
      index: 0,
      kind: "premise",
      statement: "MRI evidence supports staged treatment.",
      input_type: [],
      output_type: "text",
      operation_type: "assert",
      value: "MRI evidence supports staged treatment.",
      depends_on: [],
      evidence_refs: ["sha256:mri-report-hash"],
      rule_schema: "pc-cot/assert/v1",
      typecheck: { valid: false, errors: [], signature: "" }
    },
    {
      id: "step-2",
      index: 1,
      kind: "conclusion",
      statement: "Proceed with staged treatment.",
      input_type: ["text"],
      output_type: "decision",
      operation_type: "conclude",
      value: "Proceed with staged treatment.",
      depends_on: ["step-1"],
      evidence_refs: ["sha256:mri-report-hash"],
      rule_schema: "pc-cot/conclude/v1",
      typecheck: { valid: false, errors: [], signature: "" }
    }
  ],
  faithfulness: {
    status: "typed_checked",
    method: "structural_check",
    method_version: "clp-2.0",
    certified_at: new Date().toISOString(),
    metrics: {
      coverage: 1,
      evidence_validity_rate: 1,
      unit_validity_ratio: 1,
      path_exists: true,
      minimal_path_size: 2
    },
    gate: {
      name: "local-typed-step-check",
      passed: true,
      thresholds: { coverage: 1, path_exists: true }
    }
  }
});

const entry = ledger.getEntries()[0];
console.log(entry.schema_version); // "2.0"
console.log(entry.hash_version);   // "entry-canonical-v2"
console.log(entry.reasoning_steps[0].typecheck.valid); // true
console.log(ledger.verify());      // { valid: true, entries_checked: 1, ... }
```

## Typed Reasoning Steps

Each `ReasoningStep` is an addressable typed unit:

```typescript
interface ReasoningStep {
  id: string;
  index: number;
  kind: ReasoningStepKind;
  statement: string;
  input_type: ReasoningValueType[];
  output_type: ReasoningValueType;
  operation_type: ReasoningOperationType;
  value?: string | number | boolean;
  unit?: string;
  depends_on: string[];
  evidence_refs: string[];
  rule_schema: string;
  rule_signature?: string;
  typecheck: {
    valid: boolean;
    errors: string[];
    signature: string;
  };
}
```

Supported value types include `text`, `boolean`, `number`, `probability`, `quantity`, `money`, `duration`, `date`, `category`, `evidence_ref`, and `decision`.

Supported operation types include `assert`, `observe`, `assume`, `infer`, `calculate`, `retrieve`, `compare`, `transform`, `conclude`, and `reflect`. Each operation references a rule schema such as `pc-cot/infer/v1` or `pc-cot/conclude/v1`.

Runtime validation checks:

- Required IDs, indexes, statements, dependencies, evidence references, and rule schemas.
- Whether input and output types are known.
- Whether the operation's rule schema matches the operation.
- Whether the operation has enough inputs.
- Whether the operation can produce the declared output type.
- Whether the optional value matches the declared output type.
- Whether dependencies exist and point to earlier steps.

`record()` normalizes supplied steps and writes fresh `typecheck` metadata. `verifyChain()` also re-validates v2 reasoning steps at verification time.

## Faithfulness Certification

`FaithfulnessCertification` is record-level metadata. It is intentionally separate from CAP or Clearpath-style per-event/per-node faithfulness.

Supported methods:

- `structural_check`: local typed-step and graph-shape checks.
- `external_verifier`: an external verifier produced the certificate.
- `consensus`: multiple assessors or verifiers agreed.
- `unverified`: no certification has been performed.

Supported statuses:

- `not_assessed`
- `self_reported`
- `evidence_linked`
- `typed_checked`
- `certified`
- `rejected`

Profile generation includes a `faithfulness_summary` with assessed, certified, and rejected entry counts plus average coverage, evidence validity, and unit validity metrics when available.

## Hashing And Verification

CLP-1.x used a compact hash payload:

```text
content + previous_hash + timestamp
```

CLP-2.0 uses canonical JSON over the full integrity-bearing entry payload:

- schema and hash version
- entry identity and timestamp
- domain, event type, content, state, energy, pressure, and confidence
- calibrated confidence and outcome
- alternatives, assumptions, evidence, detected biases, visibility, and source
- previous hash
- typed reasoning steps, including input/output/operation types and typecheck metadata
- record-level faithfulness certification
- trace IDs, parent entry IDs, and external evidence hashes

New entries use:

```text
schema_version: "2.0"
hash_version: "entry-canonical-v2"
```

Legacy entries without a v2 hash marker are verified using the v1 hash. `verifyChain(entries)` runs in automatic dual mode. You can force a mode with `verifyChain(entries, { mode: "v1" })` or `verifyChain(entries, { mode: "v2" })`.

## Migration From CLP-1.x

CLP-2.0 can read existing v1 JSON with `CognitiveLedger.fromJSON(json)` and verify it in automatic legacy mode.

To convert a valid v1 chain into v2 entries:

```javascript
const {
  CognitiveLedger,
  migrateV1LedgerJSONToV2,
  verifyChain
} = require("./dist/index");

const migrated = migrateV1LedgerJSONToV2(v1Json);
console.log(migrated.verified_legacy); // true
console.log(verifyChain(migrated.entries, { mode: "v2" }));

const ledger = CognitiveLedger.migrateV1JSONToV2(v1Json);
console.log(ledger.verify());
```

Migration verifies the v1 chain first, then re-hashes entries with the v2 canonical payload. Migrated entries receive `method: "unverified"` faithfulness metadata because CLP-1.x did not store record-level certification.

## Bias And Pattern Analysis

CLP still includes the CLP-1.x profiling layer:

- Bias detection: overconfidence, confirmation, anchoring, recency, sunk cost, correlation-causation confusion, neglect of probability, and status quo.
- Pattern analysis: recurring biases, strengths, blind spots, emotional triggers, growth patterns, and domain transfer.
- Generative prompts: questions, challenges, assumption tests, blind spot probes, creation seeds, and reviews.
- Reasoning profiles: calibration, domain calibration, recurring biases, emotional patterns, growth trajectory, faithfulness summary, and chain verification.

## Relationship To Clearpath

Clearpath/CAP audits an individual decision trace. CLP audits the reasoner across decisions over time. A CLP entry can reference an external decision trace through `source`, `trace_id`, or `external_evidence_hashes`.

Together they form a trust stack: event provenance, typed reasoning evidence, cognitive pattern analysis, and profile export.

## Design Reference

The local design note for this release is `V2_DESIGN.md`.

PC-CoT is treated as design inspiration, not a runtime dependency. CLP stores typed steps and certificate metadata, but it does not implement a full typed reasoning graph engine or claim to prove hidden model cognition.

## Test

```bash
npm test
```

The suite covers core ledger operations, v1 and v2 hash verification, tamper detection, typed reasoning step round-trip, runtime type signature validation, faithfulness certification methods, migration from v1 to v2, outcome recording, bias detection, pattern analysis, prompts, profiles, JSON import/export, markdown export, filtering, and source tracking.

## Status

- CLP-2.0 schema and runtime.
- TypeScript, local-only library.
- No server, database, or external runtime calls.
- Part of the Omega reasoning infrastructure.

## License

MIT
