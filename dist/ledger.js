"use strict";
/**
 * Cognitive Ledger Protocol (CLP-2.0) — main CognitiveLedger class.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitiveLedger = void 0;
const bias_detector_1 = require("./bias-detector");
const generative_engine_1 = require("./generative-engine");
const hash_1 = require("./hash");
const pattern_analyser_1 = require("./pattern-analyser");
const profile_generator_1 = require("./profile-generator");
const reasoning_1 = require("./reasoning");
const verify_1 = require("./verify");
const migration_1 = require("./migration");
function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}
const PATTERN_ANALYSIS_INTERVAL = 5;
function defaultFaithfulnessCertification() {
    return {
        status: "not_assessed",
        method: "unverified",
        method_version: "clp-2.0",
        certified_at: new Date().toISOString(),
    };
}
class CognitiveLedger {
    constructor(personId) {
        this._entries = [];
        this._patterns = [];
        this._personId = personId;
    }
    record(input) {
        const timestamp = new Date().toISOString();
        const previous_hash = this._entries.length === 0
            ? hash_1.GENESIS_HASH
            : this._entries[this._entries.length - 1].hash;
        const energy_level = clamp01(input.energy_level);
        const time_pressure = clamp01(input.time_pressure);
        const stated_confidence = clamp01(input.stated_confidence);
        const entry = {
            schema_version: "2.0",
            hash_version: "entry-canonical-v2",
            id: (0, hash_1.generateId)(),
            timestamp,
            domain: input.domain,
            event_type: input.event_type,
            content: input.content,
            emotional_state: input.emotional_state,
            energy_level,
            time_pressure,
            stated_confidence,
            alternatives_considered: input.alternatives_considered ?? [],
            assumptions: input.assumptions ?? [],
            evidence_used: input.evidence_used ?? [],
            detected_biases: [],
            visibility: input.visibility ?? "private",
            hash: "",
            previous_hash,
            source: input.source,
            reasoning_steps: (0, reasoning_1.normalizeReasoningSteps)(input.reasoning_steps ?? []),
            faithfulness: input.faithfulness ?? defaultFaithfulnessCertification(),
            trace_id: input.trace_id,
            parent_entry_ids: input.parent_entry_ids ?? [],
            external_evidence_hashes: input.external_evidence_hashes ?? [],
        };
        entry.detected_biases = (0, bias_detector_1.detectBiases)(entry, this._entries);
        entry.hash = (0, hash_1.hashEntryV2)(entry);
        this._entries.push(entry);
        if (this._entries.length % PATTERN_ANALYSIS_INTERVAL === 0) {
            this._patterns = (0, pattern_analyser_1.analysePatterns)(this._entries, this._patterns);
        }
        return entry;
    }
    rehashV2Chain() {
        let previousHash = hash_1.GENESIS_HASH;
        for (const entry of this._entries) {
            if (entry.hash_version !== "entry-canonical-v2") {
                previousHash = entry.hash;
                continue;
            }
            entry.previous_hash = previousHash;
            entry.hash = (0, hash_1.hashEntryV2)(entry);
            previousHash = entry.hash;
        }
    }
    recordOutcome(entryId, outcome) {
        const idx = this._entries.findIndex((e) => e.id === entryId);
        if (idx < 0)
            return null;
        const entry = this._entries[idx];
        const accuracy = clamp01(outcome.accuracy);
        entry.outcome = {
            result: outcome.result,
            accuracy,
            resolved_at: outcome.resolved_at,
            learned: outcome.learned,
        };
        const withOutcomes = this._entries.filter((e) => e.outcome != null);
        if (withOutcomes.length >= 5) {
            const recent = withOutcomes.slice(-10);
            const avgAccuracy = recent.reduce((s, e) => s + (e.outcome.accuracy ?? 0), 0) /
                recent.length;
            for (const e of recent) {
                e.calibrated_confidence = clamp01((e.calibrated_confidence ?? e.stated_confidence) * 0.7 + avgAccuracy * 0.3);
            }
        }
        this.rehashV2Chain();
        this._patterns = (0, pattern_analyser_1.analysePatterns)(this._entries, this._patterns);
        return entry;
    }
    getPrompts() {
        this._patterns = (0, pattern_analyser_1.analysePatterns)(this._entries, this._patterns);
        return (0, generative_engine_1.generatePrompts)(this._entries, this._patterns);
    }
    getProfile() {
        this._patterns = (0, pattern_analyser_1.analysePatterns)(this._entries, this._patterns);
        return (0, profile_generator_1.generateProfile)(this._personId, this._entries, this._patterns);
    }
    getPatterns() {
        this._patterns = (0, pattern_analyser_1.analysePatterns)(this._entries, this._patterns);
        return this._patterns;
    }
    verify() {
        return (0, verify_1.verifyChain)(this._entries);
    }
    getEntries() {
        return this._entries;
    }
    getEntriesByDomain(domain) {
        return this._entries.filter((e) => e.domain === domain);
    }
    getEntriesByState(state) {
        return this._entries.filter((e) => e.emotional_state === state);
    }
    get personId() {
        return this._personId;
    }
    toJSON() {
        return JSON.stringify({
            personId: this._personId,
            entries: this._entries,
            patterns: this._patterns,
        });
    }
    static fromJSON(json) {
        const data = JSON.parse(json);
        const ledger = new CognitiveLedger(data.personId);
        ledger._entries = data.entries ?? [];
        ledger._patterns = data.patterns ?? [];
        return ledger;
    }
    static migrateV1JSONToV2(json) {
        const data = (0, migration_1.migrateV1LedgerJSONToV2)(json);
        const ledger = new CognitiveLedger(data.personId);
        ledger._entries = data.entries;
        ledger._patterns = data.patterns;
        return ledger;
    }
    toMarkdown() {
        const profile = this.getProfile();
        const prompts = this.getPrompts();
        const lines = [
            `# Cognitive Ledger — ${this._personId}`,
            `Generated: ${profile.generated_at}`,
            `Entries: ${profile.entry_count}`,
            "",
            "## Calibration",
            `Overall: ${(profile.overall_calibration * 100).toFixed(0)}%`,
            ...profile.domain_calibration.map((d) => `- ${d.domain}: ${(d.calibration * 100).toFixed(0)}%`),
            "",
            "## Strengths",
            ...profile.strengths.map((s) => `- ${s}`),
            "",
            "## Recurring biases",
            ...profile.recurring_biases.map((b) => `- ${b.type} (${b.frequency}x, improving: ${b.improving})`),
            "",
            "## Emotional patterns",
            `Best decisions when: ${profile.best_decisions_made_when.join(", ") || "—"}`,
            `Worst decisions when: ${profile.worst_decisions_made_when.join(", ") || "—"}`,
            "",
            "## Growth",
            `Trajectory: ${(profile.growth_trajectory * 100).toFixed(0)}% | Corrections: ${profile.total_corrections} | Insights: ${profile.total_insights}`,
            "",
            "## Faithfulness",
            `Assessed: ${profile.faithfulness_summary?.assessed_entries ?? 0} | Certified: ${profile.faithfulness_summary?.certified_entries ?? 0} | Rejected: ${profile.faithfulness_summary?.rejected_entries ?? 0}`,
            "",
            "## Top 5 prompts",
            ...prompts.slice(0, 5).map((p) => `- [${p.prompt_type}] ${p.content}`),
            "",
            `Verification: ${profile.verification.valid ? "Valid" : "Invalid"} (${profile.verification.entries_checked} entries)`,
        ];
        return lines.join("\n");
    }
}
exports.CognitiveLedger = CognitiveLedger;
//# sourceMappingURL=ledger.js.map