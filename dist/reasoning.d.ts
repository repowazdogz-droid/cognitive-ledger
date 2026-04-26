/**
 * Cognitive Ledger Protocol (CLP-2.0) — runtime checks for typed reasoning steps.
 */
import type { ReasoningOperationType, ReasoningStep, ReasoningTypecheck, ReasoningValueType } from "./types";
declare const OPERATION_RULE_SCHEMAS: Record<ReasoningOperationType, {
    rule_schema: string;
    min_inputs: number;
    output_types: ReasoningValueType[];
}>;
export declare function buildRuleSignature(step: Pick<ReasoningStep, "input_type" | "operation_type" | "output_type" | "rule_schema">): string;
export declare function validateReasoningStep(step: ReasoningStep): ReasoningTypecheck;
export declare function validateReasoningSteps(steps: ReasoningStep[]): ReasoningTypecheck;
export declare function normalizeReasoningSteps(steps?: ReasoningStep[]): ReasoningStep[];
export { OPERATION_RULE_SCHEMAS };
//# sourceMappingURL=reasoning.d.ts.map