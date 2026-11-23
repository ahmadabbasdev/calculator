/**
 * Reusable E-E-A-T content schema for calculator pages.
 *
 * Priority tools ship full entries below. Remaining calculators can adopt the
 * same shape via `getCalculatorEeAt(href)` once content is authored —
 * FormulaMethodologyBox + WorkedExamplesCard + RelatedCalculatorsGrid render it.
 */

import type { CategoryTheme } from "@/lib/calculators";

export type WorkedExampleInput = {
  label: string;
  value: string;
};

export type WorkedExample = {
  id: string;
  title: string;
  inputs: WorkedExampleInput[];
  result: string;
  /** One-line (or short) step-by-step math explanation. */
  steps: string;
};

export type FormulaBlock = {
  title: string;
  intro?: string;
  /** Plain readable notation — not LaTeX. */
  notation: string;
  edgeCases?: string[];
};

export type RelatedCalculatorLink = {
  href: string;
  /** Descriptive anchor text for internal linking. */
  anchor: string;
  description: string;
};

export type CalculatorEeAtContent = {
  href: string;
  theme: CategoryTheme;
  formula: FormulaBlock;
  examples: WorkedExample[];
  related: RelatedCalculatorLink[];
  relatedSummary?: string;
};

/**
 * High-opportunity niche calculators + a template other pages can copy.
 * Values match the same pure functions used by each calculator UI.
 */
