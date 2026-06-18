export type SignatureMethod =
  | "handwritten"
  | "electronic"
  | "telephonic"
  | "gesture"
  | "x-mark"
  | "none";

export type WorkflowInputs = {
  applicationDate: string;
  currentDate: string;
  correctCountyReceivedDate: string;
  containsName: boolean;
  containsAddress: boolean;
  signedByHouseholdMember: boolean;
  signedByAuthorizedRepresentative: boolean;
  signatureMethod: SignatureMethod;
  eligibilityDetermined: boolean;
  newlyCertified: boolean;
  expeditedService: boolean;
  opportunityDate: string;
  benefitsAvailableDate: string;
  interviewCompleted: boolean;
  monthsSinceLastInterview: number;
  missedInterview: boolean;
  subsequentInterviewScheduled: boolean;
  householdCertificationMonths: number;
  householdRequestsInterview: boolean;
  outstandingRecertificationIssue: boolean;
};

export type RuleStatus = "pass" | "warning" | "fail" | "info";

export type RuleResult = {
  id: string;
  label: string;
  status: RuleStatus;
  section: string;
  target: string;
  detail: string;
  dueDate?: string;
};

export type WorkflowResult = {
  daysSinceApplication: number;
  processingDayOne: string;
  normalDeadline: string;
  expeditedDeadline: string;
  applicationValidityDeadline: string;
  passCount: number;
  failCount: number;
  warningCount: number;
  results: RuleResult[];
};

export const DEFAULT_WORKFLOW_INPUTS: WorkflowInputs = {
  applicationDate: "2026-06-01",
  currentDate: "2026-06-18",
  correctCountyReceivedDate: "2026-06-01",
  containsName: true,
  containsAddress: true,
  signedByHouseholdMember: true,
  signedByAuthorizedRepresentative: false,
  signatureMethod: "electronic",
  eligibilityDetermined: false,
  newlyCertified: true,
  expeditedService: false,
  opportunityDate: "2026-06-25",
  benefitsAvailableDate: "2026-06-06",
  interviewCompleted: true,
  monthsSinceLastInterview: 0,
  missedInterview: false,
  subsequentInterviewScheduled: false,
  householdCertificationMonths: 12,
  householdRequestsInterview: false,
  outstandingRecertificationIssue: false,
};

const RULESPEC = {
  minimumContent:
    "us-co:regulations/10-ccr-2506-1/4.202#snap_incomplete_application_minimum_content_met",
  signatureValid:
    "us-co:regulations/10-ccr-2506-1/4.202#snap_application_signature_valid",
  applicationValidity:
    "us-co:regulations/10-ccr-2506-1/4.202#snap_application_within_validity_period",
  interviewRequirement:
    "us-co:regulations/10-ccr-2506-1/4.204#applicant_household_interview_requirement_met",
  missedInterview:
    "us-co:regulations/10-ccr-2506-1/4.204#missed_interview_application_denial_calendar_day",
  normalProcessing:
    "us-co:regulations/10-ccr-2506-1/4.205#newly_certified_non_expedited_household_opportunity_to_participate_timely",
  expeditedProcessing:
    "us-co:regulations/10-ccr-2506-1/4.205#expedited_service_household_benefits_available_timely",
  processingDayOne:
    "us-co:regulations/10-ccr-2506-1/4.205#application_processing_day_one_set_from_correct_county_local_office_receipt",
} as const;

