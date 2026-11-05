#!/usr/bin/env node
/**
 * Content audit for published and candidate state-tax pages.
 * Usage: npm run states:audit
 */
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data", "state-tax");
const CURRENT_TAX_YEAR = 2026;
const MAX_AGE_DAYS = 400;
const SIMILARITY_FLAG = 0.35;

function daysSince(iso) {
  const t = Date.parse(`${iso}T00:00:00.000Z`);
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

function isDataFile(name) {
  return (
    name.endsWith(".json") &&
    !name.startsWith("_") &&
    name !== "roster.json" &&
    name !== "ZZ.json"
  );
}

function uniqueWordsOutsideCalculator(state) {
  const parts = [
    ...(state.notes ?? []).map((n) => n.text),
    ...(state.facts ?? []).map((f) => `${f.label} ${f.text}`),
    state.localTaxNote ?? "",
    state.modelFitReason ?? "",
    ...(state.limits ?? []),
    ...(state.sources ?? []).map((s) => s.label),
  ];
  const text = parts.join(" ").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = text.split(/\s+/).filter(Boolean);
  return new Set(words).size;
}

function shingles(text, size = 3) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set();
  for (let i = 0; i <= words.length - size; i++) {
    set.add(words.slice(i, i + size).join(" "));
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const item of a) {
    if (b.has(item)) inter++;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function editorialBlob(state) {
  return [
    ...(state.notes ?? []).map((n) => n.text),
    ...(state.facts ?? []).map((f) => f.text),
    state.localTaxNote ?? "",
    ...(state.limits ?? []),
  ].join(" ");
}

function metaDescription(state) {
  const top = state.brackets?.single?.at(-1)?.rate;
  const rate =
    typeof top === "number" ? `${(top * 100).toFixed(2).replace(/\.?0+$/, "")}%` : "?";
  return `Estimate ${state.name} state income tax for tax year ${state.taxYear} using a ${state.structure} schedule (top rate ${rate}). Sourced figures last verified ${state.lastVerified}. State tax only.`;
}

function title(state) {
  return `${state.name} State Income Tax Calculator (${state.taxYear})`;
}

function isCandidate(state) {
  return (
    state.verified &&
    (state.modelFit === "good" || state.modelFit === "partial") &&
    state.structure !== "none"
  );
}

function isStale(state) {
  const age = daysSince(state.lastVerified);
  const ageStale = age != null && age > MAX_AGE_DAYS;
  const yearStale =
    state.taxYear !== CURRENT_TAX_YEAR &&
    state.taxYear !== CURRENT_TAX_YEAR - 1;
  return ageStale || yearStale;
}

const files = fs.readdirSync(dataDir).filter(isDataFile);
const states = files.map((file) =>
  JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8")),
);

const focus = states.filter(isCandidate);
const stale = states.filter((s) => s.verified && isStale(s));

console.log("=== Unique words outside calculator ===");
for (const state of focus) {
  console.log(
    `${state.code}: ${uniqueWordsOutsideCalculator(state)} unique words`,
  );
}

console.log("\n=== Pairwise similarity (3-word shingles) ===");
const flagged = [];
for (let i = 0; i < focus.length; i++) {
  for (let j = i + 1; j < focus.length; j++) {
    const a = focus[i];
    const b = focus[j];
    const sim = jaccard(shingles(editorialBlob(a)), shingles(editorialBlob(b)));
    const mark = sim > SIMILARITY_FLAG ? " FLAG" : "";
    console.log(`${a.code}-${b.code}: ${(sim * 100).toFixed(1)}%${mark}`);
    if (sim > SIMILARITY_FLAG) flagged.push([a.code, b.code, sim]);
  }
}

console.log("\n=== Duplicate titles / descriptions ===");
const titles = new Map();
const descs = new Map();
let dupes = 0;
for (const state of focus) {
  const t = title(state);
  const d = metaDescription(state);
  if (titles.has(t)) {
    console.log(`Duplicate title: ${state.code} and ${titles.get(t)}`);
    dupes++;
  } else titles.set(t, state.code);
  if (descs.has(d)) {
    console.log(`Duplicate description: ${state.code} and ${descs.get(d)}`);
    dupes++;
  } else descs.set(d, state.code);
}
if (dupes === 0) console.log("None");

console.log("\n=== Stale states (hidden automatically) ===");
if (stale.length === 0) {
  console.log("None");
} else {
  for (const state of stale) {
    const age = daysSince(state.lastVerified);
    console.log(
      `${state.code}: lastVerified=${state.lastVerified} (age=${age}d), taxYear=${state.taxYear}`,
    );
  }
}

console.log("\n=== Summary ===");
console.log(
  `candidates=${focus.length} flaggedPairs=${flagged.length} duplicateTitleOrDesc=${dupes} stale=${stale.length}`,
);

if (flagged.length > 0 || dupes > 0) {
  process.exitCode = 1;
}

export {
  uniqueWordsOutsideCalculator,
  jaccard,
  shingles,
  isStale,
  isCandidate,
  metaDescription,
  title,
  SIMILARITY_FLAG,
};
