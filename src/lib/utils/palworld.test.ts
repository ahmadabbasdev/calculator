import { describe, expect, it } from "vitest";
import { FIXTURE_PALWORLD } from "@/lib/palworld/fixture";
import type { PalworldData } from "@/lib/palworld/schema";
import {
  assertGoldenPairsPass,
  breedChild,
  breedingTargetRank,
  findParentPairsForChild,
} from "@/lib/utils/palworld";

describe("breedingTargetRank", () => {
  it("100 + 200 → 150", () => {
    expect(breedingTargetRank(100, 200)).toBe(150);
  });
  it("100 + 300 → 200", () => {
    expect(breedingTargetRank(100, 300)).toBe(200);
  });
  it("100 + 500 → 300", () => {
    expect(breedingTargetRank(100, 500)).toBe(300);
  });
});

describe("breedChild — fixture ranks", () => {
  it("100 + 200 → tie between ranks 100 and 200", () => {
    const result = breedChild(FIXTURE_PALWORLD, "emberling", "tidecub");
    expect(result.kind).toBe("tie");
    if (result.kind !== "tie") return;
    expect(result.targetRank).toBe(150);
    expect(result.message).toBe("tie: verify in game");
    expect(result.candidates.map((c) => c.rank).sort()).toEqual([100, 200]);
  });

  it("100 + 300 → rank 200 Tidecub", () => {
    const result = breedChild(FIXTURE_PALWORLD, "emberling", "fernpaw");
    expect(result.kind).toBe("child");
    if (result.kind !== "child") return;
    expect(result.child.id).toBe("tidecub");
    expect(result.child.rank).toBe(200);
    expect(result.reason).toBe("formula");
  });

  it("100 + 500 → rank 300 Fernpaw (without unique override when genders unset… unique non-gender overrides)", () => {
    // emberling × mytharch has a unique → stormkit; use stormkit × mytharch instead? 
    // Spec: 100 + 500 gives target 300. Use parents that do not hit a unique.
    const data: PalworldData = {
      ...FIXTURE_PALWORLD,
      unique: [],
    };
    const result = breedChild(data, "emberling", "mytharch");
    expect(result.kind).toBe("child");
    if (result.kind !== "child") return;
    expect(result.targetRank).toBe(300);
    expect(result.child.id).toBe("fernpaw");
  });

  it("same-species returns that species", () => {
    const result = breedChild(FIXTURE_PALWORLD, "fernpaw", "fernpaw");
    expect(result.kind).toBe("child");
    if (result.kind !== "child") return;
    expect(result.child.id).toBe("fernpaw");
    expect(result.reason).toBe("same-species");
  });
});

describe("unique combos and exclusions", () => {
  it("unique combo overrides the formula", () => {
    const result = breedChild(FIXTURE_PALWORLD, "mytharch", "emberling");
    expect(result.kind).toBe("child");
    if (result.kind !== "child") return;
    expect(result.child.id).toBe("stormkit");
    expect(result.reason).toBe("unique");
  });

  it("gender-specific combos return different children by gender", () => {
    const mf = breedChild(FIXTURE_PALWORLD, "emberling", "tidecub", {
      genderA: "male",
      genderB: "female",
    });
    const fm = breedChild(FIXTURE_PALWORLD, "emberling", "tidecub", {
      genderA: "female",
      genderB: "male",
    });
    expect(mf.kind).toBe("child");
    expect(fm.kind).toBe("child");
    if (mf.kind !== "child" || fm.kind !== "child") return;
    expect(mf.child.id).toBe("fernpaw");
    expect(fm.child.id).toBe("stormkit");
    expect(mf.child.id).not.toBe(fm.child.id);
  });

  it("formulaExcluded Pals are never produced by the formula", () => {
    const data: PalworldData = {
      ...FIXTURE_PALWORLD,
      unique: [],
      pals: FIXTURE_PALWORLD.pals.map((pal) =>
        pal.id === "fernpaw"
          ? { ...pal, formulaExcluded: true }
          : pal,
      ),
    };
    const result = breedChild(data, "emberling", "mytharch");
    const producedIds =
      result.kind === "child"
        ? [result.child.id]
        : result.kind === "tie"
          ? result.candidates.map((c) => c.id)
          : [];
    expect(producedIds).not.toContain("fernpaw");
    expect(producedIds.length).toBeGreaterThan(0);
    expect(
      producedIds.every((id) => {
        const pal = data.pals.find((p) => p.id === id);
        return pal && !pal.formulaExcluded;
      }),
    ).toBe(true);
  });
});

describe("reverse search", () => {
  it("returns every pair that forward search maps to the target, and nothing else", () => {
    const data: PalworldData = { ...FIXTURE_PALWORLD, unique: [] };
    const childId = "tidecub";
    const reverse = findParentPairsForChild(data, childId);
    const breedable = data.pals.filter((p) => p.breedable);

    const expectedKeys = new Set<string>();
    for (let i = 0; i < breedable.length; i++) {
      for (let j = i; j < breedable.length; j++) {
        const a = breedable[i]!;
        const b = breedable[j]!;
        const forward = breedChild(data, a.id, b.id);
        const hit =
          (forward.kind === "child" && forward.child.id === childId) ||
          (forward.kind === "tie" &&
            forward.candidates.some((c) => c.id === childId));
        if (hit) {
          expectedKeys.add(
            a.id <= b.id ? `${a.id}::${b.id}` : `${b.id}::${a.id}`,
          );
        }
      }
    }

    const reverseKeys = new Set(
      reverse.map((pair) => {
        const a = pair.parentA.id;
        const b = pair.parentB.id;
        return a <= b ? `${a}::${b}` : `${b}::${a}`;
      }),
    );

    expect([...reverseKeys].sort()).toEqual([...expectedKeys].sort());
  });
});

describe("golden pairs gate", () => {
  it("skips enforcement when verified is false", () => {
    expect(() =>
      assertGoldenPairsPass(FIXTURE_PALWORLD, [
        { parentA: "emberling", parentB: "fernpaw", expectedChild: "wrong" },
      ]),
    ).not.toThrow();
  });

  it("fails when verified and a golden pair mismatches", () => {
    const verified = { ...FIXTURE_PALWORLD, verified: true, unique: [] };
    expect(() =>
      assertGoldenPairsPass(verified, [
        { parentA: "emberling", parentB: "fernpaw", expectedChild: "emberling" },
      ]),
    ).toThrow(/Golden pair check failed/);
  });

  it("passes when verified and golden pairs match", () => {
    const verified = { ...FIXTURE_PALWORLD, verified: true, unique: [] };
    expect(() =>
      assertGoldenPairsPass(verified, [
        { parentA: "emberling", parentB: "fernpaw", expectedChild: "tidecub" },
      ]),
    ).not.toThrow();
  });
});
