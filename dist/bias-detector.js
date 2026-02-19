"use strict";
/**
 * Cognitive Ledger Protocol (CLP-1.0) — real-time bias detection on each entry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBiases = detectBiases;
function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}
const RECENT_TIME_WORDS = [
    "just",
    "recently",
    "yesterday",
    "today",
    "last week",
    "this morning",
];
const SUNK_COST_PHRASES = [
    "already invested",
    "too far",
    "can't stop now",
    "already spent",
    "come this far",
];
const CAUSAL_WORDS = ["causes", "leads to", "results in", "because of", "due to"];
const CORRELATION_WORDS = [
    "associated",
    "correlated",
    "linked",
    "connected",
    "related",
];
const STATUS_QUO_WORDS = ["continue", "maintain", "keep", "same", "unchanged"];
function lower(s) {
    return s.toLowerCase();
}
function textContainsAny(text, phrases) {
    const t = lower(text);
    return phrases.some((p) => t.includes(lower(p)));
}
function detectBiases(entry, history) {
    const out = [];
    // 1. overconfidence — stated_confidence >= 0.85, past high-confidence entries had avg accuracy < 0.7 (3+ entries)
    if (entry.stated_confidence >= 0.85) {
        const highConfPast = history.filter((e) => e.stated_confidence >= 0.85 && e.outcome !== undefined);
        if (highConfPast.length >= 3) {
            const avgAccuracy = highConfPast.reduce((s, e) => s + (e.outcome.accuracy ?? 0), 0) /
                highConfPast.length;
            if (avgAccuracy < 0.7) {
                out.push({
                    type: "overconfidence",
                    confidence: clamp01(0.85 - avgAccuracy),
                    evidence: `Past ${highConfPast.length} high-confidence entries averaged ${(avgAccuracy * 100).toFixed(0)}% accuracy.`,
                    suggestion: "Consider lowering stated confidence until outcomes calibrate.",
                });
            }
        }
    }
    // 2. confirmation — alternatives_considered empty but evidence_used not empty
    if ((entry.alternatives_considered?.length ?? 0) === 0 &&
        (entry.evidence_used?.length ?? 0) > 0) {
        out.push({
            type: "confirmation",
            confidence: 0.7,
            evidence: "Evidence was used but no alternatives were considered.",
            suggestion: "List at least one alternative interpretation before concluding.",
        });
    }
    // 3. anchoring — confidence in same domain clusters within 0.1 of first entry (3+ recent)
    const sameDomain = history.filter((e) => e.domain === entry.domain);
    if (sameDomain.length >= 3) {
        const firstConf = sameDomain[0].stated_confidence;
        const recent = sameDomain.slice(-3);
        const allNearFirst = recent.every((e) => Math.abs(e.stated_confidence - firstConf) <= 0.1);
        if (allNearFirst && Math.abs(entry.stated_confidence - firstConf) <= 0.1) {
            out.push({
                type: "anchoring",
                confidence: 0.65,
                evidence: `Confidence in ${entry.domain} has stayed within 0.1 of first entry (${(firstConf * 100).toFixed(0)}%) across ${recent.length + 1} entries.`,
                suggestion: "Re-anchor: estimate confidence from scratch for this case only.",
            });
        }
    }
    // 4. recency — 50%+ of assumptions contain recent-time words
    const assumptions = entry.assumptions ?? [];
    if (assumptions.length > 0) {
        const withRecent = assumptions.filter((a) => RECENT_TIME_WORDS.some((w) => lower(a).includes(w)));
        if (withRecent.length / assumptions.length >= 0.5) {
            out.push({
                type: "recency",
                confidence: 0.6,
                evidence: `${withRecent.length}/${assumptions.length} assumptions use recent-time language.`,
                suggestion: "Consider whether recency is driving the conclusion; test with older data.",
            });
        }
    }
    // 5. sunk_cost — content or assumptions contain sunk cost language
    const fullText = [entry.content, ...(entry.assumptions ?? [])].join(" ");
    if (textContainsAny(fullText, SUNK_COST_PHRASES)) {
        out.push({
            type: "sunk_cost",
            confidence: 0.75,
            evidence: "Sunk cost language detected in content or assumptions.",
            suggestion: "Decide based on future value only; ignore past investment.",
        });
    }
    // 6. correlation_causation — content has causal language, evidence has correlation language
    const hasCausal = CAUSAL_WORDS.some((w) => lower(entry.content).includes(w));
    const evidenceText = (entry.evidence_used ?? []).join(" ");
    const hasCorrelation = CORRELATION_WORDS.some((w) => lower(evidenceText).includes(w));
    if (hasCausal && evidenceText.length > 0 && hasCorrelation) {
        out.push({
            type: "correlation_causation",
            confidence: 0.7,
            evidence: "Content uses causal language while evidence uses correlation language.",
            suggestion: "Avoid inferring causation from correlation without stronger design.",
        });
    }
    // 7. neglect_of_probability — stated_confidence > 0.9 and assumptions empty
    if (entry.stated_confidence > 0.9 && (entry.assumptions?.length ?? 0) === 0) {
        out.push({
            type: "neglect_of_probability",
            confidence: 0.65,
            evidence: "Very high confidence with no stated assumptions.",
            suggestion: "List assumptions and base rates that would change the probability.",
        });
    }
    // 8. status_quo — 80%+ of last 5 decisions in same domain contain continue/maintain/keep
    const decisionsInDomain = history.filter((e) => e.domain === entry.domain && e.event_type === "decision");
    const last5 = decisionsInDomain.slice(-5);
    if (last5.length >= 5) {
        const withStatusQuo = last5.filter((e) => STATUS_QUO_WORDS.some((w) => lower(e.content).includes(w)));
        if (withStatusQuo.length / 5 >= 0.8) {
            out.push({
                type: "status_quo",
                confidence: 0.7,
                evidence: `${withStatusQuo.length}/5 recent decisions in ${entry.domain} use status-quo language.`,
                suggestion: "Explicitly consider change options before defaulting to continue.",
            });
        }
    }
    return out.map((d) => ({
        ...d,
        confidence: clamp01(d.confidence),
    }));
}
//# sourceMappingURL=bias-detector.js.map