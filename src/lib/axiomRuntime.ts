import type {
  SnapStateUi,
  StateId,
  WorkflowInputs,
  WorkflowResult,
} from "@/lib/snapWorkflow";

export const ENTITY = "Household";
export const ENTITY_ID = "household";
export const PERIOD = {
  period_kind: "custom",
  name: "month",
  start: "2026-06-01",
  end: "2026-06-30",
} as const;
export const INTERVAL = {
  start: PERIOD.start,
  end: PERIOD.end,
} as const;

export type ModuleKey = "application" | "interview" | "processing";

const MODULE_KEYS: ModuleKey[] = ["application", "interview", "processing"];

export type ScalarValue =
  | { kind: "bool"; value: boolean }
  | { kind: "integer"; value: number }
  | { kind: "decimal"; value: string }
  | { kind: "text"; value: string }
  | { kind: "date"; value: string };

type OutputValue =
  | {
      kind: "scalar";
      name: string;
      id?: string;
      dtype: string;
      unit: string | null;
      value: ScalarValue;
    }
  | {
      kind: "judgment";
      name: string;
      id?: string;
      unit: string | null;
      outcome: "holds" | "not_holds";
    };

type ExecutionResponse = {
  metadata: {
    requested_mode: "explain" | "fast";
    actual_mode: "explain" | "fast";
    fallback_reason: string | null;
  };
  results: Array<{
    outputs: Record<string, OutputValue>;
  }>;
};

export type CompiledArtifact = {
  program: {
    parameters: Array<{
      id: string;
      versions: Array<{
        values: Record<string, ScalarValue>;
      }>;
    }>;
  };
};

export type InputRecord = {
  name: string;
  entity: string;
  entity_id: string;
  interval: typeof INTERVAL;
  value: ScalarValue;
};

export type StateRuntimeContext = {
  inputs: WorkflowInputs;
  parameters: Record<string, number>;
  judgments: Record<string, boolean>;
  engineVersion: string;
  artifactFormatVersion: number;
};

export type StateDefinition = {
  id: StateId;
  rulespecPrefix: string;
  modules: Record<ModuleKey, string>;
  outputs: Record<ModuleKey, string[]>;
  extractParameters: (
    artifacts: Record<ModuleKey, CompiledArtifact>,
  ) => Record<string, number>;
  buildDatasetInputs: (inputs: WorkflowInputs) => InputRecord[];
  buildResults: (context: StateRuntimeContext) => WorkflowResult;
};

export type SnapState = {
  ui: SnapStateUi;
  definition: StateDefinition;
};

type AxiomWasmModule = {
  default: (options?: {
    module_or_path?: string | ArrayBuffer | Uint8Array;
  }) => Promise<unknown>;
  compile: (modulesJson: string, rootTarget: string) => string;
  execute: (artifactJson: string, requestJson: string) => string;
  engine_version: () => string;
  artifact_format_version: () => number;
};

export type SnapWorkflowRuntime = {
  engineVersion: string;
  artifactFormatVersion: number;
  runScenario: (inputs: WorkflowInputs, mode?: "explain" | "fast") => WorkflowResult;
};

const runtimeCache = new Map<StateId, Promise<SnapWorkflowRuntime>>();

export function loadSnapWorkflowRuntime(definition: StateDefinition) {
  const cached = runtimeCache.get(definition.id) ?? createRuntime(definition);
  runtimeCache.set(definition.id, cached);
  return cached;
}

