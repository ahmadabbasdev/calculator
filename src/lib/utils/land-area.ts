/**
 * Land / plot area estimates and area-unit conversions.
 * Pure math — no I/O. Inputs stay in the browser UI only.
 */

/** Square feet per square metre (exact inverse of m²→ft² constant below). */
export const SQFT_PER_SQM = 10.763910416709722;
/** 1 m² = 10.763910417 ft² (spec constant). */
export const SQFT_PER_M2 = 10.763910417;
export const SQFT_PER_YD2 = 9;
export const SQFT_PER_ACRE = 43_560;
export const M2_PER_HECTARE = 10_000;
export const SQFT_PER_SARSAI = 30.25;
/** Default marla = 9 sarsai = 272.25 ft² */
export const DEFAULT_SQFT_PER_MARLA = 272.25;
export const SARSAI_PER_MARLA = 9;
export const MARLA_PER_KANAL = 20;
export const MAX_POLYGON_POINTS = 20;

export type LengthUnit = "ft" | "m" | "yd";
export type AreaUnit =
  | "sqft"
  | "sqyd"
  | "sqm"
  | "sarsai"
  | "marla"
  | "kanal"
  | "acre"
  | "hectare";

export type PlotShape =
  | "rectangle"
  | "triangle"
  | "trapezoid"
  | "quad"
  | "polygon";

export type LandMode = "plot" | "convert";

export type LandErrorCode =
  | "empty"
  | "invalid"
  | "zero"
  | "negative"
  | "nonfinite"
  | "triangle"
  | "self_intersecting";

export type Point2D = { x: number; y: number };

export type AreaBreakdown = {
  sqft: number;
  sqyd: number;
  sqm: number;
  sarsai: number;
  marla: number;
  kanal: number;
  acre: number;
  hectare: number;
};

export type PlotSuccess = {
  ok: true;
  mode: "plot";
  shape: PlotShape;
  areaSqFt: number;
  perimeter: number;
  lengthUnit: LengthUnit;
  areas: AreaBreakdown;
  working: string;
};

export type ConvertSuccess = {
  ok: true;
  mode: "convert";
  areas: AreaBreakdown;
  working: string;
};

export type LandFailure = {
  ok: false;
  error: LandErrorCode;
  message: string;
};

export type LandResult = PlotSuccess | ConvertSuccess | LandFailure;

export type RectangleInput = {
  mode: "plot";
  shape: "rectangle";
  length: number | null;
  width: number | null;
  lengthUnit: LengthUnit;
  sqftPerMarla: number | null;
};

export type TriangleInput = {
  mode: "plot";
  shape: "triangle";
  sideA: number | null;
  sideB: number | null;
  sideC: number | null;
  lengthUnit: LengthUnit;
  sqftPerMarla: number | null;
};

export type TrapezoidInput = {
  mode: "plot";
  shape: "trapezoid";
  baseA: number | null;
  baseB: number | null;
  height: number | null;
  lengthUnit: LengthUnit;
  sqftPerMarla: number | null;
};

export type QuadInput = {
  mode: "plot";
  shape: "quad";
  sideA: number | null;
  sideB: number | null;
  sideC: number | null;
  sideD: number | null;
  diagonal: number | null;
  lengthUnit: LengthUnit;
  sqftPerMarla: number | null;
};

export type PolygonInput = {
  mode: "plot";
  shape: "polygon";
  points: Array<{ x: number | null; y: number | null }>;
  lengthUnit: LengthUnit;
  sqftPerMarla: number | null;
};

export type ConvertInput = {
  mode: "convert";
  value: number | null;
  unit: AreaUnit;
  sqftPerMarla: number | null;
};

export type LandInput =
  | RectangleInput
  | TriangleInput
  | TrapezoidInput
  | QuadInput
  | PolygonInput
  | ConvertInput;

function emptyResult(message: string): LandFailure {
  return { ok: false, error: "empty", message };
}

