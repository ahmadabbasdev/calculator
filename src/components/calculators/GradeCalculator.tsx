"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ClipboardList, Plus, RefreshCw, Trash2 } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  US_PLUS_MINUS_CUTOFFS,
  US_STANDARD_CUTOFFS,
  calculateFinalNeeded,
  calculateTestScore,
  calculateWeightedGrade,
  cutoffsForScale,
  defaultCustomCutoffs,
  formatGradePercent,
  parseGradeInput,
  type GradeMode,
  type LetterCutoff,
  type LetterScaleId,
} from "@/lib/utils/grade";

const mathTheme = CATEGORY_THEME[getCategoryTheme("math")];

const MODES: { id: GradeMode; label: string; shortLabel: string }[] = [
  {
    id: "weighted",
    label: "Weighted grade",
    shortLabel: "Assignments with weights",
  },
  {
    id: "final-needed",
    label: "Final exam needed",
    shortLabel: "What do I need on the final?",
  },
  {
    id: "test-score",
    label: "Test score",
    shortLabel: "Points to percent & letter",
  },
];

const SCALE_OPTIONS: { id: LetterScaleId; label: string }[] = [
  {
    id: "us-standard",
    label: "US standard (A 90, B 80, C 70, D 60)",
  },
  {
    id: "us-plus-minus",
    label: "US with plus/minus",
  },
  {
    id: "custom",
    label: "Custom cutoffs",
  },
];

const MAX_ROWS = 30;

type RowState = { id: string; name: string; score: string; weight: string };

function newRow(): RowState {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    score: "",
    weight: "",
  };
}

function initialRows(): RowState[] {
  return Array.from({ length: 5 }, () => newRow());
}

/**
 * Grade calculator — weighted average, final exam needed, and test score modes.
 * Inputs stay in React state only (never URL, storage, cookies, or analytics).
 */
