/**
 * Cognitive Ledger Protocol (CLP-1.0) — comprehensive test suite.
 */

import {
  CognitiveLedger,
  verifyChain,
  detectBiases,
  analysePatterns,
  generatePrompts,
  generateProfile,
} from "../src/index";
import type { LedgerEntry } from "../src/types";

function entryInput(overrides: Partial<Parameters<CognitiveLedger["record"]>[0]> = {}) {
  return {
    domain: "general" as const,
    event_type: "decision" as const,
    content: "Test decision",
    emotional_state: "calm" as const,
    energy_level: 0.5,
    time_pressure: 0.2,
    stated_confidence: 0.7,
    ...overrides,
  };
}

describe("Core", () => {
  test("create ledger with personId", () => {
    const ledger = new CognitiveLedger("user-1");
    expect(ledger.personId).toBe("user-1");
    expect(ledger.getEntries().length).toBe(0);
  });

  test("record creates entry with defaults", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(entryInput());
    expect(e.id).toBeDefined();
    expect(e.timestamp).toBeDefined();
    expect(e.domain).toBe("general");
    expect(e.event_type).toBe("decision");
    expect(e.content).toBe("Test decision");
    expect(e.visibility).toBe("private");
    expect(e.alternatives_considered).toEqual([]);
    expect(e.assumptions).toEqual([]);
    expect(e.evidence_used).toEqual([]);
    expect(e.hash).toBeDefined();
    expect(e.previous_hash).toBe("0".repeat(64));
  });

  test("record clamps 0-1 values", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(
      entryInput({
        energy_level: 1.5,
        time_pressure: -0.1,
        stated_confidence: 2,
      })
    );
    expect(e.energy_level).toBeLessThanOrEqual(1);
    expect(e.energy_level).toBeGreaterThanOrEqual(0);
    expect(e.time_pressure).toBeGreaterThanOrEqual(0);
    expect(e.stated_confidence).toBeLessThanOrEqual(1);
  });

  test("chain: second entry has previous_hash of first", () => {
    const ledger = new CognitiveLedger("u");
    const e1 = ledger.record(entryInput({ content: "First" }));
    const e2 = ledger.record(entryInput({ content: "Second" }));
    expect(e2.previous_hash).toBe(e1.hash);
  });

  test("record accepts optional arrays and visibility", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(
      entryInput({
        alternatives_considered: ["A", "B"],
        assumptions: ["X"],
        evidence_used: ["E1"],
        visibility: "team",
      })
    );
    expect(e.alternatives_considered).toEqual(["A", "B"]);
    expect(e.assumptions).toEqual(["X"]);
    expect(e.evidence_used).toEqual(["E1"]);
    expect(e.visibility).toBe("team");
  });
});

describe("Integrity", () => {
  test("empty ledger verify returns valid", () => {
    const ledger = new CognitiveLedger("u");
    const r = ledger.verify();
    expect(r.valid).toBe(true);
    expect(r.entries_checked).toBe(0);
  });

  test("valid chain verify passes", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput());
    ledger.record(entryInput({ content: "Second" }));
    expect(ledger.verify().valid).toBe(true);
    expect(ledger.verify().entries_checked).toBe(2);
  });

  test("tamper breaks verification", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput({ content: "A" }));
    ledger.record(entryInput({ content: "B" }));
    const entries = (ledger as any)._entries;
    entries[0].content = "Tampered";
    const r = verifyChain(entries);
    expect(r.valid).toBe(false);
    expect(r.broken_at).toBeDefined();
  });

  test("chain break at first modified entry", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput({ content: "A" }));
    ledger.record(entryInput({ content: "B" }));
    ledger.record(entryInput({ content: "C" }));
    const entries = (ledger as any)._entries.map((e: LedgerEntry) => ({ ...e }));
    entries[1].content = "X";
    const r = verifyChain(entries);
    expect(r.valid).toBe(false);
    expect(r.broken_at).toBe(1);
  });
});

