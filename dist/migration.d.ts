/**
 * Cognitive Ledger Protocol (CLP-2.0) — migration helpers for v1 ledgers.
 */
import type { CognitivePattern, LedgerEntry } from "./types";
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
export declare function migrateV1EntryToV2(entry: LedgerEntry, previousHash?: string): LedgerEntry;
export declare function migrateV1ChainToV2(entries: LedgerEntry[]): LedgerEntry[];
export declare function migrateV1LedgerJSONToV2(json: string): MigrationResult;
//# sourceMappingURL=migration.d.ts.map