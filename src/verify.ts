/**
 * Cognitive Ledger Protocol (CLP-1.0) — hash chain verification.
 */

import { GENESIS_HASH, hashEntry } from "./hash";
import type { LedgerEntry } from "./types";

export interface VerifyResult {
  valid: boolean;
  entries_checked: number;
  broken_at?: number;
}

export function verifyChain(entries: LedgerEntry[]): VerifyResult {
  if (entries.length === 0) {
    return { valid: true, entries_checked: 0 };
  }
  let previousHash = GENESIS_HASH;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.previous_hash !== previousHash) {
      return { valid: false, entries_checked: i, broken_at: i };
    }
    const expected = hashEntry(e.content, e.previous_hash, e.timestamp);
    if (e.hash !== expected) {
      return { valid: false, entries_checked: i, broken_at: i };
    }
    previousHash = e.hash;
  }
  return { valid: true, entries_checked: entries.length };
}