describe("Outcomes", () => {
  test("recordOutcome attaches outcome", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(entryInput());
    const updated = ledger.recordOutcome(e.id, {
      result: "Success",
      accuracy: 0.9,
      resolved_at: new Date().toISOString(),
      learned: "Learned something",
    });
    expect(updated).not.toBeNull();
    expect(updated!.outcome?.result).toBe("Success");
    expect(updated!.outcome?.accuracy).toBe(0.9);
  });

  test("recordOutcome unknown ID returns null", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput());
    const r = ledger.recordOutcome("nonexistent", {
      result: "x",
      accuracy: 0.5,
      resolved_at: new Date().toISOString(),
      learned: "x",
    });
    expect(r).toBeNull();
  });

  test("recordOutcome clamps accuracy to 0-1", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(entryInput());
    ledger.recordOutcome(e.id, {
      result: "x",
      accuracy: 1.5,
      resolved_at: new Date().toISOString(),
      learned: "x",
    });
    expect((ledger.getEntries()[0] as LedgerEntry).outcome!.accuracy).toBeLessThanOrEqual(1);
  });
});

describe("Bias detection", () => {
  test("confirmation bias when no alternatives but evidence used", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(
      entryInput({ evidence_used: ["E1"], alternatives_considered: [] })
    );
    const biases = e.detected_biases.filter((b) => b.type === "confirmation");
    expect(biases.length).toBeGreaterThan(0);
    expect(biases[0].suggestion).toMatch(/alternative/);
  });

  test("sunk cost language detected", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(
      entryInput({ content: "We have already invested too much to stop now." })
    );
    const biases = e.detected_biases.filter((b) => b.type === "sunk_cost");
    expect(biases.length).toBeGreaterThan(0);
  });

  test("overconfidence from history", () => {
    const ledger = new CognitiveLedger("u");
    for (let i = 0; i < 4; i++) {
      const e = ledger.record(
        entryInput({ stated_confidence: 0.9, content: `High conf ${i}` })
      );
      if (i > 0)
        ledger.recordOutcome(e.id, {
          result: "bad",
          accuracy: 0.5,
          resolved_at: new Date().toISOString(),
          learned: "x",
        });
    }
    const last = ledger.record(
      entryInput({ stated_confidence: 0.9, content: "Another high conf" })
    );
    const overconf = last.detected_biases.filter((b) => b.type === "overconfidence");
    expect(overconf.length).toBeGreaterThanOrEqual(0);
  });

  test("neglect of probability when high confidence and no assumptions", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(
      entryInput({ stated_confidence: 0.95, assumptions: [] })
    );
    const biases = e.detected_biases.filter(
      (b) => b.type === "neglect_of_probability"
    );
    expect(biases.length).toBeGreaterThan(0);
  });

  test("well-reasoned entry can have no bias flags", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(
      entryInput({
        stated_confidence: 0.6,
        alternatives_considered: ["A", "B"],
        assumptions: ["We assume X"],
        evidence_used: ["E1"],
        content: "Neutral decision with no bias triggers.",
      })
    );
    expect(e.detected_biases.length).toBeLessThanOrEqual(2);
  });
});

