/**
 * Pure grade math for the Grade Calculator.
 * Display rounding only — never return NaN or Infinity to callers.
 */

export type GradeMode = "weighted" | "final-needed" | "test-score";

export type LetterScaleId = "us-standard" | "us-plus-minus" | "custom";

export type LetterCutoff = {
  letter: string;
  /** Minimum percentage for this letter (inclusive). */
  minPercent: number;
};

export type WeightedRow = {
  name?: string;
  /** Score as a percent (may exceed 100 for extra credit). */
  score: number | null;
  /** Weight as a percent of the course. */
  weight: number | null;
};

export type WeightedGradeResult =
  | {
      ok: true;
      average: number;
      letter: string;
      weightsTotal: number;
      weightsAre100: boolean;
      hasExtraCreditScore: boolean;
      working: string;
    }
  | {
      ok: false;
      error: "empty" | "no_weights" | "invalid";
      message: string;
    };

export type FinalNeededResult =
  | {
      ok: true;
      needed: number;
      kind: "reachable" | "unreachable" | "already_secured";
      lowestOverallIfZero?: number;
      working: string;
      message: string;
    }
  | {
      ok: false;
      error: "empty" | "invalid_weight" | "invalid";
      message: string;
    };

export type TestScoreResult =
  | {
      ok: true;
      percent: number;
      letter: string;
      working: string;
    }
  | {
      ok: false;
      error: "empty" | "invalid" | "zero_possible";
      message: string;
    };

/** US standard: A 90, B 80, C 70, D 60, F below. */
export const US_STANDARD_CUTOFFS: LetterCutoff[] = [
  { letter: "A", minPercent: 90 },
  { letter: "B", minPercent: 80 },
  { letter: "C", minPercent: 70 },
  { letter: "D", minPercent: 60 },
  { letter: "F", minPercent: 0 },
];

/** Common US plus/minus bands. */
export const US_PLUS_MINUS_CUTOFFS: LetterCutoff[] = [
  { letter: "A+", minPercent: 97 },
  { letter: "A", minPercent: 93 },
  { letter: "A-", minPercent: 90 },
  { letter: "B+", minPercent: 87 },
  { letter: "B", minPercent: 83 },
  { letter: "B-", minPercent: 80 },
  { letter: "C+", minPercent: 77 },
  { letter: "C", minPercent: 73 },
  { letter: "C-", minPercent: 70 },
  { letter: "D+", minPercent: 67 },
  { letter: "D", minPercent: 63 },
  { letter: "D-", minPercent: 60 },
  { letter: "F", minPercent: 0 },
];

export function defaultCustomCutoffs(): LetterCutoff[] {
  return US_STANDARD_CUTOFFS.map((c) => ({ ...c }));
}

export function cutoffsForScale(
  scale: LetterScaleId,
  custom: LetterCutoff[],
): LetterCutoff[] {
  if (scale === "us-standard") return US_STANDARD_CUTOFFS;
  if (scale === "us-plus-minus") return US_PLUS_MINUS_CUTOFFS;
  return custom.length > 0 ? custom : defaultCustomCutoffs();
}

