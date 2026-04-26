/**
 * Cognitive Ledger Protocol (CLP-2.0) — main CognitiveLedger class.
 */
import type { Domain, EmotionalState, EntryInput, LedgerEntry, OutcomeInput, ReasoningProfile, CognitivePattern, GenerativePrompt } from "./types";
export interface VerifyResult {
    valid: boolean;
    entries_checked: number;
    broken_at?: number;
    hash_version?: "content-chain-v1" | "entry-canonical-v2" | "mixed";
    error?: string;
}
export declare class CognitiveLedger {
    private _personId;
    private _entries;
    private _patterns;
    constructor(personId: string);
    record(input: EntryInput): LedgerEntry;
    private rehashV2Chain;
    recordOutcome(entryId: string, outcome: OutcomeInput): LedgerEntry | null;
    getPrompts(): GenerativePrompt[];
    getProfile(): ReasoningProfile;
    getPatterns(): CognitivePattern[];
    verify(): VerifyResult;
    getEntries(): readonly LedgerEntry[];
    getEntriesByDomain(domain: Domain): LedgerEntry[];
    getEntriesByState(state: EmotionalState): LedgerEntry[];
    get personId(): string;
    toJSON(): string;
    static fromJSON(json: string): CognitiveLedger;
    static migrateV1JSONToV2(json: string): CognitiveLedger;
    toMarkdown(): string;
}
//# sourceMappingURL=ledger.d.ts.map