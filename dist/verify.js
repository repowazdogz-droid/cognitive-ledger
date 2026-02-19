"use strict";
/**
 * Cognitive Ledger Protocol (CLP-1.0) — hash chain verification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyChain = verifyChain;
const hash_1 = require("./hash");
function verifyChain(entries) {
    if (entries.length === 0) {
        return { valid: true, entries_checked: 0 };
    }
    let previousHash = hash_1.GENESIS_HASH;
    for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.previous_hash !== previousHash) {
            return { valid: false, entries_checked: i, broken_at: i };
        }
        const expected = (0, hash_1.hashEntry)(e.content, e.previous_hash, e.timestamp);
        if (e.hash !== expected) {
            return { valid: false, entries_checked: i, broken_at: i };
        }
        previousHash = e.hash;
    }
    return { valid: true, entries_checked: entries.length };
}
//# sourceMappingURL=verify.js.map