export function GradeCalculator() {
  const [mode, setMode] = useState<GradeMode>("weighted");
  const [scaleId, setScaleId] = useState<LetterScaleId>("us-standard");
  const [customCutoffs, setCustomCutoffs] = useState<LetterCutoff[]>(
    defaultCustomCutoffs,
  );
  const [rows, setRows] = useState<RowState[]>(initialRows);
  const [currentGrade, setCurrentGrade] = useState("");
  const [finalWeight, setFinalWeight] = useState("");
  const [desiredGrade, setDesiredGrade] = useState("");
  const [earned, setEarned] = useState("");
  const [possible, setPossible] = useState("");

  const tablistId = useId();
  const scaleIdAttr = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const cutoffs = cutoffsForScale(scaleId, customCutoffs);

  const weightedResult = calculateWeightedGrade(
    rows.map((row) => ({
      name: row.name,
      score: parseGradeInput(row.score),
      weight: parseGradeInput(row.weight),
    })),
    cutoffs,
  );

  const finalResult = calculateFinalNeeded({
    currentGrade: parseGradeInput(currentGrade),
    finalWeightPercent: parseGradeInput(finalWeight),
    desiredGrade: parseGradeInput(desiredGrade),
  });

  const testResult = calculateTestScore({
    pointsEarned: parseGradeInput(earned),
    pointsPossible: parseGradeInput(possible),
    cutoffs,
  });

  const selectMode = useCallback((next: GradeMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("weighted");
    setScaleId("us-standard");
    setCustomCutoffs(defaultCustomCutoffs());
    setRows(initialRows());
    setCurrentGrade("");
    setFinalWeight("");
    setDesiredGrade("");
    setEarned("");
    setPossible("");
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

  function updateRow(id: string, patch: Partial<RowState>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => (prev.length >= MAX_ROWS ? prev : [...prev, newRow()]));
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="grade-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="grade-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <ClipboardList
                className={`size-5 ${mathTheme.text}`}
                aria-hidden="true"
              />
              Choose a calculation
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="ui-label inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted transition hover:bg-background hover:text-foreground"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Grade calculation modes"
            className="flex flex-col gap-1.5"
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
                      ? `${mathTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-math-soft hover:text-cat-math"
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

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={scaleIdAttr}
              className="text-[12px] font-semibold text-muted"
            >
              Letter grade scale
            </label>
            <select
              id={scaleIdAttr}
              value={scaleId}
              onChange={(e) => {
                const next = e.target.value as LetterScaleId;
                setScaleId(next);
                if (next === "custom") {
                  setCustomCutoffs(defaultCustomCutoffs());
                }
              }}
              className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
            >
              {SCALE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[12px] leading-relaxed text-zinc-600">
              Schools differ — confirm cutoffs against your syllabus or handbook.
            </p>
          </div>

          {scaleId === "custom" ? (
            <div className="overflow-x-auto rounded-lg border border-border/70">
              <table className="min-w-[16rem] w-full border-collapse text-left text-[13px]">
                <caption className="sr-only">
                  Custom letter grade cutoffs
                </caption>
                <thead>
                  <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
                    <th scope="col" className="px-3 py-2">
                      Letter
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Min %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customCutoffs.map((band, index) => (
                    <tr
                      key={`${band.letter}-${index}`}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-3 py-2">
                        <label className="sr-only" htmlFor={`cutoff-letter-${index}`}>
                          Letter {index + 1}
                        </label>
                        <input
                          id={`cutoff-letter-${index}`}
                          type="text"
                          value={band.letter}
                          onChange={(e) => {
                            const next = [...customCutoffs];
                            next[index] = {
                              ...band,
                              letter: e.target.value,
                            };
                            setCustomCutoffs(next);
                          }}
                          className="w-16 rounded border border-border/80 bg-background px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-cat-math focus:ring-1 focus:ring-cat-math/20"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <label className="sr-only" htmlFor={`cutoff-min-${index}`}>
                          Minimum percent for {band.letter || `row ${index + 1}`}
                        </label>
                        <input
                          id={`cutoff-min-${index}`}
                          type="text"
                          inputMode="decimal"
                          value={String(band.minPercent)}
                          onChange={(e) => {
                            const n = parseGradeInput(e.target.value);
                            const next = [...customCutoffs];
                            next[index] = {
                              ...band,
                              minPercent: n ?? 0,
                            };
                            setCustomCutoffs(next);
                          }}
                          className="w-20 rounded border border-border/80 bg-background px-2 py-1.5 text-[13px] tabular-nums text-foreground outline-none focus:border-cat-math focus:ring-1 focus:ring-cat-math/20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div
            role="tabpanel"
            id={`${tablistId}-panel`}
            aria-labelledby={`${tablistId}-${mode}`}
            className="flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            {mode === "weighted" ? (
              <WeightedFields
                rows={rows}
                onUpdate={updateRow}
                onAdd={addRow}
                onRemove={removeRow}
              />
            ) : null}
            {mode === "final-needed" ? (
              <FinalNeededFields
                currentGrade={currentGrade}
                finalWeight={finalWeight}
                desiredGrade={desiredGrade}
                onCurrent={setCurrentGrade}
                onWeight={setFinalWeight}
                onDesired={setDesiredGrade}
              />
            ) : null}
            {mode === "test-score" ? (
              <TestScoreFields
                earned={earned}
                possible={possible}
                onEarned={setEarned}
                onPossible={setPossible}
              />
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="grade-result-heading"
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-[18rem] flex-col lg:col-span-7"
      >
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="border-b border-border pb-3">
            <h2
              id="grade-result-heading"
              className="text-[15px] font-semibold text-foreground"
            >
              Result
            </h2>
          </div>
          <ResultPanel
            mode={mode}
            weighted={weightedResult}
            finalNeeded={finalResult}
            testScore={testResult}
            scaleLabel={
              SCALE_OPTIONS.find((s) => s.id === scaleId)?.label ?? scaleId
            }
            previewCutoffs={
              scaleId === "us-plus-minus"
                ? US_PLUS_MINUS_CUTOFFS
                : scaleId === "custom"
                  ? customCutoffs
                  : US_STANDARD_CUTOFFS
            }
          />
        </div>
      </section>
    </div>
  );
}

function WeightedFields({
  rows,
  onUpdate,
  onAdd,
  onRemove,
}: {
  rows: RowState[];
  onUpdate: (id: string, patch: Partial<RowState>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] leading-relaxed text-zinc-700">
        Enter each assignment&apos;s score % and weight %. Names are optional.
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <li
            key={row.id}
            className="rounded-lg border border-border/70 bg-panel/80 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-zinc-700">
                Row {index + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemove(row.id)}
                disabled={rows.length <= 1}
                aria-label={`Remove row ${index + 1}${row.name ? `: ${row.name}` : ""}`}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-zinc-600 transition hover:bg-stone-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-1">
                <label
                  htmlFor={`grade-name-${row.id}`}
                  className="text-[12px] font-semibold text-muted"
                >
                  Name (optional)
                </label>
                <input
                  id={`grade-name-${row.id}`}
                  type="text"
                  autoComplete="off"
                  value={row.name}
                  onChange={(e) => onUpdate(row.id, { name: e.target.value })}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label
                  htmlFor={`grade-score-${row.id}`}
                  className="text-[12px] font-semibold text-muted"
                >
                  Score %
                </label>
                <input
                  id={`grade-score-${row.id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={row.score}
                  onChange={(e) => onUpdate(row.id, { score: e.target.value })}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] tabular-nums text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label
                  htmlFor={`grade-weight-${row.id}`}
                  className="text-[12px] font-semibold text-muted"
                >
                  Weight %
                </label>
                <input
                  id={`grade-weight-${row.id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={row.weight}
                  onChange={(e) => onUpdate(row.id, { weight: e.target.value })}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] tabular-nums text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAdd}
        disabled={rows.length >= MAX_ROWS}
        aria-label="Add row"
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-2 text-[13px] font-semibold text-foreground transition hover:border-cat-math/40 hover:bg-cat-math-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add row
        <span className="font-medium text-muted">
          ({rows.length}/{MAX_ROWS})
        </span>
      </button>
    </div>
  );
}

function FinalNeededFields({
  currentGrade,
  finalWeight,
  desiredGrade,
  onCurrent,
  onWeight,
  onDesired,
}: {
  currentGrade: string;
  finalWeight: string;
  desiredGrade: string;
  onCurrent: (v: string) => void;
  onWeight: (v: string) => void;
  onDesired: (v: string) => void;
}) {
  const currentId = useId();
  const weightId = useId();
  const desiredId = useId();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] leading-relaxed text-zinc-700">
        Current grade means your average on everything before the final exam.
      </p>
      <NumberField
        id={currentId}
        label="Current grade %"
        value={currentGrade}
        onChange={onCurrent}
      />
      <NumberField
        id={weightId}
        label="Final exam weight %"
        value={finalWeight}
        onChange={onWeight}
      />
      <NumberField
        id={desiredId}
        label="Desired overall grade %"
        value={desiredGrade}
        onChange={onDesired}
      />
    </div>
  );
}

function TestScoreFields({
  earned,
  possible,
  onEarned,
  onPossible,
}: {
  earned: string;
  possible: string;
  onEarned: (v: string) => void;
  onPossible: (v: string) => void;
}) {
  const earnedId = useId();
  const possibleId = useId();
  return (
    <div className="flex flex-col gap-3">
      <NumberField
        id={earnedId}
        label="Points earned"
        value={earned}
        onChange={onEarned}
      />
      <NumberField
        id={possibleId}
        label="Points possible"
        value={possible}
        onChange={onPossible}
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
      />
    </div>
  );
}

function ResultPanel({
  mode,
  weighted,
  finalNeeded,
  testScore,
  scaleLabel,
  previewCutoffs,
}: {
  mode: GradeMode;
  weighted: ReturnType<typeof calculateWeightedGrade>;
  finalNeeded: ReturnType<typeof calculateFinalNeeded>;
  testScore: ReturnType<typeof calculateTestScore>;
  scaleLabel: string;
  previewCutoffs: LetterCutoff[];
}) {
  if (mode === "weighted") {
    if (!weighted.ok) {
      return <p className="text-[15px] leading-relaxed text-muted">{weighted.message}</p>;
    }
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[12px] font-semibold text-muted">
            Weighted average
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
            {formatGradePercent(weighted.average)}%
          </p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">
            Letter: {weighted.letter}
          </p>
        </div>
        <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
          Weights total: {formatGradePercent(weighted.weightsTotal)}%
          {weighted.weightsAre100
            ? " (equals 100%)."
            : " — not 100%. Result uses the entered weights only (divided by this total), not a silent rescale to 100%."}
        </p>
        {weighted.hasExtraCreditScore ? (
          <p className="text-[13px] leading-relaxed text-zinc-700">
            At least one score is above 100% (extra credit). Schools treat that
            differently — check your policy.
          </p>
        ) : null}
        <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
          {weighted.working}
        </p>
        <p className="text-[12px] text-zinc-600">Scale: {scaleLabel}</p>
        <CutoffPreview cutoffs={previewCutoffs} />
      </div>
    );
  }

  if (mode === "final-needed") {
    if (!finalNeeded.ok) {
      return (
        <p className="text-[15px] leading-relaxed text-muted">
          {finalNeeded.message}
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[12px] font-semibold text-muted">
            Score needed on the final
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
            {formatGradePercent(finalNeeded.needed)}%
          </p>
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-800">
          {finalNeeded.message}
        </p>
        <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
          {finalNeeded.working}
        </p>
      </div>
    );
  }

  if (!testScore.ok) {
    return (
      <p className="text-[15px] leading-relaxed text-muted">{testScore.message}</p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[12px] font-semibold text-muted">Test percentage</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
          {formatGradePercent(testScore.percent)}%
        </p>
        <p className="mt-1 text-[15px] font-semibold text-foreground">
          Letter: {testScore.letter}
        </p>
      </div>
      <p className="text-[13px] leading-relaxed text-zinc-700 tabular-nums">
        {testScore.working}
      </p>
      <p className="text-[12px] text-zinc-600">Scale: {scaleLabel}</p>
      <CutoffPreview cutoffs={previewCutoffs} />
    </div>
  );
}

function CutoffPreview({ cutoffs }: { cutoffs: LetterCutoff[] }) {
  const sorted = [...cutoffs].sort((a, b) => b.minPercent - a.minPercent);
  return (
    <p className="text-[12px] leading-relaxed text-zinc-600">
      Cutoffs:{" "}
      {sorted.map((c) => `${c.letter} ≥ ${c.minPercent}`).join(", ")}
    </p>
  );
}
