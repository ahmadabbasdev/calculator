#!/usr/bin/env node
/**
 * Scaffold data/state-tax/XX.json from _TEMPLATE.json and refresh the roster.
 * Usage: npm run states:new -- XX
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const codeArg = process.argv[2]?.trim().toUpperCase();
if (!codeArg || !/^[A-Z]{2}$/.test(codeArg)) {
  console.error("Usage: npm run states:new -- XX");
  process.exit(1);
}

const NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const NO_WAGE = new Set([
  "AK",
  "FL",
  "NV",
  "NH",
  "SD",
  "TN",
  "TX",
  "WA",
  "WY",
]);

if (NO_WAGE.has(codeArg)) {
  console.error(
    `${codeArg} is a no-wage-tax jurisdiction — do not scaffold a calculator file.`,
  );
  process.exit(1);
}

if (!NAMES[codeArg]) {
  console.error(`Unknown state code: ${codeArg}`);
  process.exit(1);
}

const dataDir = path.join(process.cwd(), "data", "state-tax");
const target = path.join(dataDir, `${codeArg}.json`);
const templatePath = path.join(dataDir, "_TEMPLATE.json");

if (fs.existsSync(target)) {
  console.error(`File already exists: ${target}`);
  process.exit(1);
}

const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
const scaffold = {
  ...template,
  code: codeArg,
  name: NAMES[codeArg],
  taxYear: 0,
  structure: "progressive",
  wave: null,
  modelFit: "unknown",
  modelFitReason: "",
  limits: [],
  verified: false,
  lastVerified: "YYYY-MM-DD",
};

fs.writeFileSync(target, JSON.stringify(scaffold, null, 2) + "\n");
console.log(`Created ${target}`);

const regen = spawnSync("node", ["scripts/generate-roster.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
if (regen.status !== 0) {
  process.exit(regen.status ?? 1);
}
