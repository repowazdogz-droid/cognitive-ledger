/**
 * Cognitive Ledger Protocol (CLP-2.0) — SHA-256 hashing and ID generation.
 */
import type { LedgerEntry } from "./types";
declare const GENESIS_HASH: string;
export declare function sha256(input: string): string;
/**
 * CLP-1.0 hash for chain integrity: content + previousHash + timestamp.
 */
export declare function hashEntry(content: string, previousHash: string, timestamp: string): string;
export declare function canonicalStringify(value: unknown): string;
export declare function v2HashPayload(entry: LedgerEntry): Record<string, unknown>;
export declare function hashEntryV2(entry: LedgerEntry): string;
export declare function generateId(): string;
export { GENESIS_HASH };
//# sourceMappingURL=hash.d.ts.map