export function evaluateWorkflow(inputs: WorkflowInputs): WorkflowResult {
  const applicationDate = parseDate(inputs.applicationDate);
  const currentDate = parseDate(inputs.currentDate);
  const receivedDate = parseDate(inputs.correctCountyReceivedDate);
  const opportunityDate = parseDate(inputs.opportunityDate);
  const benefitsDate = parseDate(inputs.benefitsAvailableDate);

  const daysSinceApplication = differenceInCalendarDays(
    currentDate,
    applicationDate,
  );
  const processingDayOne = addDays(receivedDate, 1);
  const normalDeadline = addDays(applicationDate, 30);
  const expeditedDeadline = addDays(applicationDate, 7);
  const applicationValidityDeadline = addDays(applicationDate, 60);

  const signatureProvided =
    inputs.signedByHouseholdMember || inputs.signedByAuthorizedRepresentative;
  const validSignatureMethod = inputs.signatureMethod !== "none";
  const minimumContent =
    inputs.containsName &&
    inputs.containsAddress &&
    signatureProvided &&
    validSignatureMethod;
  const applicationStillValid =
    daysSinceApplication <= 60 && !inputs.eligibilityDetermined;
  const interviewRequirementMet =
    inputs.interviewCompleted && inputs.monthsSinceLastInterview <= 12;
  const missedInterviewDenialAllowed =
    inputs.missedInterview &&
    daysSinceApplication >= 30 &&
    !inputs.subsequentInterviewScheduled;
  const normalProcessingTimely =
    !inputs.newlyCertified ||
    inputs.expeditedService ||
    compareDates(opportunityDate, normalDeadline) <= 0;
  const expeditedProcessingTimely =
    !inputs.expeditedService || compareDates(benefitsDate, expeditedDeadline) <= 0;
  const dayOneCorrect =
    inputs.correctCountyReceivedDate.length > 0 &&
    compareDates(processingDayOne, addDays(applicationDate, 1)) === 0;

  const twentyFourMonthException =
    inputs.householdCertificationMonths === 24 &&
    !inputs.householdRequestsInterview &&
    !inputs.outstandingRecertificationIssue;

  const results: RuleResult[] = [
    {
      id: "minimum-content",
      label: "Minimum application content",
      status: minimumContent ? "pass" : "fail",
      section: "10 CCR 2506-1 4.202(A)",
      target: RULESPEC.minimumContent,
      detail: minimumContent
        ? "The filing has name, address, and an accepted signature path."
        : "A SNAP filing needs name, address, and a responsible household or authorized representative signature.",
    },
    {
      id: "signature",
      label: "Signature validity",
      status: validSignatureMethod ? "pass" : "fail",
      section: "10 CCR 2506-1 4.202(A)",
      target: RULESPEC.signatureValid,
      detail: validSignatureMethod
        ? `${signatureLabel(inputs.signatureMethod)} signature method selected.`
        : "Select an accepted signature method before treating the application as signed.",
    },
    {
      id: "validity-window",
      label: "Application validity window",
      status: applicationStillValid ? "pass" : "warning",
      section: "10 CCR 2506-1 4.202(F)",
      target: RULESPEC.applicationValidity,
      dueDate: formatDate(applicationValidityDeadline),
      detail: applicationStillValid
        ? `The application is ${daysSinceApplication} calendar days old and remains inside the 60-day window.`
        : "The application is outside the 60-day window or eligibility has already been determined.",
    },
    {
      id: "interview",
      label: "Interview requirement",
      status:
        interviewRequirementMet || twentyFourMonthException ? "pass" : "warning",
      section: "10 CCR 2506-1 4.204(A)",
      target: RULESPEC.interviewRequirement,
      detail:
        interviewRequirementMet || twentyFourMonthException
          ? twentyFourMonthException && !interviewRequirementMet
            ? "A 24-month household exception may avoid an additional interview."
            : "The household interview condition is marked complete within the 12-month period."
          : "Complete the household interview or confirm a valid 24-month exception.",
    },
    {
      id: "missed-interview",
      label: "Missed interview denial",
      status: inputs.missedInterview
        ? missedInterviewDenialAllowed
          ? "warning"
          : "fail"
        : "info",
      section: "10 CCR 2506-1 4.204(C)",
      target: RULESPEC.missedInterview,
      detail: inputs.missedInterview
        ? missedInterviewDenialAllowed
          ? "Denial may be procedurally available on or after day 30 if no timely later interview is scheduled."
          : "Do not deny yet for a missed interview; day 30 has not arrived or a later interview is scheduled."
        : "No missed interview is marked for this case.",
    },
    {
      id: "normal-processing",
      label: "30-day opportunity deadline",
      status: normalProcessingTimely ? "pass" : "fail",
      section: "10 CCR 2506-1 4.205",
      target: RULESPEC.normalProcessing,
      dueDate: formatDate(normalDeadline),
      detail: inputs.expeditedService
        ? "Normal 30-day participation check is superseded by expedited-service timing."
        : normalProcessingTimely
          ? "The opportunity-to-participate date is no later than the 30-day deadline."
          : "The opportunity-to-participate date is after the 30-day deadline.",
    },
    {
      id: "expedited-processing",
      label: "7-day expedited benefit deadline",
      status: expeditedProcessingTimely ? "pass" : "fail",
      section: "10 CCR 2506-1 4.205",
      target: RULESPEC.expeditedProcessing,
      dueDate: formatDate(expeditedDeadline),
      detail: inputs.expeditedService
        ? expeditedProcessingTimely
          ? "Benefits are available no later than the seventh calendar day after application."
          : "Expedited benefits are marked available after the seventh calendar day."
        : "Expedited service is not selected for this case.",
    },
    {
      id: "day-one",
      label: "Processing day one",
      status: dayOneCorrect ? "pass" : "info",
      section: "10 CCR 2506-1 4.205",
      target: RULESPEC.processingDayOne,
      dueDate: formatDate(processingDayOne),
      detail: `Processing day one is the first calendar day after receipt by the correct county local office: ${formatDate(processingDayOne)}.`,
    },
  ];

  return {
    daysSinceApplication,
    processingDayOne: formatDate(processingDayOne),
    normalDeadline: formatDate(normalDeadline),
    expeditedDeadline: formatDate(expeditedDeadline),
    applicationValidityDeadline: formatDate(applicationValidityDeadline),
    passCount: results.filter((result) => result.status === "pass").length,
    failCount: results.filter((result) => result.status === "fail").length,
    warningCount: results.filter((result) => result.status === "warning").length,
    results,
  };
}

export function formatRuleDate(value: string) {
  return formatDate(parseDate(value));
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function differenceInCalendarDays(later: Date, earlier: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((stripTime(later).getTime() - stripTime(earlier).getTime()) / dayMs);
}

function compareDates(left: Date, right: Date) {
  return stripTime(left).getTime() - stripTime(right).getTime();
}

function stripTime(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function signatureLabel(method: SignatureMethod) {
  switch (method) {
    case "handwritten":
      return "Handwritten";
    case "electronic":
      return "Electronic";
    case "telephonic":
      return "Recorded telephonic";
    case "gesture":
      return "Documented gestured";
    case "x-mark":
      return "X-mark";
    case "none":
      return "No";
  }
}
