/**
 * Cognitive Ledger Protocol (CLP-1.0) — SHA-256 hashing and ID generation.
 */
declare const GENESIS_HASH: string;
export declare function sha256(input: string): string;
/**
 * Canonical hash for chain integrity: content + previousHash + timestamp.
 */
export declare function hashEntry(content: string, previousHash: string, timestamp: string): string;
export declare function generateId(): string;
export { GENESIS_HASH };
//# sourceMappingURL=hash.d.ts.map