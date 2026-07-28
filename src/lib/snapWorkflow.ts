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
  missedInterviewNoticeMailed: boolean;
  missedInterviewNoticeSaysMissed: boolean;
  missedInterviewNoticeSaysReschedule: boolean;
  subsequentInterviewScheduled: boolean;
  denialDayAfterApplication: number;
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
  applicationValidityDeadline?: string;
  normalProcessingDays: number;
  expeditedProcessingDays: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  results: RuleResult[];
  engineVersion: string;
  artifactFormatVersion: number;
};

export type WorkflowFacts = {
  daysSinceApplication: number;
  applicationProcessingDayOneOffset: number;
  opportunityDaysAfterApplication: number;
  benefitsDaysAfterApplication: number;
};

export type StateId = "us-ny" | "us-co";

export type SnapStateUi = {
  id: StateId;
  name: string;
  operationsLabel: string;
  regulationName: string;
  loadingMessage: string;
  receivedDateLabel: string;
  opportunityDateLabel: string;
  normalDeadlineDetail: string;
  showEligibilityDeterminedToggle: boolean;
  showNoticeSaysMissedToggle: boolean;
  showDenialDayField: boolean;
  showSubsequentInterviewToggle: boolean;
  targetLines: Array<{ section: string; label: string }>;
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
  missedInterviewNoticeMailed: false,
  missedInterviewNoticeSaysMissed: false,
  missedInterviewNoticeSaysReschedule: false,
  subsequentInterviewScheduled: false,
  denialDayAfterApplication: 30,
  householdCertificationMonths: 12,
  householdRequestsInterview: false,
  outstandingRecertificationIssue: false,
};

export function deriveWorkflowFacts(inputs: WorkflowInputs): WorkflowFacts {
  const applicationDate = parseDate(inputs.applicationDate);
  const currentDate = parseDate(inputs.currentDate);
  const receivedDate = parseDate(inputs.correctCountyReceivedDate);
  const opportunityDate = parseDate(inputs.opportunityDate);
  const benefitsDate = parseDate(inputs.benefitsAvailableDate);

  return {
    daysSinceApplication: differenceInCalendarDays(currentDate, applicationDate),
    applicationProcessingDayOneOffset: differenceInCalendarDays(
      addDays(receivedDate, 1),
      receivedDate,
    ),
    opportunityDaysAfterApplication: differenceInCalendarDays(
      opportunityDate,
      applicationDate,
    ),
    benefitsDaysAfterApplication: differenceInCalendarDays(
      benefitsDate,
      applicationDate,
    ),
  };
}

export function countStatuses(results: RuleResult[]) {
  return {
    passCount: results.filter((result) => result.status === "pass").length,
    failCount: results.filter((result) => result.status === "fail").length,
    warningCount: results.filter((result) => result.status === "warning").length,
  };
}

export function addCalendarDays(value: string, days: number) {
  return formatDate(addDays(parseDate(value), days));
}

export function formatRuleDate(value: string) {
  return formatDate(parseDate(value));
}

export function signatureLabel(method: SignatureMethod) {
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
  return Math.round(
    (stripTime(later).getTime() - stripTime(earlier).getTime()) / dayMs,
  );
}

function stripTime(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
