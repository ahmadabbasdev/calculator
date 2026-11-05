import fs from "node:fs";
import path from "node:path";

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

const STATES = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

const dataDir = path.join(process.cwd(), "data", "state-tax");

function statusFromFile(code) {
  const file = path.join(dataDir, `${code}.json`);
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    structure: data.structure ?? "unknown",
    modelFit: data.modelFit ?? "unknown",
    modelFitReason: data.modelFitReason ?? "",
    wave: data.wave ?? null,
    verified: Boolean(data.verified),
    hasFile: true,
  };
}

const roster = STATES.map(([code, name]) => {
  if (NO_WAGE.has(code)) {
    return {
      code,
      name,
      taxesWages: false,
      structure: "none",
      modelFit: "unknown",
      modelFitReason: "No state income tax on wages.",
      wave: null,
      status: "no-wage-tax",
    };
  }

  const fromFile = statusFromFile(code);
  if (fromFile) {
    let status = "todo";
    if (fromFile.verified) status = "verified";
    else if (fromFile.hasFile) status = "data-ready";
    return {
      code,
      name,
      taxesWages: true,
      structure: fromFile.structure === "none" ? "none" : fromFile.structure,
      modelFit: fromFile.modelFit,
      modelFitReason: fromFile.modelFitReason || "",
      wave: fromFile.wave,
      status,
    };
  }

  return {
    code,
    name,
    taxesWages: true,
    structure: "unknown",
    modelFit: "unknown",
    modelFitReason: "",
    wave: null,
    status: "todo",
  };
});

const out = path.join(dataDir, "roster.json");
fs.writeFileSync(out, JSON.stringify({ states: roster }, null, 2) + "\n");
console.log(`Wrote ${roster.length} entries to ${out}`);
console.log(
  "no-wage-tax:",
  roster.filter((s) => s.status === "no-wage-tax").map((s) => s.code).join(","),
);
