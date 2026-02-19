# Cognitive Ledger Protocol (CLP-1.0)

Persistent cognitive profiling: track how a person thinks over time, detect biases, surface patterns, and generate prompts for what to think about next.

Part of the Omega reasoning infrastructure. Clearpath traces individual decisions; the Cognitive Ledger traces the person.

## Install

```bash
npm install
npm run build
```

## Quick start

```javascript
const { CognitiveLedger } = require("./dist/index");

const ledger = new CognitiveLedger("user-1");

ledger.record({
  domain: "clinical",
  event_type: "decision",
  content: "Proceed with staged approach.",
  emotional_state: "calm",
  energy_level: 0.7,
  time_pressure: 0.3,
  stated_confidence: 0.75,
  alternatives_considered: ["Immediate surgery", "Extended conservative"],
  assumptions: ["No comorbidity interaction"],
  evidence_used: ["MRI", "history"],
});

const profile = ledger.getProfile();
const prompts = ledger.getPrompts();
console.log(ledger.toMarkdown());
```

## Test

```bash
npm test
```

33 tests: core, integrity, outcomes, bias detection, patterns, generative prompts, profile, export/import, filtering, source tracking.

## Schema

- **LedgerEntry** — hash-chained; includes emotional_state, energy_level, time_pressure, stated_confidence, outcome, detected_biases.
- **CognitivePattern** — bias_recurring, strength, blind_spot, emotional_trigger, growth.
- **ReasoningProfile** — shareable profile with calibration, strengths, recurring biases, best/worst emotional states, growth trajectory, verification.

Zero external dependencies (Node.js `crypto` only). TypeScript strict mode.

## License

MIT
