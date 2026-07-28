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

const MODULE_TARGET = "us-ny:manuals/otda/snap-source-book/section-4";

const MODULE = {
  application: MODULE_TARGET,
  interview: MODULE_TARGET,
  processing: MODULE_TARGET,
} as const;

const OUTPUT = {
  minimumContent: `${MODULE_TARGET}#snap_incomplete_application_minimum_content_met`,
  signatureValid: `${MODULE_TARGET}#snap_application_signature_valid`,
  reregistrationWindow: `${MODULE_TARGET}#original_application_reregistration_window_open`,
  interviewRequirement: `${MODULE_TARGET}#applicant_household_interview_requirement_met`,
  missedInterviewTiming: `${MODULE_TARGET}#missed_interview_notice_and_denial_timing_compliant`,
  normalProcessing: `${MODULE_TARGET}#newly_certified_household_eligibility_determination_and_issuance_timely`,
  expeditedProcessing: `${MODULE_TARGET}#expedited_service_household_benefits_available_timely`,
  processingDayOne: `${MODULE_TARGET}#application_processing_day_one_set_from_district_receipt`,
} as const;

const PARAMETER = {
  reregistrationDays: `${MODULE_TARGET}#snap_application_reregistration_calendar_day_limit`,
  interviewMonthLimit: `${MODULE_TARGET}#initial_and_periodic_interview_month_limit`,
  missedInterviewDenialDay: `${MODULE_TARGET}#missed_interview_application_denial_calendar_day`,
  normalProcessingDays: `${MODULE_TARGET}#normal_processing_calendar_day_limit`,
  expeditedProcessingDays: `${MODULE_TARGET}#expedited_service_benefit_availability_calendar_day_limit`,
  processingDayOneOffset: `${MODULE_TARGET}#application_processing_day_one_calendar_day_offset`,
} as const;

