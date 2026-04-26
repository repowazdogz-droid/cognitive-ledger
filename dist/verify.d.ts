/**
 * Cognitive Ledger Protocol (CLP-2.0) — dual-mode hash chain verification.
 */
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
export declare function verifyChain(entries: LedgerEntry[], options?: VerifyOptions): VerifyResult;
//# sourceMappingURL=verify.d.ts.map