/** Round for display: two decimal places; never -0. */
export function roundGradeDisplay(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatGradePercent(value: number): string {
  const n = roundGradeDisplay(value);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

/**
 * Map a percentage to a letter using cutoffs sorted by min descending.
 * Exact boundary: 90 with A@90 → A; 89.99 → next lower band.
 */
export function letterFromPercent(
  percent: number,
  cutoffs: LetterCutoff[],
): string {
  if (!Number.isFinite(percent)) return "—";
  const sorted = [...cutoffs].sort((a, b) => b.minPercent - a.minPercent);
  for (const band of sorted) {
    if (percent >= band.minPercent) return band.letter;
  }
  return sorted.at(-1)?.letter ?? "F";
}

export function parseGradeInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed || trimmed === "-" || trimmed === "." || trimmed === "-.") {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** Rows that have both a score and a weight entered. */
function activeWeightedRows(rows: WeightedRow[]): {
  score: number;
  weight: number;
}[] {
  const out: { score: number; weight: number }[] = [];
  for (const row of rows) {
    if (row.score === null || row.weight === null) continue;
    out.push({ score: row.score, weight: row.weight });
  }
  return out;
}

/**
 * Weighted average = Σ(score × weight) / Σ(weights).
 * Does not silently normalize to 100 — divides by the entered weights total.
 */
export function calculateWeightedGrade(
  rows: WeightedRow[],
  cutoffs: LetterCutoff[],
): WeightedGradeResult {
  const active = activeWeightedRows(rows);
  if (active.length === 0) {
    const anyPartial = rows.some(
      (r) => r.score !== null || r.weight !== null,
    );
    return {
      ok: false,
      error: anyPartial ? "empty" : "empty",
      message: anyPartial
        ? "Enter both a score % and a weight % on at least one row."
        : "Enter scores and weights to see your weighted grade.",
    };
  }

  for (const row of active) {
    if (row.weight < 0 || row.score < 0) {
      return {
        ok: false,
        error: "invalid",
        message: "Scores and weights cannot be negative.",
      };
    }
  }

  const weightsTotal = active.reduce((sum, r) => sum + r.weight, 0);
  if (weightsTotal === 0) {
    return {
      ok: false,
      error: "no_weights",
      message:
        "Weights total 0%. Enter positive weights so the average can be calculated.",
    };
  }

  const weightedSum = active.reduce((sum, r) => sum + r.score * r.weight, 0);
  const average = weightedSum / weightsTotal;
  if (!Number.isFinite(average)) {
    return {
      ok: false,
      error: "invalid",
      message: "Could not calculate a weighted average from these inputs.",
    };
  }

  const hasExtraCreditScore = active.some((r) => r.score > 100);
  const weightsAre100 = Math.abs(weightsTotal - 100) < 1e-9;
  const letter = letterFromPercent(average, cutoffs);
  const parts = active
    .map((r) => `${formatGradePercent(r.score)}×${formatGradePercent(r.weight)}`)
    .join(" + ");

  const working = weightsAre100
    ? `(${parts}) ÷ ${formatGradePercent(weightsTotal)} = ${formatGradePercent(average)}%`
    : `(${parts}) ÷ ${formatGradePercent(weightsTotal)} (entered weights total, not 100) = ${formatGradePercent(average)}%`;

  return {
    ok: true,
    average,
    letter,
    weightsTotal,
    weightsAre100,
    hasExtraCreditScore,
    working,
  };
}

/**
 * Needed final score = (desired − current × (1 − w)) ÷ w, with w as a fraction.
 */
export function calculateFinalNeeded(input: {
  currentGrade: number | null;
  finalWeightPercent: number | null;
  desiredGrade: number | null;
}): FinalNeededResult {
  const { currentGrade, finalWeightPercent, desiredGrade } = input;
  if (
    currentGrade === null ||
    finalWeightPercent === null ||
    desiredGrade === null
  ) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter your current grade %, final exam weight %, and desired overall grade %.",
    };
  }

  if (currentGrade < 0 || desiredGrade < 0 || finalWeightPercent < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Values cannot be negative.",
    };
  }

  if (finalWeightPercent === 0 || finalWeightPercent > 100) {
    return {
      ok: false,
      error: "invalid_weight",
      message:
        "Final exam weight must be greater than 0% and at most 100%.",
    };
  }

  const w = finalWeightPercent / 100;
  const needed = (desiredGrade - currentGrade * (1 - w)) / w;

  if (!Number.isFinite(needed)) {
    return {
      ok: false,
      error: "invalid",
      message: "Could not calculate the needed final score.",
    };
  }

  const working = `(${formatGradePercent(desiredGrade)} − ${formatGradePercent(currentGrade)} × (1 − ${formatGradePercent(finalWeightPercent)}/100)) ÷ (${formatGradePercent(finalWeightPercent)}/100) = ${formatGradePercent(needed)}%`;

  if (needed > 100) {
    return {
      ok: true,
      needed,
      kind: "unreachable",
      working,
      message:
        "Above 100% — not reachable without extra credit (or a different grading policy).",
    };
  }

  if (needed < 0) {
    const lowestOverall = currentGrade * (1 - w); // final = 0
    return {
      ok: true,
      needed,
      kind: "already_secured",
      lowestOverallIfZero: lowestOverall,
      working,
      message: `Desired grade is already secured. With 0% on the final, the lowest overall grade would be about ${formatGradePercent(lowestOverall)}%.`,
    };
  }

  return {
    ok: true,
    needed,
    kind: "reachable",
    working,
    message: `You need ${formatGradePercent(needed)}% on the final exam.`,
  };
}

export function calculateTestScore(input: {
  pointsEarned: number | null;
  pointsPossible: number | null;
  cutoffs: LetterCutoff[];
}): TestScoreResult {
  const { pointsEarned, pointsPossible, cutoffs } = input;
  if (pointsEarned === null || pointsPossible === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter points earned and points possible.",
    };
  }
  if (pointsEarned < 0 || pointsPossible < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Points cannot be negative.",
    };
  }
  if (pointsPossible === 0) {
    return {
      ok: false,
      error: "zero_possible",
      message: "Points possible must be greater than zero.",
    };
  }

  const percent = (pointsEarned / pointsPossible) * 100;
  if (!Number.isFinite(percent)) {
    return {
      ok: false,
      error: "invalid",
      message: "Could not calculate a percentage from these points.",
    };
  }

  const letter = letterFromPercent(percent, cutoffs);
  return {
    ok: true,
    percent,
    letter,
    working: `(${pointsEarned} ÷ ${pointsPossible}) × 100 = ${formatGradePercent(percent)}% → ${letter}`,
  };
}
