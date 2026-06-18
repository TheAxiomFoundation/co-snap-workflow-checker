"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Info,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  DEFAULT_WORKFLOW_INPUTS,
  evaluateWorkflow,
  formatRuleDate,
  type RuleResult,
  type RuleStatus,
  type SignatureMethod,
  type WorkflowInputs,
} from "@/lib/coSnapWorkflow";

const signatureOptions: Array<{ value: SignatureMethod; label: string }> = [
  { value: "handwritten", label: "Handwritten" },
  { value: "electronic", label: "Electronic" },
  { value: "telephonic", label: "Telephonic" },
  { value: "gesture", label: "Gesture" },
  { value: "x-mark", label: "X mark" },
  { value: "none", label: "None" },
];

export function WorkflowChecker() {
  const [inputs, setInputs] = useState<WorkflowInputs>(DEFAULT_WORKFLOW_INPUTS);
  const workflow = useMemo(() => evaluateWorkflow(inputs), [inputs]);
  const blockingCount = workflow.failCount + workflow.warningCount;

  function patch(next: Partial<WorkflowInputs>) {
    setInputs((current) => ({ ...current, ...next }));
  }

  return (
    <section className="min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pt-28">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-7">
        <header className="grid gap-6 border-b border-[var(--color-rule)] pb-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.1fr)] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-ink-muted)]">
              Colorado SNAP operations
            </p>
            <h1 className="max-w-[780px] text-4xl font-semibold leading-[1.04] text-[var(--color-ink)] md:text-6xl">
              Application workflow checker
            </h1>
          </div>
          <div className="max-w-[720px] text-base leading-7 text-[var(--color-ink-secondary)] md:text-lg">
            <p>
              Check filing, interview, and processing timing against Axiom RuleSpec
              concepts from <span className="font-semibold text-[var(--color-ink)]">10 CCR 2506-1</span>.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)]">
          <aside className="self-start rounded-[6px] border border-[var(--color-rule)] bg-[var(--color-paper-elevated)] p-5 shadow-[0_18px_48px_rgba(28,25,23,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-ink)]">
                  Case inputs
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  Dates use calendar-day counting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInputs(DEFAULT_WORKFLOW_INPUTS)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-[var(--color-rule)] text-[var(--color-ink-muted)] transition hover:border-[var(--color-rule-strong)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
                aria-label="Reset case inputs"
                title="Reset case inputs"
              >
                <RotateCcw aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="grid gap-5">
              <FieldGroup title="Application">
                <DateField
                  label="Application filed"
                  value={inputs.applicationDate}
                  onChange={(applicationDate) => patch({ applicationDate })}
                />
                <DateField
                  label="Correct county received"
                  value={inputs.correctCountyReceivedDate}
                  onChange={(correctCountyReceivedDate) =>
                    patch({ correctCountyReceivedDate })
                  }
                />
                <DateField
                  label="Today"
                  value={inputs.currentDate}
                  onChange={(currentDate) => patch({ currentDate })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Toggle
                    label="Name present"
                    checked={inputs.containsName}
                    onChange={(containsName) => patch({ containsName })}
                  />
                  <Toggle
                    label="Address present"
                    checked={inputs.containsAddress}
                    onChange={(containsAddress) => patch({ containsAddress })}
                  />
                  <Toggle
                    label="Household signed"
                    checked={inputs.signedByHouseholdMember}
                    onChange={(signedByHouseholdMember) =>
                      patch({ signedByHouseholdMember })
                    }
                  />
                  <Toggle
                    label="Authorized rep signed"
                    checked={inputs.signedByAuthorizedRepresentative}
                    onChange={(signedByAuthorizedRepresentative) =>
                      patch({ signedByAuthorizedRepresentative })
                    }
                  />
                </div>
                <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
                  Signature method
                  <select
                    value={inputs.signatureMethod}
                    onChange={(event) =>
                      patch({
                        signatureMethod: event.currentTarget.value as SignatureMethod,
                      })
                    }
                    className="h-11 rounded-[4px] border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
                  >
                    {signatureOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </FieldGroup>

              <FieldGroup title="Processing">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Toggle
                    label="Newly certified"
                    checked={inputs.newlyCertified}
                    onChange={(newlyCertified) => patch({ newlyCertified })}
                  />
                  <Toggle
                    label="Expedited service"
                    checked={inputs.expeditedService}
                    onChange={(expeditedService) => patch({ expeditedService })}
                  />
                  <Toggle
                    label="Eligibility determined"
                    checked={inputs.eligibilityDetermined}
                    onChange={(eligibilityDetermined) =>
                      patch({ eligibilityDetermined })
                    }
                  />
                  <Toggle
                    label="Missed interview"
                    checked={inputs.missedInterview}
                    onChange={(missedInterview) => patch({ missedInterview })}
                  />
                </div>
                <DateField
                  label="Opportunity to participate"
                  value={inputs.opportunityDate}
                  onChange={(opportunityDate) => patch({ opportunityDate })}
                />
                <DateField
                  label="Benefits available"
                  value={inputs.benefitsAvailableDate}
                  onChange={(benefitsAvailableDate) =>
                    patch({ benefitsAvailableDate })
                  }
                />
                <Toggle
                  label="Later interview scheduled"
                  checked={inputs.subsequentInterviewScheduled}
                  onChange={(subsequentInterviewScheduled) =>
                    patch({ subsequentInterviewScheduled })
                  }
                />
              </FieldGroup>

              <FieldGroup title="Interview">
                <Toggle
                  label="Interview completed"
                  checked={inputs.interviewCompleted}
                  onChange={(interviewCompleted) => patch({ interviewCompleted })}
                />
                <NumberField
                  label="Months since last interview"
                  value={inputs.monthsSinceLastInterview}
                  min={0}
                  max={36}
                  onChange={(monthsSinceLastInterview) =>
                    patch({ monthsSinceLastInterview })
                  }
                />
                <NumberField
                  label="Certification period months"
                  value={inputs.householdCertificationMonths}
                  min={1}
                  max={24}
                  onChange={(householdCertificationMonths) =>
                    patch({ householdCertificationMonths })
                  }
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Toggle
                    label="Household requests interview"
                    checked={inputs.householdRequestsInterview}
                    onChange={(householdRequestsInterview) =>
                      patch({ householdRequestsInterview })
                    }
                  />
                  <Toggle
                    label="Outstanding recert issue"
                    checked={inputs.outstandingRecertificationIssue}
                    onChange={(outstandingRecertificationIssue) =>
                      patch({ outstandingRecertificationIssue })
                    }
                  />
                </div>
              </FieldGroup>
            </div>
          </aside>

          <div className="grid min-w-0 gap-6">
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryMetric
                icon={<CalendarDays size={18} />}
                label="Application age"
                value={`${workflow.daysSinceApplication} days`}
                detail={`Filed ${formatRuleDate(inputs.applicationDate)}`}
              />
              <SummaryMetric
                icon={<Clock3 size={18} />}
                label="30-day deadline"
                value={workflow.normalDeadline}
                detail="Opportunity to participate"
              />
              <SummaryMetric
                icon={<ShieldCheck size={18} />}
                label="7-day deadline"
                value={workflow.expeditedDeadline}
                detail="Expedited benefits"
              />
              <SummaryMetric
                icon={<FileCheck2 size={18} />}
                label="Open issues"
                value={String(blockingCount)}
                detail={`${workflow.failCount} fail, ${workflow.warningCount} warn`}
              />
            </div>

            <section className="rounded-[6px] border border-[var(--color-rule)] bg-[var(--color-paper-elevated)] shadow-[0_18px_48px_rgba(28,25,23,0.06)]">
              <div className="flex flex-col gap-3 border-b border-[var(--color-rule)] p-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                    Rule results
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    Each result maps to a RuleSpec target and Colorado rule section.
                  </p>
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
                  {workflow.passCount} pass / {workflow.warningCount} warn / {workflow.failCount} fail
                </div>
              </div>
              <div className="divide-y divide-[var(--color-rule-subtle)]">
                {workflow.results.map((result) => (
                  <RuleRow key={result.id} result={result} />
                ))}
              </div>
            </section>

            <section className="grid gap-4 border-t border-[var(--color-rule)] pt-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                  Axiom surface
                </h2>
                <p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--color-ink-secondary)]">
                  This first pass keeps execution in a typed browser model that mirrors
                  the encoded RuleSpec subset. The listed targets are the seam for
                  replacing the model with compiled RuleSpec execution.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[var(--color-ink-secondary)]">
                <TargetLine section="4.202" label="Application content and validity" />
                <TargetLine section="4.204" label="Interview timing and missed interviews" />
                <TargetLine section="4.205" label="Normal and expedited processing clocks" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-3 border-t border-[var(--color-rule-subtle)] pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-2 text-sm font-semibold text-[var(--color-ink)]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-11 rounded-[4px] border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--color-ink)]">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const parsed = Number(event.currentTarget.value);
          if (Number.isFinite(parsed)) {
            onChange(Math.max(min, Math.min(max, parsed)));
          }
        }}
        className="h-11 rounded-[4px] border border-[var(--color-rule-strong)] bg-[var(--color-paper)] px-3 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="grid min-h-11 cursor-pointer grid-cols-[20px_minmax(0,1fr)] items-start gap-3 rounded-[4px] border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2.5 text-sm text-[var(--color-ink)] transition hover:border-[var(--color-rule-strong)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]"
      />
      <span className="leading-5">{label}</span>
    </label>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[6px] border border-[var(--color-rule)] bg-[var(--color-paper-elevated)] p-4">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[4px] bg-[var(--color-rule-subtle)] text-[var(--color-accent)]">
        {icon}
      </div>
      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
        {label}
      </div>
      <div className="mt-1 min-h-8 text-2xl font-semibold leading-tight text-[var(--color-ink)]">
        {value}
      </div>
      <div className="mt-2 text-sm text-[var(--color-ink-secondary)]">
        {detail}
      </div>
    </div>
  );
}

