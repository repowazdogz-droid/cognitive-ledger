/**
 * Cognitive Ledger Protocol (CLP-1.0) — main CognitiveLedger class.
 */

import { detectBiases } from "./bias-detector";
import { generatePrompts } from "./generative-engine";
import { GENESIS_HASH, generateId, hashEntry } from "./hash";
import { analysePatterns } from "./pattern-analyser";
import { generateProfile } from "./profile-generator";
import type {
  Domain,
  EmotionalState,
  EntryInput,
  LedgerEntry,
  OutcomeInput,
  ReasoningProfile,
  CognitivePattern,
  GenerativePrompt,
} from "./types";
import { verifyChain } from "./verify";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

const PATTERN_ANALYSIS_INTERVAL = 5;

export interface VerifyResult {
  valid: boolean;
  entries_checked: number;
  broken_at?: number;
}

export class CognitiveLedger {
  private _personId: string;
  private _entries: LedgerEntry[] = [];
  private _patterns: CognitivePattern[] = [];

  constructor(personId: string) {
    this._personId = personId;
  }

  record(input: EntryInput): LedgerEntry {
    const timestamp = new Date().toISOString();
    const previous_hash =
      this._entries.length === 0
        ? GENESIS_HASH
        : this._entries[this._entries.length - 1].hash;

    const energy_level = clamp01(input.energy_level);
    const time_pressure = clamp01(input.time_pressure);
    const stated_confidence = clamp01(input.stated_confidence);

    const entry: LedgerEntry = {
      id: generateId(),
      timestamp,
      domain: input.domain,
      event_type: input.event_type,
      content: input.content,
      emotional_state: input.emotional_state,
      energy_level,
      time_pressure,
      stated_confidence,
      alternatives_considered: input.alternatives_considered ?? [],
      assumptions: input.assumptions ?? [],
      evidence_used: input.evidence_used ?? [],
      detected_biases: [],
      visibility: input.visibility ?? "private",
      hash: "",
      previous_hash,
      source: input.source,
    };

    entry.hash = hashEntry(entry.content, entry.previous_hash, entry.timestamp);
    entry.detected_biases = detectBiases(entry, this._entries);
    this._entries.push(entry);

    if (this._entries.length % PATTERN_ANALYSIS_INTERVAL === 0) {
      this._patterns = analysePatterns(this._entries, this._patterns);
    }

    return entry;
  }

  recordOutcome(entryId: string, outcome: OutcomeInput): LedgerEntry | null {
    const idx = this._entries.findIndex((e) => e.id === entryId);
    if (idx < 0) return null;

    const entry = this._entries[idx];
    const accuracy = clamp01(outcome.accuracy);
    entry.outcome = {
      result: outcome.result,
      accuracy,
      resolved_at: outcome.resolved_at,
      learned: outcome.learned,
    };

    const withOutcomes = this._entries.filter((e) => e.outcome != null);
    if (withOutcomes.length >= 5) {
      const recent = withOutcomes.slice(-10);
      const avgAccuracy =
        recent.reduce((s, e) => s + (e.outcome!.accuracy ?? 0), 0) /
        recent.length;
      for (const e of recent) {
        e.calibrated_confidence = clamp01(
          (e.calibrated_confidence ?? e.stated_confidence) * 0.7 + avgAccuracy * 0.3
        );
      }
    }

    this._patterns = analysePatterns(this._entries, this._patterns);
    return entry;
  }

  getPrompts(): GenerativePrompt[] {
    this._patterns = analysePatterns(this._entries, this._patterns);
    return generatePrompts(this._entries, this._patterns);
  }

  getProfile(): ReasoningProfile {
    this._patterns = analysePatterns(this._entries, this._patterns);
    return generateProfile(this._personId, this._entries, this._patterns);
  }

  getPatterns(): CognitivePattern[] {
    this._patterns = analysePatterns(this._entries, this._patterns);
    return this._patterns;
  }

  verify(): VerifyResult {
    return verifyChain(this._entries);
  }

  getEntries(): readonly LedgerEntry[] {
    return this._entries;
  }

  getEntriesByDomain(domain: Domain): LedgerEntry[] {
    return this._entries.filter((e) => e.domain === domain);
  }

  getEntriesByState(state: EmotionalState): LedgerEntry[] {
    return this._entries.filter((e) => e.emotional_state === state);
  }

  get personId(): string {
    return this._personId;
  }

  toJSON(): string {
    return JSON.stringify({
      personId: this._personId,
      entries: this._entries,
      patterns: this._patterns,
    });
  }

  static fromJSON(json: string): CognitiveLedger {
    const data = JSON.parse(json) as {
      personId: string;
      entries: LedgerEntry[];
      patterns: CognitivePattern[];
    };
    const ledger = new CognitiveLedger(data.personId);
    ledger._entries = data.entries ?? [];
    ledger._patterns = data.patterns ?? [];
    return ledger;
  }

  toMarkdown(): string {
    const profile = this.getProfile();
    const prompts = this.getPrompts();
    const lines: string[] = [
      `# Cognitive Ledger — ${this._personId}`,
      `Generated: ${profile.generated_at}`,
      `Entries: ${profile.entry_count}`,
      "",
      "## Calibration",
      `Overall: ${(profile.overall_calibration * 100).toFixed(0)}%`,
      ...profile.domain_calibration.map(
        (d) => `- ${d.domain}: ${(d.calibration * 100).toFixed(0)}%`
      ),
      "",
      "## Strengths",
      ...profile.strengths.map((s) => `- ${s}`),
      "",
      "## Recurring biases",
      ...profile.recurring_biases.map(
        (b) => `- ${b.type} (${b.frequency}x, improving: ${b.improving})`
      ),
      "",
      "## Emotional patterns",
      `Best decisions when: ${profile.best_decisions_made_when.join(", ") || "—"}`,
      `Worst decisions when: ${profile.worst_decisions_made_when.join(", ") || "—"}`,
      "",
      "## Growth",
      `Trajectory: ${(profile.growth_trajectory * 100).toFixed(0)}% | Corrections: ${profile.total_corrections} | Insights: ${profile.total_insights}`,
      "",
      "## Top 5 prompts",
      ...prompts.slice(0, 5).map((p) => `- [${p.prompt_type}] ${p.content}`),
      "",
      `Verification: ${profile.verification.valid ? "Valid" : "Invalid"} (${profile.verification.entries_checked} entries)`,
    ];
    return lines.join("\n");
  }
}
