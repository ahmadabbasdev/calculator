import {
  buildStateMetaDescription,
  formatRatePercent,
  topMarginalRate,
} from "@/lib/state-tax/format";
import type { StateTaxData } from "@/lib/state-tax/schema";
import { computeWorkedExamples } from "@/lib/utils/state-tax";
import { fromCents } from "@/lib/utils/money";

export type StatePageSectionId =
  | "calculator"
  | "brackets"
  | "deductions"
  | "examples"
  | "notes"
  | "local-tax"
  | "sources"
  | "verified";

/**
 * Data-driven section ids that must appear on a taxable state page.
 * Used by tests to prevent empty template shells.
 */
export function buildStatePageSections(state: StateTaxData): StatePageSectionId[] {
  if (state.structure === "none") {
    return ["notes", "sources", "verified"];
  }
  const sections: StatePageSectionId[] = [
    "calculator",
    "brackets",
    "deductions",
    "examples",
    "notes",
    "sources",
    "verified",
  ];
  if (state.localTaxNote) {
    sections.splice(5, 0, "local-tax");
  }
  return sections;
}

export function buildStateFaqs(state: StateTaxData): {
  question: string;
  answer: string;
}[] {
  const top = formatRatePercent(topMarginalRate(state));
  const singleDeduction = state.standardDeduction.single.toLocaleString("en-US");
  const structurePhrase =
    state.structure === "flat"
      ? `${state.name} uses a flat state income tax rate of ${top} for tax year ${state.taxYear}`
      : `${state.name} uses progressive state income tax brackets for tax year ${state.taxYear}, with a top marginal rate of ${top}`;

  const firstNote = state.notes[0]?.text ?? "";
  const sourceLabel = state.sources[0]?.label ?? "the state revenue department";

  return [
    {
      question: `How does ${state.name} state income tax work in ${state.taxYear}?`,
      answer: `${structurePhrase}. This calculator estimates state income tax only after the single-filer standard deduction of ${singleDeduction} (and other statuses as listed). Federal tax, FICA, credits and local taxes are not included.`,
    },
    {
      question: `What is the ${state.name} standard deduction for a single filer?`,
      answer: `For tax year ${state.taxYear}, the verified single-filer standard deduction in this dataset is ${singleDeduction}. Married filing jointly is ${state.standardDeduction.married_joint.toLocaleString("en-US")}; head of household is ${state.standardDeduction.head_of_household.toLocaleString("en-US")}. Confirm with ${sourceLabel}.`,
    },
    {
      question: `Where do the ${state.name} figures on this page come from?`,
      answer: `Figures were last verified on ${state.lastVerified} against listed official sources, including ${sourceLabel}. ${firstNote} Estimates are general information only — not tax advice.`,
    },
  ];
}

export function assertStateFaqsUnique(states: StateTaxData[]): void {
  const seen = new Map<string, string>();
  for (const state of states) {
    for (const faq of buildStateFaqs(state)) {
      const key = `${faq.question}::${faq.answer}`;
      const prior = seen.get(key);
      if (prior) {
        throw new Error(
          `Identical FAQ reused for ${state.code} and ${prior}. FAQs must be state-specific.`,
        );
      }
      seen.set(key, state.code);
    }
  }
}

export function formatExampleSummary(
  state: StateTaxData,
): { gross: number; tax: string; effective: string }[] {
  return computeWorkedExamples(state).map(({ gross, result }) => {
    if (!result.ok) {
      return { gross, tax: "—", effective: "—" };
    }
    return {
      gross,
      tax: fromCents(result.taxCents).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      effective: `${(result.effectiveRate * 100).toFixed(2)}%`,
    };
  });
}

export { buildStateMetaDescription };
