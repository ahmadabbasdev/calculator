import type { StateTaxData } from "@/lib/state-tax/schema";

/** Public URL slug from the state name (e.g. Illinois → illinois). */
export function stateSlug(state: Pick<StateTaxData, "name">): string {
  return state.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** @deprecated Prefer stateSlug — kept for call sites that still pass a code. */
export function stateCodeToSlug(code: string): string {
  return code.trim().toLowerCase();
}

export function slugToStateCode(slug: string): string {
  return slug.trim().toUpperCase();
}

export function stateHref(state: Pick<StateTaxData, "name">): string {
  return `/finance/state-income-tax-calculator/${stateSlug(state)}`;
}

export function hubHref(): string {
  return "/finance/state-income-tax-calculator";
}

/** Highest marginal rate across filing statuses (for meta / comparison). */
export function topMarginalRate(state: StateTaxData): number {
  if (state.structure === "none") return 0;
  let top = 0;
  for (const status of ["single", "married_joint", "head_of_household"] as const) {
    for (const bracket of state.brackets[status]) {
      if (bracket.rate > top) top = bracket.rate;
    }
  }
  return top;
}

export function formatRatePercent(rate: number): string {
  const pct = rate * 100;
  const rounded = Math.round(pct * 100) / 100;
  if (Number.isInteger(rounded)) return `${rounded}%`;
  return `${rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

export function buildStateMetaDescription(state: StateTaxData): string {
  const structureLabel =
    state.structure === "flat"
      ? "flat"
      : state.structure === "progressive"
        ? "progressive"
        : "no";
  const top = formatRatePercent(topMarginalRate(state));
  const deduction = state.standardDeduction.single.toLocaleString("en-US");
  return `Estimate ${state.name} (${state.code}) state income tax for tax year ${state.taxYear}: ${structureLabel} rates (top ${top}), single standard deduction ${deduction}. State tax only — not federal advice.`;
}

export function buildStatePageTitle(state: StateTaxData): string {
  const top = formatRatePercent(topMarginalRate(state));
  const structure =
    state.structure === "flat"
      ? "Flat"
      : state.structure === "progressive"
        ? "Progressive"
        : "No";
  const title = `${state.name} State Income Tax Calculator (${structure}, top ${top})`;
  return title.length <= 60
    ? title
    : `${state.code} Income Tax Calculator - ${structure} ${top}`;
}

export function assertUniqueStateMetaDescriptions(states: StateTaxData[]): void {
  const seen = new Map<string, string>();
  for (const state of states) {
    const description = buildStateMetaDescription(state);
    const prior = seen.get(description);
    if (prior) {
      throw new Error(
        `Duplicate meta description for ${state.code} and ${prior}. Descriptions must be unique.`,
      );
    }
    seen.set(description, state.code);
  }
}
