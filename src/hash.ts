/**
 * Cognitive Ledger Protocol (CLP-2.0) — SHA-256 hashing and ID generation.
 */

import { createHash, randomBytes } from "crypto";
import type { LedgerEntry } from "./types";

const GENESIS_HASH = "0".repeat(64);

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * CLP-1.0 hash for chain integrity: content + previousHash + timestamp.
 */
export function hashEntry(
  content: string,
  previousHash: string,
  timestamp: string
): string {
  const payload = [content, previousHash, timestamp].join("\n");
  return sha256(payload);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const item = (value as Record<string, unknown>)[key];
    if (item !== undefined) out[key] = canonicalize(item);
  }
  return out;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function v2HashPayload(entry: LedgerEntry): Record<string, unknown> {
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

export function hashEntryV2(entry: LedgerEntry): string {
  return sha256(canonicalStringify(v2HashPayload(entry)));
}

export function generateId(): string {
  const t = Date.now().toString(16);
  const r = randomBytes(4).toString("hex");
  return (t + r).slice(0, 16);
}

export { GENESIS_HASH };
