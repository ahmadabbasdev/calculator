# State income tax data

Each file is one US state (or the fictional Testland fixture).  
**Every numeric value must be copied from the state revenue department for the stated tax year.** Do not invent rates, brackets, or deductions.

`roster.json` lists all 50 states + DC. No tax numbers belong in the roster.

Publish controls live in `src/lib/state-tax/config.ts` (`SHOW_STATE_TAX_PILOT`, `PUBLISHED_WAVE`, `CURRENT_TAX_YEAR`). While the pilot flag is false, hub/pages stay hidden in production.

## File naming

- Production / pilot states: `XX.json` where `XX` is the two-letter postal code (for example `CA.json`).
- Fictional test fixture only: `ZZ.json` (Testland). Keep `verified: false`. It must never appear in production routes, the hub, the sitemap, or `llms.txt`.

## Filling a state

1. `npm run states:new -- XX` (or copy `_TEMPLATE.json`).
2. Fill every field from the official state revenue / taxation department for the `taxYear` you document.
3. Set `wave`, `modelFit`, `modelFitReason`, and `limits` (use `limits` when `modelFit` is `partial`).
4. Add at least four state-specific `facts` (`label`, `text`, `sourceUrl`), at least one official `sources` entry, and 2–5 short factual `notes`.
5. Set `lastVerified` to the ISO date you checked the figures.
6. Set `verified: true` only after you have personally confirmed the numbers against those sources.
7. Refresh the roster: `npm run states:roster`.

## Publish rules

A state page is generated only when all are true:

- `verified` is true
- `modelFit` is `good` or `partial` (`poor` never gets a page)
- `wave` ≤ `PUBLISHED_WAVE`
- notes ≥ 2, facts ≥ 4, sources ≥ 1 (each with an official URL)
- `lastVerified` within 400 days
- `taxYear` is `CURRENT_TAX_YEAR` or `CURRENT_TAX_YEAR - 1`
- `SHOW_STATE_TAX_PILOT` is true (production)

No-wage-tax jurisdictions (AK, FL, NV, NH, SD, TN, TX, WA, WY) get no page.

## Structures

- `flat` — one bracket from `0` with an open end (`to: null`).
- `progressive` — contiguous brackets; first `from` is `0`; last `to` is `null`.
- `none` — no state income tax on wages (roster only).

## Tooling

- `npm run states:status` — roster/data status table
- `npm run states:new -- XX` — scaffold a state file
- `npm run states:audit` — uniqueness / similarity / stale report
- `npm run states:roster` — regenerate `roster.json`

## Build gates

Zod validation runs when state-tax data is loaded. The build fails if brackets are unsorted/non-contiguous, rates are outside 0–1, verified states are missing sources/notes/facts, `lastVerified` is older than 400 days, any wave has more than 5 verified states, or fact text / meta descriptions collide across candidate states.
