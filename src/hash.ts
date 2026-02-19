/**
 * Cognitive Ledger Protocol (CLP-1.0) — SHA-256 hashing and ID generation.
 */

import { createHash, randomBytes } from "crypto";

const GENESIS_HASH = "0".repeat(64);

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Canonical hash for chain integrity: content + previousHash + timestamp.
 */
export function hashEntry(
  content: string,
  previousHash: string,
  timestamp: string
): string {
  const payload = [content, previousHash, timestamp].join("\n");
  return sha256(payload);
}

export function generateId(): string {
  const t = Date.now().toString(16);
  const r = randomBytes(4).toString("hex");
  return (t + r).slice(0, 16);
}

export { GENESIS_HASH };
