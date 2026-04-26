"use strict";
/**
 * Cognitive Ledger Protocol (CLP-2.0) — migration helpers for v1 ledgers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateV1EntryToV2 = migrateV1EntryToV2;
exports.migrateV1ChainToV2 = migrateV1ChainToV2;
exports.migrateV1LedgerJSONToV2 = migrateV1LedgerJSONToV2;
const hash_1 = require("./hash");
const reasoning_1 = require("./reasoning");
const verify_1 = require("./verify");
function defaultUnverifiedFaithfulness(certifiedAt) {
    return {
        status: "not_assessed",
        method: "unverified",
        method_version: "clp-2.0-migration",
        certified_at: certifiedAt,
        notes: "Migrated from CLP-1.x without record-level faithfulness certification.",
    };
}
function migrateV1EntryToV2(entry, previousHash = entry.previous_hash) {
    const migrated = {
        ...entry,
        schema_version: "2.0",
        hash_version: "entry-canonical-v2",
        previous_hash: previousHash,
        reasoning_steps: (0, reasoning_1.normalizeReasoningSteps)(entry.reasoning_steps ?? []),
        faithfulness: entry.faithfulness ?? defaultUnverifiedFaithfulness(entry.timestamp),
        parent_entry_ids: entry.parent_entry_ids ?? [],
        external_evidence_hashes: entry.external_evidence_hashes ?? [],
        hash: "",
    };
    migrated.hash = (0, hash_1.hashEntryV2)(migrated);
    return migrated;
}
function migrateV1ChainToV2(entries) {
    let previousHash = hash_1.GENESIS_HASH;
    return entries.map((entry) => {
        const migrated = migrateV1EntryToV2(entry, previousHash);
        previousHash = migrated.hash;
        return migrated;
    });
}
function migrateV1LedgerJSONToV2(json) {
    const data = JSON.parse(json);
    const entries = data.entries ?? [];
    const legacyVerification = (0, verify_1.verifyChain)(entries, { mode: "v1" });
    if (!legacyVerification.valid) {
        throw new Error(`Cannot migrate invalid CLP-1.x chain at entry ${legacyVerification.broken_at ?? 0}`);
    }
    return {
        personId: data.personId,
        entries: migrateV1ChainToV2(entries),
        patterns: data.patterns ?? [],
        verified_legacy: true,
    };
}
//# sourceMappingURL=migration.js.map