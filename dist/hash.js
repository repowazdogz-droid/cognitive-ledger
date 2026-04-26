"use strict";
/**
 * Cognitive Ledger Protocol (CLP-2.0) — SHA-256 hashing and ID generation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENESIS_HASH = void 0;
exports.sha256 = sha256;
exports.hashEntry = hashEntry;
exports.canonicalStringify = canonicalStringify;
exports.v2HashPayload = v2HashPayload;
exports.hashEntryV2 = hashEntryV2;
exports.generateId = generateId;
const crypto_1 = require("crypto");
const GENESIS_HASH = "0".repeat(64);
exports.GENESIS_HASH = GENESIS_HASH;
function sha256(input) {
    return (0, crypto_1.createHash)("sha256").update(input, "utf8").digest("hex");
}
/**
 * CLP-1.0 hash for chain integrity: content + previousHash + timestamp.
 */
function hashEntry(content, previousHash, timestamp) {
    const payload = [content, previousHash, timestamp].join("\n");
    return sha256(payload);
}
function canonicalize(value) {
    if (Array.isArray(value))
        return value.map(canonicalize);
    if (value == null || typeof value !== "object")
        return value;
    const out = {};
    for (const key of Object.keys(value).sort()) {
        const item = value[key];
        if (item !== undefined)
            out[key] = canonicalize(item);
    }
    return out;
}
function canonicalStringify(value) {
    return JSON.stringify(canonicalize(value));
}
function v2HashPayload(entry) {
    return {
        schema_version: entry.schema_version ?? "2.0",
        hash_version: entry.hash_version ?? "entry-canonical-v2",
        id: entry.id,
        timestamp: entry.timestamp,
        domain: entry.domain,
        event_type: entry.event_type,
        content: entry.content,
        emotional_state: entry.emotional_state,
        energy_level: entry.energy_level,
        time_pressure: entry.time_pressure,
        stated_confidence: entry.stated_confidence,
        calibrated_confidence: entry.calibrated_confidence,
        outcome: entry.outcome,
        alternatives_considered: entry.alternatives_considered,
        assumptions: entry.assumptions,
        evidence_used: entry.evidence_used,
        detected_biases: entry.detected_biases,
        visibility: entry.visibility,
        previous_hash: entry.previous_hash,
        source: entry.source,
        reasoning_steps: entry.reasoning_steps,
        faithfulness: entry.faithfulness,
        trace_id: entry.trace_id,
        parent_entry_ids: entry.parent_entry_ids,
        external_evidence_hashes: entry.external_evidence_hashes,
    };
}
function hashEntryV2(entry) {
    return sha256(canonicalStringify(v2HashPayload(entry)));
}
function generateId() {
    const t = Date.now().toString(16);
    const r = (0, crypto_1.randomBytes)(4).toString("hex");
    return (t + r).slice(0, 16);
}
//# sourceMappingURL=hash.js.map