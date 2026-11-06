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

  const factBlurb = state.facts
    .slice(0, 2)
    .map((f) => f.text)
    .join(" ");
  const local =
    state.localTaxNote?.trim() ||
    `${state.name} local wage taxes are not added in this estimate.`;
  const pe = state.personalExemption;
  const peSingle =
    pe == null ? 0 : typeof pe === "number" ? pe : pe.single;
  const pePhrase =
    peSingle > 0
      ? `A personal exemption of ${peSingle.toLocaleString("en-US")} for a single filer is applied in the estimate when the schedule includes one.`
      : `${state.name}’s schedule on this page does not add a separate personal exemption beyond the standard deduction shown.`;

  return [
    {
      question: `How does ${state.name} state income tax work in ${state.taxYear}?`,
      answer: `${structurePhrase}. This calculator estimates state income tax only after the single-filer standard deduction of ${singleDeduction} (and other statuses as listed). ${pePhrase} Federal tax, FICA, credits and local taxes are not included.`,
    },
    {
      question: `What is the ${state.name} standard deduction for a single filer?`,
      answer: `For tax year ${state.taxYear}, the verified single-filer standard deduction in this dataset is ${singleDeduction}. Married filing jointly is ${state.standardDeduction.married_joint.toLocaleString("en-US")}; head of household is ${state.standardDeduction.head_of_household.toLocaleString("en-US")}. Confirm with ${sourceLabel}.`,
    },
    {
      question: `Does this ${state.name} calculator include local income tax?`,
      answer: `${local} Enter only amounts relevant to ${state.name} state income tax here.`,
    },
    {
      question: `What should I know before trusting the ${state.name} estimate?`,
      answer: `${factBlurb || firstNote} Part-year residency, credits, and itemized deductions beyond the listed standard deduction are outside this model.`,
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

function moneyLabel(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * State-specific editorial blocks (scenarios, mistakes, limits).
 * Built only from that state's verified numbers so pages do not share prose.
 */
export function buildStateEditorial(state: StateTaxData): {
  scenarios: { title: string; body: string }[];
  mistakes: string[];
  notEnough: string[];
  structureBlurb: string;
} {
  const examples = computeWorkedExamples(state);
  const mid = examples[1];
  const high = examples[2];
  const midTax =
    mid && mid.result.ok
      ? moneyLabel(fromCents(mid.result.taxCents))
      : "—";
  const highTax =
    high && high.result.ok
      ? moneyLabel(fromCents(high.result.taxCents))
      : "—";
  const sd = state.standardDeduction.single.toLocaleString("en-US");
  const pe = state.personalExemption;
  const peSingle =
    pe == null
      ? 0
      : typeof pe === "number"
        ? pe
        : pe.single;
  const peLabel = peSingle.toLocaleString("en-US");
  const top = formatRatePercent(topMarginalRate(state));
  const sourceLabel = state.sources[0]?.label ?? "the state revenue department";

  const structureBlurb =
    state.structure === "flat"
      ? `${state.name} uses a flat ${top} state income tax for tax year ${state.taxYear}. After subtracting the single-filer standard deduction of ${sd}${peSingle > 0 ? ` and a personal exemption of ${peLabel}` : ""}, every dollar of remaining taxable income is taxed at ${top}.`
      : `${state.name} uses progressive brackets for tax year ${state.taxYear}, with a top marginal rate of ${top}. Taxable income is filled bracket by bracket after the single-filer standard deduction of ${sd}${peSingle > 0 ? ` and personal exemption of ${peLabel}` : ""}.`;

  const noteHint = state.notes[0]?.text ?? "";
  const sdJoint = state.standardDeduction.married_joint.toLocaleString("en-US");

  const scenarios =
    state.structure === "flat"
      ? [
          {
            title: `${state.name} example: $80,000 wages, single, ${top} flat rate`,
            body: `For a single filer in ${state.name} with 80,000 gross and no pre-tax deductions, subtract the ${sd} standard deduction${peSingle > 0 ? ` and the ${peLabel} personal exemption` : " (this schedule uses no personal exemption beyond what is shown)"}. The remaining taxable income is taxed at the flat ${top} rate for ${state.taxYear}. Estimated state tax: $${midTax}. Federal income tax and FICA are separate.`,
          },
          {
            title: `${state.name} example: $150,000 wages, same flat ${top}`,
            body: `Raise gross to 150,000 with the same single status. Because ${state.name} is flat at ${top}, state tax scales with taxable income after the ${sd} deduction${peSingle > 0 ? ` and ${peLabel} exemption` : ""}. Estimated state tax: $${highTax}. Married filing jointly on this page uses a ${sdJoint} standard deduction instead.`,
          },
        ]
      : [
          {
            title: `${state.name} example: $80,000, progressive brackets to ${top}`,
            body: `Enter 80,000 gross as Single with no pre-tax deductions. After the ${sd} standard deduction${peSingle > 0 ? ` and ${peLabel} exemption` : ""}, taxable income fills ${state.name}’s brackets in order up toward the ${top} top rate. Estimated state tax: $${midTax}.`,
          },
          {
            title: `${state.name} example: $150,000 reaches higher brackets`,
            body: `At 150,000 gross, more income sits in upper ${state.name} brackets (top ${top}). Estimated state tax: $${highTax}. Do not apply ${top} to every dollar — only the slice that falls in that bracket.`,
          },
        ];

  const mistakes =
    state.structure === "flat"
      ? [
          `Charging ${top} on full gross wages in ${state.name} without removing the ${sd} single standard deduction${peSingle > 0 ? ` and ${peLabel} exemption` : ""}.`,
          `Reading $${midTax} (the $80k example) as take-home pay — federal tax and FICA are not subtracted here.`,
          `Mixing tax year ${state.taxYear} figures with an older booklet; this page was last checked ${state.lastVerified} using ${sourceLabel}.`,
        ]
      : [
          `Applying ${state.name}’s top rate ${top} to all taxable income instead of walking each bracket.`,
          `Skipping the ${sd} single deduction${peSingle > 0 ? ` or ${peLabel} exemption` : ""} before the bracket stack.`,
          `Ignoring the local-tax note on this ${state.name} page while still expecting local wage tax in the total (this tool does not add local tax).`,
        ];

  const notEnough = [
    `Filing as a part-year ${state.name} resident or splitting income with another state.`,
    `Claiming credits or itemizing beyond the ${sd} / ${sdJoint} deductions listed for ${state.name}.`,
    `Building a paycheck from withholding tables — this page estimates annual state tax, not per-period withholding.`,
    `Relying on the tool instead of ${sourceLabel} when numbers disagree.`,
    noteHint ? `Context from this page’s notes: ${noteHint}` : `Confirm unusual facts directly with ${sourceLabel}.`,
  ];

  return { scenarios, mistakes, notEnough, structureBlurb };
}

export { buildStateMetaDescription };
