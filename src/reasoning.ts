/**
 * Cognitive Ledger Protocol (CLP-2.0) — runtime checks for typed reasoning steps.
 */

import type {
  ReasoningOperationType,
  ReasoningStep,
  ReasoningTypecheck,
  ReasoningValueType,
} from "./types";

const VALUE_TYPES: ReasoningValueType[] = [
  "text",
  "boolean",
  "number",
  "probability",
  "quantity",
  "money",
  "duration",
  "date",
  "category",
  "evidence_ref",
  "decision",
];

const OPERATION_RULE_SCHEMAS: Record<
  ReasoningOperationType,
  {
    rule_schema: string;
    min_inputs: number;
    output_types: ReasoningValueType[];
  }
> = {
  assert: {
    rule_schema: "pc-cot/assert/v1",
    min_inputs: 0,
    output_types: VALUE_TYPES,
  },
  observe: {
    rule_schema: "pc-cot/observe/v1",
    min_inputs: 0,
    output_types: ["text", "number", "boolean", "quantity", "date", "evidence_ref"],
  },
  assume: {
    rule_schema: "pc-cot/assume/v1",
    min_inputs: 0,
    output_types: VALUE_TYPES,
  },
  infer: {
    rule_schema: "pc-cot/infer/v1",
    min_inputs: 1,
    output_types: VALUE_TYPES,
  },
  calculate: {
    rule_schema: "pc-cot/calculate/v1",
    min_inputs: 1,
    output_types: ["number", "probability", "quantity", "money", "duration"],
  },
  retrieve: {
    rule_schema: "pc-cot/retrieve/v1",
    min_inputs: 1,
    output_types: ["text", "evidence_ref", "number", "boolean", "date"],
  },
  compare: {
    rule_schema: "pc-cot/compare/v1",
    min_inputs: 2,
    output_types: ["boolean", "category", "decision", "text"],
  },
  transform: {
    rule_schema: "pc-cot/transform/v1",
    min_inputs: 1,
    output_types: VALUE_TYPES,
  },
  conclude: {
    rule_schema: "pc-cot/conclude/v1",
    min_inputs: 1,
    output_types: ["decision", "text", "boolean", "category"],
  },
  reflect: {
    rule_schema: "pc-cot/reflect/v1",
    min_inputs: 1,
    output_types: ["text", "category", "decision"],
  },
};

export function buildRuleSignature(step: Pick<
  ReasoningStep,
  "input_type" | "operation_type" | "output_type" | "rule_schema"
>): string {
  return `${step.rule_schema}:${step.operation_type}(${step.input_type.join(",")})->${step.output_type}`;
}

function isKnownValueType(value: string): value is ReasoningValueType {
  return VALUE_TYPES.includes(value as ReasoningValueType);
}

function valueMatchesType(
  value: string | number | boolean | undefined,
  type: ReasoningValueType
): boolean {
  if (value === undefined) return true;
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number" || type === "quantity" || type === "money" || type === "duration") {
    return typeof value === "number" && Number.isFinite(value);
  }
  if (type === "probability") {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
  }
  if (type === "date") {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
  }
  return typeof value === "string";
}

export function validateReasoningStep(step: ReasoningStep): ReasoningTypecheck {
  const errors: string[] = [];

  if (!step.id) errors.push("id is required");
  if (!Number.isInteger(step.index) || step.index < 0) {
    errors.push("index must be a non-negative integer");
  }
  if (!step.statement) errors.push("statement is required");
  if (!Array.isArray(step.input_type)) errors.push("input_type must be an array");
  if (!Array.isArray(step.depends_on)) errors.push("depends_on must be an array");
  if (!Array.isArray(step.evidence_refs)) errors.push("evidence_refs must be an array");
  if (!step.rule_schema) errors.push("rule_schema is required");

  for (const inputType of step.input_type ?? []) {
    if (!isKnownValueType(inputType)) {
      errors.push(`unknown input_type: ${inputType}`);
    }
  }
  if (!isKnownValueType(step.output_type)) {
    errors.push(`unknown output_type: ${step.output_type}`);
  }

  const rule = OPERATION_RULE_SCHEMAS[step.operation_type];
  if (!rule) {
    errors.push(`unknown operation_type: ${step.operation_type}`);
  } else {
    if (step.rule_schema !== rule.rule_schema) {
      errors.push(
        `rule_schema must be ${rule.rule_schema} for ${step.operation_type}`
      );
    }
    if ((step.input_type?.length ?? 0) < rule.min_inputs) {
      errors.push(
        `${step.operation_type} requires at least ${rule.min_inputs} input type(s)`
      );
    }
    if (!rule.output_types.includes(step.output_type)) {
      errors.push(
        `${step.operation_type} cannot output ${step.output_type}`
      );
    }
  }

  if (!valueMatchesType(step.value, step.output_type)) {
    errors.push(`value does not match output_type ${step.output_type}`);
  }

  const signature = buildRuleSignature(step);
  if (step.rule_signature !== undefined && step.rule_signature !== signature) {
    errors.push("rule_signature does not match runtime signature");
  }

  return {
    valid: errors.length === 0,
    errors,
    signature,
  };
}

export function validateReasoningSteps(steps: ReasoningStep[]): ReasoningTypecheck {
  const errors: string[] = [];
  const ids = new Set<string>();
  const indexes = new Set<number>();

  for (const step of steps) {
    const result = validateReasoningStep(step);
    errors.push(...result.errors.map((error) => `${step.id || "unknown"}: ${error}`));
    if (ids.has(step.id)) errors.push(`${step.id}: duplicate id`);
    ids.add(step.id);
    if (indexes.has(step.index)) errors.push(`${step.id}: duplicate index`);
    indexes.add(step.index);
  }

  const byId = new Map(steps.map((step) => [step.id, step]));
  for (const step of steps) {
    for (const dependency of step.depends_on) {
      const parent = byId.get(dependency);
      if (!parent) {
        errors.push(`${step.id}: missing dependency ${dependency}`);
      } else if (parent.index >= step.index) {
        errors.push(`${step.id}: dependency ${dependency} must precede step`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    signature: `steps:${steps.length}`,
  };
}

export function normalizeReasoningSteps(steps: ReasoningStep[] = []): ReasoningStep[] {
  const cloned = steps.map((step) => {
    const typecheck = validateReasoningStep(step);
    return {
      ...step,
      depends_on: [...(step.depends_on ?? [])],
      evidence_refs: [...(step.evidence_refs ?? [])],
      input_type: [...(step.input_type ?? [])],
      rule_signature: typecheck.signature,
      typecheck,
    };
  });

  const chainCheck = validateReasoningSteps(cloned);
  if (chainCheck.valid) return cloned;

  return cloned.map((step) => {
    const stepErrors = chainCheck.errors
      .filter((error) => error.startsWith(`${step.id}:`))
      .map((error) => error.slice(step.id.length + 2));
    if (stepErrors.length === 0) return step;
    return {
      ...step,
      typecheck: {
        ...step.typecheck,
        valid: false,
        errors: Array.from(new Set([...step.typecheck.errors, ...stepErrors])),
      },
    };
  });
}

export { OPERATION_RULE_SCHEMAS };
