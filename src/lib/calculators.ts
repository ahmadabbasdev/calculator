import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  Briefcase,
  Calculator,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Clock,
  DollarSign,
  Gamepad2,
  HandCoins,
  HeartPulse,
  Landmark,
  Percent,
  PiggyBank,
  ChartColumn,
  ClipboardList,
  Receipt,
  Ruler,
  Scale,
  Sigma,
  Wallet,
} from "lucide-react";
import { isPalworldVerified } from "@/lib/palworld/load";
import { SHOW_STATE_TAX_PILOT } from "@/lib/state-tax/config";

/** Theme keys map to `--cat-*` tokens in globals.css */
export type CategoryTheme = "date" | "finance" | "health" | "math" | "games";

/** Category slug → theme key (use for route-based calculator pages). */
export type CategorySlug =
  | "date-time"
  | "finance"
  | "health"
  | "math"
  | "games";

/**
 * Canonical category color map keyed by category slug.
 * Future calculator pages should resolve accents via `getCategoryColors(slug)`
 * instead of hardcoding hex or brand amber.
 */
export const CATEGORY_COLORS: Record<
  CategorySlug,
  {
    theme: CategoryTheme;
    hex: string;
    softHex: string;
    cssVar: string;
    softCssVar: string;
  }
> = {
  "date-time": {
    theme: "date",
    hex: "#0F5C5C",
    softHex: "#E6F0EF",
    cssVar: "--cat-date",
    softCssVar: "--cat-date-soft",
  },
  finance: {
    theme: "finance",
    hex: "#15803D",
    softHex: "#EFF9F1",
    cssVar: "--cat-finance",
    softCssVar: "--cat-finance-soft",
  },
  health: {
    theme: "health",
    hex: "#BE185D",
    softHex: "#FDF0F5",
    cssVar: "--cat-health",
    softCssVar: "--cat-health-soft",
  },
  math: {
    theme: "math",
    hex: "#7C3AED",
    softHex: "#F5F0FE",
    cssVar: "--cat-math",
    softCssVar: "--cat-math-soft",
  },
  games: {
    theme: "games",
    hex: "#18181B",
    softHex: "#F5F5F4",
    cssVar: "--cat-games",
    softCssVar: "--cat-games-soft",
  },
};

export function getCategoryColors(slug: CategorySlug) {
  return CATEGORY_COLORS[slug];
}

export function getCategoryTheme(slug: CategorySlug): CategoryTheme {
  return CATEGORY_COLORS[slug].theme;
}

export type CalculatorStatus = "live" | "coming-soon" | "draft";

export type CalculatorListing = {
  id: string;
  /** URL slug segment (usually matches the route leaf). */
  slug: string;
  name: string;
  description: string;
  /** Present when status is "live". */
  href?: string;
  icon: LucideIcon;
  status: CalculatorStatus;
  /** ISO date (YYYY-MM-DD) when the tool was added. Used for the optional New badge. */
  addedAt: string;
  /**
   * ISO date (YYYY-MM-DD) of the last human content/data review.
   * Shown on the tool page when set — not the build date.
   */
  reviewedAt?: string;
  /** Shown in the homepage popular strip when true. */
  popular?: boolean;
};

export type CalculatorCategory = {
  id: CategorySlug;
  title: string;
  description: string;
  icon: LucideIcon;
  theme: CategoryTheme;
  calculators: CalculatorListing[];
};

