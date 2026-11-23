import Link from "next/link";
import type { CategoryTheme } from "@/lib/calculators";
import type {
  CalculatorEeAtContent,
  FormulaBlock,
  RelatedCalculatorLink,
  WorkedExample,
} from "@/lib/calculator-eeat";

const THEME_HOVER: Record<
  CategoryTheme,
  { border: string; soft: string }
> = {
  date: {
    border: "hover:border-cat-date/45",
    soft: "hover:bg-cat-date-soft",
  },
  finance: {
    border: "hover:border-cat-finance/45",
    soft: "hover:bg-cat-finance-soft",
  },
  health: {
    border: "hover:border-cat-health/45",
    soft: "hover:bg-cat-health-soft",
  },
  math: {
    border: "hover:border-cat-math/45",
    soft: "hover:bg-cat-math-soft",
  },
  home: {
    border: "hover:border-cat-home/45",
    soft: "hover:bg-cat-home-soft",
  },
  everyday: {
    border: "hover:border-cat-everyday/45",
    soft: "hover:bg-cat-everyday-soft",
  },
  creators: {
    border: "hover:border-cat-creators/45",
    soft: "hover:bg-cat-creators-soft",
  },
  games: {
    border: "hover:border-cat-games/45",
    soft: "hover:bg-cat-games-soft",
  },
};

type FormulaMethodologyBoxProps = {
  formula: FormulaBlock;
};

/** Explicit formula / methodology callout for crawlers and readers. */
export function FormulaMethodologyBox({ formula }: FormulaMethodologyBoxProps) {
  return (
    <section
      aria-labelledby="formula-methodology-heading"
      className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6"
    >
      <h2
        id="formula-methodology-heading"
        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {formula.title}
      </h2>
      {formula.intro ? (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {formula.intro}
        </p>
      ) : null}
      <pre className="mt-4 overflow-x-auto rounded-lg border border-border/70 bg-background/80 px-4 py-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground sm:text-[14px]">
        {formula.notation}
      </pre>
      {formula.edgeCases && formula.edgeCases.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-[13px] font-semibold text-foreground">
            Edge cases
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
            {formula.edgeCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

type WorkedExamplesCardProps = {
  heading?: string;
  summary?: string;
  examples: WorkedExample[];
};

/** Card/table of concrete input → output scenarios with step-by-step math. */
export function WorkedExamplesCard({
  heading = "Worked Real-World Examples",
  summary = "Concrete scenarios you can re-enter in the calculator. Figures come from the same functions used on this page.",
  examples,
}: WorkedExamplesCardProps) {
  if (examples.length === 0) return null;

  return (
    <section
      aria-labelledby="worked-examples-heading"
      className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6"
    >
      <h2
        id="worked-examples-heading"
        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {heading}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{summary}</p>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-[13px] sm:text-[14px]">
          <caption className="sr-only">{heading}</caption>
          <thead className="border-b border-border bg-stone-50 text-[12px] text-zinc-600">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold sm:px-4">
                Scenario
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold sm:px-4">
                Inputs
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold sm:px-4">
                Result
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold sm:px-4">
                Steps
              </th>
            </tr>
          </thead>
          <tbody>
            {examples.map((example) => (
              <tr
                key={example.id}
                className="border-b border-border/70 align-top last:border-0"
              >
                <th
                  scope="row"
                  className="px-3 py-3 font-medium text-foreground sm:px-4"
                >
                  {example.title}
                </th>
                <td className="px-3 py-3 text-zinc-700 sm:px-4">
                  <ul className="space-y-1">
                    {example.inputs.map((input) => (
                      <li key={`${example.id}-${input.label}`}>
                        <span className="text-zinc-500">{input.label}: </span>
                        <span className="tabular-nums font-medium text-foreground">
                          {input.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-3 tabular-nums font-semibold text-foreground sm:px-4">
                  {example.result}
                </td>
                <td className="px-3 py-3 leading-relaxed text-zinc-700 sm:px-4">
                  {example.steps}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type RelatedCalculatorsGridProps = {
  links: RelatedCalculatorLink[];
  theme?: CategoryTheme;
  heading?: string;
  summary?: string;
};

/** Contextual internal links with descriptive anchor text. */
export function RelatedCalculatorsGrid({
  links,
  theme = "finance",
  heading = "Related Calculators",
  summary = "Closely related tools and cross-category workflows.",
}: RelatedCalculatorsGridProps) {
  if (links.length === 0) return null;
  const hover = THEME_HOVER[theme] ?? THEME_HOVER.finance;

  return (
    <section aria-labelledby="eeat-related-heading">
      <div className="mb-4 max-w-3xl">
        <h2
          id="eeat-related-heading"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {heading}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{summary}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={`inline-flex flex-col gap-1 rounded-xl border border-border/80 bg-panel px-5 py-4 shadow-card transition ${hover.border} ${hover.soft}`}
          >
            <span className="text-[15px] font-semibold text-foreground">
              {link.anchor}
            </span>
            <span className="text-sm text-muted">{link.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

type CalculatorEeAtSectionsProps = {
  content: CalculatorEeAtContent;
  /** When true, also render the related-calculators grid from the schema. */
  includeRelated?: boolean;
};

/**
 * Reusable E-E-A-T block: formula methodology + worked examples
 * (+ optional related grid). Safe to drop into any calculator article.
 */
export function CalculatorEeAtSections({
  content,
  includeRelated = false,
}: CalculatorEeAtSectionsProps) {
  return (
    <div className="space-y-10 sm:space-y-12">
      <FormulaMethodologyBox formula={content.formula} />
      <WorkedExamplesCard examples={content.examples} />
      {includeRelated ? (
        <RelatedCalculatorsGrid
          links={content.related}
          theme={content.theme}
          summary={content.relatedSummary}
        />
      ) : null}
    </div>
  );
}
