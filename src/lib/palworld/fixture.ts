import type { PalworldData } from "@/lib/palworld/schema";

/**
 * Fictional five-Pal fixture for unit tests only — not real Palworld data.
 */
export const FIXTURE_PALWORLD: PalworldData = {
  gameVersion: "test-0",
  extractedAt: "2026-01-15",
  source: "Fictional test fixture — not game data.",
  verified: false,
  pals: [
    {
      id: "emberling",
      name: "Emberling",
      rank: 100,
      breedable: true,
      formulaExcluded: false,
    },
    {
      id: "tidecub",
      name: "Tidecub",
      rank: 200,
      breedable: true,
      formulaExcluded: false,
    },
    {
      id: "fernpaw",
      name: "Fernpaw",
      rank: 300,
      breedable: true,
      formulaExcluded: false,
    },
    {
      id: "stormkit",
      name: "Stormkit",
      rank: 400,
      breedable: true,
      formulaExcluded: false,
    },
    {
      id: "mytharch",
      name: "Mytharch",
      rank: 500,
      breedable: true,
      formulaExcluded: false,
    },
  ],
  unique: [
    {
      parentA: "emberling",
      parentB: "mytharch",
      child: "stormkit",
    },
    {
      parentA: "emberling",
      parentB: "tidecub",
      child: "fernpaw",
      genderA: "male",
      genderB: "female",
    },
    {
      parentA: "emberling",
      parentB: "tidecub",
      child: "stormkit",
      genderA: "female",
      genderB: "male",
    },
  ],
};
