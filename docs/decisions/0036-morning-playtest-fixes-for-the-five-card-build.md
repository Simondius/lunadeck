# 0036 — Morning playtest fixes for the five-card v2 build

**Date:** 2026-08-31
**Status:** Accepted (built live with Simon testing, still uncommitted)

## Context

Simon played the overnight build (`docs/decisions/0035`) the next morning and
came back with seven pieces of feedback across Node 1, Node 6/7, Node 8,
Node 10, and the dev console. This doc records what changed and the calls
made along the way — same house rule as 0035.

## Node 1 (the zone/tile-match node)

**Element names now open their own description**, e.g. "Cliff edge: The
boundary between safety and the unknown, crossed without hesitation." —
applied wherever that element's text appears (all four zone rounds plus the
tile-match pairs), and skipped for `uranus`, whose text already opened with
its own name.

**The tile-match round split into two 3-pair rounds** instead of one 6-pair
round — grouped the same way the two "full" zone rounds already group these
six elements (cliff/raised_hand/rising_sun, then uranus/crescent_moon/
night_sky), rather than an arbitrary split. Its tile images now show
`object-fit: contain` on a square box instead of `cover` — the crop was
cutting into square element art to force it into a short rectangle.

**The whole node moved from 1st to 5th**, per Simon's exact instruction ("2,
3, 4, 5, 1, 6" against the old order) — it's too abstract a mechanic for a
learner's very first node. `data/v2/fool_section.json`'s node order changed;
`app/v2/page.js`'s `LABELS.fool` array changed to match. Round-level
`"tutorial": true` flags travel with the round data, not a hardcoded node
index, so the zone tutorial still plays correctly in its new 5th-node slot
with no extra work.

## Node 6 vs Node 7 — a numbering mismatch, resolved by content

