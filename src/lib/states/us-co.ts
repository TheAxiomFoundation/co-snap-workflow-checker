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

export const US_CO: SnapState = {
  ui: {
    id: "us-co",
    name: "Colorado",
    operationsLabel: "Colorado SNAP operations",
    regulationName: "10 CCR 2506-1",
    loadingMessage:
      "Loading Axiom WASM and compiling Colorado SNAP RuleSpec modules.",
    receivedDateLabel: "Correct county received",
    opportunityDateLabel: "Opportunity to participate",
    normalDeadlineDetail: "Opportunity to participate",
    showEligibilityDeterminedToggle: true,
    showNoticeSaysMissedToggle: true,
    showDenialDayField: true,
    showSubsequentInterviewToggle: true,
    targetLines: [
      { section: "4.202", label: "Application content and validity" },
      { section: "4.204", label: "Interview timing and missed interviews" },
      { section: "4.205", label: "Normal and expedited processing clocks" },
    ],
  },
  definition: {
    id: "us-co",
    rulespecPrefix: "us-co",
    modules: MODULE,
    outputs: {
      application: [
        OUTPUT.minimumContent,
        OUTPUT.signatureValid,
        OUTPUT.applicationWithinValidity,
      ],
      interview: [OUTPUT.interviewRequirement, OUTPUT.missedInterviewTiming],
      processing: [
        OUTPUT.normalProcessing,
        OUTPUT.expeditedProcessing,
        OUTPUT.processingDayOne,
      ],
    },
    extractParameters: (artifacts) => ({
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
          status: judgments[OUTPUT.minimumContent] ? "pass" : "fail",
          section: "10 CCR 2506-1 4.202(A)",
          target: OUTPUT.minimumContent,
          detail: judgments[OUTPUT.minimumContent]
            ? "Axiom returned that the filing has the required name, address, and signature path."
            : "Axiom returned that the filing is missing name, address, or a responsible household or authorized representative signature.",
        },
        {
          id: "signature",
          label: "Signature validity",
          status: judgments[OUTPUT.signatureValid] ? "pass" : "fail",
          section: "10 CCR 2506-1 4.202(A)",
          target: OUTPUT.signatureValid,
          detail: judgments[OUTPUT.signatureValid]
            ? `Axiom accepted the ${signatureLabel(inputs.signatureMethod).toLowerCase()} signature method.`
            : "Axiom did not find an accepted signature method.",
        },
        {
          id: "validity-window",
          label: "Application validity window",
          status: judgments[OUTPUT.applicationWithinValidity] ? "pass" : "warning",
          section: "10 CCR 2506-1 4.202(F)",
          target: OUTPUT.applicationWithinValidity,
          dueDate: applicationValidityDeadline,
          detail: judgments[OUTPUT.applicationWithinValidity]
            ? `Axiom returned that the application remains inside the ${parameters.applicationValidityDays}-day validity window.`
            : "Axiom returned that the application is outside the validity window or eligibility has already been determined.",
        },
        {
          id: "interview",
          label: "Interview requirement",
          status: judgments[OUTPUT.interviewRequirement] ? "pass" : "warning",
          section: "10 CCR 2506-1 4.204(A)",
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
          section: "10 CCR 2506-1 4.204(C)",
          target: OUTPUT.missedInterviewTiming,
          dueDate: missedInterviewDueDate,
          detail: inputs.missedInterview
            ? judgments[OUTPUT.missedInterviewTiming]
              ? "Axiom returned that the missed-interview notice and denial timing conditions are satisfied."
              : "Axiom returned that the missed-interview notice or denial timing conditions are not satisfied."
            : "No missed interview is marked for this case; the Axiom output is not treated as an active issue.",
        },
        {
          id: "normal-processing",
          label: `${parameters.normalProcessingDays}-day opportunity deadline`,
          status: judgments[OUTPUT.normalProcessing] ? "pass" : "fail",
          section: "10 CCR 2506-1 4.205",
          target: OUTPUT.normalProcessing,
          dueDate: normalDeadline,
          detail: judgments[OUTPUT.normalProcessing]
            ? "Axiom returned that the normal processing opportunity-to-participate timing is satisfied."
            : "Axiom returned that the normal processing opportunity-to-participate timing is not satisfied.",
        },
        {
          id: "expedited-processing",
          label: `${parameters.expeditedProcessingDays}-day expedited benefit deadline`,
          status: inputs.expeditedService
            ? judgments[OUTPUT.expeditedProcessing]
              ? "pass"
              : "fail"
            : "info",
          section: "10 CCR 2506-1 4.205",
          target: OUTPUT.expeditedProcessing,
          dueDate: expeditedDeadline,
          detail: inputs.expeditedService
            ? judgments[OUTPUT.expeditedProcessing]
              ? "Axiom returned that expedited benefits are available within the seven-day deadline."
              : "Axiom returned that expedited benefits are not available within the seven-day deadline."
            : "Expedited service is not selected; Axiom treats the expedited timing condition as not applicable.",
        },
        {
          id: "day-one",
          label: "Processing day one",
          status: judgments[OUTPUT.processingDayOne] ? "pass" : "fail",
          section: "10 CCR 2506-1 4.205",
          target: OUTPUT.processingDayOne,
          dueDate: processingDayOne,
          detail: judgments[OUTPUT.processingDayOne]
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
