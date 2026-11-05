/**
 * Content-quality audit for live calculator pages.
 * Extracts non-calculator explanatory text from page.tsx sources.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(import.meta.url);

// Live hrefs from a lightweight parse of calculators.ts (avoid TS import).
const calculatorsSrc = fs.readFileSync(
  path.join(root, "src/lib/calculators.ts"),
  "utf8",
);

const liveHrefs = [];
const blockRe =
  /\{\s*id:\s*"[^"]+"[\s\S]*?status:\s*"(live|coming-soon|draft)"[\s\S]*?\}/g;
let m;
while ((m = blockRe.exec(calculatorsSrc))) {
  const block = m[0];
  const status = /status:\s*"(live|coming-soon|draft)"/.exec(block)?.[1];
  const href = /href:\s*"([^"]+)"/.exec(block)?.[1];
  const name = /name:\s*"([^"]+)"/.exec(block)?.[1];
  if (status === "live" && href) liveHrefs.push({ href, name, status });
}

// Also include verified state pages
const stateDir = path.join(root, "data/state-tax");
const statePages = [];
if (fs.existsSync(stateDir)) {
  for (const file of fs.readdirSync(stateDir)) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(stateDir, file), "utf8"));
    if (data.verified && data.structure !== "none" && data.code !== "ZZ") {
      const href = `/finance/state-income-tax-calculator/${String(data.code).toLowerCase()}`;
      statePages.push({
        href,
        name: `${data.name} State Income Tax`,
        status: "live",
        sourceFile: path.join(
          root,
          "src/app/finance/state-income-tax-calculator/[state]/page.tsx",
        ),
        sharedTemplate: true,
        stateCode: data.code,
      });
    }
  }
}

function hrefToPageFile(href) {
  if (href.includes("/state-income-tax-calculator/") && href.split("/").length > 4) {
    return path.join(
      root,
      "src/app/finance/state-income-tax-calculator/[state]/page.tsx",
    );
  }
  const rel = href.replace(/^\//, "");
  return path.join(root, "src/app", rel, "page.tsx");
}

const CALCULATOR_COMPONENT_RE =
  /<(Percentage|Average|AveragePerDay|Gpa|UnitConverter|Age|DaysBetween|AddSubtract|BusinessDays|TimeDuration|Loan|CompoundInterest|SavingsGoal|SalaryToHourly|Zakat|Bmi|Calorie|Pregnancy|StateIncomeTax|PalworldBreeding)[A-Za-z]*[\s\S]*?\/>|<(Percentage|Average|AveragePerDay|Gpa|UnitConverter|Age|DaysBetweenDates|AddSubtractDays|BusinessDays|TimeDuration|Loan|CompoundInterest|SavingsGoal|SalaryToHourly|Zakat|Bmi|Calorie|PregnancyDueDate|StateIncomeTax|PalworldBreeding)[A-Za-z]*[\s\S]*?<\/[A-Za-z]+>/g;

function extractExplanatoryText(filePath, opts = {}) {
  if (!fs.existsSync(filePath)) return "";
  let src = fs.readFileSync(filePath, "utf8");

  // Drop imports, metadata, JSON-LD const objects, and the calculator widget JSX.
  src = src.replace(/^import[\s\S]*?;$/gm, "");
  src = src.replace(/export const FAQ_ITEMS[\s\S]*?as const;/m, (block) => {
    // Keep FAQ question/answer strings — they are visible content.
    return block
      .replace(/question:\s*/g, " ")
      .replace(/answer:\s*/g, " ");
  });
  src = src.replace(/const \w+JsonLd[\s\S]*?;/g, "");
  src = src.replace(/export async function generateMetadata[\s\S]*?\n\}/g, "");
  src = src.replace(/export const metadata[\s\S]*?;/g, "");
  src = src.replace(/export function generateStaticParams[\s\S]*?\n\}/g, "");

  // Remove calculator component tags (self-closing and common wrappers).
  src = src.replace(/<[A-Z][A-Za-z0-9]*Calculator\b[^>]*\/>/g, " ");
  src = src.replace(
    /<[A-Z][A-Za-z0-9]*Calculator\b[\s\S]*?<\/[A-Z][A-Za-z0-9]*Calculator>/g,
    " ",
  );
  src = src.replace(/<UnitConverter\b[^>]*\/>/g, " ");
  src = src.replace(/<Header\s*\/>|<Footer\s*\/>|<Breadcrumbs[\s\S]*?\/>/g, " ");
  src = src.replace(/<script[\s\S]*?<\/script>/g, " ");

  // Pull string literals and JSX text-ish content.
  const chunks = [];
  const strRe = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let sm;
  while ((sm = strRe.exec(src))) {
    const s = sm[2]
      .replace(/\\n/g, " ")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\$\{[^}]+\}/g, " ")
      .trim();
    if (s.length < 20) continue;
    // Skip paths, className soup, URLs-only, technical identifiers.
    if (/^(https?:|\/[a-z]|bg-|text-|flex |grid |mx-|px-|py-|sm:|lg:)/i.test(s))
      continue;
    if (/className|application\/ld\+json|ListItem|WebApplication/.test(s))
      continue;
    if (/^[A-Z_]+$/.test(s)) continue;
    chunks.push(s);
  }

  // Also capture JSX text nodes between tags when reasonably long.
  const textNodeRe = />([^<>{]{25,})</g;
  let tm;
  while ((tm = textNodeRe.exec(src))) {
    const t = tm[1].replace(/\s+/g, " ").trim();
    if (t.length >= 25) chunks.push(t);
  }

  let text = chunks.join(" ");
  text = text
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (opts.stateName) {
    // State pages share a template; inject state-specific tokens already in file
    // are mostly dynamic — approximate by appending unique state name mentions.
    text = `${opts.stateName} state income tax ${text}`;
  }

  return text;
}

