/**
 * Cognitive Ledger Protocol (CLP-2.0) — type definitions.
 */
export type EmotionalState = "calm" | "stressed" | "fatigued" | "energised" | "anxious" | "confident" | "uncertain" | "rushed" | "reflective" | "frustrated";
export type BiasType = "anchoring" | "confirmation" | "overconfidence" | "availability" | "sunk_cost" | "framing" | "correlation_causation" | "authority" | "recency" | "neglect_of_probability" | "groupthink" | "status_quo" | "bandwagon" | "hindsight" | "dunning_kruger";
export type Domain = "clinical" | "educational" | "technical" | "financial" | "interpersonal" | "creative" | "strategic" | "ethical" | "scientific" | "general";
export type Visibility = "private" | "supervised" | "team" | "public";
export type EventType = "decision" | "assumption" | "prediction" | "reflection" | "correction" | "insight" | "creation";
export type SchemaVersion = "1.0" | "2.0";
export type HashVersion = "content-chain-v1" | "entry-canonical-v2";
export type ReasoningStepKind = "premise" | "observation" | "assumption" | "inference" | "calculation" | "tool_result" | "counterfactual" | "conclusion" | "reflection";
export type ReasoningValueType = "text" | "boolean" | "number" | "probability" | "quantity" | "money" | "duration" | "date" | "category" | "evidence_ref" | "decision";
export type ReasoningOperationType = "assert" | "observe" | "assume" | "infer" | "calculate" | "retrieve" | "compare" | "transform" | "conclude" | "reflect";
export type FaithfulnessStatus = "not_assessed" | "self_reported" | "evidence_linked" | "typed_checked" | "certified" | "rejected";
export type FaithfulnessCertificationMethod = "structural_check" | "external_verifier" | "consensus" | "unverified";
export interface ReasoningTypecheck {
    valid: boolean;
    errors: string[];
    signature: string;
}
export interface ReasoningStep {
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
    typecheck: ReasoningTypecheck;
}
export interface FaithfulnessCertificationMetrics {
    coverage?: number;
    evidence_validity_rate?: number;
    unit_validity_ratio?: number;
    path_exists?: boolean;
    minimal_path_size?: number;
}
export interface FaithfulnessCertificationGate {
    name: string;
    passed: boolean;
    thresholds: Record<string, number | boolean>;
}
export interface FaithfulnessCertification {
    status: FaithfulnessStatus;
    method: FaithfulnessCertificationMethod;
    method_version: string;
    certified_at: string;
    metrics?: FaithfulnessCertificationMetrics;
    gate?: FaithfulnessCertificationGate;
    certificate_hash?: string;
    certifier?: string;
    notes?: string;
}
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
    schema_version?: SchemaVersion;
    hash_version?: HashVersion;
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
    reasoning_steps?: ReasoningStep[];
    faithfulness?: FaithfulnessCertification;
    trace_id?: string;
    parent_entry_ids?: string[];
    external_evidence_hashes?: string[];
}
export interface CognitivePattern {
    id: string;
    pattern_type: "bias_recurring" | "strength" | "blind_spot" | "growth" | "emotional_trigger" | "domain_transfer";
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
    prompt_type: "question" | "challenge" | "assumption_test" | "blind_spot_probe" | "creation_seed" | "review";
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
    domain_calibration: {
        domain: Domain;
        calibration: number;
    }[];
    best_decisions_made_when: EmotionalState[];
    worst_decisions_made_when: EmotionalState[];
    growth_trajectory: number;
    total_corrections: number;
    total_insights: number;
    faithfulness_summary?: {
        assessed_entries: number;
        certified_entries: number;
        rejected_entries: number;
        average_coverage?: number;
        average_evidence_validity_rate?: number;
        average_unit_validity_ratio?: number;
    };
    hash: string;
    verification: {
        valid: boolean;
        entries_checked: number;
    };
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
    reasoning_steps?: ReasoningStep[];
    faithfulness?: FaithfulnessCertification;
    trace_id?: string;
    parent_entry_ids?: string[];
    external_evidence_hashes?: string[];
}
export interface OutcomeInput {
    result: string;
    accuracy: number;
    resolved_at: string;
    learned: string;
}
//# sourceMappingURL=types.d.ts.map