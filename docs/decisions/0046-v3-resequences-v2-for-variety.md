# 0046 — v3 resequences v2 for variety

**Date:** 31 Aug 2026
**Status:** Accepted

## Context

Feedback on v2 (the five-card build, `0035`) was that it read as repetitive:
every section opened with five or six identical keyword-tap nodes in a row,
and the newer formats (swipe, cloze, choice) all sat clustered at the very
end. Simon supplied a spec (`specs/v3_curriculum_resequencing_spec.pdf`,
sent as a Downloads-folder attachment, copied in here) derived from reading each
section's actual JSON: reorder each section's nodes into an interleaved
shape (fill-in-the-blank intro, swipe, elements, keyword, then alternating
formats climbing in difficulty, closing on multiple choice into a
fill-in-the-blank capstone), splitting the oversized description node into
an easy intro and a hard capstone to make that opening and closing work. No
round content changes — same text, same word lists, same blanks, same swipe
cards, just which node they live in and where that node sits in the array.

The spec itself was written assuming an in-place edit to `data/v2/*.json`
with zero component changes. What Simon actually asked for in chat was a new
**third**, independently-playable curriculum — v1, v2, and v3 all reachable
from the dev console, v3 as the new default. Those two don't fully agree:
v2 has to stay exactly as it was for that to make sense, so the reorder
can't happen to v2's own files. This is the one place this decision departs
from the letter of the attached spec, and it's flagged here per this repo's
own rule about specs and requests conflicting.

## What v3 actually is

`data/v3/*_section.json` — five files, each a copy of the matching
`data/v2/` file with the transform applied: the description node
(`node-8` in four sections, `node-7` in Empress, identified the same way
the spec says — the cloze node whose last round has far more blanks than
the ones before it) split into an intro (every round but the last, same id)
and a capstone (just that last round, id `<original>-capstone`), then the
whole `nodes` array reordered to the sequence the spec gives, by id, for
that card. Verified mechanically, not just by eye: a script asserted the
full set of round ids is identical before and after for all five files (no
round gained, lost, or duplicated), and that each new node order is exactly
the id sequence the spec specifies. It is — 63/44/46/48/46 rounds for
Fool/Lovers/Magician/Empress/Emperor, unchanged in both counts and content.

Two node counts change as a result: the four sections with a zone node go
13 → 14, Empress (no zone node — its card-element crops were dropped a
while back) goes 12 → 13. `app/v3/page.js`'s `LABELS` arrays are the ones
the spec supplies, one per new node, in order.

