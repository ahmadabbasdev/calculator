import palsJson from "../../../data/palworld/pals.json";
import goldenJson from "../../../data/palworld/golden-pairs.json";
import {
  parseGoldenPairs,
  parsePalworldData,
  type GoldenPair,
  type PalworldData,
} from "@/lib/palworld/schema";
import { assertGoldenPairsPass } from "@/lib/utils/palworld";

let cached: PalworldData | null = null;
let cachedGolden: GoldenPair[] | null = null;

export function loadPalworldData(): PalworldData {
  if (!cached) {
    cached = parsePalworldData(palsJson, "data/palworld/pals.json");
  }
  return cached;
}

export function loadGoldenPairs(): GoldenPair[] {
  if (!cachedGolden) {
    cachedGolden = parseGoldenPairs(
      goldenJson,
      "data/palworld/golden-pairs.json",
    );
  }
  return cachedGolden;
}

export function isPalworldVerified(): boolean {
  return loadPalworldData().verified === true;
}

/**
 * Draft pages may render in local development and Vercel preview only.
 * Production (`VERCEL_ENV=production` or `next start`) returns 404 while unverified.
 */
export function allowsDraftPages(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview" || vercelEnv === "development") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

/** True when the Palworld breeding page should render (live or draft-allowed). */
export function canAccessPalworldPage(): boolean {
  return isPalworldVerified() || allowsDraftPages();
}

/** Run at build/page load: validate data and golden pairs when verified. */
export function assertPalworldBuildGates(): void {
  const data = loadPalworldData();
  const golden = loadGoldenPairs();
  assertGoldenPairsPass(data, golden);
}

export const PALWORLD_PAGE_PATH = "/games/palworld-breeding-calculator";
export const GAMES_CATEGORY_PATH = "/games";
