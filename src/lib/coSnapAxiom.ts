import {
  addCalendarDays,
  deriveWorkflowFacts,
  signatureLabel,
  type RuleResult,
  type WorkflowInputs,
  type WorkflowResult,
} from "@/lib/coSnapWorkflow";

const ENTITY = "Household";
const ENTITY_ID = "household";
const PERIOD = {
  period_kind: "custom",
  name: "month",
  start: "2026-06-01",
  end: "2026-06-30",
} as const;
const INTERVAL = {
  start: PERIOD.start,
  end: PERIOD.end,
} as const;

const MODULE = {
  application: "us-co:regulations/10-ccr-2506-1/4.202",
  interview: "us-co:regulations/10-ccr-2506-1/4.204",
  processing: "us-co:regulations/10-ccr-2506-1/4.205",
} as const;

const OUTPUT = {
  minimumContent: `${MODULE.application}#snap_incomplete_application_minimum_content_met`,
  signatureValid: `${MODULE.application}#snap_application_signature_valid`,
  applicationWithinValidity: `${MODULE.application}#snap_application_within_validity_period`,
  interviewRequirement: `${MODULE.interview}#applicant_household_interview_requirement_met`,
  missedInterviewTiming: `${MODULE.interview}#missed_interview_notice_and_denial_timing_compliant`,
  normalProcessing: `${MODULE.processing}#newly_certified_non_expedited_household_opportunity_to_participate_timely`,
  expeditedProcessing: `${MODULE.processing}#expedited_service_household_benefits_available_timely`,
  processingDayOne: `${MODULE.processing}#application_processing_day_one_set_from_correct_county_local_office_receipt`,
} as const;

const PARAMETER = {
  applicationValidityDays: `${MODULE.application}#snap_application_valid_calendar_day_limit`,
  interviewMonthLimit: `${MODULE.interview}#initial_and_periodic_interview_month_limit`,
  missedInterviewDenialDay: `${MODULE.interview}#missed_interview_application_denial_calendar_day`,
  normalProcessingDays: `${MODULE.processing}#normal_processing_opportunity_calendar_day_limit`,
  expeditedProcessingDays: `${MODULE.processing}#expedited_service_benefit_availability_calendar_day_limit`,
  processingDayOneOffset: `${MODULE.processing}#application_processing_day_one_calendar_day_offset`,
} as const;

type ScalarValue =
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