Simon described "Node 6" as having "spontaneity, intuition, play" as the
correct triad in every round. The node matching that description exactly is
actually **Node 7** ("Spontaneity mastery") — Node 6 ("Trickier
confusables") already varies its triad per round. Content took precedence
over the stated number; **Node 7's five rounds now each draw a different
three-word combination** from the section's seven keywords, reusing the same
five wrong-word tiers already authored (only the correct triad changed).

## Node 8 (first cloze node)

**Layout**: the card now shows at the top (a smaller crop than the
drag-onto-card rounds' — `.cloze-reference-card`, 108px vs 166px — since here
it's a reminder, not the target), the sentence sits in the middle via a
second pair of spacers, and its font is 21px, +25% over the original 17px.

**A first-appearance tutorial**, mirroring the keyword/zone rounds':
`tutorial-ghost.jsx` gained a `targetRef` option (a ref, or ref-shaped object
with a live `.current` getter) alongside its existing `targetRect`/`cardRef`
pair, since a cloze blank isn't a fraction of a card — it's just its own DOM
node. The demo drags whichever bank word answers the blank named "new
cycle" (Node 8 Round 1 has one, and it's the word Simon named when he asked
for this) — falls back to the first blank if a future round doesn't.

**The reported drag bug — three real, stacked causes, not one:**
1. An *empty* `.cloze-blank` (before any word lands) had no content to give
   it a real line height, so its actual hit-tested box was ~6px tall — a
   sliver well short of the ~30px gap it visually reads as in the sentence.
   Fixed with `min-height: 30px`; an empty inline-block's baseline is its
   own bottom edge, so this grows the box upward without moving the dashed
   underline itself. Also added ±18px of hit-test padding past even that
   real box, matching how much smaller a sentence blank is than the other
   two round types' drop targets (a whole card, or a card zone).
2. None of the three drag-chip components (`drag-chip.jsx`, `zone-chip.jsx`,
   the cloze player's own `BankChip`) called `event.preventDefault()` on
   pointerdown, and `.chip` had no `user-select: none`. On a real touch
   press, the browser can read that as "select this text" instead of "start
   a drag" — confirmed by reproducing it in this session's own touch-emulated
   browser pane, where a drag attempt landed as a text selection instead of
   a chip drag, on *any* chip type, not just cloze's. Both are fixed now,
   globally, on `.chip`.
3. `tutorial-ghost.jsx` measured its start/end positions synchronously on
   mount, before the reference-card's `<img>` necessarily finished loading —
   a still-loading image means the page is shorter than its final layout,
   so the whole first 4200ms loop can play out over stale, pre-reflow
   coordinates. Only affects the demo's own visual path, not the real drag
   hit-testing, but it's the same class of bug as (1) and worth closing
   while in this file: it now waits for any incomplete `document.images` to
   load once before its first measurement; every later loop already
   re-measures fresh regardless.

None of these three individually was necessarily *the* bug Simon hit, but
each is independently real and each would produce exactly "I tried a few
times and it didn't work" on a touchscreen. Fixing all three rather than
guessing which one was load-bearing seemed like the right call given he
can't be asked which reproduction he saw.

## Node 10 (choice round)

**Switched from tap-one-of-four to drag-onto-the-card**, matching every
other round type, per Simon's instruction. Reuses `drag-chip.jsx`'s
`DragChip` directly rather than writing a parallel implementation — a wrong
drop already gets the exact same card-flash-and-shake reject every keyword
round has for free. `DragChip` gained one new optional prop, `long`, since
choice options are full sentences rather than keywords: it adds an
`is-long` class (`max-width: 260px; text-align: left; white-space: normal`)
copying `.zone-chip`'s own wrap treatment for phrase-length text, rather
than duplicating that CSS under a new name. The old tap-based
`.choice-options`/`.choice-option` CSS is gone; the shake keyframe they used
stayed, since `tile-match-player.jsx`'s wrong-pair reject also uses it.

## Dev console: skip without completing

Added `‹`/`›` buttons flanking the DEV FAB, visible only while a node is on
screen. `NodeSession` and `DevConsole` don't share a React tree (the console
mounts once at the root layout; a node session mounts per route), so
`lib/dev-console-bridge.js` is a minimal pub/sub connecting them: the
session registers `{onNext, onPrev}` on mount, the console subscribes and
shows the buttons only when handlers exist. Skipping mirrors the real
`handleRoundDone` stage transitions (main → bridge → review → complete)
without recording a miss or requiring a real drag/tap — it does not cross
into an adjacent node, matching Simon's own scoping ("skip … a node").

## Three more live requests, same session

**Cloze card shrunk again, to 83px** (half of `.drag-reference-card`'s own
166px, per Simon's exact "50%" instruction) — the first pass at a smaller
cloze card (108px) never actually rendered at that size: its CSS selector
had one class fewer than the 166px rule it was trying to override, so it
silently lost the specificity fight the whole time Simon was looking at it.
Fixed the selector and sized off the real 166px baseline he'd actually been
seeing, not the phantom 108px.

**A correct cloze drop now shimmers the word and the card together** — one
light-sweep animation (`.is-shimmering`, generic enough for any element to
take it) triggered on both the just-filled blank and the reference-art image
at once, so the reward reads across the whole exercise rather than just the
blank in isolation.

**Every round type's top-of-screen instruction line is gone** — "Drag the
word that is the best fit onto the card," "Match each part of the card to
what it means," and so on, across `round-player.jsx`, `zone-round-player.jsx`,
`cloze-round-player.jsx`, and `tile-match-player.jsx`. Kept
`choice-round-player.jsx`'s own `<p className="prompt">` alone: unlike the
others, its text is round-specific content — the actual question being
asked ("Which of these is true of this card?") — not a static how-to-drag
instruction, and removing it would leave that round with no indication of
what it's asking. Simon's instruction said "call to action text," which
reads as the imperative how-to lines, not a question the exercise depends
on; worth a second look if that wasn't the intent.

## v2 path screen: chunky icons, sparkle, companion card

Follow-up spec (`v2_path_icon_refinements.md`, not checked in) replacing
`app/v2/page.js`'s per-node `circleForKey` photo with four bold glyph shapes
keyed off `node.rounds?.[0]?.type` (zone→hex, cloze→square, choice→oct, else
circle), dropping the "Node N" sub-label entirely, adding a twinkling
sparkle field over the current node, and one floating, tappable companion
card per section (the real card art, not the round crop) tucked into
whichever side that section's early nodes bend away from.

**"Current" is a placeholder, not real progress.** v2 deliberately tracks no
progress at all (`0037`) — every node is a plain reachable link, nothing is
locked, nothing is marked done. The spec's `.is-locked`/`.is-done`/
`.is-current` states assume a progress model, which doesn't exist yet.
Rather than build one (out of scope for an icon-and-motion pass) or drop the
states, I hardcoded the very first node of the very first section as
"current" — CSS/markup for all three states is in place and correct, but
`is-locked`/`is-done` never actually trigger today. The moment v2 tracks any
real progress, this should read off that instead of the hardcoded index.

**The companion card's tap-to-expand reuses `Inspector`**
(`components/lesson/options.jsx`) — the same fixed, full-viewport, tap- or
Back-button-to-dismiss overlay the deck's own image inspection already uses
elsewhere, rather than a new modal convention. Triggered on click rather
than `Inspector`'s usual callers' long-press, since the spec asked for a
plain tap.

**The 108px `.cloze-reference-card` specificity bug (above) turned out not
to be a one-off** — the companion card's own selector was written correctly
the first time only because I'd learned the lesson by then. Worth flagging
in case a future v2-scoped override needs to beat an existing 3-class rule
again: match or exceed its class count, or it silently loses.

## The companion card finds its own gap(s)

Two follow-up requests refined where the companion card sits, replacing the
first pass's guess (the section's very *first* node's own wind offset):

**Centered on the node the trail bends hardest around, measured, not
computed.** The point of "maximum horizontal space" is the node farthest
from center in that section's own stretch of the shared WIND cycle — that's
where the opposite side opens up the most. Rather than trust a row-height
formula (labels wrap to one or two lines depending on viewport width,
shifting every node below them), `app/v2/page.js` attaches a ref to that
peak node's own icon and measures its real `getBoundingClientRect()` after
mount and on resize, then positions the card's `top` from that.

**Two peaks, two cards.** The WIND cycle's two extremes, +62 and -62, both
land inside every section with 7+ nodes (all five here), which means "the
trail bends hardest" isn't a single point most of the time — it's a tie,
once on each side. Simon's call: render one companion card per tied peak
rather than picking one arbitrarily. `peaksForSection` returns every node
tying for that section's own maximum offset magnitude; each gets its own
card, ref, and measured position, keyed by `slug::localIndex` since a
section can now hold more than one.

## Icons: a second pass, delivered as a real component

A follow-up doc (`v2_icon_update_notes.md.pdf`) came with its own file,
`v2-node-icon.jsx`, replacing the inline glyph snippets from the first icon
pass. Dropped in as `components/lesson-v2/v2-node-icon.jsx` and imported
into `app/v2/page.js` unmodified. Two changes from the first pass:

**Keyword (circle) nodes get three icons, not one** — `pairs` (two blocks
reaching for each other), `six` (a 2×3 grid, the first six-word round in a
section), and `difficult` (two overlapping blocks, every six-word round
after that). `makeKeywordVariantTracker()` is created fresh per section and
threaded through that section's own node loop in order, exactly as the doc
specified — sharing one tracker across sections would make the second
section's first six-word node wrongly come back `difficult`.

**Colour collapses to two states.** Locked and current are now both the
same flat grey (`#2b2b30` tile, `#8f8f99` icon) with no colour anywhere;
only `is-done` inverts to the accent fill. "Current" is now signalled
purely by size, ring, and the sparkle field — Simon's call after seeing the
accent-coloured ring rendered and deciding it read as one signal too many.

## The recap round: no card, smaller type

Node 8's closing round strings all four of its earlier sentences into one
12-blank paragraph — at the base 21px font plus its full-size card, this
genuinely ran off the bottom of the screen, word bank included, matching
Simon's "make it all fit" report exactly (he called it "the last node of
the fill in blanks"; the overflow is really this round specifically, the
last one inside Node 8 — its other four rounds, and all of Node 9's, are
short single-paragraph sentences that already fit). Rather than hardcode
this to Node 8, `ClozeRoundPlayer` detects it structurally —
`round.blanks.length > RECAP_BLANK_THRESHOLD` (6) — so any future card's own
recap round gets the same treatment automatically: no reference card at all,
sentence font down to 14px, and its blanks a little narrower to match.
Confirmed the drag mechanic (including the earlier hit-test/touch fixes)
still works correctly at the smaller scale, and that the round now fits the
viewport exactly with no scrolling needed.

## Known gaps, honestly

The three Node 8 drag fixes are defensive/plausible rather than confirmed
against Simon's exact repro — I couldn't get a real touchscreen to test
against, only this session's own touch-emulated browser pane, which
reproduced cause (2) directly but couldn't confirm (1) or (3) were what he
personally hit. Worth watching if he reports it again.

Node 7's identification by content instead of stated number is a judgment
call, not a certainty — if Simon actually meant literal Node 6, its varied
distractor tiers are untouched and still stand as originally authored.
