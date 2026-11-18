"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { RefreshCw, Video } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import { parseDecimal } from "@/lib/utils/money";
import {
  DEFAULT_TARGET_HOURS,
  calculateWatchTime,
  type WatchMode,
} from "@/lib/utils/youtube-watch-time";

const creatorsTheme = CATEGORY_THEME[getCategoryTheme("creators")];

const MODES: { id: WatchMode; label: string; shortLabel: string }[] = [
  {
    id: "views",
    label: "Views needed",
    shortLabel: "Target hours and average view duration",
  },
  {
    id: "timeline",
    label: "Time to reach my target",
    shortLabel: "Current hours, monthly gain and growth",
  },
  {
    id: "video",
    label: "One video",
    shortLabel: "Length, percent viewed and views",
  },
];

function formatQty(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Watch-time arithmetic for views and hours.
 * Inputs stay in React state only. Does not state platform programme rules.
 */
export function YoutubeWatchTimeCalculator() {
  const [mode, setMode] = useState<WatchMode>("views");
  const [targetHoursRaw, setTargetHoursRaw] = useState(
    String(DEFAULT_TARGET_HOURS),
  );
  const [avgMinRaw, setAvgMinRaw] = useState("");
  const [avgSecRaw, setAvgSecRaw] = useState("");
  const [usePercent, setUsePercent] = useState(false);
  const [videoMinRaw, setVideoMinRaw] = useState("");
  const [videoSecRaw, setVideoSecRaw] = useState("");
  const [percentRaw, setPercentRaw] = useState("");
  const [currentHoursRaw, setCurrentHoursRaw] = useState("");
  const [monthlyHoursRaw, setMonthlyHoursRaw] = useState("");
  const [growthRaw, setGrowthRaw] = useState("0");
  const [viewsRaw, setViewsRaw] = useState("");

  const tablistId = useId();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectMode = useCallback((next: WatchMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("views");
    setTargetHoursRaw(String(DEFAULT_TARGET_HOURS));
    setAvgMinRaw("");
    setAvgSecRaw("");
    setUsePercent(false);
    setVideoMinRaw("");
    setVideoSecRaw("");
    setPercentRaw("");
    setCurrentHoursRaw("");
    setMonthlyHoursRaw("");
    setGrowthRaw("0");
    setViewsRaw("");
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

  const result =
    mode === "views"
      ? calculateWatchTime({
          mode: "views",
          targetHours: parseDecimal(targetHoursRaw),
          averageMinutes: parseDecimal(avgMinRaw),
          averageSeconds: parseDecimal(avgSecRaw),
          videoMinutes: parseDecimal(videoMinRaw),
          videoSeconds: parseDecimal(videoSecRaw),
          percentViewed: parseDecimal(percentRaw),
          usePercentOfLength: usePercent,
        })
      : mode === "timeline"
        ? calculateWatchTime({
            mode: "timeline",
            currentHours: parseDecimal(currentHoursRaw),
            monthlyHours: parseDecimal(monthlyHoursRaw),
            growthPercent: parseDecimal(growthRaw),
            targetHours: parseDecimal(targetHoursRaw),
          })
        : calculateWatchTime({
            mode: "video",
            videoMinutes: parseDecimal(videoMinRaw),
            videoSeconds: parseDecimal(videoSecRaw),
            percentViewed: parseDecimal(percentRaw),
            views: parseDecimal(viewsRaw),
          });

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="watch-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="watch-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Video
                className={`size-5 ${creatorsTheme.text}`}
                aria-hidden="true"
              />
              Watch time inputs
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
            Arithmetic only. The target hours field is editable — check the
            platform&apos;s official help pages for any current programme
            rules. This page does not promise growth or income.
          </p>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Watch time calculator modes"
            className="grid grid-cols-1 gap-1.5"
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
                      ? `${creatorsTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-creators-soft hover:text-cat-creators"
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
            {mode === "views" || mode === "timeline" ? (
              <NumberField
                id={`${uid}-target`}
                label="Target watch hours"
                value={targetHoursRaw}
                onChange={setTargetHoursRaw}
                hint="Editable. Confirm any official thresholds on the platform’s help pages."
              />
            ) : null}

            {mode === "views" ? (
              <>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-panel/60 px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={usePercent}
                    onChange={(event) => setUsePercent(event.target.checked)}
                    className="mt-0.5 size-4 rounded border-border text-cat-creators focus:ring-cat-creators/30"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-foreground">
                      Use video length and percentage viewed
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      Otherwise enter average view duration directly.
                    </span>
                  </span>
                </label>

                {usePercent ? (
                  <>
                    <DurationFields
                      uid={`${uid}-len`}
                      legend="Video length"
                      minutes={videoMinRaw}
                      seconds={videoSecRaw}
                      onMinutes={setVideoMinRaw}
                      onSeconds={setVideoSecRaw}
                    />
                    <NumberField
                      id={`${uid}-pct`}
                      label="Average percentage viewed"
                      value={percentRaw}
                      onChange={setPercentRaw}
                    />
                  </>
                ) : (
                  <DurationFields
                    uid={`${uid}-avg`}
                    legend="Average view duration"
                    minutes={avgMinRaw}
                    seconds={avgSecRaw}
                    onMinutes={setAvgMinRaw}
                    onSeconds={setAvgSecRaw}
                  />
                )}
              </>
            ) : null}

            {mode === "timeline" ? (
              <>
                <NumberField
                  id={`${uid}-current`}
                  label="Current watch hours"
                  value={currentHoursRaw}
                  onChange={setCurrentHoursRaw}
                />
                <NumberField
                  id={`${uid}-monthly`}
                  label="Hours gained per month"
                  value={monthlyHoursRaw}
                  onChange={setMonthlyHoursRaw}
                />
                <NumberField
                  id={`${uid}-growth`}
                  label="Monthly growth percent (optional)"
                  value={growthRaw}
                  onChange={setGrowthRaw}
                  hint="Default 0. Example: 10 means each month’s gained hours are 10% higher than the previous month."
                />
              </>
            ) : null}

            {mode === "video" ? (
              <>
                <DurationFields
                  uid={`${uid}-vid`}
                  legend="Video length"
                  minutes={videoMinRaw}
                  seconds={videoSecRaw}
                  onMinutes={setVideoMinRaw}
                  onSeconds={setVideoSecRaw}
                />
                <NumberField
                  id={`${uid}-pct-video`}
                  label="Average percentage viewed"
                  value={percentRaw}
                  onChange={setPercentRaw}
                />
                <NumberField
                  id={`${uid}-views`}
                  label="Views"
                  value={viewsRaw}
                  onChange={setViewsRaw}
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="watch-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <span
            id="watch-outcome-heading"
            className="ui-label w-fit rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
          >
            {mode === "views"
              ? "Views needed"
              : mode === "timeline"
                ? "Time to target"
                : "One video"}
          </span>

          {!result.ok ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {result.message}
            </p>
          ) : result.mode === "views" ? (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Views needed
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatQty(result.viewsNeeded, 0)}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="Average view duration"
                  value={formatClock(result.averageViewSeconds)}
                />
                <Stat
                  label="Target hours"
                  value={formatQty(result.targetHours)}
                />
              </dl>
              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.working}
              </p>
            </>
          ) : result.mode === "timeline" ? (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Interpolated months
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatQty(result.interpolatedMonths)}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="Remaining hours"
                  value={formatQty(result.remainingHours)}
                />
                <Stat
                  label="Month reached"
                  value={
                    result.monthReached === 0
                      ? "Already met"
                      : formatQty(result.monthReached, 0)
                  }
                />
                {result.monthReached > 0 ? (
                  <Stat
                    label="Gained before that month"
                    value={formatQty(result.cumulativeBefore)}
                  />
                ) : null}
                {result.monthGain > 0 ? (
                  <Stat
                    label="Hours in that month"
                    value={formatQty(result.monthGain)}
                  />
                ) : null}
              </dl>
              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.working}
              </p>
            </>
          ) : (
            <>
              <div>
                <p className="text-[13px] font-medium text-muted">
                  Total watch hours
                </p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatQty(result.totalHours)}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stat
                  label="Average view duration"
                  value={formatClock(result.averageViewSeconds)}
                />
                <Stat
                  label="Total hours"
                  value={formatQty(result.totalHours)}
                />
              </dl>
              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <span className="font-semibold text-foreground">Working: </span>
                {result.working}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function DurationFields({
  uid,
  legend,
  minutes,
  seconds,
  onMinutes,
  onSeconds,
}: {
  uid: string;
  legend: string;
  minutes: string;
  seconds: string;
  onMinutes: (value: string) => void;
  onSeconds: (value: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-border/60 bg-panel/60 p-3">
      <legend className="px-1 text-[13px] font-semibold text-foreground">
        {legend}
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <NumberField
          id={`${uid}-min`}
          label="Minutes"
          value={minutes}
          onChange={onMinutes}
        />
        <NumberField
          id={`${uid}-sec`}
          label="Seconds"
          value={seconds}
          onChange={onSeconds}
        />
      </div>
    </fieldset>
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
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-creators/40 focus:border-cat-creators focus:bg-panel focus:ring-2 focus:ring-cat-creators/20"
      />
      {hint ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
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
