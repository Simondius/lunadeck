# 0050 — Story gets real art, animated beats, and a second chapter

**Date:** 31 Aug 2026
**Status:** Accepted

## Context

`0048` shipped Story mode with a CSS-gradient placeholder for its location
and no character portrait at all - both called out there as honest gaps.
Simon then supplied real art
(`public/assets/reading-scene-sketch-v2/`: two backgrounds, a table with a
gemstone circle and card deck, a pair of hands, and two characters - Dave
and Riley - each with four emotion states) and, over a single live
playtest pass, asked for the scene, the card reveal, and the dialogue
presentation to all be substantially reworked around it. This decision
records the shape that pass settled into.

## The scene itself

`chapter-player.jsx` composites five image layers inside `.story-stage`,
back to front: background, character, an opaque table backing, the table
line art, and the hands - plus a sixth, the one real tarot card, once a
`reveal` beat fires. The stage is deliberately light (`#e7e3da`), not this
app's usual near-black shell: the asset pack's own README calls its
line art "light grey, not black, so it sits back behind the black-line
table/characters/hands," and that only holds if what's behind *them* is
light too.

**The table needed a real backing, not just its own line art.** Two
separate fixes landed here. First, a 3D tilt
(`perspective(900px) rotateX(30deg)`, pivoting from the bottom edge) so
the table reads as a surface being looked down at rather than a card
propped upright facing the camera. Second, `.story-table-backing` - a
plain solid-color rectangle sharing the table's own footprint and tilt,
sitting directly behind the table's own (still-transparent-outside-its-
drawn-shape) line art. Without it, the tilt opened a gap at the table's
own top edge where the character showed through; the backing makes the
table read as opaque regardless of what's sketched into its PNG.

