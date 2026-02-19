"use strict";
/**
 * Cognitive Ledger Protocol (CLP-1.0) — generates prompts/challenges from patterns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePrompts = generatePrompts;
const hash_1 = require("./hash");
function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}
const now = () => new Date().toISOString();
function generatePrompts(entries, patterns) {
    const out = [];
    const blindSpots = patterns.filter((p) => p.pattern_type === "blind_spot");
    const strengthPatterns = patterns.filter((p) => p.pattern_type === "strength");
    const growthPatterns = patterns.filter((p) => p.pattern_type === "growth");
    const emotionalTriggers = patterns.filter((p) => p.pattern_type === "emotional_trigger");
    // 1. blind_spot_probe — for each blind_spot, prompt to list unknowns before next decision
    for (const p of blindSpots) {
        out.push({
            id: (0, hash_1.generateId)(),
            timestamp: now(),
            prompt_type: "blind_spot_probe",
            content: `Before your next decision in this area, list 3 things you don't know or could be wrong about.`,
            reasoning: p.description,
            based_on: [p.id],
            priority: clamp01(0.7 + p.severity * 0.2),
        });
    }
    // 2. assumption_test — assumptions from recent entries never tested/corrected; verify top 3
    const recentWithAssumptions = entries
        .filter((e) => (e.assumptions?.length ?? 0) > 0)
        .slice(-10);
    const correctionIds = new Set(entries.filter((e) => e.event_type === "correction").map((e) => e.id));
    const assumptionsToTest = [];
    for (const e of recentWithAssumptions) {
        if (correctionIds.has(e.id))
            continue;
        for (const a of e.assumptions ?? []) {
            if (assumptionsToTest.length >= 3)
                break;
            assumptionsToTest.push(a);
        }
    }
    if (assumptionsToTest.length > 0) {
        out.push({
            id: (0, hash_1.generateId)(),
            timestamp: now(),
            prompt_type: "assumption_test",
            content: `Verify or test these assumptions: ${assumptionsToTest.slice(0, 3).join("; ")}`,
            reasoning: "Recent entries contain assumptions that haven't been corrected or reflected.",
            based_on: recentWithAssumptions.slice(0, 3).map((e) => e.id),
            priority: 0.75,
        });
    }
    // 3. challenge — if latest entry's emotional state matches emotional_trigger, warn
    const latest = entries[entries.length - 1];
    if (latest) {
        const trigger = emotionalTriggers.find((p) => p.description.includes(latest.emotional_state));
        if (trigger) {
            out.push({
                id: (0, hash_1.generateId)(),
                timestamp: now(),
                prompt_type: "challenge",
                content: `You're in a state (${latest.emotional_state}) where past decisions have been poor. Pause and consider whether to defer or double-check.`,
                reasoning: trigger.description,
                based_on: [trigger.id, latest.id],
                priority: 0.9,
            });
        }
    }
    // 4. review — if 3+ entries have outcomes but no corresponding reflection entries
    const withOutcomes = entries.filter((e) => e.outcome != null);
    const reflections = entries.filter((e) => e.event_type === "reflection");
    if (withOutcomes.length >= 3 && reflections.length < withOutcomes.length * 0.5) {
        out.push({
            id: (0, hash_1.generateId)(),
            timestamp: now(),
            prompt_type: "review",
            content: "Several decisions have outcomes but no reflection. Review at least one and add what you learned.",
            reasoning: `${withOutcomes.length} outcomes vs ${reflections.length} reflections.`,
            based_on: withOutcomes.slice(-3).map((e) => e.id),
            priority: 0.7,
        });
    }
    // 5. creation_seed — if strength + growth exist, suggest building something
    if (strengthPatterns.length > 0 && growthPatterns.length > 0) {
        const domains = strengthPatterns
            .map((p) => p.description.match(/in (\w+)/)?.[1])
            .filter(Boolean);
        out.push({
            id: (0, hash_1.generateId)(),
            timestamp: now(),
            prompt_type: "creation_seed",
            content: `Combine your strength in ${domains[0] ?? "your strong domain"} with recent learning: what could you build or teach next?`,
            reasoning: "Strength and growth patterns suggest readiness for creation.",
            based_on: [
                strengthPatterns[0].id,
                growthPatterns[0].id,
            ],
            priority: 0.5,
        });
    }
    // 6. question — previously active domains now neglected
    const domainCount = new Map();
    for (const e of entries) {
        domainCount.set(e.domain, (domainCount.get(e.domain) ?? 0) + 1);
    }
    const recentDomains = new Set(entries.slice(-10).map((e) => e.domain));
    const neglected = Array.from(domainCount.entries())
        .filter(([, count]) => count >= 3)
        .filter(([d]) => !recentDomains.has(d));
    if (neglected.length > 0) {
        out.push({
            id: (0, hash_1.generateId)(),
            timestamp: now(),
            prompt_type: "question",
            content: `You used to reason often in: ${neglected.map(([d]) => d).join(", ")}. Is the shift intentional?`,
            reasoning: "Previously active domains have no recent entries.",
            based_on: [],
            priority: 0.4,
        });
    }
    return out.sort((a, b) => b.priority - a.priority);
}
//# sourceMappingURL=generative-engine.js.map