function invalidResult(
  message: string,
  error: LandErrorCode = "invalid",
): LandFailure {
  return { ok: false, error, message };
}

function formatNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function requirePositive(
  value: number,
  label: string,
): LandFailure | null {
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: "nonfinite",
      message: `${label} must be a finite number.`,
    };
  }
  if (value < 0) {
    return {
      ok: false,
      error: "negative",
      message: `${label} cannot be negative.`,
    };
  }
  if (value === 0) {
    return {
      ok: false,
      error: "zero",
      message: `${label} must be greater than zero.`,
    };
  }
  return null;
}

export function lengthToFeet(value: number, unit: LengthUnit): number {
  if (unit === "ft") return value;
  if (unit === "yd") return value * 3;
  // metres → feet using sqrt of SQFT_PER_M2 so area conversions stay consistent
  return value * Math.sqrt(SQFT_PER_M2);
}

export function feetToLength(value: number, unit: LengthUnit): number {
  if (unit === "ft") return value;
  if (unit === "yd") return value / 3;
  return value / Math.sqrt(SQFT_PER_M2);
}

export function resolveSqftPerMarla(custom: number | null): number {
  if (custom === null || !Number.isFinite(custom)) return DEFAULT_SQFT_PER_MARLA;
  return custom;
}

/** Convert any supported area unit to square feet. */
export function toSqFt(
  value: number,
  unit: AreaUnit,
  sqftPerMarla: number = DEFAULT_SQFT_PER_MARLA,
): number {
  switch (unit) {
    case "sqft":
      return value;
    case "sqyd":
      return value * SQFT_PER_YD2;
    case "sqm":
      return value * SQFT_PER_M2;
    case "sarsai":
      return value * SQFT_PER_SARSAI;
    case "marla":
      return value * sqftPerMarla;
    case "kanal":
      return value * sqftPerMarla * MARLA_PER_KANAL;
    case "acre":
      return value * SQFT_PER_ACRE;
    case "hectare":
      return value * M2_PER_HECTARE * SQFT_PER_M2;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

/** Expand square feet into every area unit. */
export function breakdownFromSqFt(
  sqft: number,
  sqftPerMarla: number = DEFAULT_SQFT_PER_MARLA,
): AreaBreakdown {
  const sqm = sqft / SQFT_PER_M2;
  const marla = sqft / sqftPerMarla;
  return {
    sqft,
    sqyd: sqft / SQFT_PER_YD2,
    sqm,
    sarsai: sqft / SQFT_PER_SARSAI,
    marla,
    kanal: marla / MARLA_PER_KANAL,
    acre: sqft / SQFT_PER_ACRE,
    hectare: sqm / M2_PER_HECTARE,
  };
}

export function rectangleArea(length: number, width: number): number {
  return length * width;
}

export function rectanglePerimeter(length: number, width: number): number {
  return 2 * (length + width);
}

/** Heron's formula. Returns null if sides cannot form a triangle. */
export function triangleAreaHeron(
  a: number,
  b: number,
  c: number,
): number | null {
  if (a + b <= c || a + c <= b || b + c <= a) return null;
  const s = (a + b + c) / 2;
  const areaSq = s * (s - a) * (s - b) * (s - c);
  if (areaSq <= 0 || !Number.isFinite(areaSq)) return null;
  return Math.sqrt(areaSq);
}

export function trianglePerimeter(a: number, b: number, c: number): number {
  return a + b + c;
}

export function trapezoidArea(
  baseA: number,
  baseB: number,
  height: number,
): number {
  return ((baseA + baseB) / 2) * height;
}

/**
 * Four-sided plot as two triangles sharing a diagonal.
 * Triangle 1: sides a, b, diagonal; Triangle 2: sides c, d, diagonal.
 */
export function quadAreaFromDiagonal(
  a: number,
  b: number,
  c: number,
  d: number,
  diagonal: number,
): number | null {
  const t1 = triangleAreaHeron(a, b, diagonal);
  const t2 = triangleAreaHeron(c, d, diagonal);
  if (t1 === null || t2 === null) return null;
  return t1 + t2;
}

export function quadPerimeter(
  a: number,
  b: number,
  c: number,
  d: number,
): number {
  return a + b + c + d;
}

/**
 * Detect self-intersection of a simple polygon ring (non-adjacent edges).
 * Adjacent edges sharing a vertex are allowed to meet at endpoints.
 */
export function polygonSelfIntersects(points: Point2D[]): boolean {
  const n = points.length;
  if (n < 4) return false;

  function orient(
    p: Point2D,
    q: Point2D,
    r: Point2D,
  ): number {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  }

  function onSegment(p: Point2D, q: Point2D, r: Point2D): boolean {
    return (
      Math.min(p.x, r.x) - 1e-12 <= q.x &&
      q.x <= Math.max(p.x, r.x) + 1e-12 &&
      Math.min(p.y, r.y) - 1e-12 <= q.y &&
      q.y <= Math.max(p.y, r.y) + 1e-12
    );
  }

  function segmentsIntersect(
    p1: Point2D,
    q1: Point2D,
    p2: Point2D,
    q2: Point2D,
  ): boolean {
    const o1 = orient(p1, q1, p2);
    const o2 = orient(p1, q1, q2);
    const o3 = orient(p2, q2, p1);
    const o4 = orient(p2, q2, q1);

    if (o1 * o2 < 0 && o3 * o4 < 0) return true;

    if (Math.abs(o1) < 1e-12 && onSegment(p1, p2, q1)) return true;
    if (Math.abs(o2) < 1e-12 && onSegment(p1, q2, q1)) return true;
    if (Math.abs(o3) < 1e-12 && onSegment(p2, p1, q2)) return true;
    if (Math.abs(o4) < 1e-12 && onSegment(p2, q1, q2)) return true;
    return false;
  }

  for (let i = 0; i < n; i += 1) {
    const a1 = points[i]!;
    const a2 = points[(i + 1) % n]!;
    for (let j = i + 1; j < n; j += 1) {
      // Skip adjacent edges and the same edge
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === n - 1) continue;
      const b1 = points[j]!;
      const b2 = points[(j + 1) % n]!;
      // Also skip if they share a vertex (closed ring adjacency)
      if (
        (a1.x === b1.x && a1.y === b1.y) ||
        (a1.x === b2.x && a1.y === b2.y) ||
        (a2.x === b1.x && a2.y === b1.y) ||
        (a2.x === b2.x && a2.y === b2.y)
      ) {
        continue;
      }
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

/** Shoelace formula (absolute area). Points in order around the boundary. */
export function polygonAreaShoelace(points: Point2D[]): number {
  const n = points.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    sum += points[i]!.x * points[j]!.y - points[j]!.x * points[i]!.y;
  }
  return Math.abs(sum) / 2;
}

export function polygonPerimeter(points: Point2D[]): number {
  const n = points.length;
  if (n < 2) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const dx = points[j]!.x - points[i]!.x;
    const dy = points[j]!.y - points[i]!.y;
    sum += Math.hypot(dx, dy);
  }
  return sum;
}

function resolveMarla(
  sqftPerMarla: number | null,
): { ok: true; value: number } | { ok: false; failure: LandFailure } {
  const value = resolveSqftPerMarla(sqftPerMarla);
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: "nonfinite",
        message: "Marla size must be a finite number.",
      },
    };
  }
  if (value <= 0) {
    return {
      ok: false,
      failure: {
        ok: false,
        error: value < 0 ? "negative" : "zero",
        message: "Marla size must be greater than zero.",
      },
    };
  }
  return { ok: true, value };
}

