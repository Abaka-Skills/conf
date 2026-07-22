---
name: new-conference-planner
description: Add a schedule planner for a new conference to this repo, cloned from the siggraph26 planner. Use when the user wants to create/add a planner for another conference (e.g. "add a NeurIPS 2026 planner").
---

# Create a planner for a new conference

This repo hosts one static planner per conference plus an index page. Every
planner is a copy of `siggraph26/` with conference-specific data and constants
swapped out. There is **no build step and no dependencies** — everything must
keep working when opened via `file://`, which is why data is a JS `const` in a
`<script src>` file, not fetched JSON.

## 0. Gather facts first

Before touching files, establish (ask the user for anything you can't find):

- Conference id: short lowercase slug + 2-digit year, e.g. `neurips26`. This
  becomes the directory name.
- Full title, subtitle/tagline, venue + city, official website URL.
- Date range (first and last day, ISO dates).
- Conference-local timezone and its UTC offset during the event (mind DST).
- Where the official schedule lives and whether it is scrapeable
  (static HTML? JSON API? lazy-loaded snippets like SIGGRAPH's?).
- The list of program/event types, if discoverable up front.

## 1. Scaffold from siggraph26

```
cp -r siggraph26 <confid>
```

Do **not** modify `siggraph26/` itself.

## 2. Produce `assets/data.js`

This is the canonical data file. Required shape — a single top-level const:

```js
const EVENTS = [
 {
  "day": "2026-07-19",              // conference-local date, ISO
  "s_utc": "2026-07-19T15:00:00Z",  // start, UTC ISO with Z
  "e_utc": "2026-07-19T21:00:00Z",  // end, UTC ISO with Z
  "type": "Technical Papers",       // program type — keys TYCOLOR/TYDESC in app.js
  "psid": "sess471",                // any stable id; "none" if absent
  "ssid": "none",
  "title": "…",
  "url": "https://…",               // official session page (rows link here)
  "room": "…",
  "speakers": ["…"],
  "tags": ["…"]
 },
 …
];
```

Preferred route: write a scraper at `<confid>/tools/pull_official.mjs`
(plain Node ≥18, no npm deps — `siggraph26/tools/pull_official.mjs` is the
model: fetch → regex-parse → `writeFileSync` the formatted `data.js` with a
header comment saying it's generated and how to regenerate). If the official
site has no scrapeable schedule yet, hand-build a minimal `data.js` and note
that in its header comment.

Verify: `node <confid>/tools/pull_official.mjs` runs clean and logs a
plausible event count per day.

## 3. Adapt `assets/app.js`

All conference specifics are constants at the top plus a few scattered strings.
Update every one of these:

- `DAYS`, `DAYNAME`, `DAYFULL` — the conference dates and labels.
- `TYCOLOR` — one distinct color per program type in the data (keep the
  existing palette style: muted, dark-background-friendly). `clr()` falls back
  to grey for unknown types — don't rely on that for real types.
- `TYDESC` — one-line description per type (shown in the matrix and tooltips).
- **Timezone**: the UTC→local conversion is a hardcoded offset in two places —
  the `EV` mapping (`- 7*3600e3` for PDT) and `nowPDT()`. Change both to the
  conference offset, and rename `nowPDT`/"PDT" strings to the real zone.
- **localStorage keys**: `sig26fav`, `sig26hidety`, `sig26favalways` → prefix
  with your conf id (e.g. `nips26fav`). Skipping this makes planners share
  favorites and break each other.
- Favorites export filename (`siggraph26_favorites.json`).
- `descUrl()`/`loadDesc()` — the live description fetch is SIGGRAPH-specific
  (WordPress REST API). Point it at an equivalent CORS-open endpoint for your
  conference, or delete the feature (remove `loadDesc` call and the
  loading-description branch in `showTip`) if none exists.

## 4. Adapt `<confid>/index.html`

- `<title>` and the `<h1>` (conference name, dates, venue, timezone note).
- Footer: official-site link and data-source credit.
- The "⟳ Pull from official" button links to this repo's GitHub Action —
  update it to the new workflow (step 6) or remove it if data is hand-built.

`assets/summary.css` is conference-agnostic — normally leave it untouched.

## 5. Register on the index page

- Add a 16:9 cover image at `assets/covers/<confid>.jpg` (repo root `assets/`,
  not the planner's). Use official key art if licensing permits.
- Append an entry to `meta.js` (`window.CONFERENCES`) — copy the siggraph26
  entry's fields: `id`, `title`, `subtitle`, `start`, `end`, `location`,
  `official`, `schedule: "<confid>/"`, `cover`. The index page renders it
  automatically, including the Past/Now/Upcoming chip.

## 6. CI workflow (only if there's a scraper)

Copy `.github/workflows/pull-official.yml` to a new file, rename the workflow,
and point the two paths at `<confid>/tools/pull_official.mjs` and
`<confid>/assets/data.js`. Keep it `workflow_dispatch`-only.

## 7. Verify

- Open root `index.html` via `file://` — the new card renders with cover,
  dates, and correct status chip, and links into the planner.
- Open the planner: stats line is plausible; timeline and list views render
  for every day; matrix counts sum to the total; every program type has a
  non-grey color and a description; search and favorites work; event links
  open the official pages; displayed times match the official site (timezone
  check — compare 2–3 known sessions).
- Confirm `siggraph26/` has no diff.
