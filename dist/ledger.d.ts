/**
 * Cognitive Ledger Protocol (CLP-1.0) — main CognitiveLedger class.
 */
import type { Domain, EmotionalState, EntryInput, LedgerEntry, OutcomeInput, ReasoningProfile, CognitivePattern, GenerativePrompt } from "./types";
export interface VerifyResult {
    valid: boolean;
    entries_checked: number;
    broken_at?: number;
}
export declare class CognitiveLedger {
    private _personId;
    private _entries;
    private _patterns;
    constructor(personId: string);
    record(input: EntryInput): LedgerEntry;
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
    toMarkdown(): string;
}
//# sourceMappingURL=ledger.d.ts.map