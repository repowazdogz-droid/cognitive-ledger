/**
 * Cognitive Ledger Protocol (CLP-1.0) — type definitions.
 */

export type EmotionalState =
  | "calm"
  | "stressed"
  | "fatigued"
  | "energised"
  | "anxious"
  | "confident"
  | "uncertain"
  | "rushed"
  | "reflective"
  | "frustrated";

export type BiasType =
  | "anchoring"
  | "confirmation"
  | "overconfidence"
  | "availability"
  | "sunk_cost"
  | "framing"
  | "correlation_causation"
  | "authority"
  | "recency"
  | "neglect_of_probability"
  | "groupthink"
  | "status_quo"
  | "bandwagon"
  | "hindsight"
  | "dunning_kruger";

export type Domain =
  | "clinical"
  | "educational"
  | "technical"
  | "financial"
  | "interpersonal"
  | "creative"
  | "strategic"
  | "ethical"
  | "scientific"
  | "general";

export type Visibility = "private" | "supervised" | "team" | "public";

export type EventType =
  | "decision"
  | "assumption"
  | "prediction"
  | "reflection"
  | "correction"
  | "insight"
  | "creation";

export interface BiasDetection {
  type: BiasType;
  confidence: number;
  evidence: string;
  suggestion: string;
}

export interface LedgerEntryOutcome {
  result: string;
  accuracy: number;
  resolved_at: string;
  learned: string;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  domain: Domain;
  event_type: EventType;
  content: string;
  emotional_state: EmotionalState;
  energy_level: number;
  time_pressure: number;
  stated_confidence: number;
  calibrated_confidence?: number;
  outcome?: LedgerEntryOutcome;
  alternatives_considered: string[];
  assumptions: string[];
  evidence_used: string[];
  detected_biases: BiasDetection[];
  visibility: Visibility;
  hash: string;
  previous_hash: string;
  source?: string;
}

export interface CognitivePattern {
  id: string;
  pattern_type:
    | "bias_recurring"
    | "strength"
    | "blind_spot"
    | "growth"
    | "emotional_trigger"
    | "domain_transfer";
  description: string;
  first_detected: string;
  occurrences: number;
  last_seen: string;
  severity: number;
  improving: boolean;
  entries: string[];
}

export interface GenerativePrompt {
  id: string;
  timestamp: string;
  prompt_type:
    | "question"
    | "challenge"
    | "assumption_test"
    | "blind_spot_probe"
    | "creation_seed"
    | "review";
  content: string;
  reasoning: string;
  based_on: string[];
  priority: number;
}

export interface ReasoningProfile {
  person_id: string;
  generated_at: string;
  entry_count: number;
  domains_active: Domain[];
  strengths: string[];
  recurring_biases: {
    type: BiasType;
    frequency: number;
    improving: boolean;
  }[];
  overall_calibration: number;
  domain_calibration: { domain: Domain; calibration: number }[];
  best_decisions_made_when: EmotionalState[];
  worst_decisions_made_when: EmotionalState[];
  growth_trajectory: number;
  total_corrections: number;
  total_insights: number;
  hash: string;
  verification: { valid: boolean; entries_checked: number };
}

export interface EntryInput {
  domain: Domain;
  event_type: EventType;
  content: string;
  emotional_state: EmotionalState;
  energy_level: number;
  time_pressure: number;
  stated_confidence: number;
  alternatives_considered?: string[];
  assumptions?: string[];
  evidence_used?: string[];
  visibility?: Visibility;
  source?: string;
}

export interface OutcomeInput {
  result: string;
  accuracy: number;
  resolved_at: string;
  learned: string;
}
