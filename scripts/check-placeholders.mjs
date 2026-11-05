/**
 * Fails when trust-page placeholders remain on a production build.
 * Runs for VERCEL_ENV=production or when ENFORCE_PLACEHOLDERS=1.
 */
import fs from "node:fs";
import path from "node:path";

const enforce =
  process.env.VERCEL_ENV === "production" ||
  process.env.ENFORCE_PLACEHOLDERS === "1";

if (!enforce) {
  console.log(
    "check-placeholders: skipped (not production; set ENFORCE_PLACEHOLDERS=1 to run).",
  );
  process.exit(0);
}

const root = process.cwd();
const PLACEHOLDER = /\{\{[A-Z][A-Z0-9_]*\}\}/g;
const targets = [
  "src/lib/site-owner.ts",
  "src/app/about",
  "src/app/contact",
  "src/app/privacy",
  "src/app/terms",
  "src/app/disclaimer",
];

const hits = [];

function scanFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const matches = text.match(PLACEHOLDER);
  if (matches?.length) {
    hits.push({
      file: path.relative(root, filePath),
      placeholders: [...new Set(matches)],
    });
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    if (/\.(tsx?|jsx?|md|json)$/.test(dir)) scanFile(dir);
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    walk(path.join(dir, name));
  }
}

for (const target of targets) {
  walk(path.join(root, target));
}

if (hits.length > 0) {
  console.error(
    "Production build blocked: replace trust-page placeholders before shipping:\n",
  );
  for (const hit of hits) {
    console.error(`  ${hit.file}: ${hit.placeholders.join(", ")}`);
  }
  process.exit(1);
}

console.log("check-placeholders: no {{PLACEHOLDER}} tokens found.");
