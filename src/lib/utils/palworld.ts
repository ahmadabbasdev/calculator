/**
 * Pure Palworld breeding estimates (rank formula + unique combos).
 * No game assets; ids/names come from caller-supplied data.
 */

import type {
  GoldenPair,
  PalGender,
  PalRecord,
  PalworldData,
  UniqueCombo,
} from "@/lib/palworld/schema";

export type BreedChildResult = {
  kind: "child";
  child: PalRecord;
  reason: "same-species" | "unique" | "formula";
  targetRank?: number;
  tie: false;
};

export type BreedTieResult = {
  kind: "tie";
  candidates: PalRecord[];
  reason: "formula";
  targetRank: number;
  tie: true;
  message: "tie: verify in game";
  /** Golden pairs that document this parent pair (if any). */
  knownGolden: GoldenPair[];
};

export type BreedEmptyResult = {
  kind: "empty";
  message: string;
};

export type BreedResult = BreedChildResult | BreedTieResult | BreedEmptyResult;

export type ParentPair = {
  parentA: PalRecord;
  parentB: PalRecord;
  genderA?: PalGender;
  genderB?: PalGender;
  via: "same-species" | "unique" | "formula" | "formula-tie";
};

function byId(data: PalworldData): Map<string, PalRecord> {
  return new Map(data.pals.map((pal) => [pal.id, pal]));
}

function formulaPool(data: PalworldData): PalRecord[] {
  return data.pals.filter((pal) => pal.breedable && !pal.formulaExcluded);
}

function unorderedKey(a: string, b: string): string {
  return a <= b ? `${a}::${b}` : `${b}::${a}`;
}

/**
 * Match a unique combo. Order-independent.
 * Gender-specific rows apply only when both genders are provided.
 */
export function findUniqueCombo(
  parentA: string,
  parentB: string,
  uniques: UniqueCombo[],
  genderA?: PalGender | null,
  genderB?: PalGender | null,
): UniqueCombo | null {
  const gendersChosen = genderA != null && genderB != null;

  for (const combo of uniques) {
    const direct =
      combo.parentA === parentA && combo.parentB === parentB;
    const swapped =
      combo.parentA === parentB && combo.parentB === parentA;
    if (!direct && !swapped) continue;

    const genderSpecific =
      combo.genderA != null || combo.genderB != null;

    if (genderSpecific) {
      if (!gendersChosen) continue;
      if (direct) {
        if (
          (combo.genderA == null || combo.genderA === genderA) &&
          (combo.genderB == null || combo.genderB === genderB)
        ) {
          return combo;
        }
      } else {
        if (
          (combo.genderA == null || combo.genderA === genderB) &&
          (combo.genderB == null || combo.genderB === genderA)
        ) {
          return combo;
        }
      }
      continue;
    }

    return combo;
  }

  return null;
}

export function breedingTargetRank(rankA: number, rankB: number): number {
  return Math.floor((rankA + rankB + 1) / 2);
}

export function closestByRank(
  pool: PalRecord[],
  target: number,
): PalRecord[] {
  if (pool.length === 0) return [];
  let best = Number.POSITIVE_INFINITY;
  const winners: PalRecord[] = [];
  for (const pal of pool) {
    const distance = Math.abs(pal.rank - target);
    if (distance < best) {
      best = distance;
      winners.length = 0;
      winners.push(pal);
    } else if (distance === best) {
      winners.push(pal);
    }
  }
  return winners;
}

export function breedChild(
  data: PalworldData,
  parentAId: string,
  parentBId: string,
  options: {
    genderA?: PalGender | null;
    genderB?: PalGender | null;
    goldenPairs?: GoldenPair[];
  } = {},
): BreedResult {
  const index = byId(data);
  const parentA = index.get(parentAId);
  const parentB = index.get(parentBId);
  if (!parentA || !parentB) {
    return { kind: "empty", message: "Select two known Pals." };
  }
  if (!parentA.breedable || !parentB.breedable) {
    return {
      kind: "empty",
      message: "One or both parents are marked non-breedable in this dataset.",
    };
  }

  if (parentA.id === parentB.id) {
    return {
      kind: "child",
      child: parentA,
      reason: "same-species",
      tie: false,
    };
  }

  const unique = findUniqueCombo(
    parentA.id,
    parentB.id,
    data.unique,
    options.genderA,
    options.genderB,
  );
  if (unique) {
    const child = index.get(unique.child);
    if (!child) {
      return { kind: "empty", message: "Unique combo child id is missing." };
    }
    return {
      kind: "child",
      child,
      reason: "unique",
      tie: false,
    };
  }

  const pool = formulaPool(data);
  if (pool.length === 0) {
    return { kind: "empty", message: "No formula-eligible Pals in this dataset." };
  }

  const targetRank = breedingTargetRank(parentA.rank, parentB.rank);
  const closest = closestByRank(pool, targetRank);
  if (closest.length === 0) {
    return { kind: "empty", message: "No formula match." };
  }
  if (closest.length === 1) {
    return {
      kind: "child",
      child: closest[0]!,
      reason: "formula",
      targetRank,
      tie: false,
    };
  }

  const pairKey = unorderedKey(parentA.id, parentB.id);
  const knownGolden = (options.goldenPairs ?? []).filter(
    (pair) => unorderedKey(pair.parentA, pair.parentB) === pairKey,
  );

  return {
    kind: "tie",
    candidates: closest,
    reason: "formula",
    targetRank,
    tie: true,
    message: "tie: verify in game",
    knownGolden,
  };
}

