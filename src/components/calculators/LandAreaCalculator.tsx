"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { LandPlot, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  DEFAULT_SQFT_PER_MARLA,
  MAX_POLYGON_POINTS,
  calculateLandArea,
  type AreaUnit,
  type LandMode,
  type LengthUnit,
  type PlotShape,
} from "@/lib/utils/land-area";

const lifeTheme = CATEGORY_THEME[getCategoryTheme("everyday-life")];

const MODES: { id: LandMode; label: string; shortLabel: string }[] = [
  {
    id: "plot",
    label: "Area of a plot",
    shortLabel: "Rectangle, triangle, trapezoid, quad or polygon",
  },
  {
    id: "convert",
    label: "Convert area",
    shortLabel: "Square feet, marla, kanal, acre and more",
  },
];

const SHAPES: { id: PlotShape; label: string }[] = [
  { id: "rectangle", label: "Rectangle" },
  { id: "triangle", label: "Triangle" },
  { id: "trapezoid", label: "Trapezoid" },
  { id: "quad", label: "Four-sided plot" },
  { id: "polygon", label: "Irregular polygon" },
];

const LENGTH_UNITS: { id: LengthUnit; label: string }[] = [
  { id: "ft", label: "Feet" },
  { id: "m", label: "Metres" },
  { id: "yd", label: "Yards" },
];

const AREA_UNITS: { id: AreaUnit; label: string }[] = [
  { id: "sqft", label: "Square feet" },
  { id: "sqyd", label: "Square yards" },
  { id: "sqm", label: "Square metres" },
  { id: "sarsai", label: "Sarsai" },
  { id: "marla", label: "Marla" },
  { id: "kanal", label: "Kanal" },
  { id: "acre", label: "Acre" },
  { id: "hectare", label: "Hectare" },
];

type PointDraft = { id: string; x: string; y: string };

let pointSeq = 0;