/** Tailwind class sets per category — full strings so utilities are detected. */
export const CATEGORY_THEME = {
  date: {
    icon: "bg-cat-date-soft text-cat-date",
    badge: "bg-cat-date-soft text-cat-date",
    hoverBorder: "hover:border-cat-date",
    soft: "bg-cat-date-soft",
    text: "text-cat-date",
    solid: "bg-cat-date",
    border: "border-cat-date",
    ring: "focus:border-cat-date focus:ring-cat-date/20",
    toggle: "peer-checked:bg-cat-date peer-focus-visible:ring-cat-date/40",
    borderSoft: "border-cat-date/30",
  },
  finance: {
    icon: "bg-cat-finance-soft text-cat-finance",
    badge: "bg-cat-finance-soft text-cat-finance",
    hoverBorder: "hover:border-cat-finance",
    soft: "bg-cat-finance-soft",
    text: "text-cat-finance",
    solid: "bg-cat-finance",
    border: "border-cat-finance",
    ring: "focus:border-cat-finance focus:ring-cat-finance/20",
    toggle: "peer-checked:bg-cat-finance peer-focus-visible:ring-cat-finance/40",
    borderSoft: "border-cat-finance/30",
  },
  health: {
    icon: "bg-cat-health-soft text-cat-health",
    badge: "bg-cat-health-soft text-cat-health",
    hoverBorder: "hover:border-cat-health",
    soft: "bg-cat-health-soft",
    text: "text-cat-health",
    solid: "bg-cat-health",
    border: "border-cat-health",
    ring: "focus:border-cat-health focus:ring-cat-health/20",
    toggle: "peer-checked:bg-cat-health peer-focus-visible:ring-cat-health/40",
    borderSoft: "border-cat-health/30",
  },
  math: {
    icon: "bg-cat-math-soft text-cat-math",
    badge: "bg-cat-math-soft text-cat-math",
    hoverBorder: "hover:border-cat-math",
    soft: "bg-cat-math-soft",
    text: "text-cat-math",
    solid: "bg-cat-math",
    border: "border-cat-math",
    ring: "focus:border-cat-math focus:ring-cat-math/20",
    toggle: "peer-checked:bg-cat-math peer-focus-visible:ring-cat-math/40",
    borderSoft: "border-cat-math/30",
  },
  games: {
    icon: "bg-cat-games-soft text-cat-games",
    badge: "bg-cat-games-soft text-cat-games",
    hoverBorder: "hover:border-cat-games",
    soft: "bg-cat-games-soft",
    text: "text-cat-games",
    solid: "bg-cat-games",
    border: "border-cat-games",
    ring: "focus:border-cat-games focus:ring-cat-games/20",
    toggle: "peer-checked:bg-cat-games peer-focus-visible:ring-cat-games/40",
    borderSoft: "border-cat-games/30",
  },
} as const;

const NEW_BADGE_DAYS = 30;
const MS_PER_DAY = 86_400_000;

/** True when the calculator is published and has a route. */
export function isCalculatorLive(
  calculator: CalculatorListing,
): calculator is CalculatorListing & { href: string } {
  return calculator.status === "live" && Boolean(calculator.href);
}

/** Live or coming-soon — shown on public catalog surfaces. Drafts are omitted. */
export function isCalculatorCatalogVisible(
  calculator: CalculatorListing,
): boolean {
  return calculator.status === "live" || calculator.status === "coming-soon";
}

/** Categories that have at least one non-draft tool (homepage, nav, counts). */
export function getPublicCategories(): CalculatorCategory[] {
  return CALCULATOR_CATEGORIES.filter((category) =>
    category.calculators.some(isCalculatorCatalogVisible),
  );
}

function palworldBreedingListing(): CalculatorListing {
  const verified = isPalworldVerified();
  return {
    id: "palworld-breeding",
    slug: "palworld-breeding-calculator",
    name: "Palworld Breeding Calculator",
    description:
      "Estimate Palworld offspring from two parents using rank averages, unique combinations, and same-species rules.",
    href: "/games/palworld-breeding-calculator",
    icon: Gamepad2,
    status: verified ? "live" : "draft",
    addedAt: new Date().toISOString().slice(0, 10),
  };
}

function stateIncomeTaxListing(): CalculatorListing {
  const live = SHOW_STATE_TAX_PILOT;
  return {
    id: "state-income-tax",
    slug: "state-income-tax-calculator",
    name: "US State Income Tax Calculator",
    description:
      "Estimate state income tax for verified US states from sourced brackets and deductions — state tax only, not federal advice.",
    href: "/finance/state-income-tax-calculator",
    icon: Landmark,
    status: live ? "live" : "draft",
    addedAt: new Date().toISOString().slice(0, 10),
    reviewedAt: live ? "2026-11-04" : undefined,
  };
}

