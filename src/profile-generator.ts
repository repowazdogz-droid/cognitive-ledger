/**
 * Cognitive Ledger Protocol (CLP-2.0) — shareable reasoning profile with verification.
 */

import { sha256 } from "./hash";
import { verifyChain } from "./verify";
import type {
  CognitivePattern,
  Domain,
  EmotionalState,
  LedgerEntry,
  ReasoningProfile,
} from "./types";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function generateProfile(
  personId: string,
  entries: LedgerEntry[],
  patterns: CognitivePattern[]
): ReasoningProfile {
  const generated_at = new Date().toISOString();

  const domains_active = Array.from(
    new Set(entries.map((e) => e.domain))
  ) as Domain[];

  const strengthPatterns = patterns.filter((p) => p.pattern_type === "strength");
  const strengths = strengthPatterns.map((p) =>
    p.description.replace(/^Strength in (\w+).*/, "$1")
  );

  const biasRecurring = patterns.filter(
    (p) => p.pattern_type === "bias_recurring"
  );
  const recurring_biases = biasRecurring.map((p) => {
    const typeMatch = p.description.match(/Recurring (\w+)/);
    const type = (typeMatch?.[1] ?? "confirmation") as import("./types").BiasType;
    return {
      type,
      frequency: p.occurrences,
      improving: p.improving,
    };
  });

  const withOutcomes = entries.filter((e) => e.outcome != null);
  let overall_calibration = 1;
  if (withOutcomes.length > 0) {
    const sumDiff = withOutcomes.reduce(
      (s, e) =>
        s + Math.abs(e.stated_confidence - (e.outcome!.accuracy ?? 0)),
      0
    );
    overall_calibration = clamp01(1 - sumDiff / withOutcomes.length);
  }

  const domain_calibration: { domain: Domain; calibration: number }[] = [];
  for (const d of domains_active) {
    const inDomain = withOutcomes.filter((e) => e.domain === d);
    if (inDomain.length === 0) {
      domain_calibration.push({ domain: d, calibration: 1 });
      continue;
    }
    const sumDiff = inDomain.reduce(
      (s, e) =>
        s + Math.abs(e.stated_confidence - (e.outcome!.accuracy ?? 0)),
      0
    );
    domain_calibration.push({
      domain: d,
      calibration: clamp01(1 - sumDiff / inDomain.length),
    });
  }

  const stateOutcomes = new Map<
    EmotionalState,
    { good: number; total: number }
  >();
  for (const e of withOutcomes) {
    const cur = stateOutcomes.get(e.emotional_state) ?? { good: 0, total: 0 };
    cur.total++;
    if ((e.outcome!.accuracy ?? 0) >= 0.7) cur.good++;
    stateOutcomes.set(e.emotional_state, cur);
  }

  const best_decisions_made_when: EmotionalState[] = [];
  const worst_decisions_made_when: EmotionalState[] = [];
  for (const [state, data] of stateOutcomes) {
    if (data.total < 3) continue;
    if (data.good / data.total >= 0.7) best_decisions_made_when.push(state);
    if (data.good / data.total <= 0.3) worst_decisions_made_when.push(state);
  }

  const half = Math.floor(withOutcomes.length / 2);
  let growth_trajectory = 0;
  if (withOutcomes.length >= 2 && half >= 1) {
    const firstAvg =
      withOutcomes
        .slice(0, half)
        .reduce((s, e) => s + (e.outcome!.accuracy ?? 0), 0) / half;
    const secondAvg =
      withOutcomes
        .slice(half)
        .reduce((s, e) => s + (e.outcome!.accuracy ?? 0), 0) /
      (withOutcomes.length - half);
    growth_trajectory = clamp01((secondAvg - firstAvg + 1) / 2) * 2 - 1;
  }

  const total_corrections = entries.filter(
    (e) => e.event_type === "correction"
  ).length;
  const total_insights = entries.filter((e) => e.event_type === "insight").length;

  const assessedFaithfulness = entries.filter(
    (e) => e.faithfulness && e.faithfulness.method !== "unverified"
  );
  const faithfulness_summary = {
    assessed_entries: assessedFaithfulness.length,
    certified_entries: entries.filter(
      (e) => e.faithfulness?.status === "certified"
    ).length,
    rejected_entries: entries.filter((e) => e.faithfulness?.status === "rejected")
      .length,
    average_coverage: average(
      assessedFaithfulness
        .map((e) => e.faithfulness?.metrics?.coverage)
        .filter((value): value is number => value !== undefined)
    ),
    average_evidence_validity_rate: average(
      assessedFaithfulness
        .map((e) => e.faithfulness?.metrics?.evidence_validity_rate)
        .filter((value): value is number => value !== undefined)
    ),
    average_unit_validity_ratio: average(
      assessedFaithfulness
        .map((e) => e.faithfulness?.metrics?.unit_validity_ratio)
        .filter((value): value is number => value !== undefined)
    ),
  };

  const verification = verifyChain(entries);
  const payload = [
    personId,
    generated_at,
    entries.length,
    domains_active.join(","),
    strengths.join(","),
    JSON.stringify(recurring_biases),
    overall_calibration,
    total_corrections,
    total_insights,
    JSON.stringify(faithfulness_summary),
    growth_trajectory,
    verification.entries_checked,
    verification.valid,
  ].join("|");
  const hash = sha256(payload);

  return {
    person_id: personId,
    generated_at,
    entry_count: entries.length,
    domains_active,
    strengths,
    recurring_biases,
    overall_calibration,
    domain_calibration,
    best_decisions_made_when,
    worst_decisions_made_when,
    growth_trajectory,
    total_corrections,
    total_insights,
    faithfulness_summary,
    hash,
    verification: {
      valid: verification.valid,
      entries_checked: verification.entries_checked,
    },
  };
}