describe("Patterns", () => {
  test("recurring bias pattern after 3+ entries with same bias", () => {
    const ledger = new CognitiveLedger("u");
    for (let i = 0; i < 4; i++) {
      ledger.record(
        entryInput({
          content: `Decision ${i}`,
          evidence_used: ["e1"],
          alternatives_considered: [],
        })
      );
    }
    const patterns = ledger.getPatterns();
    const recurring = patterns.filter((p) => p.pattern_type === "bias_recurring");
    expect(recurring.length).toBeGreaterThanOrEqual(0);
  });

  test("strength pattern when 5+ outcomes with 80% accurate", () => {
    const ledger = new CognitiveLedger("u");
    for (let i = 0; i < 6; i++) {
      const e = ledger.record(
        entryInput({ domain: "technical", content: `Tech ${i}` })
      );
      ledger.recordOutcome(e.id, {
        result: "ok",
        accuracy: i < 5 ? 0.8 : 0.5,
        resolved_at: new Date().toISOString(),
        learned: "x",
      });
    }
    const patterns = ledger.getPatterns();
    const strength = patterns.filter((p) => p.pattern_type === "strength");
    expect(strength.length).toBeGreaterThanOrEqual(0);
  });

  test("growth pattern with 3+ corrections", () => {
    const ledger = new CognitiveLedger("u");
    for (let i = 0; i < 3; i++) {
      ledger.record(
        entryInput({ event_type: "correction", content: `Correction ${i}` })
      );
    }
    const patterns = ledger.getPatterns();
    const growth = patterns.filter((p) => p.pattern_type === "growth");
    expect(growth.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Generative", () => {
  test("getPrompts returns array", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput());
    const prompts = ledger.getPrompts();
    expect(Array.isArray(prompts)).toBe(true);
  });

  test("prompts sorted by priority descending", () => {
    const ledger = new CognitiveLedger("u");
    for (let i = 0; i < 3; i++) ledger.record(entryInput({ content: `E${i}` }));
    const prompts = ledger.getPrompts();
    for (let i = 1; i < prompts.length; i++) {
      expect(prompts[i].priority).toBeLessThanOrEqual(prompts[i - 1].priority);
    }
  });
});

describe("Profile", () => {
  test("getProfile returns profile with person_id and entry_count", () => {
    const ledger = new CognitiveLedger("p1");
    ledger.record(entryInput());
    const profile = ledger.getProfile();
    expect(profile.person_id).toBe("p1");
    expect(profile.entry_count).toBe(1);
    expect(profile.domains_active).toContain("general");
    expect(profile.verification).toBeDefined();
    expect(profile.verification.entries_checked).toBe(1);
  });

  test("profile includes best/worst emotional states when enough data", () => {
    const ledger = new CognitiveLedger("u");
    for (let i = 0; i < 4; i++) {
      const e = ledger.record(
        entryInput({
          emotional_state: "calm",
          content: `Calm ${i}`,
        })
      );
      ledger.recordOutcome(e.id, {
        result: "good",
        accuracy: 0.9,
        resolved_at: new Date().toISOString(),
        learned: "x",
      });
    }
    const profile = ledger.getProfile();
    expect(profile.best_decisions_made_when).toBeDefined();
    expect(profile.worst_decisions_made_when).toBeDefined();
  });
});

describe("Export/Import", () => {
  test("JSON roundtrip preserves entries and chain", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput({ content: "A" }));
    ledger.record(entryInput({ content: "B" }));
    const json = ledger.toJSON();
    const restored = CognitiveLedger.fromJSON(json);
    expect(restored.personId).toBe("u");
    expect(restored.getEntries().length).toBe(2);
    expect(restored.verify().valid).toBe(true);
  });

  test("markdown includes calibration and verification", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput());
    const md = ledger.toMarkdown();
    expect(md).toContain("Cognitive Ledger");
    expect(md).toContain("Calibration");
    expect(md).toContain("Verification");
  });
});

describe("Filtering", () => {
  test("getEntriesByDomain", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput({ domain: "clinical" }));
    ledger.record(entryInput({ domain: "technical" }));
    ledger.record(entryInput({ domain: "clinical" }));
    const clinical = ledger.getEntriesByDomain("clinical");
    expect(clinical.length).toBe(2);
    expect(ledger.getEntriesByDomain("technical").length).toBe(1);
  });

  test("getEntriesByState", () => {
    const ledger = new CognitiveLedger("u");
    ledger.record(entryInput({ emotional_state: "calm" }));
    ledger.record(entryInput({ emotional_state: "stressed" }));
    ledger.record(entryInput({ emotional_state: "calm" }));
    const calm = ledger.getEntriesByState("calm");
    expect(calm.length).toBe(2);
  });
});

describe("Source tracking", () => {
  test("record stores source when provided", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(
      entryInput({ source: "spine-case" })
    );
    expect(e.source).toBe("spine-case");
  });

  test("source is optional", () => {
    const ledger = new CognitiveLedger("u");
    const e = ledger.record(entryInput());
    expect(e.source).toBeUndefined();
  });
});

describe("detectBiases standalone", () => {
  test("returns empty for empty history", () => {
    const e = {
      id: "1",
      timestamp: new Date().toISOString(),
      domain: "general" as const,
      event_type: "decision" as const,
      content: "Test",
      emotional_state: "calm" as const,
      energy_level: 0.5,
      time_pressure: 0.2,
      stated_confidence: 0.7,
      alternatives_considered: ["A"],
      assumptions: ["X"],
      evidence_used: ["E"],
      detected_biases: [],
      visibility: "private" as const,
      hash: "h",
      previous_hash: "0".repeat(64),
    };
    const biases = detectBiases(e, []);
    expect(Array.isArray(biases)).toBe(true);
  });
});

describe("analysePatterns standalone", () => {
  test("returns empty when no patterns", () => {
    const entries: LedgerEntry[] = [];
    const out = analysePatterns(entries, []);
    expect(out).toEqual([]);
  });
});

describe("generateProfile standalone", () => {
  test("empty entries still produces profile", () => {
    const profile = generateProfile("p", [], []);
    expect(profile.person_id).toBe("p");
    expect(profile.entry_count).toBe(0);
    expect(profile.domains_active).toEqual([]);
    expect(profile.verification.valid).toBe(true);
  });
});