export const CALCULATOR_EEAT: Record<string, CalculatorEeAtContent> = {
  "/home-energy/solar-panel-calculator": {
    href: "/home-energy/solar-panel-calculator",
    theme: "home",
    formula: {
      title: "Formula and Methodology",
      intro:
        "System size follows from annual use, peak sun hours, losses and panel wattage. Money figures use only the rates you type.",
      notation:
        "yield_per_kW = sun_hours × 365 × (1 − losses)\nneeded_kW = annual_use_kWh × share ÷ yield_per_kW\npanel_count = ceil(needed_kW × 1000 ÷ panel_watts)\ninstalled_kW = panel_count × panel_watts ÷ 1000\nannual_kWh ≈ installed_kW × yield_per_kW\nsimple_payback_years = system_cost ÷ year_1_savings",
      edgeCases: [
        "Losses and share are percents from 0–100; empty required fields show a calm prompt instead of NaN.",
        "Panel count always rounds up, so installed kW can slightly exceed the exact need.",
        "Payback and lifetime views are arithmetic estimates — not financial advice.",
      ],
    },
    examples: [
      {
        id: "solar-7300",
        title: "Annual home use",
        inputs: [
          { label: "Use", value: "7,300 kWh/year" },
          { label: "Sun hours", value: "5" },
          { label: "Losses", value: "20%" },
          { label: "Panel", value: "500 W" },
        ],
        result: "5.00 kW → 10 panels; ~7,300 kWh/year",
        steps:
          "Yield = 5 × 365 × 0.80 = 1,460 kWh/kW. Need 7,300 ÷ 1,460 = 5 kW → ceil(5,000 ÷ 500) = 10 panels.",
      },
      {
        id: "solar-payback",
        title: "Simple payback check",
        inputs: [
          { label: "Installed", value: "5 kW" },
          { label: "Cost per watt", value: "0.80" },
          { label: "Price per kWh", value: "0.20" },
        ],
        result: "Cost 4,000; year-1 savings 1,460; payback ≈ 2.74 years",
        steps:
          "Cost = 5,000 W × 0.80 = 4,000. Year-1 savings = 7,300 × 0.20 = 1,460. Payback = 4,000 ÷ 1,460 ≈ 2.74 years.",
      },
      {
        id: "solar-half-share",
        title: "50% of use covered",
        inputs: [
          { label: "Use", value: "7,300 kWh/year" },
          { label: "Share", value: "50%" },
          { label: "Sun / losses", value: "5 h / 20%" },
        ],
        result: "2.50 kW needed before panel rounding",
        steps:
          "Target energy = 7,300 × 0.50 = 3,650 kWh. Needed kW = 3,650 ÷ 1,460 = 2.50 kW.",
      },
    ],
    related: [
      {
        href: "/home-energy/electricity-cost-calculator",
        anchor: "Electricity Cost Calculator",
        description: "Convert watts and hours into kWh and bill estimates",
      },
      {
        href: "/home-energy/battery-backup-calculator",
        anchor: "Battery Backup Time Calculator",
        description: "Estimate UPS or inverter runtime from volts, Ah and load",
      },
      {
        href: "/home-energy/btu-calculator",
        anchor: "BTU Calculator",
        description: "Room heating and cooling capacity in BTU/h and tons",
      },
      {
        href: "/math/unit-converter",
        anchor: "Unit Converter",
        description: "Convert length, area and energy-related units",
      },
    ],
    relatedSummary:
      "Electricity cost, battery runtime, heating capacity, and unit conversion.",
  },

  "/home-energy/battery-backup-calculator": {
    href: "/home-energy/battery-backup-calculator",
    theme: "home",
    formula: {
      title: "Formula and Methodology",
      intro:
        "Runtime and pack sizing use usable watt-hours after depth-of-discharge, health and inverter efficiency.",
      notation:
        "nominal_Wh = pack_voltage × pack_Ah\nusable_Wh = nominal_Wh × usable% × health%\nruntime_hours = usable_Wh × efficiency% ÷ load_watts\n\nFor sizing a target backup time:\nrequired_Wh = load_watts × hours ÷ efficiency%\nthen convert Wh to battery count at your system voltage and Ah.",
      edgeCases: [
        "Zero or negative volts, Ah or load are blocked with a calm message.",
        "Usable, health and efficiency percents must stay within 0–100.",
        "Results are estimates — real runtime depends on inverter curves, temperature and battery chemistry.",
      ],
    },
    examples: [
      {
        id: "batt-runtime",
        title: "12 V 150 Ah at 300 W",
        inputs: [
          { label: "Battery", value: "12 V × 150 Ah" },
          { label: "Usable / efficiency", value: "50% / 85%" },
          { label: "Load", value: "300 W" },
        ],
        result: "2 h 33 min (2.55 h)",
        steps:
          "Nominal 1,800 Wh; usable 900 Wh; runtime = 900 × 0.85 ÷ 300 = 2.55 h.",
      },
      {
        id: "batt-light-load",
        title: "Same pack at 100 W",
        inputs: [
          { label: "Usable Wh", value: "900" },
          { label: "Efficiency", value: "85%" },
          { label: "Load", value: "100 W" },
        ],
        result: "≈ 7.65 h",
        steps: "Runtime = 900 × 0.85 ÷ 100 = 7.65 hours.",
      },
      {
        id: "batt-needed",
        title: "Size for 4 hours at 500 W",
        inputs: [
          { label: "Load", value: "500 W" },
          { label: "Target", value: "4 h" },
          { label: "System", value: "24 V, 150 Ah, 50% usable, 85% eff." },
        ],
        result: "Use the Needed mode to count batteries",
        steps:
          "Required Wh ≈ 500 × 4 ÷ 0.85 ≈ 2,353 Wh before usable and voltage packing.",
      },
    ],
    related: [
      {
        href: "/home-energy/solar-panel-calculator",
        anchor: "Solar Panel Calculator",
        description: "Estimate array size, panel count and simple payback",
      },
      {
        href: "/home-energy/electricity-cost-calculator",
        anchor: "Electricity Cost Calculator",
        description: "kWh and cost from appliance watts or a bill rate",
      },
      {
        href: "/home-energy/btu-calculator",
        anchor: "BTU Calculator",
        description: "Heating and cooling capacity for a room",
      },
      {
        href: "/math/unit-converter",
        anchor: "Unit Converter",
        description: "Convert energy and electrical units",
      },
    ],
  },

  "/creators/youtube-watch-time-calculator": {
    href: "/creators/youtube-watch-time-calculator",
    theme: "creators",
    formula: {
      title: "Formula and Methodology",
      intro:
        "Watch-time math converts a target hour total into views from average view duration, or projects a timeline from current hours and growth.",
      notation:
        "average_view_seconds = minutes × 60 + seconds\n  (or video_length_seconds × percent_viewed)\nviews_needed = target_hours × 3600 ÷ average_view_seconds\n\nTimeline (with optional monthly growth):\nproject remaining hours month by month until the target is reached.",
      edgeCases: [
        "Average duration must be greater than zero to find views needed.",
        "A 0% growth path uses a constant monthly hour rate.",
        "Results describe watch-time arithmetic only — not monetization eligibility advice.",
      ],
    },
    examples: [
      {
        id: "yt-3min",
        title: "4,000 hours at 3:00 average",
        inputs: [
          { label: "Target", value: "4,000 hours" },
          { label: "Avg view", value: "3:00 (180 s)" },
        ],
        result: "80,000 views",
        steps: "Views = 4,000 × 3,600 ÷ 180 = 80,000.",
      },
      {
        id: "yt-4min",
        title: "4,000 hours at 4:00 average",
        inputs: [
          { label: "Target", value: "4,000 hours" },
          { label: "Avg view", value: "4:00 (240 s)" },
        ],
        result: "60,000 views",
        steps: "Views = 4,000 × 3,600 ÷ 240 = 60,000.",
      },
      {
        id: "yt-video",
        title: "One video contribution",
        inputs: [
          { label: "Length", value: "10:00" },
          { label: "Percent viewed", value: "50%" },
          { label: "Views", value: "10,000" },
        ],
        result: "≈ 833.33 hours from that video",
        steps:
          "Avg seconds = 600 × 0.50 = 300. Hours = 10,000 × 300 ÷ 3,600 ≈ 833.33.",
      },
    ],
    related: [
      {
        href: "/math/percentage-calculator",
        anchor: "Percentage Calculator",
        description: "Percent of a number and percent change",
      },
      {
        href: "/math/average-calculator",
        anchor: "Average Calculator",
        description: "Mean and related averages for view metrics",
      },
      {
        href: "/date-time/time-duration-calculator",
        anchor: "Time Duration Calculator",
        description: "Add or find the span between times",
      },
      {
        href: "/finance/freelance-rate-calculator",
        anchor: "Freelance Rate Calculator",
        description: "Price billable creative work from a take-home goal",
      },
    ],
  },

  "/finance/zakat-calculator": {
    href: "/finance/zakat-calculator",
    theme: "finance",
    formula: {
      title: "Formula and Methodology",
      intro:
        "Zakat due is 2.5% of zakatable net wealth when that wealth meets or exceeds the nisab you enter. Metal prices are values you type — not live market feeds.",
      notation:
        "zakatable_assets = cash + receivables + investments + (gold_g × gold_price) + (silver_g × silver_price) + …\nnet_wealth = zakatable_assets − deductible_debts\nif net_wealth ≥ nisab:\n  zakat_due = net_wealth × 0.025\nelse:\n  zakat_due = 0",
      edgeCases: [
        "Negative asset or debt fields are blocked; empty optional lines count as zero.",
        "Below nisab, due amount is zero even if assets are positive.",
        "This is general arithmetic — not a fatwa or personalized religious ruling.",
      ],
    },
    examples: [
      {
        id: "zakat-above",
        title: "Above nisab on cash",
        inputs: [
          { label: "Cash / savings", value: "40,000" },
          { label: "Debts", value: "0" },
          { label: "Nisab", value: "20,000" },
        ],
        result: "Zakat due 1,000.00",
        steps: "Net 40,000 ≥ 20,000 → 40,000 × 0.025 = 1,000.",
      },
      {
        id: "zakat-below",
        title: "Below nisab",
        inputs: [
          { label: "Cash", value: "15,000" },
          { label: "Nisab", value: "20,000" },
        ],
        result: "Zakat due 0.00",
        steps: "15,000 < 20,000 nisab → due amount is zero.",
      },
      {
        id: "zakat-debt",
        title: "Assets minus debts",
        inputs: [
          { label: "Assets", value: "50,000" },
          { label: "Debts", value: "10,000" },
          { label: "Nisab", value: "20,000" },
        ],
        result: "Zakat due 1,000.00",
        steps: "Net = 40,000 ≥ nisab → 40,000 × 0.025 = 1,000.",
      },
    ],
    related: [
      {
        href: "/finance/budget-calculator",
        anchor: "Budget Calculator",
        description: "Split monthly income with 50/30/20 or custom shares",
      },
      {
        href: "/finance/savings-goal-calculator",
        anchor: "Savings Goal Calculator",
        description: "Monthly saving amount or time to a goal",
      },
      {
        href: "/math/percentage-calculator",
        anchor: "Percentage Calculator",
        description: "Percent of a number for other share calculations",
      },
      {
        href: "/finance/profit-margin-calculator",
        anchor: "Profit Margin Calculator",
        description: "Margin and markup on cost and selling price",
      },
    ],
  },

  "/finance/freelance-rate-calculator": {
    href: "/finance/freelance-rate-calculator",
    theme: "finance",
    formula: {
      title: "Formula and Methodology",
      intro:
        "Find-rate mode builds revenue from take-home, expenses and tax, then divides by billable hours after weeks off.",
      notation:
        "weeks_worked = 52 − weeks_off\nbillable_hours = weeks_worked × billable_hours_per_week\nprofit_needed = take_home ÷ (1 − tax_rate)   (when tax_rate < 100%)\nrevenue_needed = profit_needed + annual_expenses\noptional: raise revenue for platform fee and/or buffer\nhourly_rate = revenue_needed ÷ billable_hours",
      edgeCases: [
        "Tax rate of 100% or more cannot convert take-home to profit.",
        "Zero billable hours (for example 52 weeks off) is blocked.",
        "Rates are planning arithmetic — not market-rate advice.",
      ],
    },
    examples: [
      {
        id: "fr-base",
        title: "Take-home 60,000",
        inputs: [
          { label: "Take-home", value: "60,000" },
          { label: "Expenses", value: "6,000 / year" },
          { label: "Tax on profit", value: "20%" },
          { label: "Time", value: "6 weeks off, 25 h/week" },
        ],
        result: "≈ 70.43 per hour",
        steps:
          "Weeks 46 → 1,150 h. Profit 75,000 + expenses 6,000 = 81,000 revenue ÷ 1,150 ≈ 70.43.",
      },
      {
        id: "fr-fee",
        title: "Same goal with 20% platform fee",
        inputs: [
          { label: "Base revenue", value: "81,000" },
          { label: "Platform fee", value: "20%" },
        ],
        result: "≈ 88.04 per hour",
        steps:
          "Revenue with fee = 81,000 ÷ 0.80 = 101,250 ÷ 1,150 ≈ 88.04.",
      },
      {
        id: "fr-simple",
        title: "Minimal inputs",
        inputs: [
          { label: "Take-home", value: "30,000" },
          { label: "Expenses / tax", value: "0" },
          { label: "Time", value: "4 weeks off, 20 h/week" },
        ],
        result: "31.25 per hour",
        steps: "960 billable hours; 30,000 ÷ 960 = 31.25.",
      },
    ],
    related: [
      {
        href: "/finance/salary-to-hourly-calculator",
        anchor: "Salary to Hourly Calculator",
        description: "Convert salary and other pay periods to hourly equivalents",
      },
      {
        href: "/finance/profit-margin-calculator",
        anchor: "Profit Margin Calculator",
        description: "Margin and markup when pricing a product or package",
      },
      {
        href: "/math/percentage-calculator",
        anchor: "Percentage Calculator",
        description: "Percent of a number, change, and related math",
      },
      {
        href: "/finance/budget-calculator",
        anchor: "Budget Calculator",
        description: "Plan monthly spending against income",
      },
    ],
  },

  "/finance/vat-gst-calculator": {
    href: "/finance/vat-gst-calculator",
    theme: "finance",
    formula: {
      title: "Formula and Methodology",
      intro:
        "Add tax, remove tax, or find the rate. Amounts round to the nearest cent (half up). Enter the rate that applies to you — this page stores no country schedules.",
      notation:
        "Add:    tax = round(net × rate);  gross = round(net + tax)\nRemove: net = round(gross ÷ (1 + rate));  tax = round(gross − net)\n        (not gross × (1 − rate))\nFind:   rate% = (gross ÷ net − 1) × 100\nSplit:  two parts in minor units that sum exactly to tax",
      edgeCases: [
        "Negative prices are blocked; a 0% rate yields tax 0.",
        "Rate must be between 0% and 100% for add/remove.",
        "Net must be greater than zero to find a rate.",
      ],
    },
    examples: [
      {
        id: "vat-add",
        title: "Add 18% to 1,000",
        inputs: [
          { label: "Net", value: "1,000" },
          { label: "Rate", value: "18%" },
        ],
        result: "Tax 180.00; gross 1,180.00",
        steps: "1,000 × 0.18 = 180; 1,000 + 180 = 1,180.",
      },
      {
        id: "vat-remove",
        title: "Remove 18% from 1,180",
        inputs: [
          { label: "Gross", value: "1,180" },
          { label: "Rate", value: "18%" },
        ],
        result: "Net 1,000.00; tax 180.00",
        steps: "1,180 ÷ 1.18 = 1,000; tax = 1,180 − 1,000 = 180.",
      },
      {
        id: "vat-wrong",
        title: "Why × (1 − rate) fails",
        inputs: [
          { label: "Gross", value: "120" },
          { label: "Rate", value: "20%" },
        ],
        result: "Correct net 100.00 (not 96.00)",
        steps:
          "Shortcut 120 × 0.80 = 96 understates net. Correct: 120 ÷ 1.20 = 100.",
      },
    ],
    related: [
      {
        href: "/math/percentage-calculator",
        anchor: "Percentage Calculator",
        description: "Percent-of and percent-change outside a single tax rate",
      },
      {
        href: "/finance/profit-margin-calculator",
        anchor: "Profit Margin Calculator",
        description: "Margin and markup on cost and selling price",
      },
      {
        href: "/finance/salary-to-hourly-calculator",
        anchor: "Salary to Hourly Calculator",
        description: "Convert salary and wage periods",
      },
      {
        href: "/finance/loan-calculator",
        anchor: "Loan Calculator",
        description: "Monthly payment and amortization",
      },
    ],
  },

  "/finance/state-income-tax-calculator": {
    href: "/finance/state-income-tax-calculator",
    theme: "finance",
    formula: {
      title: "Formula and Methodology",
      intro:
        "Published state pages apply verified bracket tables and deductions for the stated tax year. Federal income tax is not calculated here.",
      notation:
        "taxable_income = max(0, gross_income − deductions_you_select)\nstate_tax = sum over brackets:\n  rate_i × portion_of_taxable_income_in_bracket_i\n\nEffective rate ≈ state_tax ÷ gross_income (display only)",
      edgeCases: [
        "Only published, verified states appear; pilot fixtures stay hidden.",
        "Filing status and deduction choices change taxable income before brackets run.",
        "Not a substitute for official software, a tax preparer or your department of revenue.",
      ],
    },
    examples: [
      {
        id: "sit-hub",
        title: "Open a verified state page",
        inputs: [
          { label: "Path", value: "Choose a state from the hub directory" },
        ],
        result: "State-specific brackets and worked examples on that page",
        steps:
          "Each published state page documents its tax year, structure and last-verified date.",
      },
      {
        id: "sit-brackets",
        title: "How brackets stack",
        inputs: [
          { label: "Idea", value: "Only the slice inside each band is taxed at that band’s rate" },
        ],
        result: "Marginal rate ≠ effective rate",
        steps:
          "Lower bands still apply; the top band rate applies only to income above its threshold.",
      },
      {
        id: "sit-scope",
        title: "What is out of scope",
        inputs: [
          { label: "Excluded", value: "Federal tax, local tax, credits not listed on the state page" },
        ],
        result: "State income tax estimate only",
        steps:
          "Use official sources for credits, locality taxes and filing requirements.",
      },
    ],
    related: [
      {
        href: "/finance/salary-to-hourly-calculator",
        anchor: "Salary to Hourly Calculator",
        description: "Convert pay periods before estimating tax",
      },
      {
        href: "/finance/budget-calculator",
        anchor: "Budget Calculator",
        description: "Plan spending after you estimate take-home",
      },
      {
        href: "/math/percentage-calculator",
        anchor: "Percentage Calculator",
        description: "Effective-rate style percent-of math",
      },
      {
        href: "/finance/vat-gst-calculator",
        anchor: "VAT, GST & Sales Tax Calculator",
        description: "Sales/VAT arithmetic separate from income tax",
      },
    ],
  },
};

/** Look up E-E-A-T content by calculator path (no trailing slash). */
export function getCalculatorEeAt(
  href: string,
): CalculatorEeAtContent | null {
  const key = href.replace(/\/+$/, "") || "/";
  return CALCULATOR_EEAT[key] ?? null;
}

/**
 * Minimal starter used when authoring a new calculator page.
 * Copy into CALCULATOR_EEAT and replace placeholders.
 */
export const EEAT_CONTENT_TEMPLATE: Omit<CalculatorEeAtContent, "href"> = {
  theme: "finance",
  formula: {
    title: "Formula and Methodology",
    intro: "Describe what the calculator computes in one sentence.",
    notation: "result = f(inputs)",
    edgeCases: ["Document blocked inputs and undefined cases."],
  },
  examples: [
    {
      id: "example-1",
      title: "Scenario title",
      inputs: [{ label: "Input", value: "…" }],
      result: "…",
      steps: "Show the arithmetic in one line.",
    },
  ],
  related: [],
  relatedSummary: "Link 3–4 closely related live calculators.",
};