function nextPointId(): string {
  pointSeq += 1;
  return `pt-${pointSeq}`;
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatArea(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function lengthUnitLabel(unit: LengthUnit): string {
  if (unit === "ft") return "ft";
  if (unit === "m") return "m";
  return "yd";
}

function emptyPoints(): PointDraft[] {
  return [
    { id: "pt-initial-0", x: "", y: "" },
    { id: "pt-initial-1", x: "", y: "" },
    { id: "pt-initial-2", x: "", y: "" },
  ];
}

/**
 * Land / plot area and area-unit conversion.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function LandAreaCalculator() {
  const [mode, setMode] = useState<LandMode>("plot");
  const [shape, setShape] = useState<PlotShape>("rectangle");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("ft");
  const [lengthRaw, setLengthRaw] = useState("");
  const [widthRaw, setWidthRaw] = useState("");
  const [sideARaw, setSideARaw] = useState("");
  const [sideBRaw, setSideBRaw] = useState("");
  const [sideCRaw, setSideCRaw] = useState("");
  const [sideDRaw, setSideDRaw] = useState("");
  const [heightRaw, setHeightRaw] = useState("");
  const [diagonalRaw, setDiagonalRaw] = useState("");
  const [points, setPoints] = useState<PointDraft[]>(emptyPoints);
  const [convertValueRaw, setConvertValueRaw] = useState("");
  const [convertUnit, setConvertUnit] = useState<AreaUnit>("sqft");
  const [marlaRaw, setMarlaRaw] = useState(String(DEFAULT_SQFT_PER_MARLA));

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: LandMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("plot");
    setShape("rectangle");
    setLengthUnit("ft");
    setLengthRaw("");
    setWidthRaw("");
    setSideARaw("");
    setSideBRaw("");
    setSideCRaw("");
    setSideDRaw("");
    setHeightRaw("");
    setDiagonalRaw("");
    setPoints(emptyPoints());
    setConvertValueRaw("");
    setConvertUnit("sqft");
    setMarlaRaw(String(DEFAULT_SQFT_PER_MARLA));
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = MODES.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = last;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    selectMode(MODES[nextIndex]!.id);
    tabRefs.current[nextIndex]?.focus();
  }

  const sqftPerMarla = parseOptionalNumber(marlaRaw);

  const result =
    mode === "convert"
      ? calculateLandArea({
          mode: "convert",
          value: parseOptionalNumber(convertValueRaw),
          unit: convertUnit,
          sqftPerMarla,
        })
      : shape === "rectangle"
        ? calculateLandArea({
            mode: "plot",
            shape: "rectangle",
            length: parseOptionalNumber(lengthRaw),
            width: parseOptionalNumber(widthRaw),
            lengthUnit,
            sqftPerMarla,
          })
        : shape === "triangle"
          ? calculateLandArea({
              mode: "plot",
              shape: "triangle",
              sideA: parseOptionalNumber(sideARaw),
              sideB: parseOptionalNumber(sideBRaw),
              sideC: parseOptionalNumber(sideCRaw),
              lengthUnit,
              sqftPerMarla,
            })
          : shape === "trapezoid"
            ? calculateLandArea({
                mode: "plot",
                shape: "trapezoid",
                baseA: parseOptionalNumber(sideARaw),
                baseB: parseOptionalNumber(sideBRaw),
                height: parseOptionalNumber(heightRaw),
                lengthUnit,
                sqftPerMarla,
              })
            : shape === "quad"
              ? calculateLandArea({
                  mode: "plot",
                  shape: "quad",
                  sideA: parseOptionalNumber(sideARaw),
                  sideB: parseOptionalNumber(sideBRaw),
                  sideC: parseOptionalNumber(sideCRaw),
                  sideD: parseOptionalNumber(sideDRaw),
                  diagonal: parseOptionalNumber(diagonalRaw),
                  lengthUnit,
                  sqftPerMarla,
                })
              : calculateLandArea({
                  mode: "plot",
                  shape: "polygon",
                  points: points.map((p) => ({
                    x: parseOptionalNumber(p.x),
                    y: parseOptionalNumber(p.y),
                  })),
                  lengthUnit,
                  sqftPerMarla,
                });

  const areas = result.ok ? result.areas : null;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="land-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="land-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <LandPlot
                className={`size-5 ${lifeTheme.text}`}
                aria-hidden="true"
              />
              Land area inputs
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="ui-label inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <p className="rounded-lg border border-zinc-200 bg-stone-50 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
            This is a calculation aid, not a survey or legal record.
            Measurements and local unit definitions decide the result. It does
            not advise on valuation, purchase, boundaries or disputes.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Land area calculator modes"
            className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
          >
            {MODES.map((item, index) => {
              const selected = mode === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${tablistId}-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`${tablistId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectMode(item.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    selected
                      ? `${lifeTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-everyday-soft hover:text-cat-everyday"
                  }`}
                >
                  <span className="block">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] font-medium ${
                      selected ? "text-white/80" : "text-muted"
                    }`}
                  >
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`${tablistId}-panel`}
            aria-labelledby={`${tablistId}-${mode}`}
            className="flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            {mode === "plot" ? (
              <>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`${uid}-shape`}
                    className="text-[12px] font-semibold text-muted"
                  >
                    Shape
                  </label>
                  <select
                    id={`${uid}-shape`}
                    value={shape}
                    onChange={(event) =>
                      setShape(event.target.value as PlotShape)
                    }
                    className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-cat-everyday/40 focus:border-cat-everyday focus:ring-2 focus:ring-cat-everyday/20"
                  >
                    {SHAPES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <UnitToggle
                  label="Length unit"
                  value={lengthUnit}
                  options={LENGTH_UNITS}
                  onChange={setLengthUnit}
                />

                {shape === "rectangle" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NumberField
                      id={`${uid}-len`}
                      label={`Length (${lengthUnitLabel(lengthUnit)})`}
                      value={lengthRaw}
                      onChange={setLengthRaw}
                    />
                    <NumberField
                      id={`${uid}-wid`}
                      label={`Width (${lengthUnitLabel(lengthUnit)})`}
                      value={widthRaw}
                      onChange={setWidthRaw}
                    />
                  </div>
                ) : null}

                {shape === "triangle" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <NumberField
                      id={`${uid}-a`}
                      label={`Side a (${lengthUnitLabel(lengthUnit)})`}
                      value={sideARaw}
                      onChange={setSideARaw}
                    />
                    <NumberField
                      id={`${uid}-b`}
                      label={`Side b (${lengthUnitLabel(lengthUnit)})`}
                      value={sideBRaw}
                      onChange={setSideBRaw}
                    />
                    <NumberField
                      id={`${uid}-c`}
                      label={`Side c (${lengthUnitLabel(lengthUnit)})`}
                      value={sideCRaw}
                      onChange={setSideCRaw}
                    />
                  </div>
                ) : null}

                {shape === "trapezoid" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <NumberField
                      id={`${uid}-basea`}
                      label={`Parallel side a (${lengthUnitLabel(lengthUnit)})`}
                      value={sideARaw}
                      onChange={setSideARaw}
                    />
                    <NumberField
                      id={`${uid}-baseb`}
                      label={`Parallel side b (${lengthUnitLabel(lengthUnit)})`}
                      value={sideBRaw}
                      onChange={setSideBRaw}
                    />
                    <NumberField
                      id={`${uid}-h`}
                      label={`Height (${lengthUnitLabel(lengthUnit)})`}
                      value={heightRaw}
                      onChange={setHeightRaw}
                    />
                  </div>
                ) : null}

                {shape === "quad" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField
                        id={`${uid}-qa`}
                        label={`Side a (${lengthUnitLabel(lengthUnit)})`}
                        value={sideARaw}
                        onChange={setSideARaw}
                      />
                      <NumberField
                        id={`${uid}-qb`}
                        label={`Side b (${lengthUnitLabel(lengthUnit)})`}
                        value={sideBRaw}
                        onChange={setSideBRaw}
                      />
                      <NumberField
                        id={`${uid}-qc`}
                        label={`Side c (${lengthUnitLabel(lengthUnit)})`}
                        value={sideCRaw}
                        onChange={setSideCRaw}
                      />
                      <NumberField
                        id={`${uid}-qd`}
                        label={`Side d (${lengthUnitLabel(lengthUnit)})`}
                        value={sideDRaw}
                        onChange={setSideDRaw}
                      />
                    </div>
                    <NumberField
                      id={`${uid}-diag`}
                      label={`Diagonal (${lengthUnitLabel(lengthUnit)})`}
                      value={diagonalRaw}
                      onChange={setDiagonalRaw}
                      hint="Measure the diagonal between the corners that split the plot into two triangles. Sides a and b meet one end of the diagonal; sides c and d meet the other."
                    />
                  </>
                ) : null}

                {shape === "polygon" ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[12px] font-semibold text-muted">
                      Points (x, y) — up to {MAX_POLYGON_POINTS}, in boundary
                      order
                    </span>
                    <ul className="flex flex-col gap-2">
                      {points.map((point, index) => (
                        <li
                          key={point.id}
                          className="grid grid-cols-[1fr_1fr_auto] gap-2"
                        >
                          <NumberField
                            id={`${uid}-x-${point.id}`}
                            label={`Point ${index + 1} x`}
                            value={point.x}
                            onChange={(value) =>
                              setPoints((rows) =>
                                rows.map((row) =>
                                  row.id === point.id
                                    ? { ...row, x: value }
                                    : row,
                                ),
                              )
                            }
                          />
                          <NumberField
                            id={`${uid}-y-${point.id}`}
                            label={`Point ${index + 1} y`}
                            value={point.y}
                            onChange={(value) =>
                              setPoints((rows) =>
                                rows.map((row) =>
                                  row.id === point.id
                                    ? { ...row, y: value }
                                    : row,
                                ),
                              )
                            }
                          />
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() =>
                                setPoints((rows) =>
                                  rows.length <= 3
                                    ? rows
                                    : rows.filter((row) => row.id !== point.id),
                                )
                              }
                              disabled={points.length <= 3}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/80 text-zinc-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Remove point ${index + 1}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() =>
                        setPoints((rows) =>
                          rows.length >= MAX_POLYGON_POINTS
                            ? rows
                            : [...rows, { id: nextPointId(), x: "", y: "" }],
                        )
                      }
                      disabled={points.length >= MAX_POLYGON_POINTS}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition hover:bg-cat-everyday-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Add point
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberField
                  id={`${uid}-cval`}
                  label="Area value"
                  value={convertValueRaw}
                  onChange={setConvertValueRaw}
                />
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`${uid}-cunit`}
                    className="text-[12px] font-semibold text-muted"
                  >
                    Unit
                  </label>
                  <select
                    id={`${uid}-cunit`}
                    value={convertUnit}
                    onChange={(event) =>
                      setConvertUnit(event.target.value as AreaUnit)
                    }
                    className="h-11 w-full rounded-lg border border-border/80 bg-background px-3 text-[15px] text-foreground outline-none transition hover:border-cat-everyday/40 focus:border-cat-everyday focus:ring-2 focus:ring-cat-everyday/20"
                  >
                    {AREA_UNITS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <details className="rounded-lg border border-border/70 bg-panel/60 p-3">
              <summary className="cursor-pointer text-[13px] font-semibold text-foreground">
                More options
              </summary>
              <div className="mt-3">
                <NumberField
                  id={`${uid}-marla`}
                  label="Square feet per marla"
                  value={marlaRaw}
                  onChange={setMarlaRaw}
                  hint="The size of a marla can differ by region and authority. Check your local records. Default 272.25 ft² (9 × 30.25 sarsai)."
                />
              </div>
            </details>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="land-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="land-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            {mode === "plot" ? "Plot area" : "Converted area"}
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : areas ? (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Area (square feet)
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatArea(areas.sqft, 2)}
                </p>
                {result.mode === "plot" ? (
                  <p className="mt-1 text-[15px] tabular-nums text-zinc-600">
                    Perimeter: {formatArea(result.perimeter, 2)}{" "}
                    {lengthUnitLabel(result.lengthUnit)}
                  </p>
                ) : null}
              </div>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Square yards" value={formatArea(areas.sqyd)} />
                <Stat label="Square metres" value={formatArea(areas.sqm)} />
                <Stat label="Sarsai" value={formatArea(areas.sarsai)} />
                <Stat label="Marla" value={formatArea(areas.marla)} />
                <Stat label="Kanal" value={formatArea(areas.kanal)} />
                <Stat label="Acre" value={formatArea(areas.acre, 4)} />
                <Stat label="Hectare" value={formatArea(areas.hectare, 4)} />
                <Stat label="Square feet" value={formatArea(areas.sqft)} />
              </dl>

              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.working}
              </p>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3.5 py-3">
      <dt className="text-[12px] font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-everyday/40 focus:border-cat-everyday focus:bg-panel focus:ring-2 focus:ring-cat-everyday/20"
      />
      {hint ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function UnitToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className={`grid h-11 gap-1.5 ${options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-[12px] font-semibold transition ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-border/80 bg-background text-zinc-400 hover:border-zinc-400 hover:text-zinc-700"
              }`}
            >
              <input
                type="radio"
                name={label}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
