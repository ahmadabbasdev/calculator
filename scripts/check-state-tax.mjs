#!/usr/bin/env node
/**
 * Build gate for state-tax data: schema-ish checks, unique facts/descriptions,
 * and wave caps. Fails the build on violation.
 */
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data", "state-tax");
const MAX_STATES_PER_WAVE = 5;
const MAX_AGE_DAYS = 400;

function isDataFile(name) {
  return (
    name.endsWith(".json") &&
    !name.startsWith("_") &&
    name !== "roster.json"
  );
}

function daysSince(iso) {
  const t = Date.parse(`${iso}T00:00:00.000Z`);
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function metaDescription(state) {
  const brackets = state.brackets?.single ?? [];
  const topRate = brackets.reduce((m, b) => Math.max(m, b.rate ?? 0), 0);
  const pct = topRate * 100;
  const rounded = Math.round(pct * 100) / 100;
  const top = Number.isInteger(rounded)
    ? `${rounded}%`
    : `${rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
  const structureLabel =
    state.structure === "flat"
      ? "flat"
      : state.structure === "progressive"
        ? "progressive"
        : "no";
  const deduction = Number(state.standardDeduction?.single ?? 0).toLocaleString(
    "en-US",
  );
  return `Estimate ${state.name} (${state.code}) state income tax for tax year ${state.taxYear}: ${structureLabel} rates (top ${top}), single standard deduction ${deduction}. State tax only — not federal advice.`;
}

const roster = JSON.parse(
  fs.readFileSync(path.join(dataDir, "roster.json"), "utf8"),
);
if (!Array.isArray(roster.states) || roster.states.length !== 51) {
  console.error(`roster.json must have exactly 51 states (got ${roster.states?.length})`);
  process.exit(1);
}

const codes = new Set();
for (const entry of roster.states) {
  if (codes.has(entry.code)) {
    console.error(`Duplicate roster code: ${entry.code}`);
    process.exit(1);
  }
  codes.add(entry.code);
}
const noWage = roster.states.filter((s) => s.status === "no-wage-tax");
if (noWage.length !== 9) {
  console.error(`Expected 9 no-wage-tax entries, got ${noWage.length}`);
  process.exit(1);
}

const files = fs.readdirSync(dataDir).filter(isDataFile);
const states = files.map((file) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  if (data.code === "ZZ") return data;
  if (!data.wave && data.wave !== null) {
    console.error(`${file}: missing wave`);
    process.exit(1);
  }
  if (!data.modelFit) {
    console.error(`${file}: missing modelFit`);
    process.exit(1);
  }
  if (!Array.isArray(data.facts)) {
    console.error(`${file}: facts must be an array`);
    process.exit(1);
  }
  if (!Array.isArray(data.limits)) {
    console.error(`${file}: limits must be an array`);
    process.exit(1);
  }
  if (data.verified) {
    if (data.facts.length < 4) {
      console.error(`${file}: verified states need >= 4 facts`);
      process.exit(1);
    }
    if (!Array.isArray(data.notes) || data.notes.length < 2) {
      console.error(`${file}: verified states need >= 2 notes`);
      process.exit(1);
    }
    if (!Array.isArray(data.sources) || data.sources.length < 1) {
      console.error(`${file}: verified states need >= 1 source`);
      process.exit(1);
    }
    if (daysSince(data.lastVerified) > MAX_AGE_DAYS) {
      console.error(`${file}: lastVerified is stale`);
      process.exit(1);
    }
  }
  return data;
});

const byWave = new Map();
for (const state of states) {
  if (!state.verified || state.code === "ZZ" || state.wave == null) continue;
  const list = byWave.get(state.wave) ?? [];
  list.push(state.code);
  byWave.set(state.wave, list);
}
for (const [wave, list] of byWave) {
  if (list.length > MAX_STATES_PER_WAVE) {
    console.error(
      `Wave ${wave} has ${list.length} verified states (max ${MAX_STATES_PER_WAVE}): ${list.join(", ")}`,
    );
    process.exit(1);
  }
}

const candidates = states.filter(
  (s) =>
    s.code !== "ZZ" &&
    s.verified &&
    (s.modelFit === "good" || s.modelFit === "partial"),
);

const factSeen = new Map();
for (const state of candidates) {
  for (const fact of state.facts) {
    const key = String(fact.text).trim().toLowerCase();
    if (factSeen.has(key)) {
      console.error(
        `Duplicate fact text across ${factSeen.get(key)} and ${state.code}: "${fact.text}"`,
      );
      process.exit(1);
    }
    factSeen.set(key, state.code);
  }
}

const descSeen = new Map();
for (const state of candidates) {
  const desc = metaDescription(state);
  if (descSeen.has(desc)) {
    console.error(
      `Duplicate meta description for ${state.code} and ${descSeen.get(desc)}`,
    );
    process.exit(1);
  }
  descSeen.set(desc, state.code);
}

console.log(
  `state-tax check ok: roster=${roster.states.length} files=${files.length} candidates=${candidates.length}`,
);