/**
 * Show a "New" badge when live and addedAt is within the last 30 days
 * (evaluated when called — never hardcoded per tool).
 */
export function isCalculatorNew(
  calculator: CalculatorListing,
  now: Date = new Date(),
): boolean {
  if (!isCalculatorLive(calculator)) return false;
  const added = Date.parse(calculator.addedAt);
  if (!Number.isFinite(added)) return false;
  const ageMs = now.getTime() - added;
  return ageMs >= 0 && ageMs <= NEW_BADGE_DAYS * MS_PER_DAY;
}

/** Homepage and category catalog — single source of truth for all tool lists. */
export const CALCULATOR_CATEGORIES: CalculatorCategory[] = [
  {
    id: "date-time",
    title: "Date & Time",
    description: "Count days, ages, working-day spans, and clock-time durations.",
    icon: CalendarDays,
    theme: "date",
    calculators: [
      {
        id: "days-between-dates",
        slug: "days-between-dates",
        name: "Days Between Two Dates",
        description:
          "Calculate total elapsed days, weeks, months, and hours between any two start and end calendar dates.",
        href: "/date-time/days-between-dates",
        icon: CalendarRange,
        status: "live",
        addedAt: "2026-06-01",
        reviewedAt: "2026-06-01",
        popular: true,
      },
      {
        id: "age-calculator",
        slug: "age-calculator",
        name: "Age Calculator",
        description:
          "Determine chronological age down to precise years, months, and days, with a clear days-old total.",
        href: "/date-time/age-calculator",
        icon: CalendarDays,
        status: "live",
        addedAt: "2026-06-01",
        reviewedAt: "2026-06-01",
        popular: true,
      },
      {
        id: "business-days",
        slug: "business-days-calculator",
        name: "Business Days Calculator",
        description:
          "Count working days between two dates with optional public holidays by country, custom weekends, and custom days off.",
        href: "/date-time/business-days-calculator",
        icon: Briefcase,
        status: "live",
        addedAt: "2026-06-15",
        reviewedAt: "2026-06-15",
        popular: true,
      },
      {
        id: "add-subtract-days",
        slug: "add-subtract-days",
        name: "Add or Subtract Days",
        description:
          "Add or subtract exact quantities of days, weeks, months, or years from any starting date.",
        href: "/date-time/add-subtract-days",
        icon: CalendarPlus,
        status: "live",
        addedAt: "2026-07-01",
        reviewedAt: "2026-07-01",
      },
      {
        id: "time-duration",
        slug: "time-duration-calculator",
        name: "Time Duration Calculator",
        description:
          "Hours between two times, add or subtract hours and minutes, and total a simple timecard — wall-clock arithmetic only.",
        href: "/date-time/time-duration-calculator",
        icon: Clock,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
        reviewedAt: "2026-11-04",
      },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    description:
      "Plan loans, budgets, interest, savings goals, VAT/GST sales tax, zakat, and verified US state income tax estimates.",
    icon: DollarSign,
    theme: "finance",
    calculators: [
      {
        id: "loan-payment",
        slug: "loan-calculator",
        name: "Loan Calculator",
        description:
          "Monthly payment (EMI), total interest, payoff date, amortization schedule, and optional extra payments — reducing or flat rate.",
        href: "/finance/loan-calculator",
        icon: DollarSign,
        status: "live",
        addedAt: "2026-09-20",
        reviewedAt: "2026-09-20",
      },
      stateIncomeTaxListing(),
      {
        id: "compound-interest",
        slug: "compound-interest-calculator",
        name: "Compound Interest Calculator",
        description:
          "Future value with monthly contributions, compounding frequency, effective annual yield (APY), optional inflation, and a yearly breakdown.",
        href: "/finance/compound-interest-calculator",
        icon: Percent,
        status: "live",
        addedAt: "2026-09-25",
        reviewedAt: "2026-09-25",
      },
      {
        id: "savings-goal",
        slug: "savings-goal-calculator",
        name: "Savings Goal Calculator",
        description:
          "How much to save each month, or how long a goal will take — with optional interest and inflation.",
        href: "/finance/savings-goal-calculator",
        icon: PiggyBank,
        status: "live",
        addedAt: "2026-10-05",
        reviewedAt: "2026-10-05",
      },
      {
        id: "budget",
        slug: "budget-calculator",
        name: "Budget Calculator",
        description:
          "Monthly budget with the 50/30/20 rule, custom percentages, or your own expense list — with a calm leftover comparison.",
        href: "/finance/budget-calculator",
        icon: ClipboardList,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: "salary-to-hourly",
        slug: "salary-to-hourly-calculator",
        name: "Salary to Hourly Calculator",
        description:
          "Convert salary to hourly wage — or hourly, weekly, monthly, and other periods to yearly gross pay equivalents.",
        href: "/finance/salary-to-hourly-calculator",
        icon: Wallet,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
        reviewedAt: "2026-11-04",
      },
      {
        id: "vat-gst",
        slug: "vat-gst-calculator",
        name: "VAT, GST & Sales Tax Calculator",
        description:
          "Add or remove VAT, GST or sales tax, or find the tax rate from net and gross prices — with optional equal tax split.",
        href: "/finance/vat-gst-calculator",
        icon: Receipt,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: "zakat",
        slug: "zakat-calculator",
        name: "Zakat Calculator",
        description:
          "Estimate zakat on savings, gold, silver and investments with a chosen nisab — using metal prices you enter.",
        href: "/finance/zakat-calculator",
        icon: HandCoins,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
        reviewedAt: "2026-11-04",
      },
    ],
  },
  {
    id: "health",

    title: "Health & Fitness",
    description:
      "BMI, calorie needs, ovulation and fertile-window estimates, pregnancy due dates, and wellness screening tools.",
    icon: HeartPulse,
    theme: "health",
    calculators: [
      {
        id: "bmi",
        slug: "bmi-calculator",
        name: "BMI Calculator",
        description:
          "Body mass index from height and weight — metric or imperial, with WHO adult categories and optional Asian cut-offs.",
        href: "/health/bmi-calculator",
        icon: Activity,
        status: "live",
        addedAt: "2026-09-15",
        reviewedAt: "2026-09-15",
      },
      {
        id: "calorie",
        slug: "calorie-calculator",
        name: "Calorie Calculator",
        description:
          "Estimate BMR and TDEE (maintenance calories) with Mifflin–St Jeor and activity levels — metric or imperial.",
        href: "/health/calorie-calculator",
        icon: HeartPulse,
        status: "live",
        addedAt: "2026-09-18",
        reviewedAt: "2026-09-18",
      },
      {
        id: "ovulation",
        slug: "ovulation-calculator",
        name: "Ovulation Calculator",
        description:
          "Estimate ovulation day and fertile window from last period and cycle length — calendar method for this cycle and the next three.",
        href: "/health/ovulation-calculator",
        icon: CalendarDays,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
        reviewedAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: "due-date",
        slug: "pregnancy-due-date-calculator",
        name: "Pregnancy Due Date Calculator",
        description:
          "Estimate a due date from last period (LMP), conception date, IVF embryo transfer, or ultrasound — with weeks pregnant and trimester dates.",
        href: "/health/pregnancy-due-date-calculator",
        icon: Baby,
        status: "live",
        addedAt: "2026-09-22",
        reviewedAt: "2026-09-22",
      },
    ],
  },
  {
    id: "math",
    title: "Math & Education",
    description: "Percentages, grades, averages, and unit helpers.",
    icon: Calculator,
    theme: "math",
    calculators: [
      {
        id: "percentage",
        slug: "percentage-calculator",
        name: "Percentage Calculator",
        description:
          "Find percentage of a number, percent change, and increase or decrease — with a clear worked step.",
        href: "/math/percentage-calculator",
        icon: Percent,
        status: "live",
        addedAt: "2026-06-01",
        reviewedAt: "2026-06-01",
        popular: true,
      },
      {
        id: "grade",
        slug: "grade-calculator",
        name: "Grade Calculator",
        description:
          "Weighted course grades, what you need on a final exam, and test scores to letter grades.",
        href: "/math/grade-calculator",
        icon: ClipboardList,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: "average",
        slug: "average-calculator",
        name: "Average Calculator",
        description:
          "Compute mean, median, mode, range, geometric mean, and standard deviation from any list of numbers.",
        href: "/math/average-calculator",
        icon: Sigma,
        status: "live",
        addedAt: "2026-07-15",
        reviewedAt: "2026-07-15",
      },
      {
        id: "average-per-day",
        slug: "average-per-day-calculator",
        name: "Average Per Day Calculator",
        description:
          "Daily average or total from an amount and days — or a date range — with optional working days and week, month, and year pace.",
        href: "/math/average-per-day-calculator",
        icon: ChartColumn,
        status: "live",
        addedAt: new Date().toISOString().slice(0, 10),
        reviewedAt: "2026-11-04",
      },
      {
        id: "unit-converter",

        slug: "unit-converter",
        name: "Unit Converter",
        description:
          "Convert length, weight, volume, and temperature — cm to inches, kg to lbs, Celsius to Fahrenheit, and more.",
        href: "/math/unit-converter",
        icon: Ruler,
        status: "live",
        addedAt: "2026-07-20",
        reviewedAt: "2026-07-20",
      },
      {
        id: "gpa",
        slug: "gpa-calculator",
        name: "GPA & CGPA Calculator",
        description:
          "Semester SGPA and overall CGPA with common 4.0, 5.0, and 10-point scales, plus a target planner.",
        href: "/math/gpa-calculator",
        icon: Scale,
        status: "live",
        addedAt: "2026-06-01",
        reviewedAt: "2026-06-01",
      },
    ],
  },
  {
    id: "games",
    title: "Games",
    description: "Fan tools for game mechanics — unofficial and data-gated.",
    icon: Gamepad2,
    theme: "games",
    calculators: [palworldBreedingListing()],
  },
];

export const ALL_CALCULATORS = CALCULATOR_CATEGORIES.flatMap(
  (category) => category.calculators,
);

export const LIVE_CALCULATORS = ALL_CALCULATORS.filter(isCalculatorLive);

export const POPULAR_CALCULATORS = LIVE_CALCULATORS.filter(
  (calculator) => calculator.popular,
);

/** Look up a live catalog entry by its href (exact match). */
export function findCalculatorByHref(
  href: string,
): (CalculatorListing & { href: string }) | undefined {
  return LIVE_CALCULATORS.find((tool) => tool.href === href);
}

export const TOTAL_CALCULATOR_COUNT = ALL_CALCULATORS.length;
export const LIVE_CALCULATOR_COUNT = LIVE_CALCULATORS.length;

/** Human-readable total for badges and claims, e.g. "14 free calculators". */
export function freeCalculatorsLabel(
  count: number = LIVE_CALCULATOR_COUNT,
): string {
  return `${count} free calculator${count === 1 ? "" : "s"}`;
}

export function categoryToolCountLabel(count: number): string {
  return `${count} tool${count === 1 ? "" : "s"}`;
}

export type BuildLlmsTxtOptions = {
  siteName: string;
  /** Origin with no trailing slash, e.g. https://calcdaily.app */
  siteUrl: string;
};

/**
 * Markdown body for /llms.txt — derived only from the calculator catalog.
 * Lists live tools (skips coming-soon) with absolute URLs.
 */
export function buildLlmsTxt(options: BuildLlmsTxtOptions): string {
  const { siteName, siteUrl } = options;
  const origin = siteUrl.replace(/\/$/, "");
  const count = LIVE_CALCULATORS.length;

  const lines: string[] = [
    `# ${siteName}`,
    "",
    `${siteName} publishes ${count} browser-based calculator${count === 1 ? "" : "s"} for dates, finance, health, and math. Calculations run in the browser; selecting a country on business-day tools loads a static holiday file for that country.`,
    "",
  ];

  for (const category of CALCULATOR_CATEGORIES) {
    const live = category.calculators.filter(isCalculatorLive);
    if (live.length === 0) continue;

    lines.push(`## ${category.title}`, "");
    for (const tool of live) {
      lines.push(`- [${tool.name}](${origin}${tool.href}): ${tool.description}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
