/**
 * Cognitive Ledger Protocol (CLP-2.0) — dual-mode hash chain verification.
 */

import { GENESIS_HASH, hashEntry, hashEntryV2 } from "./hash";
import { validateReasoningSteps } from "./reasoning";
import type { HashVersion, LedgerEntry } from "./types";

export interface VerifyResult {
  valid: boolean;
  entries_checked: number;
  broken_at?: number;
  hash_version?: HashVersion | "mixed";
  error?: string;
}

export type VerifyMode = "auto" | "v1" | "v2";

export interface VerifyOptions {
  mode?: VerifyMode;
}

function inferHashVersion(entry: LedgerEntry, mode: VerifyMode): HashVersion {
  if (mode === "v1") return "content-chain-v1";
  if (mode === "v2") return "entry-canonical-v2";
  if (entry.hash_version) return entry.hash_version;
  if (entry.schema_version === "2.0") return "entry-canonical-v2";
  return "content-chain-v1";
}

export function verifyChain(
  entries: LedgerEntry[],
  options: VerifyOptions = {}
): VerifyResult {
  if (entries.length === 0) {
    return { valid: true, entries_checked: 0 };
  }
  const mode = options.mode ?? "auto";
  let previousHash = GENESIS_HASH;
  const versions = new Set<HashVersion>();

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.previous_hash !== previousHash) {
      return {
        valid: false,
        entries_checked: i,
        broken_at: i,
        error: "previous_hash does not match prior entry hash",
      };
    }

    const hashVersion = inferHashVersion(e, mode);
    versions.add(hashVersion);
    const expected =
      hashVersion === "entry-canonical-v2"
        ? hashEntryV2(e)
        : hashEntry(e.content, e.previous_hash, e.timestamp);

    if (e.hash !== expected) {
      return {
        valid: false,
        entries_checked: i,
        broken_at: i,
        hash_version: hashVersion,
        error: "entry hash mismatch",
      };
    }

    if (hashVersion === "entry-canonical-v2") {
      const typecheck = validateReasoningSteps(e.reasoning_steps ?? []);
      if (!typecheck.valid) {
        return {
          valid: false,
          entries_checked: i,
          broken_at: i,
          hash_version: hashVersion,
          error: typecheck.errors.join("; "),
        };
      }
    }
    previousHash = e.hash;
  }

  return {
    valid: true,
    entries_checked: entries.length,
    hash_version:
      versions.size === 1 ? Array.from(versions)[0] : "mixed",
  };
}
