import {
  formatRatePercent,
  getPublishedTaxableStates,
  stateHref,
  topMarginalRate,
} from "@/lib/state-tax/load";

/**
 * Compact text-link row for Finance and /calculators directories.
 * Renders nothing when the pilot is off or no states are published.
 */
export function StateTaxDirectoryLinks() {
  const states = getPublishedTaxableStates()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  if (states.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-border/70 bg-stone-50/80 px-4 py-3">
      <p className="text-[13px] font-semibold text-zinc-800">
        State income tax calculators
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] leading-relaxed">
        {states.map((state) => (
          <li key={state.code}>
            <a
              href={stateHref(state)}
              className="text-zinc-700 underline underline-offset-2 hover:text-foreground"
            >
              {state.name}
              <span className="text-zinc-500">
                {" "}
                ({state.taxYear}, {state.structure}, top{" "}
                {formatRatePercent(topMarginalRate(state))})
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
