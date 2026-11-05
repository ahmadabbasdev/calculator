"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Gamepad2, RefreshCw } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import type { GoldenPair, PalGender, PalworldData } from "@/lib/palworld/schema";
import {
  breedChild,
  findParentPairsForChild,
  isExtractedDataStale,
} from "@/lib/utils/palworld";
import { PalCombobox } from "@/components/calculators/PalCombobox";

const gamesTheme = CATEGORY_THEME[getCategoryTheme("games")];
const PAGE_SIZE = 50;

type Props = {
  data: PalworldData;
  goldenPairs: GoldenPair[];
};

type Mode = "parents" | "child";

/**
 * Palworld breeding estimator — runs entirely in the browser.
 * Inputs stay in React state (never URL, storage, cookies, or analytics).
 */
export function PalworldBreedingCalculator({ data, goldenPairs }: Props) {
  const [mode, setMode] = useState<Mode>("parents");
  const [parentA, setParentA] = useState("");
  const [parentB, setParentB] = useState("");
  const [genderA, setGenderA] = useState<PalGender | "">("");
  const [genderB, setGenderB] = useState<PalGender | "">("");
  const [childId, setChildId] = useState("");
  const [pairLimit, setPairLimit] = useState(PAGE_SIZE);

  const breedable = useMemo(
    () => data.pals.filter((pal) => pal.breedable),
    [data.pals],
  );

  const forward = useMemo(() => {
    if (!parentA || !parentB) return null;
    return breedChild(data, parentA, parentB, {
      genderA: genderA || null,
      genderB: genderB || null,
      goldenPairs,
    });
  }, [data, parentA, parentB, genderA, genderB, goldenPairs]);

  const reverseAll = useMemo(() => {
    if (!childId) return [];
    return findParentPairsForChild(data, childId, { goldenPairs });
  }, [data, childId, goldenPairs]);

  const reverseVisible = reverseAll.slice(0, pairLimit);
  const stale = isExtractedDataStale(data.extractedAt);

  function handleSwap() {
    setParentA(parentB);
    setParentB(parentA);
    setGenderA(genderB);
    setGenderB(genderA);
  }

  function handleReset() {
    setParentA("");
    setParentB("");
    setGenderA("");
    setGenderB("");
    setChildId("");
    setPairLimit(PAGE_SIZE);
  }

  if (breedable.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
        <p className="text-[15px] leading-relaxed text-zinc-700">
          No Pal entries are loaded yet. Add your extracted data to{" "}
          <code className="text-[13px]">data/palworld/pals.json</code> before
          using this calculator.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:col-span-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="ui-label inline-flex items-center gap-1.5 text-[13px] text-cat-games">
            <Gamepad2 className="size-4" aria-hidden="true" />
            Breeding modes
          </p>
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setMode("parents")}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold ${
                mode === "parents"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-stone-100"
              }`}
            >
              Parents → child
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("child");
                setPairLimit(PAGE_SIZE);
              }}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold ${
                mode === "child"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-stone-100"
              }`}
            >
              Child → parents
            </button>
          </div>
        </div>

        {mode === "parents" ? (
          <div className="space-y-4">
            <PalCombobox
              label="Parent A"
              pals={breedable}
              value={parentA}
              onChange={setParentA}
            />
            <GenderSelect
              label="Gender A (optional)"
              value={genderA}
              onChange={setGenderA}
            />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-stone-50"
              >
                <ArrowLeftRight className="size-3.5" aria-hidden="true" />
                Swap parents
              </button>
            </div>
            <PalCombobox
              label="Parent B"
              pals={breedable}
              value={parentB}
              onChange={setParentB}
            />
            <GenderSelect
              label="Gender B (optional)"
              value={genderB}
              onChange={setGenderB}
            />
          </div>
        ) : (
          <PalCombobox
            label="Target child"
            pals={breedable}
            value={childId}
            onChange={(id) => {
              setChildId(id);
              setPairLimit(PAGE_SIZE);
            }}
          />
        )}

        <button
          type="button"
          onClick={handleReset}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Reset
        </button>

        <p className="mt-6 text-[12px] leading-relaxed text-zinc-600">
          Data: game version {data.gameVersion}, extracted {data.extractedAt}.
          {stale ? (
            <>
              {" "}
              <span className="font-semibold text-zinc-800">
                Game updates can change breeding results.
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div
        className="flex min-h-[16rem] flex-col lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <h2 className="border-b border-border pb-3 text-[15px] font-semibold text-foreground">
            Result
          </h2>

          {mode === "parents" ? (
            !forward ? (
              <p className="text-[15px] text-muted">
                Choose two parents to estimate the child.
              </p>
            ) : forward.kind === "empty" ? (
              <p className="text-[15px] text-zinc-700">{forward.message}</p>
            ) : forward.kind === "tie" ? (
              <div className="space-y-3">
                <p className="text-[15px] font-semibold text-foreground">
                  Tie — verify in game
                </p>
                <p className="text-sm text-muted">
                  Target rank {forward.targetRank}. Closest pool members:
                </p>
                <ul className="list-disc space-y-1 pl-5 text-[15px] text-zinc-800">
                  {forward.candidates.map((pal) => (
                    <li key={pal.id}>
                      {pal.name} (rank {pal.rank})
                    </li>
                  ))}
                </ul>
                {forward.knownGolden.length > 0 ? (
                  <p className="text-sm text-zinc-700">
                    Known golden pairs for these parents:{" "}
                    {forward.knownGolden
                      .map((g) => g.expectedChild)
                      .join(", ")}
                    .
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-muted">Child</p>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  {forward.child.name}
                </p>
                <p className="text-sm text-muted">
                  via {forward.reason}
                  {forward.targetRank != null
                    ? ` · target rank ${forward.targetRank}`
                    : ""}
                  {" · "}rank {forward.child.rank}
                </p>
              </div>
            )
          ) : !childId ? (
            <p className="text-[15px] text-muted">
              Choose a child to list parent pairs that produce it.
            </p>
          ) : reverseAll.length === 0 ? (
            <p className="text-[15px] text-zinc-700">
              No parent pairs in this dataset produce that child.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Showing {reverseVisible.length} of {reverseAll.length} pairs.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border/80">
                <table className="min-w-[28rem] w-full border-collapse text-left text-[14px]">
                  <caption className="sr-only">Parent pairs for selected child</caption>
                  <thead>
                    <tr className="border-b border-border bg-stone-50 text-[12px] font-semibold text-zinc-700">
                      <th scope="col" className="px-3 py-2">
                        Parent A
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Parent B
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Via
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reverseVisible.map((pair) => (
                      <tr
                        key={`${pair.parentA.id}-${pair.parentB.id}-${pair.via}-${pair.genderA}-${pair.genderB}`}
                        className="border-b border-border/70 last:border-0"
                      >
                        <td className="px-3 py-2 text-zinc-800">
                          {pair.parentA.name}
                          {pair.genderA ? ` (${pair.genderA})` : ""}
                        </td>
                        <td className="px-3 py-2 text-zinc-800">
                          {pair.parentB.name}
                          {pair.genderB ? ` (${pair.genderB})` : ""}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">{pair.via}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reverseAll.length > pairLimit ? (
                <button
                  type="button"
                  onClick={() => setPairLimit((n) => n + PAGE_SIZE)}
                  className={`cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-stone-50 ${gamesTheme.borderSoft}`}
                >
                  Show more
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GenderSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PalGender | "";
  onChange: (value: PalGender | "") => void;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-zinc-800">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value as PalGender | "")
        }
        className="w-full cursor-pointer rounded-lg border border-border bg-white py-2.5 pr-3 pl-3 text-[15px] outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
      >
        <option value="">Not specified</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </div>
  );
}