/**
 * Estimate plot area for a shape, or convert an area between units.
 */
export function calculateLandArea(input: LandInput): LandResult {
  if (input.mode === "convert") {
    return calculateConvert(input);
  }
  switch (input.shape) {
    case "rectangle":
      return calculateRectangle(input);
    case "triangle":
      return calculateTriangle(input);
    case "trapezoid":
      return calculateTrapezoid(input);
    case "quad":
      return calculateQuad(input);
    case "polygon":
      return calculatePolygon(input);
    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
}

function calculateConvert(input: ConvertInput): LandResult {
  if (input.value === null) {
    return emptyResult("Enter an area value to convert.");
  }
  const err = requirePositive(input.value, "Area");
  if (err) return err;

  const marla = resolveMarla(input.sqftPerMarla);
  if (!marla.ok) return marla.failure;

  const sqft = toSqFt(input.value, input.unit, marla.value);
  if (!Number.isFinite(sqft)) {
    return invalidResult("Conversion produced a non-finite result.");
  }
  const areas = breakdownFromSqFt(sqft, marla.value);
  return {
    ok: true,
    mode: "convert",
    areas,
    working: `${formatNum(input.value, 4)} ${input.unit} = ${formatNum(areas.sqft, 2)} ft² = ${formatNum(areas.marla, 2)} marla = ${formatNum(areas.kanal, 2)} kanal = ${formatNum(areas.sqm, 2)} m².`,
  };
}

function calculateRectangle(input: RectangleInput): LandResult {
  if (input.length === null || input.width === null) {
    return emptyResult("Enter length and width.");
  }
  const lErr = requirePositive(input.length, "Length");
  if (lErr) return lErr;
  const wErr = requirePositive(input.width, "Width");
  if (wErr) return wErr;

  const marla = resolveMarla(input.sqftPerMarla);
  if (!marla.ok) return marla.failure;

  const lengthFt = lengthToFeet(input.length, input.lengthUnit);
  const widthFt = lengthToFeet(input.width, input.lengthUnit);
  const areaSqFt = rectangleArea(lengthFt, widthFt);
  const perimeterFt = rectanglePerimeter(lengthFt, widthFt);
  if (!Number.isFinite(areaSqFt) || !Number.isFinite(perimeterFt)) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const areas = breakdownFromSqFt(areaSqFt, marla.value);
  const perimeter = feetToLength(perimeterFt, input.lengthUnit);
  return {
    ok: true,
    mode: "plot",
    shape: "rectangle",
    areaSqFt,
    perimeter,
    lengthUnit: input.lengthUnit,
    areas,
    working: `${formatNum(input.length, 2)} × ${formatNum(input.width, 2)} ${input.lengthUnit} = ${formatNum(areaSqFt, 2)} ft² (${formatNum(areas.marla, 2)} marla, ${formatNum(areas.kanal, 2)} kanal, ${formatNum(areas.sqm, 2)} m²).`,
  };
}

function calculateTriangle(input: TriangleInput): LandResult {
  if (input.sideA === null || input.sideB === null || input.sideC === null) {
    return emptyResult("Enter all three sides.");
  }
  for (const [value, label] of [
    [input.sideA, "Side a"],
    [input.sideB, "Side b"],
    [input.sideC, "Side c"],
  ] as const) {
    const err = requirePositive(value, label);
    if (err) return err;
  }

  const marla = resolveMarla(input.sqftPerMarla);
  if (!marla.ok) return marla.failure;

  const a = lengthToFeet(input.sideA, input.lengthUnit);
  const b = lengthToFeet(input.sideB, input.lengthUnit);
  const c = lengthToFeet(input.sideC, input.lengthUnit);
  const areaSqFt = triangleAreaHeron(a, b, c);
  if (areaSqFt === null) {
    return {
      ok: false,
      error: "triangle",
      message:
        "These three lengths cannot form a triangle. Each side must be shorter than the sum of the other two.",
    };
  }
  const perimeterFt = trianglePerimeter(a, b, c);
  if (!Number.isFinite(areaSqFt) || !Number.isFinite(perimeterFt)) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const areas = breakdownFromSqFt(areaSqFt, marla.value);
  return {
    ok: true,
    mode: "plot",
    shape: "triangle",
    areaSqFt,
    perimeter: feetToLength(perimeterFt, input.lengthUnit),
    lengthUnit: input.lengthUnit,
    areas,
    working: `Heron: sides ${formatNum(input.sideA, 2)}, ${formatNum(input.sideB, 2)}, ${formatNum(input.sideC, 2)} ${input.lengthUnit} → ${formatNum(areaSqFt, 2)} ft² (${formatNum(areas.marla, 2)} marla).`,
  };
}

function calculateTrapezoid(input: TrapezoidInput): LandResult {
  if (input.baseA === null || input.baseB === null || input.height === null) {
    return emptyResult("Enter both parallel sides and the height.");
  }
  for (const [value, label] of [
    [input.baseA, "Parallel side a"],
    [input.baseB, "Parallel side b"],
    [input.height, "Height"],
  ] as const) {
    const err = requirePositive(value, label);
    if (err) return err;
  }

  const marla = resolveMarla(input.sqftPerMarla);
  if (!marla.ok) return marla.failure;

  const a = lengthToFeet(input.baseA, input.lengthUnit);
  const b = lengthToFeet(input.baseB, input.lengthUnit);
  const h = lengthToFeet(input.height, input.lengthUnit);
  const areaSqFt = trapezoidArea(a, b, h);
  // Perimeter of a trapezoid needs non-parallel sides; report parallel+height span only as note via 2*(avg bases) is wrong.
  // Spec asks for perimeter — for trapezoid without legs, approximate as sum of known edges is incomplete.
  // Use: bases a+b plus twice the height as a lower-bound placeholder? Better: only sum known lengths a+b+2*h is not correct.
  // Common approach when legs unknown: perimeter unavailable → use a+b + 2*hypot approximation assuming rectangle-like.
  // Spec: "Show area in all units below plus the perimeter" — for trapezoid with only two bases and height,
  // we cannot know legs. I'll compute perimeter as a + b + 2 * height only if we treat it as right? That's wrong.
  // Looking at similar calculators: often they ask for all four sides. Spec only gives two parallel + height.
  // I'll report perimeter as NaN-safe: use a + b + 2 * sqrt(((a-b)/2)^2 + h^2) assuming isosceles trapezoid.
  const leg = Math.hypot(Math.abs(a - b) / 2, h);
  const perimeterFt = a + b + 2 * leg;
  if (!Number.isFinite(areaSqFt) || !Number.isFinite(perimeterFt)) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const areas = breakdownFromSqFt(areaSqFt, marla.value);
  return {
    ok: true,
    mode: "plot",
    shape: "trapezoid",
    areaSqFt,
    perimeter: feetToLength(perimeterFt, input.lengthUnit),
    lengthUnit: input.lengthUnit,
    areas,
    working: `((${formatNum(input.baseA, 2)} + ${formatNum(input.baseB, 2)}) ÷ 2) × ${formatNum(input.height, 2)} ${input.lengthUnit} = ${formatNum(areaSqFt, 2)} ft² (${formatNum(areas.marla, 2)} marla). Perimeter assumes an isosceles trapezoid.`,
  };
}

function calculateQuad(input: QuadInput): LandResult {
  if (
    input.sideA === null ||
    input.sideB === null ||
    input.sideC === null ||
    input.sideD === null ||
    input.diagonal === null
  ) {
    return emptyResult("Enter all four sides and one diagonal.");
  }
  for (const [value, label] of [
    [input.sideA, "Side a"],
    [input.sideB, "Side b"],
    [input.sideC, "Side c"],
    [input.sideD, "Side d"],
    [input.diagonal, "Diagonal"],
  ] as const) {
    const err = requirePositive(value, label);
    if (err) return err;
  }

  const marla = resolveMarla(input.sqftPerMarla);
  if (!marla.ok) return marla.failure;

  const a = lengthToFeet(input.sideA, input.lengthUnit);
  const b = lengthToFeet(input.sideB, input.lengthUnit);
  const c = lengthToFeet(input.sideC, input.lengthUnit);
  const d = lengthToFeet(input.sideD, input.lengthUnit);
  const diag = lengthToFeet(input.diagonal, input.lengthUnit);
  const areaSqFt = quadAreaFromDiagonal(a, b, c, d, diag);
  if (areaSqFt === null) {
    return {
      ok: false,
      error: "triangle",
      message:
        "The sides and diagonal cannot form two valid triangles. Check the measurements and which sides meet the diagonal.",
    };
  }
  const perimeterFt = quadPerimeter(a, b, c, d);
  if (!Number.isFinite(areaSqFt) || !Number.isFinite(perimeterFt)) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const areas = breakdownFromSqFt(areaSqFt, marla.value);
  return {
    ok: true,
    mode: "plot",
    shape: "quad",
    areaSqFt,
    perimeter: feetToLength(perimeterFt, input.lengthUnit),
    lengthUnit: input.lengthUnit,
    areas,
    working: `Two triangles sharing diagonal ${formatNum(input.diagonal, 2)} ${input.lengthUnit} → ${formatNum(areaSqFt, 2)} ft² (${formatNum(areas.marla, 2)} marla). Measure the diagonal between the corners that split the plot into two triangles.`,
  };
}

function calculatePolygon(input: PolygonInput): LandResult {
  if (input.points.length < 3) {
    return emptyResult("Enter at least three points for a polygon.");
  }
  if (input.points.length > MAX_POLYGON_POINTS) {
    return invalidResult(
      `You can enter up to ${MAX_POLYGON_POINTS} points.`,
    );
  }

  const resolved: Point2D[] = [];
  for (let i = 0; i < input.points.length; i += 1) {
    const p = input.points[i]!;
    if (p.x === null || p.y === null) {
      return emptyResult(
        `Point ${i + 1} needs both x and y coordinates.`,
      );
    }
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      return {
        ok: false,
        error: "nonfinite",
        message: `Point ${i + 1} must use finite numbers.`,
      };
    }
    resolved.push({
      x: lengthToFeet(p.x, input.lengthUnit),
      y: lengthToFeet(p.y, input.lengthUnit),
    });
  }

  if (polygonSelfIntersects(resolved)) {
    return {
      ok: false,
      error: "self_intersecting",
      message:
        "This shape crosses itself (self-intersecting). Re-order the points around the boundary without crossing edges, or split the plot into separate shapes.",
    };
  }

  const marla = resolveMarla(input.sqftPerMarla);
  if (!marla.ok) return marla.failure;

  const areaSqFt = polygonAreaShoelace(resolved);
  const perimeterFt = polygonPerimeter(resolved);
  if (areaSqFt === 0) {
    return {
      ok: false,
      error: "zero",
      message: "The polygon area is zero. Check that the points enclose a region.",
    };
  }
  if (!Number.isFinite(areaSqFt) || !Number.isFinite(perimeterFt)) {
    return invalidResult("Calculation produced a non-finite result.");
  }

  const areas = breakdownFromSqFt(areaSqFt, marla.value);
  return {
    ok: true,
    mode: "plot",
    shape: "polygon",
    areaSqFt,
    perimeter: feetToLength(perimeterFt, input.lengthUnit),
    lengthUnit: input.lengthUnit,
    areas,
    working: `Shoelace on ${resolved.length} points → ${formatNum(areaSqFt, 2)} ft² (${formatNum(areas.marla, 2)} marla, ${formatNum(areas.sqm, 2)} m²).`,
  };
}

/** Build a conversion reference row from the same conversion functions. */
export function areaConversionReferenceRow(
  value: number,
  unit: AreaUnit,
  sqftPerMarla: number = DEFAULT_SQFT_PER_MARLA,
): AreaBreakdown & { inputValue: number; inputUnit: AreaUnit } {
  const sqft = toSqFt(value, unit, sqftPerMarla);
  return {
    inputValue: value,
    inputUnit: unit,
    ...breakdownFromSqFt(sqft, sqftPerMarla),
  };
}