**The two companion fixes the spec flagged** are in v3's data too: the
description-intro node's first round and the zone node's first round both
now carry `"tutorial": true` in every section that was missing it (Fool
already had both; the other four didn't). Under this shape the description
intro is literally the first thing a learner sees in every section, so it
earns the same tutorial treatment Fool's already had.

## Why v3 is a new curriculum, not an edit to v2

`components/lesson-v2/*` hardcoded `/v2` in nine places — the "quit" link in
each of the six round-player components, plus three route-building
expressions in `node-session.jsx` (next node, next section, and the
"Back to v2" fallback label). Duplicating all fourteen files under a new
`components/lesson-v3/` would have worked, but it commits this codebase to
maintaining two copies of the same eleven-format round-playing engine
forever, with every future fix needing to land twice — exactly the drift
this repo's `docs/state-of-play.md` exists to prevent, just moved from "two
people" to "two folders."

Instead, every one of those nine spots took a `basePath` prop, defaulted to
`"/v2"` so v2's own route (`app/v2/play/[section]/[node]/page.js`) needed no
changes at all and behaves exactly as it did before this decision.
`app/v3/play/[section]/[node]/page.js` is new, but it's a thin route file
importing `data/v3/sections` instead of `data/v2/sections` and passing
`basePath="/v3"` into the same `NodeSession` — nothing under
`components/lesson-v2/` is forked. `app/v3/page.js` (the path screen) is its
own file, since a path screen's `LABELS` and section-slug-to-href logic
isn't something a prop can parameterize cleanly, but it reuses v2's page
markup and every `.v2-*` CSS class as-is — the visual system was never
versioned, only the content and its ordering are.

## What changed for routing

`app/page.js` now re-exports `app/v3/page.js` instead of `app/v2/page.js`.
`components/dev-console.jsx`'s Content submenu now lists all three:
"v1 (original curriculum)", "v2 (five cards, original order)", "v3
(resequenced, default)" — replacing the single "v1" escape hatch that was
enough when only two curricula existed.

While in there: Simon asked, mid-build, for the path screen's own header
("THE PATH" / "The old curriculum lives on at...") to come off entirely.
Removed from `app/v3/page.js` only — v1 and v2 keep whatever header they
already had, since neither was in scope here.

## Verified

`npm run build` succeeds across all 324 routes, including 69 new
`/v3/play/*` paths (14+14+14+13+14). A script confirmed no round was
dropped, duplicated, or moved into the wrong node across all five files.
Manually loaded `/v3/play/fool/1` (the new intro node — same 3-blank
opening round every earlier test in this session already exercised) and
`/v3/play/fool/14` (the new capstone — the full 12-blank paragraph, alone
in its own node, distractors intact) in a real browser, both rendering
correctly with no console errors in a fresh tab. Confirmed `/v1` and
`/v2/play/fool/1` are unaffected — the `basePath` default preserves v2's
exact prior behavior. Confirmed the dev console's Content menu shows all
three entries and each navigates correctly.

## Known gaps, honestly

Only Fool's node 1 and node 14 were played through in this pass, not a full
end-to-end run of every section — the transform is mechanically verified
(every round accounted for, correct order, correct tutorial flags) but
nobody has sat through Lovers, Magician, Empress, or Emperor's new shape in
the app yet. Worth a real playtest pass before calling this settled, the way
`0036` followed `0035`.

## First playtest pass on the resequenced build

Three fixes from actually looking at the new node order in the app:

**Tile-match's description text carried a redundant label.** `pairs[].text`
in the JSON is sometimes `"Cliff edge: The boundary between safety and the
unknown..."` — a short label, a colon, then the actual description — and
`tile-match-player.jsx` renders that whole string verbatim as the tile's
only content. Once tile-match nodes moved earlier in each section (this
resequencing puts "Find the elements" at position 3 instead of the very
end), that redundancy became a lot more visible. Not every pair has a
label prefix — of the 14 tile-match pairs across Fool/Lovers/Magician/
Emperor, 9 did (all 6 of Fool's, one each in the other three) and 5 were
already plain sentences — so the fix is a one-time content edit in
`data/v3/*_section.json`, stripping exactly those 9 prefixes rather than a
component change that would have to guess which pairs have one. Four of
the nine read as a lowercase continuation once their label (which supplied
the sentence's original capital letter) was removed — "Uranus: sudden
insight..." becomes "sudden insight..." — so those four also got
recapitalized. `data/v2/`'s own copies are untouched; this only touches
v3's data.

**The same tile-match tiles were oversized and misaligned.** Each image
tile filled its column at `width: 100%`, which read as too large once the
smaller image crops were shown this early rather than as the very last
thing in a section. Down to `width: 50%` of the tile. Separately, the image
column and text column were two *independent* CSS grids
(`.tile-match-col` × 2 inside `.tile-match-grid`), each sizing its own row
heights from its own content alone — so an image tile and the unrelated
text tile that happened to land in the same row position (the two columns
shuffle independently on purpose, so "same row" never means "same pair")
could disagree on height, and the two columns would drift out of vertical
alignment row by row. Fixed by flattening into one grid: both tiles of a
row are now direct siblings (image tile, then its row's text tile,
interleaved in `tile-match-player.jsx`), so the grid's own default
row-stretch sizes every row to its tallest cell and stretches the other to
match — no measurement code, no subgrid, just letting one grid do what two
grids can't do for each other.

**Swipe rounds were double-reviewing a single miss.** A card in a swipe
round already stays current until answered correctly, and the round runs
its own internal second-look pass over just the cards that were wrong
before finishing — both existed before this resequencing. But the round
still reported `onDone({missed: true})` whenever *any* card had ever been
missed, and `NodeSession`'s own node-level second look (`0038`) treats a
missed round as an opaque unit: it requeues the *entire round object* for
replay, all cards, not just the ones that were wrong. So a single miss on
one card out of eight meant the learner saw that one card twice (the
round's own internal review) and then the whole set of eight a third time
(NodeSession's outer review) - the exact "just the ones you got wrong, not
the whole deck again" the resequencing itself was trying to fix on the
happy path. Since a swipe round can't finish with anything actually wrong —
every card is confirmed correct, possibly on a retry, before the deck
empties — there's nothing left for the outer layer to usefully re-ask.
Swipe now always reports `missed: false`, unlike every other round type;
this is a deliberate difference in the contract, not an oversight, recorded
here so it isn't "fixed" back into consistency without reading this note
first. Keyword, zone, cloze, and choice rounds don't self-correct the same
way (a keyword-tap round IS one item, so replaying the whole round already
means replaying just the one thing that was wrong) — this fix is scoped to
swipe specifically, not a general claim about the double-review layer
`0045` already flagged as unresolved.

**Swipe's topbar progress bar was showing "round 1 of 1," always.** It
reused `round-player.jsx`'s own `roundNumber`/`totalRounds` progress
markup verbatim, but a swipe node is always exactly one round holding the
whole deck (`round.cards`), so that pair never moves. Swapped its source to
count cards in the deck instead: one segment per card, filled left to
right as each is answered correctly at least once (tracked by `origIndex`,
stamped onto each card when the deck is first shuffled, so a card
completed during the internal review pass above still only counts once
even though review re-deals it under a fresh `listKey`). Same `.progress`
markup and CSS as every other round type - just fed a number that actually
moves.

**2-word keyword rounds no longer wait on a Continue tap.** A 2-word round
is one correct word and one distractor - the distractor's own pop
animation (`closeOutRound`) already reads as the round's success beat, so
a Continue button after it is one more tap for a round that only ever had
one real answer. Rounds of 3+ words are unchanged: they still get the
button, since a fuller round's success state needs its own beat to land.
Gated on `round.words.length`, not the shrinking `activeWords` count, so
the check is stable for the round's whole lifetime.