export const US_NY: SnapState = {
  ui: {
    id: "us-ny",
    name: "New York",
    operationsLabel: "New York SNAP operations",
    regulationName: "OTDA SNAP Source Book §4",
    loadingMessage:
      "Loading Axiom WASM and compiling New York SNAP RuleSpec modules.",
    receivedDateLabel: "District received",
    opportunityDateLabel: "Eligibility determined & benefits issued",
    normalDeadlineDetail: "Eligibility & issuance",
    showEligibilityDeterminedToggle: false,
    showNoticeSaysMissedToggle: false,
    showDenialDayField: true,
    showSubsequentInterviewToggle: true,
    targetLines: [
      { section: "§4(B)", label: "Right to apply and minimum filing content" },
      { section: "§4(D)", label: "Date of application and the 30-day processing clock" },
      { section: "§4(E)", label: "Interviews, missed-interview notices, and expedited timing" },
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
        OUTPUT.reregistrationWindow,
        OUTPUT.interviewRequirement,
        OUTPUT.missedInterviewTiming,
        OUTPUT.normalProcessing,
        OUTPUT.expeditedProcessing,
        OUTPUT.processingDayOne,
      ],
      interview: [],
      processing: [],
    },
    extractParameters: (artifacts) => ({
      reregistrationDays: readParameter(
        artifacts.application,
        PARAMETER.reregistrationDays,
      ),
      interviewMonthLimit: readParameter(
        artifacts.application,
        PARAMETER.interviewMonthLimit,
      ),
      missedInterviewDenialDay: readParameter(
        artifacts.application,
        PARAMETER.missedInterviewDenialDay,
      ),
      normalProcessingDays: readParameter(
        artifacts.application,
        PARAMETER.normalProcessingDays,
      ),
      expeditedProcessingDays: readParameter(
        artifacts.application,
        PARAMETER.expeditedProcessingDays,
      ),
      processingDayOneOffset: readParameter(
        artifacts.application,
        PARAMETER.processingDayOneOffset,
      ),
    }),
    buildDatasetInputs: (inputs) => {
      const facts = deriveWorkflowFacts(inputs);
      return [
        boolInput(MODULE_TARGET, "application_form_contains_name", inputs.containsName),
        boolInput(
          MODULE_TARGET,
          "application_form_contains_address",
          inputs.containsAddress,
        ),
        boolInput(
          MODULE_TARGET,
          "application_form_signed_by_responsible_household_member",
          inputs.signedByHouseholdMember,
        ),
        boolInput(
          MODULE_TARGET,
          "application_form_signed_by_household_authorized_representative",
          inputs.signedByAuthorizedRepresentative,
        ),
        boolInput(
          MODULE_TARGET,
          "application_form_signed",
          inputs.signatureMethod !== "none",
        ),
        integerInput(
          MODULE_TARGET,
          "days_since_application_filed",
          facts.daysSinceApplication,
        ),
        boolInput(
          MODULE_TARGET,
          "household_newly_certified",
          inputs.newlyCertified,
        ),
        boolInput(
          MODULE_TARGET,
          "household_given_expedited_service",
          inputs.expeditedService,
        ),
        boolInput(
          MODULE_TARGET,
          "eligibility_determined_and_benefits_issued",
          Boolean(inputs.opportunityDate),
        ),
        integerInput(
          MODULE_TARGET,
          "calendar_days_following_application_filing_before_eligibility_determination_and_issuance",
          facts.opportunityDaysAfterApplication,
        ),
        boolInput(
          MODULE_TARGET,
          "application_received_by_local_social_services_district",
          Boolean(inputs.correctCountyReceivedDate),
        ),
        integerInput(
          MODULE_TARGET,
          "application_processing_day_one_calendar_days_after_receipt",
          facts.applicationProcessingDayOneOffset,
        ),
        boolInput(
          MODULE_TARGET,
          "household_interviewed_before_initial_certification",
          inputs.interviewCompleted,
        ),
        integerInput(
          MODULE_TARGET,
          "months_since_last_household_interview",
          inputs.monthsSinceLastInterview,
        ),
        boolInput(
          MODULE_TARGET,
          "household_failed_to_attend_scheduled_interview",
          inputs.missedInterview,
        ),
        boolInput(
          MODULE_TARGET,
          "district_sent_missed_interview_notice_to_household",
          inputs.missedInterviewNoticeMailed,
        ),
        boolInput(
          MODULE_TARGET,
          "notice_informed_household_responsible_for_rescheduling_interview",
          inputs.missedInterviewNoticeSaysReschedule,
        ),
        boolInput(
          MODULE_TARGET,
          "household_contacted_district_to_reschedule_within_processing_timeframe",
          inputs.subsequentInterviewScheduled,
        ),
        boolInput(
          MODULE_TARGET,
          "application_denied_before_thirtieth_day",
          inputs.denialDayAfterApplication < 30,
        ),
        boolInput(
          MODULE_TARGET,
          "household_entitled_to_expedited_service",
          inputs.expeditedService,
        ),
        boolInput(
          MODULE_TARGET,
          "benefits_available_to_household",
          Boolean(inputs.benefitsAvailableDate),
        ),
        integerInput(
          MODULE_TARGET,
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
      const applicationValidityDeadline = addCalendarDays(
        inputs.applicationDate,
        parameters.reregistrationDays,
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
          status: judgments[OUTPUT.minimumContent] ? "pass" : "fail",
          section: "SNAP Source Book §4(B)",
          target: OUTPUT.minimumContent,
          detail: judgments[OUTPUT.minimumContent]
            ? "Axiom returned that the filing has the required name, address, and a responsible member or authorized representative signature."
            : "Axiom returned that the filing is missing name, address, or a responsible member or authorized representative signature.",
        },
        {
          id: "signature",
          label: "Signature on the application form",
          status: judgments[OUTPUT.signatureValid] ? "pass" : "fail",
          section: "SNAP Source Book §4(D)",
          target: OUTPUT.signatureValid,
          detail: judgments[OUTPUT.signatureValid]
            ? `Axiom returned that the application form is signed (${signatureLabel(inputs.signatureMethod).toLowerCase()} signature recorded).`
            : "Axiom returned that the application form is not signed; an unsigned form does not preserve the filing date.",
        },
        {
          id: "validity-window",
          label: `${parameters.reregistrationDays}-day re-registration window`,
          status: judgments[OUTPUT.reregistrationWindow] ? "pass" : "warning",
          section: "SNAP Source Book §4(E)(5)",
          target: OUTPUT.reregistrationWindow,
          dueDate: applicationValidityDeadline,
          detail: judgments[OUTPUT.reregistrationWindow]
            ? `Axiom returned that the original application can still be re-registered within ${parameters.reregistrationDays} days of the original application date.`
            : `Axiom returned that more than ${parameters.reregistrationDays} days have passed; a new application is required.`,
        },
        {
          id: "interview",
          label: "Interview requirement",
          status: judgments[OUTPUT.interviewRequirement] ? "pass" : "warning",
          section: "SNAP Source Book §4(E)(1)",
          target: OUTPUT.interviewRequirement,
          detail: judgments[OUTPUT.interviewRequirement]
            ? `Axiom returned that the household interview requirement is met within the ${parameters.interviewMonthLimit}-month period.`
            : `Axiom returned that the household interview requirement is not met within the ${parameters.interviewMonthLimit}-month period.`,
        },
        {
          id: "missed-interview",
          label: "Missed interview notice and denial timing",
          status: inputs.missedInterview
            ? judgments[OUTPUT.missedInterviewTiming]
              ? "pass"
              : "fail"
            : "info",
          section: "SNAP Source Book §4(E)(5)",
          target: OUTPUT.missedInterviewTiming,
          dueDate: missedInterviewDueDate,
          detail: inputs.missedInterview
            ? judgments[OUTPUT.missedInterviewTiming]
              ? "Axiom returned that the LDSS-4753 notice was sent and no denial occurred before the 30th day."
              : "Axiom returned that the LDSS-4753 notice or the no-denial-before-the-30th-day condition is not satisfied."
            : "No missed interview is marked for this case; the Axiom output is not treated as an active issue.",
        },
        {
          id: "normal-processing",
          label: `${parameters.normalProcessingDays}-day eligibility and issuance deadline`,
          status: judgments[OUTPUT.normalProcessing] ? "pass" : "fail",
          section: "SNAP Source Book §4(D)",
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
          section: "SNAP Source Book §4(E)(4)",
          target: OUTPUT.expeditedProcessing,
          dueDate: expeditedDeadline,
          detail: inputs.expeditedService
            ? judgments[OUTPUT.expeditedProcessing]
              ? `Axiom returned that expedited benefits are available within the ${parameters.expeditedProcessingDays}-day expedited deadline.`
              : `Axiom returned that expedited benefits are not available within the ${parameters.expeditedProcessingDays}-day expedited deadline.`
            : "Expedited service is not selected; Axiom treats the expedited timing condition as not applicable.",
        },
        {
          id: "day-one",
          label: "Processing day one",
          status: judgments[OUTPUT.processingDayOne] ? "pass" : "fail",
          section: "SNAP Source Book §4(D)",
          target: OUTPUT.processingDayOne,
          dueDate: processingDayOne,
          detail: judgments[OUTPUT.processingDayOne]
            ? `Axiom returned that processing day one is the first calendar day following district receipt of the signed filing; derived day count input was ${facts.applicationProcessingDayOneOffset}.`
            : "Axiom returned that processing day one is not set from district receipt of the signed filing.",
        },
      ];

      return {
        daysSinceApplication: facts.daysSinceApplication,
        processingDayOne,
        normalDeadline,
        expeditedDeadline,
        applicationValidityDeadline,
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
