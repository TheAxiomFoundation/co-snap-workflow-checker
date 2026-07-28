import {
  boolInput,
  integerInput,
  readParameter,
  type SnapState,
} from "@/lib/axiomRuntime";
import {
  addCalendarDays,
  countStatuses,
  deriveWorkflowFacts,
  signatureLabel,
  type RuleResult,
} from "@/lib/snapWorkflow";

const MODULE = {
  application: "us-ny:regulations/18-nycrr-387/387.5",
  interview: "us-ny:regulations/18-nycrr-387/387.7",
  processing: "us-ny:regulations/18-nycrr-387/387.8",
} as const;

const OUTPUT = {
  minimumContent: `${MODULE.application}#snap_incomplete_application_minimum_content_met`,
  signatureValid: `${MODULE.application}#snap_application_signature_valid`,
  normalProcessing: `${MODULE.application}#newly_certified_household_eligibility_determination_and_issuance_timely`,
  processingDayOne: `${MODULE.application}#application_processing_day_one_set_from_district_receipt`,
  interviewRequirement: `${MODULE.interview}#applicant_household_interview_requirement_met`,
  missedInterviewNotice: `${MODULE.interview}#missed_interview_notice_compliant`,
  expeditedProcessing: `${MODULE.processing}#expedited_service_household_benefits_available_timely`,
} as const;

const PARAMETER = {
  normalProcessingDays: `${MODULE.application}#normal_processing_calendar_day_limit`,
  processingDayOneOffset: `${MODULE.application}#application_processing_day_one_calendar_day_offset`,
  interviewMonthLimit: `${MODULE.interview}#initial_and_periodic_interview_month_limit`,
  expeditedProcessingDays: `${MODULE.processing}#expedited_service_benefit_availability_calendar_day_limit`,
} as const;

