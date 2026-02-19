/**
 * Cognitive Ledger Protocol (CLP-1.0) — longitudinal pattern detection across entries.
 */

import { generateId } from "./hash";
import type {
  CognitivePattern,
  LedgerEntry,
  BiasType,
  Domain,
  EmotionalState,
} from "./types";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function mergeOrAdd(
  patterns: Map<string, CognitivePattern>,
  key: string,
  create: () => CognitivePattern,
  update: (p: CognitivePattern) => void
): void {
  const existing = patterns.get(key);
  if (existing) {
    update(existing);
  } else {
    const p = create();
    patterns.set(key, p);
  }
}

export function analysePatterns(
  entries: LedgerEntry[],
  existingPatterns: CognitivePattern[]
): CognitivePattern[] {
  const byKey = new Map<string, CognitivePattern>();
  for (const p of existingPatterns) {
    const k = `${p.pattern_type}:${p.description.slice(0, 60)}`;
    byKey.set(k, { ...p, entries: [...p.entries] });
  }

  const now = new Date().toISOString();

  // 1. bias_recurring — any bias type in 3+ entries; improving = fewer in second half vs first half
  const biasCountByType = new Map<BiasType, { entries: string[]; timestamps: string[] }>();
  for (const e of entries) {
    for (const b of e.detected_biases ?? []) {
      const cur = biasCountByType.get(b.type) ?? {
        entries: [],
        timestamps: [],
      };
      cur.entries.push(e.id);
      cur.timestamps.push(e.timestamp);
      biasCountByType.set(b.type, cur);
    }
  }
  for (const [biasType, data] of biasCountByType) {
    if (data.entries.length < 3) continue;
    const key = `bias_recurring:${biasType}`;
    const half = Math.floor(data.entries.length / 2);
    const firstHalf = data.entries.slice(0, half).length;
    const secondHalf = data.entries.length - firstHalf;
    const improving = secondHalf < firstHalf;
    const severity = clamp01(0.3 + (data.entries.length / 20));
    mergeOrAdd(
      byKey,
      key,
      () => ({
        id: generateId(),
        pattern_type: "bias_recurring",
        description: `Recurring ${biasType} bias across ${data.entries.length} entries.`,
        first_detected: data.timestamps[0],
        occurrences: data.entries.length,
        last_seen: data.timestamps[data.timestamps.length - 1],
        severity,
        improving,
        entries: data.entries,
      }),
      (p) => {
        p.occurrences = data.entries.length;
        p.last_seen = data.timestamps[data.timestamps.length - 1];
        p.improving = improving;
        p.entries = data.entries;
        p.severity = severity;
      }
    );
  }

  // 2. strength — domain with 5+ outcomes where 80%+ have accuracy >= 0.7
  const outcomesByDomain = new Map<
    Domain,
    { accurate: number; total: number; entryIds: string[] }
  >();
  for (const e of entries) {
    if (e.outcome == null) continue;
    const cur = outcomesByDomain.get(e.domain) ?? {
      accurate: 0,
      total: 0,
      entryIds: [],
    };
    cur.total++;
    if (e.outcome.accuracy >= 0.7) cur.accurate++;
    cur.entryIds.push(e.id);
    outcomesByDomain.set(e.domain, cur);
  }
  for (const [domain, data] of outcomesByDomain) {
    if (data.total < 5) continue;
    if (data.accurate / data.total < 0.8) continue;
    const key = `strength:${domain}`;
    mergeOrAdd(
      byKey,
      key,
      () => ({
        id: generateId(),
        pattern_type: "strength",
        description: `Strength in ${domain}: ${data.accurate}/${data.total} outcomes accurate (≥0.7).`,
        first_detected: now,
        occurrences: data.total,
        last_seen: now,
        severity: 0.3,
        improving: true,
        entries: data.entryIds,
      }),
      (p) => {
        p.occurrences = data.total;
        p.last_seen = now;
        p.entries = data.entryIds;
        p.description = `Strength in ${domain}: ${data.accurate}/${data.total} outcomes accurate (≥0.7).`;
      }
    );
  }

  // 3. blind_spot — domain with 3+ outcomes where accuracy < 0.5 AND avg confidence > 0.6
  for (const e of entries) {
    if (e.outcome == null) continue;
    const domain = e.domain;
    const withOutcome = entries.filter(
      (x) => x.domain === domain && x.outcome != null
    );
    if (withOutcome.length < 3) continue;
    const avgAccuracy =
      withOutcome.reduce((s, x) => s + x.outcome!.accuracy, 0) /
      withOutcome.length;
    const avgConf =
      withOutcome.reduce((s, x) => s + x.stated_confidence, 0) /
      withOutcome.length;
    if (avgAccuracy < 0.5 && avgConf > 0.6) {
      const key = `blind_spot:${domain}`;
      const entryIds = withOutcome.map((x) => x.id);
      mergeOrAdd(
        byKey,
        key,
        () => ({
          id: generateId(),
          pattern_type: "blind_spot",
          description: `Blind spot in ${domain}: low accuracy (${(avgAccuracy * 100).toFixed(0)}%) with high confidence (${(avgConf * 100).toFixed(0)}%).`,
          first_detected: now,
          occurrences: withOutcome.length,
          last_seen: now,
          severity: clamp01(0.5 + (0.6 - avgAccuracy)),
          improving: false,
          entries: entryIds,
        }),
        (p) => {
          p.occurrences = withOutcome.length;
          p.last_seen = now;
          p.entries = entryIds;
          p.description = `Blind spot in ${domain}: low accuracy (${(avgAccuracy * 100).toFixed(0)}%) with high confidence (${(avgConf * 100).toFixed(0)}%).`;
        }
      );
    }
  }

  // 4. emotional_trigger — emotional state with 3+ outcomes where 70%+ are inaccurate
  const byState = new Map<
    EmotionalState,
    { accurate: number; total: number; entryIds: string[] }
  >();
  for (const e of entries) {
    if (e.outcome == null) continue;
    const cur = byState.get(e.emotional_state) ?? {
      accurate: 0,
      total: 0,
      entryIds: [],
    };
    cur.total++;
    if (e.outcome.accuracy >= 0.7) cur.accurate++;
    cur.entryIds.push(e.id);
    byState.set(e.emotional_state, cur);
  }
  for (const [state, data] of byState) {
    if (data.total < 3) continue;
    if (data.total - data.accurate < data.total * 0.7) continue;
    const key = `emotional_trigger:${state}`;
    mergeOrAdd(
      byKey,
      key,
      () => ({
        id: generateId(),
        pattern_type: "emotional_trigger",
        description: `Decisions when ${state}: ${data.total - data.accurate}/${data.total} inaccurate (≥70% poor).`,
        first_detected: now,
        occurrences: data.total,
        last_seen: now,
        severity: 0.7,
        improving: false,
        entries: data.entryIds,
      }),
      (p) => {
        p.occurrences = data.total;
        p.last_seen = now;
        p.entries = data.entryIds;
      }
    );
  }

  // 5. growth — 3+ correction-type entries
  const corrections = entries.filter((e) => e.event_type === "correction");
  if (corrections.length >= 3) {
    const key = "growth:corrections";
    mergeOrAdd(
      byKey,
      key,
      () => ({
        id: generateId(),
        pattern_type: "growth",
        description: `${corrections.length} correction entries indicate active learning.`,
        first_detected: corrections[0].timestamp,
        occurrences: corrections.length,
        last_seen: corrections[corrections.length - 1].timestamp,
        severity: 0.2,
        improving: true,
        entries: corrections.map((e) => e.id),
      }),
      (p) => {
        p.occurrences = corrections.length;
        p.last_seen = corrections[corrections.length - 1].timestamp;
        p.entries = corrections.map((e) => e.id);
      }
    );
  }

  return Array.from(byKey.values());
}
