#!/usr/bin/env node
/**
 * Print a status table for the state-tax roster and any data files.
 * Usage: npm run states:status
 */
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data", "state-tax");
const rosterPath = path.join(dataDir, "roster.json");

const CURRENT_TAX_YEAR = 2026;
const MAX_AGE_DAYS = 400;
const PUBLISHED_WAVE = 1;

function daysSince(iso) {
  const t = Date.parse(`${iso}T00:00:00.000Z`);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

function loadFile(code) {
  const file = path.join(dataDir, `${code}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function pilotEnabled() {
  const configPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "state-tax",
    "config.ts",
  );
  const configSrc = fs.readFileSync(configPath, "utf8");
  return /SHOW_STATE_TAX_PILOT\s*=\s*true/.test(configSrc);
}

function isPublished(data) {
  if (!pilotEnabled()) return false;
  if (!data || !data.verified) return false;
  if (data.structure === "none") return false;
  if (data.modelFit !== "good" && data.modelFit !== "partial") return false;
  if (data.wave == null || data.wave > PUBLISHED_WAVE) return false;
  if (!Array.isArray(data.notes) || data.notes.length < 2) return false;
  if (!Array.isArray(data.facts) || data.facts.length < 4) return false;
  if (!Array.isArray(data.sources) || data.sources.length < 1) return false;
  const age = daysSince(data.lastVerified);
  if (age == null || age > MAX_AGE_DAYS) return false;
  if (
    data.taxYear !== CURRENT_TAX_YEAR &&
    data.taxYear !== CURRENT_TAX_YEAR - 1
  ) {
    return false;
  }
  return true;
}

const roster = JSON.parse(fs.readFileSync(rosterPath, "utf8"));
const rows = roster.states.map((entry) => {
  const data = loadFile(entry.code);
  const age = data ? daysSince(data.lastVerified) : null;
  return {
    code: entry.code,
    name: entry.name,
    structure: data?.structure ?? entry.structure,
    modelFit: data?.modelFit ?? entry.modelFit,
    wave: data?.wave ?? entry.wave,
    verified: data ? Boolean(data.verified) : false,
    sources: data?.sources?.length ?? 0,
    notes: data?.notes?.length ?? 0,
    facts: data?.facts?.length ?? 0,
    days: age,
    published: isPublished(data) ? "yes" : "no",
  };
});

const header = [
  "code",
  "name",
  "structure",
  "modelFit",
  "wave",
  "verified",
  "sources",
  "notes",
  "facts",
  "days",
  "published",
];

function pad(value, width) {
  const s = value == null ? "—" : String(value);
  return s.length >= width ? s : s + " ".repeat(width - s.length);
}

const widths = header.map((h) =>
  Math.max(h.length, ...rows.map((r) => String(r[h] ?? "—").length)),
);

console.log(header.map((h, i) => pad(h, widths[i])).join("  "));
console.log(widths.map((w) => "-".repeat(w)).join("  "));
for (const row of rows) {
  console.log(header.map((h, i) => pad(row[h], widths[i])).join("  "));
}