function RuleRow({ result }: { result: RuleResult }) {
  const tone = statusTone(result.status);

  return (
    <article className="grid gap-4 p-5 md:grid-cols-[210px_minmax(0,1fr)]">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] ${tone.iconClass}`}
          aria-hidden="true"
        >
          {tone.icon}
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${tone.textClass}`}>
            {tone.label}
          </div>
          <div className="mt-1 font-mono text-[0.72rem] text-[var(--color-ink-muted)]">
            {result.section}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <h3 className="text-base font-semibold text-[var(--color-ink)]">
            {result.label}
          </h3>
          {result.dueDate ? (
            <div className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
              {result.dueDate}
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--color-ink-secondary)]">
          {result.detail}
        </p>
        <code className="mt-3 block overflow-x-auto rounded-[4px] bg-[var(--color-rule-subtle)] px-3 py-2 font-mono text-[0.72rem] text-[var(--color-ink-secondary)]">
          {result.target}
        </code>
      </div>
    </article>
  );
}

function TargetLine({ section, label }: { section: string; label: string }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 border-b border-[var(--color-rule-subtle)] py-3 last:border-b-0">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
        {section}
      </span>
      <span>{label}</span>
    </div>
  );
}

function statusTone(status: RuleStatus) {
  switch (status) {
    case "pass":
      return {
        label: "Pass",
        icon: <CheckCircle2 size={18} />,
        iconClass:
          "bg-emerald-50 text-emerald-700 border border-emerald-200",
        textClass: "text-emerald-700",
      };
    case "warning":
      return {
        label: "Review",
        icon: <AlertTriangle size={18} />,
        iconClass: "bg-amber-50 text-amber-700 border border-amber-200",
        textClass: "text-amber-700",
      };
    case "fail":
      return {
        label: "Fail",
        icon: <XCircle size={18} />,
        iconClass: "bg-red-50 text-red-700 border border-red-200",
        textClass: "text-red-700",
      };
    case "info":
      return {
        label: "Info",
        icon: <Info size={18} />,
        iconClass: "bg-sky-50 text-sky-700 border border-sky-200",
        textClass: "text-sky-700",
      };
  }
}
