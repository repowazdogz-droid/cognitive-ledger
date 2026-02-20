# Cognitive Ledger Protocol (CLP-1.0)

Persistent cognitive profiling for humans and AI agents.

The Cognitive Ledger tracks how a person or agent thinks over time. Every decision, assumption, prediction, and reflection is recorded as a hash-chained entry with emotional context, confidence calibration, and evidence links. The system detects cognitive biases in real time, identifies reasoning patterns across entries, and generates prompts for what to think about next.

Clearpath traces individual decisions. The Cognitive Ledger traces the decision-maker.

## Why this exists

AI auditing tools verify what was decided. Nothing tracks how the person or agent making decisions is actually reasoning over time. When a surgeon makes their 50th decision, are they getting more accurate or more overconfident? When an AI agent has processed 1,000 cases, has its assumption pattern drifted? When a trader is fatigued at 2am, does their decision quality drop in ways they don't notice?

The Cognitive Ledger answers these questions. It is the missing layer between individual decision auditing and long-term reasoning accountability.

## What it does

Every entry records what was decided alongside how the decision was made: emotional state, energy level, time pressure, confidence, alternatives considered, assumptions made, and evidence used. Over time, this builds a complete picture of a person's or agent's reasoning.

Four capabilities:

**Bias detection** catches cognitive biases as they happen. Eight detectors run on every entry: overconfidence (checked against historical accuracy), confirmation bias (no alternatives with evidence cited), anchoring, recency bias, sunk cost reasoning, correlation-causation confusion, neglect of probability, and status quo bias.

**Pattern analysis** surfaces trends across entries. Recurring biases that appear three or more times. Strengths in domains where accuracy exceeds 80%. Blind spots where confidence is high but accuracy is low. Emotional triggers where specific states correlate with poor decisions. Growth patterns where self-corrections indicate active learning.

**Generative prompts** tell you what to think about next. Blind spot probes challenge your weakest domains. Assumption tests surface beliefs you have never verified. Emotional warnings flag when your current state historically leads to poor decisions. Review prompts suggest revisiting past decisions with known outcomes. Creation seeds combine your strengths with recent learning.

**Reasoning profiles** make thinking shareable and verifiable. Overall calibration (how well does your confidence match your accuracy). Domain-specific calibration. Best and worst emotional states for decision-making. Growth trajectory. Hash-chain verification proving nothing was modified.

## Install

```bash
npm install
npm run build
```

## Quick start

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
  source: "spine-case"
});

ledger.record({
  domain: "clinical",
  event_type: "prediction",
  content: "Patient will respond to injection within 3 weeks",
  emotional_state: "confident",
  energy_level: 0.8,
  time_pressure: 0.2,
  stated_confidence: 0.85,
  alternatives_considered: [],
  assumptions: ["Standard response timeline applies"],
  evidence_used: ["Historical case data"],
  source: "spine-case"
});

// Later, record what actually happened
ledger.recordOutcome(ledger.getEntries()[0].id, {
  result: "Patient showed improvement at 4 weeks",
  accuracy: 0.8,
  learned: "Timeline was slightly optimistic but approach was correct"
});

// Check for biases
ledger.getEntries().forEach(e => {
  if (e.detected_biases.length > 0) {
    console.log(e.content);
    e.detected_biases.forEach(b => console.log(" ", b.type, "-", b.suggestion));
  }
});

// What should I think about next?
ledger.getPrompts().forEach(p => {
  console.log("[" + p.prompt_type + "]", p.content);
});

// Shareable reasoning profile
const profile = ledger.getProfile();
console.log("Calibration:", profile.overall_calibration);
console.log("Growth:", profile.growth_trajectory);

// Verify integrity
console.log(ledger.verify());

// Human-readable summary
console.log(ledger.toMarkdown());
```

## Output

```
Staged approach: epidural injection first, surgery preserved
  confirmation - List at least one alternative interpretation before concluding.