**The character shrank and moved off-center.** The first pass sized a
character to nearly fill the frame, centered - which, once revealed
cards started appearing large on the same stage, collided with them, and
even without a card read as sitting too close to be "across the table."
Both fixed by the same move: characters are now sized to a third of the
stage and pinned to one side (`.story-character-art`'s own `left: 30%`),
which also frees the *other* side for whatever's currently prominent.

**Which side is per-character, not per-scene.** `CHARACTER_SIDE` in
`chapter-player.jsx` maps `dave` to the left and `riley` to the right;
`mirrorFrame()` flips every position the reveal-card animation uses
(pile, prominent, resting) so the card always animates toward whichever
side that beat's character isn't sitting on. A `.is-side-right` CSS
modifier mirrors the character image and the speech bubble the same way.

## Dialogue moved onto the stage

The original build put every beat's text in a dark box below the stage,
identically for dialogue, reveals, and choices. Simon's review split
this by who's talking: a client's line now renders in
`.story-bubble`, an actual speech-bubble shape (tail included) anchored
near that character's own face, and the reader's own lines or scene
narration render as `.story-caption`, a translucent strip overlaid on
the stage itself rather than a box below it. The panel below the stage
(`.story-content`) is choices-only now - during a plain dialogue or
reveal beat it renders nothing at all, and the stage itself becomes the
tap target, with its own "Tap to continue" hint (a solid pill, not
light-on-transparent, since the stage under it is light rather than this
app's usual dark).

**Dismissing a bubble glimmers, not just vanishes** - `is-dismissing`
plays a 500ms brightness-spike-then-fade (`story-bubble-dismiss`,
the same shimmer-sweep instinct every chip success in this app already
uses) before the beat actually advances.

**The tab bar stays visible.** `components/tabbar.jsx`'s existing
"hide on any `/play/` route" rule now also exempts `/story`, the same
way it already exempted `/v2` - Simon wants the bar reachable while
iterating on this screen, matching v2's own precedent rather than v1/v3's
full-bleed one.

## The reveal is animated, not instant

A `reveal` beat's card now lifts off the pile, flips (`rotateY`), and
grows into a tall, full-height display on whichever side is clear -
`cardPhase` (`hidden → entering → shown → exiting → settled`) gates every
transition explicitly rather than inferring "is it safe to dismiss" from
whether an animation happens to still be running. That explicitness is
load-bearing: an earlier version shared one skip-listener between the
entrance and the exit, and a single tap could resolve the entrance *and*
be read as the tap that starts the exit, racing two Web Animations on the
same element. The entrance now always plays out in full (not
tap-skippable at all); only the exit is, and only once `cardPhase` is
already `"shown"`.

On dismissal the card shrinks to a small resting spot beside the pile and
stays there, visibly, for the rest of the chapter - until the chapter
itself ends, when a final fade (a fresh WAAPI animation, since a plain
style change wouldn't reliably override the settle animation's own
`fill: forwards` hold) takes it out. The reading is over when the chapter
is; nothing carries into whatever comes next.

## Two chapters, not one with a tacked-on ending

The original chapter ended with a narration beat handing off to Riley
inside the *same* file. Simon split that into its own chapter instead -
`data/story/chapter-02.json`, deliberately minimal (one narration beat:
"Riley settles into the chair Dave just left"), registered in
`data/story/chapters.js` alongside chapter one. `getNextChapter()` already
existed for this; the chapter-complete screen's button now genuinely
reads "Riley" rather than "Back to Story" once chapter one finishes.

Riley's actual script isn't written here - that's Simon's own to do, not
invented on her behalf. This doc doesn't narrate character or backstory
content for the same reason `0048`'s own equivalent section doesn't:
those are content decisions, and this file's job is the engineering
underneath them.

**Each chapter now carries a `character` field and a computed part
label.** `chapters.js` counts appearances per character in array order
and produces "Dave Part 1," "Riley Part 1," and so on - shown in the
Story index above each chapter's own title. Computed, not stored, so it
can't drift out of sync with a chapter's actual position if entries are
ever reordered or inserted.

## Choice text has a real ceiling, and the panel below centers itself

A choice option's text was, once, whatever length felt natural to write -
one ran to three-plus lines on screen. Simon set a hard limit, tuned live
in two passes: first the stage itself shrank to leave the panel below
more room and the ceiling was set at three lines, then both were dialed
back - stage back to full width, `.story-choice-option` still at the
smaller 13px it picked up along the way but `-webkit-line-clamp` settled
at **two**. The clamp is the actual technical ceiling either way: long
enough text truncates with an ellipsis rather than silently growing past
it, whatever the number.

`.story-content` (the panel below the stage) now also centers its own
contents vertically in whatever space is actually left below the stage
(`flex: 1; justify-content: center`), rather than sitting flush against
the stage's own bottom edge - a two-option choice and a four-option one
both read as "centered in the remaining space" now, not "top-anchored
right under the image."

The resting card (beside the pile, once a reveal beat's dismissed) is
2x the size it first settled at - `CARD_RESTING`'s width/height doubled,
its `top`/`left` adjusted to keep the same visual center rather than
just growing from its old top-left corner.

## Verified

`npm run build` succeeds across all routes, including both
`/story/play/chapter-01` and `/story/play/chapter-02`. Played chapter one
start to finish in a real browser: the bubble's glimmer-dismiss, a
deliberate wrong choice on both reaction types (anger and confusion
portraits actually swapping in), the reveal's full lift-flip-grow
sequence into its top-right display, the dismiss-and-settle beside the
pile, and the final fade as the chapter ends - landing on a button
correctly labelled "Riley." Loaded chapter two directly and confirmed she
renders mirrored (right side) with no card on the table. Confirmed the
tab bar stays visible throughout, unlike v1/v3's own lesson screens.

## Known gaps, honestly

Chapter two is one narration beat - a real chapter for Riley doesn't
exist yet. The bubble's anchor point is a fixed percentage per side, not
measured off the character image's actual face position, so a future
character whose face sits somewhere unusual in its own crop would need
its own tuning rather than working automatically. And the "3 lines max"
ceiling is enforced by `-webkit-line-clamp`, which silently truncates
with an ellipsis rather than failing loudly - a genuinely too-long option
would go unnoticed unless someone reads it back on screen, not caught by
`npm run build`.
