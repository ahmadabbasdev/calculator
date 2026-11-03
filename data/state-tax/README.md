# State income tax data

Each file is one US state (or the fictional Testland fixture).  
**Every numeric value must be copied from the state revenue department for the stated tax year.** Do not invent rates, brackets, or deductions.

## File naming

- Production / pilot states: `XX.json` where `XX` is the two-letter postal code (for example `CA.json`).
- Fictional test fixture only: `ZZ.json` (Testland). Keep `verified: false`. It must never appear in production routes, the hub, the sitemap, or `llms.txt`.

## Filling a state

1. Copy `_TEMPLATE.json` to `XX.json`.
2. Fill every field from the official state revenue / taxation department for the `taxYear` you document.
3. Add at least one official `sources` entry (the revenue department page) and 2–5 short factual `notes` with `sourceUrl`s.
4. Set `lastVerified` to the ISO date you checked the figures.
5. Set `verified: true` only after you have personally confirmed the numbers against those sources.

## Structures

- `flat` — one bracket from `0` with an open end (`to: null`).
- `progressive` — contiguous brackets; first `from` is `0`; last `to` is `null`.
- `none` — no state income tax. Verified `none` states appear only as a hub table row; they never get a calculator page.

## Build gates

Zod validation runs when state-tax data is loaded. The build fails if brackets are unsorted/non-contiguous, rates are outside 0–1, verified states are missing sources/notes, or `lastVerified` is older than 450 days. Only `verified: true` states (excluding `ZZ`) are eligible for public pages and sitemap entries.