[assumption_test] Verify or test these assumptions: Comorbidity interaction 
not yet verified; Standard response timeline applies

Calibration: 0.8
Growth: 0
Verify: { valid: true, entries_checked: 2 }
```

## Test

```bash
npm test
```

33 tests covering: core ledger operations, hash chain integrity, tamper detection, outcome recording, bias detection (confirmation, sunk cost, overconfidence, neglect of probability, false positive avoidance), pattern analysis (recurring bias, strength, blind spot, emotional trigger, growth), generative prompts, profile generation, JSON export/import roundtrip, markdown export, domain filtering, emotional state filtering, and source tracking.

## Bias detectors

| Bias | Trigger | Suggestion |
|------|---------|------------|
| Overconfidence | Confidence above 0.85 with historical accuracy below 0.7 | Review calibration against past outcomes |
| Confirmation | Evidence cited but no alternatives considered | List at least one alternative interpretation |
| Anchoring | Confidence clusters within 0.1 of first entry in domain | Reassess from a different starting point |
| Recency | 50%+ of assumptions reference recent events | Consider base rates and longer history |
| Sunk cost | Language like "already invested", "too far", "can't stop now" | Evaluate decision as if starting fresh |
| Correlation-causation | Causal language with only correlational evidence | Identify confounding variables |
| Neglect of probability | Very high confidence with no assumptions stated | State your assumptions explicitly |
| Status quo | 80%+ of recent decisions default to no change | Consider what would happen if you did change |

## Pattern types

| Pattern | Detection | Meaning |
|---------|-----------|---------|
| bias_recurring | Same bias in 3+ entries | A systematic reasoning tendency |
| strength | 80%+ accuracy over 5+ outcomes in a domain | Reliable expertise |
| blind_spot | High confidence, low accuracy in a domain | Dangerous overestimation |
| emotional_trigger | Emotional state correlated with 70%+ poor decisions | A state to be cautious in |
| growth | 3+ self-correction entries | Active learning and improvement |

## Schema

**LedgerEntry:** Hash-chained with SHA-256. Includes domain, event type (decision, assumption, prediction, reflection, correction, insight, creation), content, emotional state, energy level, time pressure, stated confidence, calibrated confidence, outcome, alternatives considered, assumptions, evidence used, detected biases, visibility (private, supervised, team, public), and source tool.

**CognitivePattern:** Detected from entry history. Tracks pattern type, description, occurrence count, severity, whether it is improving, and linked entry IDs.

**GenerativePrompt:** Produced by the generative engine. Six types: question, challenge, assumption test, blind spot probe, creation seed, review. Priority-sorted.

**ReasoningProfile:** Shareable with hash-chain integrity verification. Contains overall calibration, domain calibration, strengths, recurring biases with improvement tracking, best and worst emotional states for decisions, growth trajectory, and entry count.

## How it works

The Cognitive Ledger is a library, not a service. It runs locally. No server, no database, no external calls. It is the profiling layer that applications build on top of.

A clinical decision tool imports the Cognitive Ledger and every recommendation builds the surgeon's reasoning profile over time. An adaptive tutor imports the Cognitive Ledger and tracks how a student's misconceptions evolve. An AI agent framework imports the Cognitive Ledger and detects when agent reasoning has drifted from baseline.

The protocol is domain-agnostic. The profiling mechanism is identical. The stakes change.

## Relationship to Clearpath

Clearpath (CAP-1.0) audits individual decisions with tamper-evident traces. The Cognitive Ledger (CLP-1.0) profiles the decision-maker across decisions over time. They are complementary: Clearpath answers "was this decision auditable?" while the Cognitive Ledger answers "is this person's reasoning reliable?"

Together they form a complete trust stack: verify the decision AND verify the decision-maker.

## Status

- 33 tests passing
- TypeScript, zero external dependencies
- Part of the Omega reasoning infrastructure

## License

MIT