type CompiledArtifact = {
  program: {
    parameters: Array<{
      id: string;
      versions: Array<{
        values: Record<string, ScalarValue>;
      }>;
    }>;
  };
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

type AxiomOutputs = {
  minimumContent: boolean;
  signatureValid: boolean;
  applicationWithinValidity: boolean;
  interviewRequirement: boolean;
  missedInterviewTiming: boolean;
  normalProcessing: boolean;
  expeditedProcessing: boolean;
  processingDayOne: boolean;
};

type WorkflowParameters = {
  applicationValidityDays: number;
  interviewMonthLimit: number;
  missedInterviewDenialDay: number;
  normalProcessingDays: number;
  expeditedProcessingDays: number;
  processingDayOneOffset: number;
};

type AxiomArtifacts = {
  application: string;
  interview: string;
  processing: string;
};

export type CoSnapWorkflowRuntime = {
  engineVersion: string;
  artifactFormatVersion: number;
  runScenario: (inputs: WorkflowInputs, mode?: "explain" | "fast") => WorkflowResult;
};

let runtimePromise: Promise<CoSnapWorkflowRuntime> | null = null;

export function loadCoSnapWorkflowRuntime() {
  runtimePromise ??= createRuntime();
  return runtimePromise;
}

async function createRuntime(): Promise<CoSnapWorkflowRuntime> {
  const wasm = await loadWasmModule();
  await wasm.default({
    module_or_path: "/gallery/workflow/axiom-rules-engine/axiom_rules_engine_wasm_bg.wasm",
  });

  const modules = await loadRuleSpecModules();
  const artifacts: AxiomArtifacts = {
    application: wasm.compile(JSON.stringify(modules), MODULE.application),
    interview: wasm.compile(JSON.stringify(modules), MODULE.interview),
    processing: wasm.compile(JSON.stringify(modules), MODULE.processing),
  };
  const parameters = extractParameters({
    application: JSON.parse(artifacts.application) as CompiledArtifact,
    interview: JSON.parse(artifacts.interview) as CompiledArtifact,
    processing: JSON.parse(artifacts.processing) as CompiledArtifact,
  });

  function runScenario(
    inputs: WorkflowInputs,
    mode: "explain" | "fast" = "explain",
  ): WorkflowResult {
    const outputs = readOutputs({
      ...executeOutputs(wasm, artifacts.application, MODULE.application, inputs, mode, [
        OUTPUT.minimumContent,
        OUTPUT.signatureValid,
        OUTPUT.applicationWithinValidity,
      ]),
      ...executeOutputs(wasm, artifacts.interview, MODULE.interview, inputs, mode, [
        OUTPUT.interviewRequirement,
        OUTPUT.missedInterviewTiming,
      ]),
      ...executeOutputs(wasm, artifacts.processing, MODULE.processing, inputs, mode, [
        OUTPUT.normalProcessing,
        OUTPUT.expeditedProcessing,
        OUTPUT.processingDayOne,
      ]),
    });

    return buildWorkflowResult({
      inputs,
      parameters,
      outputs,
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

async function loadRuleSpecModules() {
  const entries = await Promise.all(
    Object.values(MODULE).map(async (target) => {
      const relativePath = target
        .replace("us-co:", "/gallery/workflow/rulespec/us-co/")
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

  return dynamicImport("/gallery/workflow/axiom-rules-engine/axiom_rules_engine_wasm.js");
}

function executeOutputs(
  wasm: AxiomWasmModule,
  artifact: string,
  target: string,
  inputs: WorkflowInputs,
  mode: "explain" | "fast",
  outputs: string[],
) {
  const response = JSON.parse(
    wasm.execute(artifact, JSON.stringify(buildRequest(inputs, mode, outputs, target))),
  ) as ExecutionResponse;
  const result = response.results[0];
  if (!result) {
    throw new Error("Axiom returned no result for the household query.");
  }
  return result.outputs;
}

function buildRequest(
  inputs: WorkflowInputs,
  mode: "explain" | "fast",
  outputs: string[],
  target: string,
) {
  const facts = deriveWorkflowFacts(inputs);
  const datasetInputs = [
    boolInput(MODULE.application, "application_form_contains_name", inputs.containsName),
    boolInput(
      MODULE.application,
      "application_form_contains_address",
      inputs.containsAddress,
    ),
    boolInput(
      MODULE.application,
      "application_form_signed_by_responsible_household_member",
      inputs.signedByHouseholdMember,
    ),
    boolInput(
      MODULE.application,
      "application_form_signed_by_household_authorized_representative",
      inputs.signedByAuthorizedRepresentative,
    ),
    boolInput(
      MODULE.application,
      "handwritten_signature_provided",
      inputs.signatureMethod === "handwritten",
    ),
    boolInput(
      MODULE.application,
      "electronic_signature_technique_used",
      inputs.signatureMethod === "electronic",
    ),
    boolInput(
      MODULE.application,
      "recorded_telephonic_signature_provided",
      inputs.signatureMethod === "telephonic",
    ),
    boolInput(
      MODULE.application,
      "documented_gestured_signature_provided",
      inputs.signatureMethod === "gesture",
    ),
    boolInput(
      MODULE.application,
      "handwritten_signature_designates_x",
      inputs.signatureMethod === "x-mark",
    ),
    integerInput(
      MODULE.application,
      "days_since_application_filed",
      facts.daysSinceApplication,
    ),
    boolInput(
      MODULE.application,
      "snap_eligibility_has_been_determined",
      inputs.eligibilityDetermined,
    ),
    boolInput(
      MODULE.interview,
      "household_underwent_phone_or_face_to_face_interview_with_qualified_eligibility_technician_before_initial_certification",
      inputs.interviewCompleted,
    ),
    integerInput(
      MODULE.interview,
      "months_since_last_household_interview",
      inputs.monthsSinceLastInterview,
    ),
    boolInput(
      MODULE.interview,
      "household_failed_to_attend_scheduled_interview",
      inputs.missedInterview,
    ),
    boolInput(
      MODULE.interview,
      "local_office_mailed_notice_of_missed_interview_to_household",
      inputs.missedInterviewNoticeMailed,
    ),
    boolInput(
      MODULE.interview,
      "notice_informed_household_it_missed_scheduled_interview",
      inputs.missedInterviewNoticeSaysMissed,
    ),
    boolInput(
      MODULE.interview,
      "notice_informed_household_responsible_for_rescheduling_interview",
      inputs.missedInterviewNoticeSaysReschedule,
    ),
    boolInput(
      MODULE.interview,
      "household_scheduled_subsequent_interview_within_calendar_days_after_application",
      inputs.subsequentInterviewScheduled,
    ),
    integerInput(
      MODULE.interview,
      "local_office_denied_application_on_calendar_day_from_application",
      inputs.denialDayAfterApplication,
    ),
    boolInput(
      MODULE.interview,
      "application_denied_before_thirtieth_day",
      inputs.denialDayAfterApplication < 30,
    ),
    boolInput(
      MODULE.processing,
      "household_newly_certified",
      inputs.newlyCertified,
    ),
    boolInput(
      MODULE.processing,
      "household_given_expedited_service",
      inputs.expeditedService,
    ),
    boolInput(
      MODULE.processing,
      "household_given_opportunity_to_participate",
      Boolean(inputs.opportunityDate),
    ),
    integerInput(
      MODULE.processing,
      "calendar_days_following_application_filing_before_opportunity_to_participate",
      facts.opportunityDaysAfterApplication,
    ),
    boolInput(
      MODULE.processing,
      "household_entitled_to_expedited_service",
      inputs.expeditedService,
    ),
    boolInput(
      MODULE.processing,
      "benefits_available_to_household",
      Boolean(inputs.benefitsAvailableDate),
    ),
    integerInput(
      MODULE.processing,
      "calendar_days_following_application_before_benefits_available",
      facts.benefitsDaysAfterApplication,
    ),
    boolInput(
      MODULE.processing,
      "application_received_by_local_office_in_correct_county",
      Boolean(inputs.correctCountyReceivedDate),
    ),
    integerInput(
      MODULE.processing,
      "application_processing_day_one_calendar_days_after_receipt",
      facts.applicationProcessingDayOneOffset,
    ),
  ];

  return {
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
}

function buildWorkflowResult({
  inputs,
  parameters,
  outputs,
  engineVersion,
  artifactFormatVersion,
}: {
  inputs: WorkflowInputs;
  parameters: WorkflowParameters;
  outputs: AxiomOutputs;
  engineVersion: string;
  artifactFormatVersion: number;
}): WorkflowResult {
  const facts = deriveWorkflowFacts(inputs);
  const normalDeadline = addCalendarDays(
    inputs.applicationDate,
    parameters.normalProcessingDays,
  );
  const expeditedDeadline = addCalendarDays(
    inputs.applicationDate,
    parameters.expeditedProcessingDays,
  );
  const applicationValidityDeadline = addCalendarDays(
    inputs.applicationDate,
    parameters.applicationValidityDays,
  );
  const processingDayOne = addCalendarDays(
    inputs.correctCountyReceivedDate,
    parameters.processingDayOneOffset,
  );
  const missedInterviewDueDate = addCalendarDays(
    inputs.applicationDate,
    parameters.missedInterviewDenialDay,
  );

  const results: RuleResult[] = [
    {
      id: "minimum-content",
      label: "Minimum application content",
      status: outputs.minimumContent ? "pass" : "fail",
      section: "10 CCR 2506-1 4.202(A)",
      target: OUTPUT.minimumContent,
      detail: outputs.minimumContent
        ? "Axiom returned that the filing has the required name, address, and signature path."
        : "Axiom returned that the filing is missing name, address, or a responsible household or authorized representative signature.",
    },
    {
      id: "signature",
      label: "Signature validity",
      status: outputs.signatureValid ? "pass" : "fail",
      section: "10 CCR 2506-1 4.202(A)",
      target: OUTPUT.signatureValid,
      detail: outputs.signatureValid
        ? `Axiom accepted the ${signatureLabel(inputs.signatureMethod).toLowerCase()} signature method.`
        : "Axiom did not find an accepted signature method.",
    },
    {
      id: "validity-window",
      label: "Application validity window",
      status: outputs.applicationWithinValidity ? "pass" : "warning",
      section: "10 CCR 2506-1 4.202(F)",
      target: OUTPUT.applicationWithinValidity,
      dueDate: applicationValidityDeadline,
      detail: outputs.applicationWithinValidity
        ? `Axiom returned that the application remains inside the ${parameters.applicationValidityDays}-day validity window.`
        : "Axiom returned that the application is outside the validity window or eligibility has already been determined.",
    },
    {
      id: "interview",
      label: "Interview requirement",
      status: outputs.interviewRequirement ? "pass" : "warning",
      section: "10 CCR 2506-1 4.204(A)",
      target: OUTPUT.interviewRequirement,
      detail: outputs.interviewRequirement
        ? `Axiom returned that the household interview requirement is met within the ${parameters.interviewMonthLimit}-month period.`
        : `Axiom returned that the household interview requirement is not met within the ${parameters.interviewMonthLimit}-month period.`,
    },
    {
      id: "missed-interview",
      label: "Missed interview notice and denial timing",
      status: inputs.missedInterview
        ? outputs.missedInterviewTiming
          ? "pass"
          : "fail"
        : "info",
      section: "10 CCR 2506-1 4.204(C)",
      target: OUTPUT.missedInterviewTiming,
      dueDate: missedInterviewDueDate,
      detail: inputs.missedInterview
        ? outputs.missedInterviewTiming
          ? "Axiom returned that the missed-interview notice and denial timing conditions are satisfied."
          : "Axiom returned that the missed-interview notice or denial timing conditions are not satisfied."
        : "No missed interview is marked for this case; the Axiom output is not treated as an active issue.",
    },
    {
      id: "normal-processing",
      label: "30-day opportunity deadline",
      status: outputs.normalProcessing ? "pass" : "fail",
      section: "10 CCR 2506-1 4.205",
      target: OUTPUT.normalProcessing,
      dueDate: normalDeadline,
      detail: outputs.normalProcessing
        ? "Axiom returned that the normal processing opportunity-to-participate timing is satisfied."
        : "Axiom returned that the normal processing opportunity-to-participate timing is not satisfied.",
    },
    {
      id: "expedited-processing",
      label: "7-day expedited benefit deadline",
      status: inputs.expeditedService
        ? outputs.expeditedProcessing
          ? "pass"
          : "fail"
        : "info",
      section: "10 CCR 2506-1 4.205",
      target: OUTPUT.expeditedProcessing,
      dueDate: expeditedDeadline,
      detail: inputs.expeditedService
        ? outputs.expeditedProcessing
          ? "Axiom returned that expedited benefits are available within the seven-day deadline."
          : "Axiom returned that expedited benefits are not available within the seven-day deadline."
        : "Expedited service is not selected; Axiom treats the expedited timing condition as not applicable.",
    },
    {
      id: "day-one",
      label: "Processing day one",
      status: outputs.processingDayOne ? "pass" : "fail",
      section: "10 CCR 2506-1 4.205",
      target: OUTPUT.processingDayOne,
      dueDate: processingDayOne,
      detail: outputs.processingDayOne
        ? `Axiom returned that processing day one is set from correct-county local office receipt; derived day count input was ${facts.applicationProcessingDayOneOffset}.`
        : "Axiom returned that processing day one is not set from correct-county local office receipt.",
    },
  ];

  return {
    daysSinceApplication: facts.daysSinceApplication,
    processingDayOne,
    normalDeadline,
    expeditedDeadline,
    applicationValidityDeadline,
    passCount: results.filter((result) => result.status === "pass").length,
    failCount: results.filter((result) => result.status === "fail").length,
    warningCount: results.filter((result) => result.status === "warning").length,
    results,
    engineVersion,
    artifactFormatVersion,
  };
}

function boolInput(target: string, name: string, value: boolean) {
  return input(target, name, { kind: "bool", value });
}

function integerInput(target: string, name: string, value: number) {
  return input(target, name, { kind: "integer", value: Math.trunc(value) });
}

function input(target: string, name: string, value: ScalarValue) {
  return {
    name: `${target}#input.${name}`,
    entity: ENTITY,
    entity_id: ENTITY_ID,
    interval: INTERVAL,
    value,
  };
}

function readOutputs(outputs: Record<string, OutputValue>): AxiomOutputs {
  return {
    minimumContent: readJudgmentOutput(outputs[OUTPUT.minimumContent]),
    signatureValid: readJudgmentOutput(outputs[OUTPUT.signatureValid]),
    applicationWithinValidity: readJudgmentOutput(
      outputs[OUTPUT.applicationWithinValidity],
    ),
    interviewRequirement: readJudgmentOutput(outputs[OUTPUT.interviewRequirement]),
    missedInterviewTiming: readJudgmentOutput(outputs[OUTPUT.missedInterviewTiming]),
    normalProcessing: readJudgmentOutput(outputs[OUTPUT.normalProcessing]),
    expeditedProcessing: readJudgmentOutput(outputs[OUTPUT.expeditedProcessing]),
    processingDayOne: readJudgmentOutput(outputs[OUTPUT.processingDayOne]),
  };
}

function readJudgmentOutput(output: OutputValue | undefined) {
  if (!output || output.kind !== "judgment") {
    throw new Error("Axiom did not return the expected judgment output.");
  }
  return output.outcome === "holds";
}

function extractParameters(artifacts: {
  application: CompiledArtifact;
  interview: CompiledArtifact;
  processing: CompiledArtifact;
}): WorkflowParameters {
  return {
    applicationValidityDays: readParameter(
      artifacts.application,
      PARAMETER.applicationValidityDays,
    ),
    interviewMonthLimit: readParameter(
      artifacts.interview,
      PARAMETER.interviewMonthLimit,
    ),
    missedInterviewDenialDay: readParameter(
      artifacts.interview,
      PARAMETER.missedInterviewDenialDay,
    ),
    normalProcessingDays: readParameter(
      artifacts.processing,
      PARAMETER.normalProcessingDays,
    ),
    expeditedProcessingDays: readParameter(
      artifacts.processing,
      PARAMETER.expeditedProcessingDays,
    ),
    processingDayOneOffset: readParameter(
      artifacts.processing,
      PARAMETER.processingDayOneOffset,
    ),
  };
}

function readParameter(artifact: CompiledArtifact, id: string) {
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
