# 0082: v1, v2, v3, and the standalone Story mode are removed

## Context

v4 has been the app's default (and only actively developed) path since
3 Sep. Simon asked to clean up the legacy content now that it's no longer
needed: v1 (the original spec-driven curriculum), v2 and v3 (the two later
bespoke experiments that superseded it before v4 existed), and — in a
follow-up — the standalone Story mode's own flat chapter list, since v4's
narrative nodes had already absorbed everything Story mode did.

## What's gone

- **Routes**: `app/v1/`, `app/v2/`, `app/v3/`, `app/units/` (v1's actual
  lesson-play tree), `app/story/page.js` (the flat Story index).
- **Data**: `data/v2/`, `data/v3/`, `data/data_curriculum_nodes.csv`,
  `data/data_unit_metadata.csv`, `data/story/chapter-01.json` through
  `chapter-04.json`.
- **Code that only ever served the above**: `components/lesson/*.jsx`
  except `options.jsx` (still shared — its `Inspector`/`Footer` exports are
  used by `components/lesson-v2/cloze-round-player.jsx`),
  `components/path-screen.jsx`, `scripts/check_data.py`,
  `scripts/check_rounds.mjs` (built entirely around v1's own
  `getSession`/`buildNode` pipeline — no v4 equivalent exists yet; flagging
  this as a real gap, not silently absorbing it), `scripts/build-v4-sections.mjs`
  (a one-time codegen script that read v3's own JSON, which no longer
  exists to read).
- The dev console's v1/v2/v3 menu entries and its entire "Story" group
  (one button per standalone chapter).

**What survived**: `app/story/play/[chapter]/page.js` — the Story *player*
route, not the index. v4's own narrative nodes (`u1-dave-start.json` etc.)
already routed through this exact URL shape, so it becomes v4's sole
narrative-node engine rather than forking a new one. `data/story/chapters.js`
lost `CHAPTERS`/`RAW_CHAPTERS`/`getNextChapter` (all standalone-only) and
keeps just `V4_CHAPTERS`/`getChapter`.

## The harder part: `lib/data.js`

`getPath()` and `getAllSections()` are used well beyond v1 — the dev
console's "Unlock all", Social's "path percent", and the Deck/Reader/
`/deck/[card]` tabs' own idea of "which lesson teaches this card" all
called them, and Deck's card-detail href literally pointed at
`/units/<unit>/sections/<section>/play` — v1's own route. Deleting v1's
CSVs outright would have crashed all four surfaces. Both functions are
rewritten against v4's own `data/v4/units.js` (`firstUnitForCard`) and
`data/v4/sections.js` (`SECTIONS`) instead, returning the same shape their
callers already expected (`getAllSections()`: one entry per card v4 teaches
— all 22 majors, no minors yet — with `cardKey`, `nodeIds`, and a real
`/v4/play/<slug>/1?unit=<n>` href; `getPath()`: just the flattened
`nodeIds` list its own three callers ever actually read). `getDrawDeck()`'s
per-card `unit` field (used by the Daily Draw's "pick something from a
couple units ahead" heuristic) is re-sourced the same way, falling back to
`99` for the 56 minors v4 doesn't teach — the same fallback it already used
for any v1-uncovered card.

Also deleted from `lib/data.js`, now genuinely unreachable: `getUnits`,
`getUnit`, `getNodes`, `getSections`, `getUnitNodeIds`, `groupBySection`,
`getCardIntro` (and its private `opener`/`anonymousOpener`/`SELF_REFERENCE`
helpers), `getCardNames`, `getCardIndex`, `getSymbolIndex`,
`getCardSymbolIndex`, `getSimilarityIndex`, `getTalkingPointIndex`,
`getDescriptionIndex`, and `getSession` itself.

One import gotcha: `lib/data.js` is executed directly under plain Node (no
bundler) by `scripts/check_rounds.mjs` — since removed, but the general
constraint stands for whatever eventually replaces it — so its own
imports of `data/v4/units.js`/`sections.js` had to stay relative
(`../data/v4/units.js`) rather than the `@/` alias Next's bundler resolves
but plain Node doesn't.

## Two bugs found along the way

Neither is new — both are latent bugs the removal (and the dev console
change below) happened to surface, not regressions this change caused.

**The course's last unit skipped its own unlock celebration.**
`chapter-player.jsx` only showed `UnitCompleteCelebration` when both
`unlockUnit` AND `nextChapter` were truthy — reasonable when Story mode's
last unit (8) was a review with no unlock, so the combination "real
unlock, no next step" never happened. It happens now: unit 27 (World) is
a real first-time unlock with nothing after it in the path. Fixed by
dropping the `nextChapter` requirement; `nextHref` goes through as
`undefined` for that one case, and both `UnitCompleteCelebration` and
`deck-screen.jsx`'s own `?next=` handling already treated a missing next
step as "land on the deck, no further prompt" rather than an error —
except `UnitCompleteCelebration` was building its query string with
`new URLSearchParams({ next: nextHref })`, which stringifies `undefined`
into the literal text `next=undefined`. Fixed to only set `next` when
`nextHref` is truthy.

**The dev console's default position could land 33,000px down the page.**
Requested separately: "default the dev console to the circle up top right
until opened, rather than defaulting it to open as it is today." That part
was simple (`minimized` now defaults to `true` when nothing is stored yet,
matching `.dev-console-mini`'s already-correct top-right CSS). But
un-minimizing it for the first time on the `/v4` path page — a single very
long scroll — placed the full FAB at `y: 33036`. `frameBox()` measures
`.app-frame`'s own `getBoundingClientRect()` height, which is only a valid
proxy for the fixed-positioning viewport when `.app-frame` carries a
transform (desktop framing, above 900px). Below that it's a plain wrapper
exactly as tall as its content — on the /v4 page, tens of thousands of
pixels. Fixed by clamping `frameBox()`'s returned width/height to
`window.innerWidth`/`innerHeight`, whichever is smaller — the desktop case
(genuinely capped by its own `min(940px, 94dvh)`) is unaffected.

## Follow-ups

- No automated round-content validator exists for v4, unlike v1's
  `check_rounds.mjs`. Worth building one eventually.
- `specs/` still describes v1's Format A1-C/XP/hint system, which no
  implementation in this repo now matches. Left as-is — specs are locked
  reference docs, not something this cleanup should silently rewrite.