function words(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function shingles(wordList, n = 3) {
  const set = new Set();
  for (let i = 0; i <= wordList.length - n; i++) {
    set.add(wordList.slice(i, i + n).join(" "));
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const pages = [];
for (const item of liveHrefs) {
  // Skip draft games listing if status draft — already filtered live only
  if (item.href.startsWith("/games")) {
    // Only include if verified — check pals.json
    const pals = JSON.parse(
      fs.readFileSync(path.join(root, "data/palworld/pals.json"), "utf8"),
    );
    if (!pals.verified) continue;
  }
  const file = hrefToPageFile(item.href);
  const text = extractExplanatoryText(file);
  const w = words(text);
  pages.push({
    href: item.href,
    name: item.name,
    file,
    wordCount: w.length,
    shingles: shingles(w),
    text,
  });
}

for (const sp of statePages) {
  // State pages: template is shared; content is largely data-driven.
  // Approximate unique explanatory words from template + note that structure/FAQ are templated.
  const text = extractExplanatoryText(sp.sourceFile, { stateName: sp.name });
  const w = words(text);
  pages.push({
    href: sp.href,
    name: sp.name,
    file: sp.sourceFile,
    wordCount: w.length,
    shingles: shingles(w),
    text,
    sharedTemplate: true,
  });
}

// Static trust/category pages (brief)
const extras = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/date-time",
  "/finance",
  "/health",
  "/math",
];
for (const href of extras) {
  const file =
    href === "/"
      ? path.join(root, "src/app/page.tsx")
      : path.join(root, "src/app", href.slice(1), "page.tsx");
  if (!fs.existsSync(file)) continue;
  const text = extractExplanatoryText(file);
  const w = words(text);
  pages.push({
    href,
    name: href,
    file,
    wordCount: w.length,
    shingles: shingles(w),
    text,
    kind: "site",
  });
}

console.log("=== LIVE / SITE PAGE WORD COUNTS (explanatory text approx.) ===");
const sorted = [...pages].sort((a, b) => a.wordCount - b.wordCount);
for (const p of sorted) {
  const flag = p.wordCount < 400 ? " THIN" : "";
  const shared = p.sharedTemplate ? " [shared-template]" : "";
  console.log(
    `${String(p.wordCount).padStart(5)}  ${p.href}${flag}${shared}`,
  );
}

console.log("\n=== PAIRS WITH >35% TRIGRAM OVERLAP ===");
const thin = [];
const overlaps = [];
for (let i = 0; i < pages.length; i++) {
  if (pages[i].wordCount < 400 && pages[i].kind !== "site") {
    thin.push(pages[i].href);
  }
  for (let j = i + 1; j < pages.length; j++) {
    // Skip comparing state pages against each other on shared template (expected high)
    if (pages[i].sharedTemplate && pages[j].sharedTemplate) {
      const sim = jaccard(pages[i].shingles, pages[j].shingles);
      overlaps.push({
        a: pages[i].href,
        b: pages[j].href,
        sim,
        note: "shared-template",
      });
      continue;
    }
    const sim = jaccard(pages[i].shingles, pages[j].shingles);
    if (sim > 0.35) {
      overlaps.push({ a: pages[i].href, b: pages[j].href, sim });
    }
  }
}
overlaps
  .sort((a, b) => b.sim - a.sim)
  .forEach((o) => {
    console.log(
      `${(o.sim * 100).toFixed(1)}%  ${o.a}  ↔  ${o.b}${o.note ? " (" + o.note + ")" : ""}`,
    );
  });

console.log("\n=== THIN (<400 words) CALCULATOR PAGES ===");
console.log(thin.length ? thin.join("\n") : "(none)");

// Developer wording scan on live public pages
const DEV_PATTERNS = [
  /verified:\s*true/i,
  /Testland/,
  /data\/state-tax/,
  /data\/palworld/,
  /generateStaticParams/,
  /build time/i,
  /build-time/i,
  /\{\{[A-Z_]+\}\}/,
  /coming soon/i,
  /file in `/i,
];

console.log("\n=== DEVELOPER / PLACEHOLDER WORDING IN PAGE SOURCES ===");
const pageFiles = fs
  .readdirSync(path.join(root, "src/app"), { recursive: true })
  .filter((f) => String(f).endsWith("page.tsx"))
  .map((f) => path.join(root, "src/app", f));

for (const file of pageFiles) {
  const src = fs.readFileSync(file, "utf8");
  const hits = DEV_PATTERNS.filter((re) => re.test(src)).map((re) =>
    String(re),
  );
  if (hits.length) {
    const rel = path.relative(root, file);
    console.log(`${rel}: ${hits.join(", ")}`);
  }
}

console.log("\n=== DRAFT / GATED ===");
const pals = JSON.parse(
  fs.readFileSync(path.join(root, "data/palworld/pals.json"), "utf8"),
);
console.log(`palworld verified=${pals.verified} (draft if false)`);
console.log(`state pages verified: ${statePages.map((s) => s.href).join(", ") || "(none)"}`);

// Write JSON report for later before/after
const report = {
  pages: pages.map(({ href, name, wordCount, sharedTemplate, kind }) => ({
    href,
    name,
    wordCount,
    sharedTemplate: !!sharedTemplate,
    kind: kind || "calculator",
    thin: wordCount < 400,
  })),
  overlaps: overlaps.map((o) => ({
    ...o,
    sim: Math.round(o.sim * 1000) / 1000,
  })),
  thin,
};
fs.writeFileSync(
  path.join(root, "scripts/content-audit-report.json"),
  JSON.stringify(report, null, 2),
);
console.log("\nWrote scripts/content-audit-report.json");