/**
 * Every unordered parent pair (breedable × breedable) whose forward result
 * includes the target child — same-species, unique, or formula (including ties).
 */
export function findParentPairsForChild(
  data: PalworldData,
  childId: string,
  options: { goldenPairs?: GoldenPair[]; genderA?: PalGender | null; genderB?: PalGender | null } = {},
): ParentPair[] {
  const index = byId(data);
  const child = index.get(childId);
  if (!child) return [];

  const breedable = data.pals.filter((pal) => pal.breedable);
  const results: ParentPair[] = [];
  const seen = new Set<string>();

  const push = (
    a: PalRecord,
    b: PalRecord,
    via: ParentPair["via"],
    genderA?: PalGender,
    genderB?: PalGender,
  ) => {
    const key = `${unorderedKey(a.id, b.id)}::${genderA ?? ""}::${genderB ?? ""}::${via}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ parentA: a, parentB: b, via, genderA, genderB });
  };

  if (child.breedable) {
    push(child, child, "same-species");
  }

  for (const combo of data.unique) {
    if (combo.child !== childId) continue;
    const a = index.get(combo.parentA);
    const b = index.get(combo.parentB);
    if (!a || !b) continue;
    push(a, b, "unique", combo.genderA, combo.genderB);
  }

  for (let i = 0; i < breedable.length; i++) {
    for (let j = i; j < breedable.length; j++) {
      const a = breedable[i]!;
      const b = breedable[j]!;
      if (a.id === b.id) continue; // same-species already added
      const forward = breedChild(data, a.id, b.id, {
        genderA: options.genderA,
        genderB: options.genderB,
        goldenPairs: options.goldenPairs,
      });
      if (forward.kind === "child" && forward.child.id === childId) {
        if (forward.reason === "unique") continue; // already listed from unique table
        push(a, b, forward.reason === "same-species" ? "same-species" : "formula");
      } else if (
        forward.kind === "tie" &&
        forward.candidates.some((c) => c.id === childId)
      ) {
        push(a, b, "formula-tie");
      }
    }
  }

  return results;
}

/** When data is verified, every golden pair must resolve to expectedChild. */
export function assertGoldenPairsPass(
  data: PalworldData,
  goldenPairs: GoldenPair[],
): void {
  if (!data.verified) return;
  const failures: string[] = [];
  for (const pair of goldenPairs) {
    const result = breedChild(data, pair.parentA, pair.parentB, {
      goldenPairs,
    });
    const ok =
      (result.kind === "child" && result.child.id === pair.expectedChild) ||
      (result.kind === "tie" &&
        result.candidates.some((c) => c.id === pair.expectedChild));
    if (!ok) {
      const got =
        result.kind === "child"
          ? result.child.id
          : result.kind === "tie"
            ? result.candidates.map((c) => c.id).join("|")
            : result.message;
      failures.push(
        `${pair.parentA} × ${pair.parentB} → expected ${pair.expectedChild}, got ${got}`,
      );
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `Golden pair check failed while pals.json is verified:\n${failures.join("\n")}`,
    );
  }
}

export function isExtractedDataStale(
  extractedAt: string,
  now: Date = new Date(),
  maxAgeDays = 60,
): boolean {
  const parsed = Date.parse(extractedAt);
  if (!Number.isFinite(parsed)) return true;
  const ageDays = (now.getTime() - parsed) / (1000 * 60 * 60 * 24);
  return ageDays > maxAgeDays;
}
