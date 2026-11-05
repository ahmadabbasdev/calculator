# Palworld breeding data

Supply breeding data yourself. **Do not scrape other calculators, copy their tables, or invent production figures.**

## Files

- `pals.json` — game version, extraction date, source note, `verified` flag, Pal list, and unique parent combinations.
- `golden-pairs.json` — pairs you confirmed in-game: `{ parentA, parentB, expectedChild }`. When `pals.json` has `verified: true`, every golden pair must match the breeding formula (or a unique combo) or the build fails.

## Publishing

1. Fill `pals.json` from your own extraction / in-game checks for the stated `gameVersion`.
2. Add golden pairs you personally verified.
3. Set `verified: true` only after those checks.
4. Rebuild. The calculator then leaves draft (production route, sitemap, catalog, Games category).

While `verified` is `false`, the tool is draft-only: development and preview can render it; production returns 404 and public surfaces omit it.
