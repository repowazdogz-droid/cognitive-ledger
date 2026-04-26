/**
 * Cognitive Ledger Protocol (CLP-2.0) — migration helpers for v1 ledgers.
 */

import { GENESIS_HASH, hashEntryV2 } from "./hash";
import { normalizeReasoningSteps } from "./reasoning";
import type { CognitivePattern, LedgerEntry } from "./types";
import { verifyChain } from "./verify";

function defaultUnverifiedFaithfulness(certifiedAt: string) {
  return {
    status: "not_assessed" as const,
    method: "unverified" as const,
    method_version: "clp-2.0-migration",
    certified_at: certifiedAt,
    notes: "Migrated from CLP-1.x without record-level faithfulness certification.",
  };
}

export interface LedgerJSON {
  personId: string;
  entries: LedgerEntry[];
  patterns?: CognitivePattern[];
}

export interface MigrationResult {
  personId: string;
  entries: LedgerEntry[];
  patterns: CognitivePattern[];
  verified_legacy: boolean;
}

export function migrateV1EntryToV2(
  entry: LedgerEntry,
  previousHash: string = entry.previous_hash
): LedgerEntry {
  const migrated: LedgerEntry = {
    ...entry,
    schema_version: "2.0",
    hash_version: "entry-canonical-v2",
    previous_hash: previousHash,
    reasoning_steps: normalizeReasoningSteps(entry.reasoning_steps ?? []),
    faithfulness:
      entry.faithfulness ?? defaultUnverifiedFaithfulness(entry.timestamp),
    parent_entry_ids: entry.parent_entry_ids ?? [],
    external_evidence_hashes: entry.external_evidence_hashes ?? [],
    hash: "",
  };
  migrated.hash = hashEntryV2(migrated);
  return migrated;
}

export function migrateV1ChainToV2(entries: LedgerEntry[]): LedgerEntry[] {
  let previousHash = GENESIS_HASH;
  return entries.map((entry) => {
    const migrated = migrateV1EntryToV2(entry, previousHash);
    previousHash = migrated.hash;
    return migrated;
  });
}

export function migrateV1LedgerJSONToV2(json: string): MigrationResult {
  const data = JSON.parse(json) as LedgerJSON;
  const entries = data.entries ?? [];
  const legacyVerification = verifyChain(entries, { mode: "v1" });

  if (!legacyVerification.valid) {
    throw new Error(
      `Cannot migrate invalid CLP-1.x chain at entry ${legacyVerification.broken_at ?? 0}`
    );
  }

  return {
    personId: data.personId,
    entries: migrateV1ChainToV2(entries),
    patterns: data.patterns ?? [],
    verified_legacy: true,
  };
}
