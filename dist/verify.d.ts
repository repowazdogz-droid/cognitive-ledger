/**
 * Cognitive Ledger Protocol (CLP-1.0) — hash chain verification.
 */
import type { LedgerEntry } from "./types";
export interface VerifyResult {
    valid: boolean;
    entries_checked: number;
    broken_at?: number;
}
export declare function verifyChain(entries: LedgerEntry[]): VerifyResult;
//# sourceMappingURL=verify.d.ts.map