export const US_NY: SnapState = {
  ui: {
    id: "us-ny",
    name: "New York",
    operationsLabel: "New York SNAP operations",
    regulationName: "18 NYCRR Part 387",
    loadingMessage:
      "Loading Axiom WASM and compiling New York SNAP RuleSpec modules.",
    receivedDateLabel: "District received",
    opportunityDateLabel: "Eligibility determined & benefits issued",
    normalDeadlineDetail: "Eligibility & issuance",
    showEligibilityDeterminedToggle: false,
    showNoticeSaysMissedToggle: false,
    showDenialDayField: false,
    showSubsequentInterviewToggle: false,
    targetLines: [
      { section: "387.5", label: "Filing, minimum content, and 30-day processing clock" },
      { section: "387.7", label: "Interview timing and missed-interview notices" },
      { section: "387.8", label: "Expedited service benefit availability" },
    ],
  },
  definition: {
    id: "us-ny",
    rulespecPrefix: "us-ny",
    modules: MODULE,
    outputs: {
      application: [
        OUTPUT.minimumContent,
        OUTPUT.signatureValid,
        OUTPUT.normalProcessing,
        OUTPUT.processingDayOne,
      ],
      interview: [OUTPUT.interviewRequirement, OUTPUT.missedInterviewNotice],
      processing: [OUTPUT.expeditedProcessing],
    },
    extractParameters: (artifacts) => ({
      normalProcessingDays: readParameter(
        artifacts.application,
        PARAMETER.normalProcessingDays,
      ),
      processingDayOneOffset: readParameter(
        artifacts.application,
        PARAMETER.processingDayOneOffset,
      ),
      interviewMonthLimit: readParameter(
        artifacts.interview,
        PARAMETER.interviewMonthLimit,
      ),
      expeditedProcessingDays: readParameter(
        artifacts.processing,
        PARAMETER.expeditedProcessingDays,
      ),
    }),
    buildDatasetInputs: (inputs) => {
      const facts = deriveWorkflowFacts(inputs);
      return [
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
          "application_form_signed",
          inputs.signatureMethod !== "none",
        ),
        boolInput(
          MODULE.application,
          "household_newly_certified",
          inputs.newlyCertified,
        ),
        boolInput(
          MODULE.application,
          "household_given_expedited_service",
          inputs.expeditedService,
        ),
        boolInput(
          MODULE.application,
          "eligibility_determined_and_benefits_issued",
          Boolean(inputs.opportunityDate),
        ),
        integerInput(
          MODULE.application,
          "calendar_days_following_application_filing_before_eligibility_determination_and_issuance",
          facts.opportunityDaysAfterApplication,
        ),
        boolInput(
          MODULE.application,
          "application_received_by_local_social_services_district",
          Boolean(inputs.correctCountyReceivedDate),
        ),
        integerInput(
          MODULE.application,
          "application_processing_day_one_calendar_days_after_receipt",
          facts.applicationProcessingDayOneOffset,
        ),
        boolInput(
          MODULE.interview,
          "household_interviewed_before_initial_certification",
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
          "district_sent_notice_of_missed_interview_to_household",
          inputs.missedInterviewNoticeMailed,
        ),
        boolInput(
          MODULE.interview,
          "notice_informed_household_responsible_for_rescheduling_interview",
          inputs.missedInterviewNoticeSaysReschedule,
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
      ];
    },
    buildResults: ({ inputs, parameters, judgments, engineVersion, artifactFormatVersion }) => {
      const facts = deriveWorkflowFacts(inputs);
      const normalDeadline = addCalendarDays(
        inputs.applicationDate,
        parameters.normalProcessingDays,
      );
      const expeditedDeadline = addCalendarDays(
        inputs.applicationDate,
        parameters.expeditedProcessingDays,
      );
      const processingDayOne = addCalendarDays(
        inputs.correctCountyReceivedDate,
        parameters.processingDayOneOffset,
      );

      const results: RuleResult[] = [
        {
          id: "minimum-content",
          label: "Minimum application content",
          status: judgments[OUTPUT.minimumContent] ? "pass" : "fail",
          section: "18 NYCRR 387.5(a)",
          target: OUTPUT.minimumContent,
          detail: judgments[OUTPUT.minimumContent]
            ? "Axiom returned that the filing has the required name, address, and a responsible member or authorized representative signature."
            : "Axiom returned that the filing is missing name, address, or a responsible member or authorized representative signature.",
        },
        {
          id: "signature",
          label: "Signature on the application form",
          status: judgments[OUTPUT.signatureValid] ? "pass" : "fail",
          section: "18 NYCRR 387.5(a)",
          target: OUTPUT.signatureValid,
          detail: judgments[OUTPUT.signatureValid]
            ? `Axiom returned that the application form is signed (${signatureLabel(inputs.signatureMethod).toLowerCase()} signature recorded).`
            : "Axiom returned that the application form is not signed.",
        },
        {
          id: "interview",
          label: "Interview requirement",
          status: judgments[OUTPUT.interviewRequirement] ? "pass" : "warning",
          section: "18 NYCRR 387.7(a)",
          target: OUTPUT.interviewRequirement,
          detail: judgments[OUTPUT.interviewRequirement]
            ? `Axiom returned that the household interview requirement is met within the ${parameters.interviewMonthLimit}-month period.`
            : `Axiom returned that the household interview requirement is not met within the ${parameters.interviewMonthLimit}-month period.`,
        },
        {
          id: "missed-interview",
          label: "Missed interview notice",
          status: inputs.missedInterview
            ? judgments[OUTPUT.missedInterviewNotice]
              ? "pass"
              : "fail"
            : "info",
          section: "18 NYCRR 387.7(g)",
          target: OUTPUT.missedInterviewNotice,
          detail: inputs.missedInterview
            ? judgments[OUTPUT.missedInterviewNotice]
              ? "Axiom returned that the district sent a notice of missed interview informing the household of its responsibility to reschedule."
              : "Axiom returned that the notice-of-missed-interview conditions are not satisfied."
            : "No missed interview is marked for this case; the Axiom output is not treated as an active issue.",
        },
        {
          id: "normal-processing",
          label: `${parameters.normalProcessingDays}-day eligibility and issuance deadline`,
          status: judgments[OUTPUT.normalProcessing] ? "pass" : "fail",
          section: "18 NYCRR 387.5(f)",
          target: OUTPUT.normalProcessing,
          dueDate: normalDeadline,
          detail: judgments[OUTPUT.normalProcessing]
            ? "Axiom returned that eligibility determination and benefit issuance timing is satisfied."
            : "Axiom returned that eligibility determination and benefit issuance timing is not satisfied.",
        },
        {
          id: "expedited-processing",
          label: `${parameters.expeditedProcessingDays}-day expedited benefit deadline`,
          status: inputs.expeditedService
            ? judgments[OUTPUT.expeditedProcessing]
              ? "pass"
              : "fail"
            : "info",
          section: "18 NYCRR 387.8(a)",
          target: OUTPUT.expeditedProcessing,
          dueDate: expeditedDeadline,
          detail: inputs.expeditedService
            ? judgments[OUTPUT.expeditedProcessing]
              ? "Axiom returned that expedited benefits are available no later than the seventh calendar day following filing."
              : "Axiom returned that expedited benefits are not available within the expedited deadline."
            : "Expedited service is not selected; Axiom treats the expedited timing condition as not applicable.",
        },
        {
          id: "day-one",
          label: "Processing day one",
          status: judgments[OUTPUT.processingDayOne] ? "pass" : "fail",
          section: "18 NYCRR 387.5(c)",
          target: OUTPUT.processingDayOne,
          dueDate: processingDayOne,
          detail: judgments[OUTPUT.processingDayOne]
            ? `Axiom returned that processing day one is set from receipt by the local social services district; derived day count input was ${facts.applicationProcessingDayOneOffset}.`
            : "Axiom returned that processing day one is not set from receipt by the local social services district.",
        },
      ];

      return {
        daysSinceApplication: facts.daysSinceApplication,
        processingDayOne,
        normalDeadline,
        expeditedDeadline,
        normalProcessingDays: parameters.normalProcessingDays,
        expeditedProcessingDays: parameters.expeditedProcessingDays,
        ...countStatuses(results),
        results,
        engineVersion,
        artifactFormatVersion,
      };
    },
  },
};
