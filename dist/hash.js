"use strict";
/**
 * Cognitive Ledger Protocol (CLP-1.0) — SHA-256 hashing and ID generation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENESIS_HASH = void 0;
exports.sha256 = sha256;
exports.hashEntry = hashEntry;
exports.generateId = generateId;
const crypto_1 = require("crypto");
const GENESIS_HASH = "0".repeat(64);
exports.GENESIS_HASH = GENESIS_HASH;
function sha256(input) {
    return (0, crypto_1.createHash)("sha256").update(input, "utf8").digest("hex");
}
/**
 * Canonical hash for chain integrity: content + previousHash + timestamp.
 */
function hashEntry(content, previousHash, timestamp) {
    const payload = [content, previousHash, timestamp].join("\n");
    return sha256(payload);
}
function generateId() {
    const t = Date.now().toString(16);
    const r = (0, crypto_1.randomBytes)(4).toString("hex");
    return (t + r).slice(0, 16);
}
//# sourceMappingURL=hash.js.map