async function createRuntime(
  definition: StateDefinition,
): Promise<SnapWorkflowRuntime> {
  const wasm = await loadWasmModule();
  await wasm.default({
    module_or_path: "/workflow/axiom-rules-engine/axiom_rules_engine_wasm_bg.wasm",
  });

  const modules = await loadRuleSpecModules(definition);
  const compiledByTarget = new Map(
    [...new Set(Object.values(definition.modules))].map((target) => [
      target,
      wasm.compile(JSON.stringify(modules), target),
    ]),
  );
  const artifacts = Object.fromEntries(
    MODULE_KEYS.map((key) => [
      key,
      compiledByTarget.get(definition.modules[key]) as string,
    ]),
  ) as Record<ModuleKey, string>;
  const parameters = definition.extractParameters(
    Object.fromEntries(
      MODULE_KEYS.map((key) => [
        key,
        JSON.parse(artifacts[key]) as CompiledArtifact,
      ]),
    ) as Record<ModuleKey, CompiledArtifact>,
  );

  function runScenario(
    inputs: WorkflowInputs,
    mode: "explain" | "fast" = "explain",
  ): WorkflowResult {
    const datasetInputs = definition.buildDatasetInputs(inputs);
    const judgments: Record<string, boolean> = {};

    for (const key of MODULE_KEYS) {
      if (definition.outputs[key].length === 0) {
        continue;
      }
      const outputs = executeOutputs(
        wasm,
        artifacts[key],
        definition.modules[key],
        datasetInputs,
        mode,
        definition.outputs[key],
      );
      for (const target of definition.outputs[key]) {
        judgments[target] = readJudgmentOutput(outputs[target]);
      }
    }

    return definition.buildResults({
      inputs,
      parameters,
      judgments,
      engineVersion: wasm.engine_version(),
      artifactFormatVersion: wasm.artifact_format_version(),
    });
  }

  return {
    engineVersion: wasm.engine_version(),
    artifactFormatVersion: wasm.artifact_format_version(),
    runScenario,
  };
}

async function loadRuleSpecModules(definition: StateDefinition) {
  const entries = await Promise.all(
    [...new Set(Object.values(definition.modules))].map(async (target) => {
      const relativePath = target
        .replace(
          `${definition.rulespecPrefix}:`,
          `/workflow/rulespec/${definition.rulespecPrefix}/`,
        )
        .concat(".yaml");
      const text = await fetch(relativePath).then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load RuleSpec module ${target}`);
        }
        return response.text();
      });
      return [target, text] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function loadWasmModule(): Promise<AxiomWasmModule> {
  const dynamicImport = new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<AxiomWasmModule>;

  return dynamicImport("/workflow/axiom-rules-engine/axiom_rules_engine_wasm.js");
}

function executeOutputs(
  wasm: AxiomWasmModule,
  artifact: string,
  target: string,
  datasetInputs: InputRecord[],
  mode: "explain" | "fast",
  outputs: string[],
) {
  const request = {
    mode,
    dataset: {
      inputs: datasetInputs.filter((inputRecord) =>
        inputRecord.name.startsWith(`${target}#input.`),
      ),
      relations: [],
    },
    queries: [
      {
        entity_id: ENTITY_ID,
        period: PERIOD,
        outputs,
      },
    ],
  };
  const response = JSON.parse(
    wasm.execute(artifact, JSON.stringify(request)),
  ) as ExecutionResponse;
  const result = response.results[0];
  if (!result) {
    throw new Error("Axiom returned no result for the household query.");
  }
  return result.outputs;
}

export function boolInput(target: string, name: string, value: boolean) {
  return input(target, name, { kind: "bool", value });
}

export function integerInput(target: string, name: string, value: number) {
  return input(target, name, { kind: "integer", value: Math.trunc(value) });
}

function input(target: string, name: string, value: ScalarValue): InputRecord {
  return {
    name: `${target}#input.${name}`,
    entity: ENTITY,
    entity_id: ENTITY_ID,
    interval: INTERVAL,
    value,
  };
}

function readJudgmentOutput(output: OutputValue | undefined) {
  if (!output || output.kind !== "judgment") {
    throw new Error("Axiom did not return the expected judgment output.");
  }
  return output.outcome === "holds";
}

export function readParameter(artifact: CompiledArtifact, id: string) {
  const parameter = artifact.program.parameters.find((item) => item.id === id);
  const value = parameter?.versions[0]?.values["0"];
  if (!value) {
    throw new Error(`Compiled RuleSpec artifact did not include parameter ${id}.`);
  }
  return readScalarValue(value);
}

function readScalarValue(value: ScalarValue) {
  if (value.kind === "decimal") {
    return Number(value.value);
  }
  if (value.kind === "integer") {
    return value.value;
  }
  throw new Error(`Expected numeric value, received ${value.kind}.`);
}
