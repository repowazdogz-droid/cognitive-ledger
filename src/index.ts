/**
 * Cognitive Ledger Protocol (CLP-2.0) — public API.
 */

export { CognitiveLedger } from "./ledger";
export type { VerifyResult } from "./ledger";
export { detectBiases } from "./bias-detector";
export { analysePatterns } from "./pattern-analyser";
export { generatePrompts } from "./generative-engine";
export { generateProfile } from "./profile-generator";
export {
  sha256,
  hashEntry,
  hashEntryV2,
  canonicalStringify,
  v2HashPayload,
  generateId,
  GENESIS_HASH,
} from "./hash";
export { verifyChain } from "./verify";
export {
  buildRuleSignature,
  normalizeReasoningSteps,
  validateReasoningStep,
  validateReasoningSteps,
  OPERATION_RULE_SCHEMAS,
} from "./reasoning";
export {
  migrateV1ChainToV2,
  migrateV1EntryToV2,
  migrateV1LedgerJSONToV2,
} from "./migration";
export type {
  EmotionalState,
  BiasType,
  Domain,
  Visibility,
  EventType,
  SchemaVersion,
  HashVersion,
  ReasoningStepKind,
  ReasoningValueType,
  ReasoningOperationType,
  ReasoningTypecheck,
  ReasoningStep,
  FaithfulnessStatus,
  FaithfulnessCertificationMethod,
  FaithfulnessCertificationMetrics,
  FaithfulnessCertificationGate,
  FaithfulnessCertification,
  LedgerEntry,
  LedgerEntryOutcome,
  BiasDetection,
  CognitivePattern,
  GenerativePrompt,
  ReasoningProfile,
  EntryInput,
  OutcomeInput,
} from "./types";
