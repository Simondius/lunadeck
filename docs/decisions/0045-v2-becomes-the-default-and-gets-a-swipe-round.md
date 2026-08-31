# 0045 — v2 becomes the default path, and gets a sixth round type

**Date:** 2026-08-31
**Status:** Accepted

## v2 is the default curriculum now

Simon's explicit call, plain and simple: `/` used to render v1's real
curriculum (`components/path-screen.jsx`, driven by `data_curriculum_nodes.csv`);
it now renders v2's own path instead. The original curriculum moved to
`/v1`, reachable only from the dev console's Content menu — the exact
inverse of how this worked as of `0028`/`0037`.

**Implementation is a re-export, not a duplicate.** `app/page.js` is now
`export { default } from "./v2/page";` — one component, two routes (`/` and
`/v2` both render it), rather than copying v2's path screen into two files
that could drift apart. `app/v1/page.js` is the old `app/page.js`, moved
verbatim; nothing about how it works changed, only where it lives.
`components/tabbar.jsx` needed no change — its Path tab already links to
`/`, and its active-tab check already matches on that path exactly.

**The dev console's "v2" menu item is gone**; "v1" now points at `/v1`
instead of `/`. Simon only asked for a way back to the old curriculum, and
the tab bar's own Path tab already reaches the new default — a second
button that also goes there was redundant.

**v2's own header copy changed** (`app/v2/page.js`) — it used to call itself
"Alternative path (v2)... Experimental — dev console only," which was
accurate as of `0035`, but false the moment this shipped. It now reads "The
Path," with a note that the old curriculum lives on at dev console → v1.

## The companion card could overlap a section's own header

Found while testing the routing change: on a section where the trail's peak
node sits very close to the top of its own node list (Empress, notably —
no zone node, so its whole sequence starts differently placed in the shared
WIND cycle than the other four cards), the measured `top` for the companion
card came out negative, pushing it up past `.v2-section-trail`'s own top
edge and over the collapsible header button above it. Clamped to a 4px
floor in `app/v2/page.js`'s own measurement effect — the card can still sit
near the top of a short section, just never above it.

## A sixth round type: "Does it match?"

New spec (`v2_swipe_lesson_spec.md`, not checked in), landing after each
section's last keyword node and before its first cloze node — nodes 8-10
for Fool/Lovers/Magician/Emperor, 7-9 for Empress (its own one-node-behind
offset, unchanged since `0035`). Three rounds per card (obvious / harder /
difficult distractor tiers, same ladder every other v2 round type climbs),
each a flat 4-real/4-distractor split, full content transcribed from the
spec into `data/v2/*_section.json`.

**The mechanic**: full-bleed greyscale card art behind a stack of
playing-card-shaped phrase chips. Swipe left (or tap the tick) to claim "this
matches," right (or tap the cross) for "it doesn't." Built as
`components/lesson-v2/swipe-round-player.jsx`, registered in
`node-session.jsx`'s `PLAYERS` map exactly like every other round type.

**Genuinely true randomization, not `seededShuffle`.** Every other v2 round
shuffles with `seededShuffle(round.id)` — same round, same order, every
time, including a missed-round replay, which is what makes those replays
reproducible for debugging. The swipe spec explicitly calls this out as
wrong for itself: "content should be randomised each time. Even if the
lesson is being repeated after a failure, the cards should be presented
randomly." `swipe-round-player.jsx` uses a plain `Math.random()`
Fisher-Yates instead, a deliberate, spec-directed exception to the shared
convention, not an oversight.

**Two layers of "look at this again," not one.** The spec asks for the
round's own internal second look — once the full 8-card deck's been played,
if anything was missed, replay just those, same "asked once more, never a
third time" rule `0038`'s node-level review already follows — *and* for the
round to still report `onDone({missed: true})` afterward, "same contract
every other v2 node already implements." Taken literally, this means a
round with a miss gets a second look twice: once inside the round itself,
then again at the node's own bridge screen once every round in the node has
played (each swipe node holds exactly one round, so this doubles up
completely). Verified this actually happens, end to end, rather than
assuming the spec meant only one or the other — it's what was asked for,
even though it reads as a lot of "try that again" for a single miss.

**A real bug, not just a new one: `Math.random()` inside `useState`'s lazy
initializer breaks hydration.** The first version called
`shuffleTrueRandom(round.cards)` (and a per-chip random entry rotation)
directly in `useState(() => …)`, which runs during the very first render —
including the server-rendered one. The server and the client each rolled
their own random order, React caught the mismatch, and the whole tree
re-rendered from scratch client-side. Fixed the same way
`dev-console.jsx`'s own remembered position already handles this exact
class of problem: state starts `null` through the server render and first
client paint, and the real shuffled deck arrives a tick later from a
`useEffect` that only ever runs in the browser. `SwipeChip` sidesteps the
same trap for free — the parent gives it a fresh `key` per card, so it
never survives past its own first client-only mount to begin with.

**WAAPI animations and CSS custom properties fighting over the same
property, twice.** `.swipe-chip`'s resting position is
`translate(calc(-50% + var(--dx)), -50%) rotate(var(--rot))` — centered,
then offset by drag. Both the entrance drop and the resolve fly-off
animate `transform` directly via the Web Animations API, which means every
keyframe in both had to carry that same `-50%,-50%` centering term or the
chip would visibly jump to its unpositioned top-left corner for the
animation's duration. The entrance animation additionally calls
`animation.cancel()` in its own `onfinish` — a WAAPI animation's finished
frame otherwise keeps overriding the CSS rule indefinitely once fill mode
applies, which would have silently frozen the chip's rotation and blocked
dragging from working afterward.

**Sizing went through three passes live** — the first cut followed the
spec's own words ("small," "playing-card ratio") loosely and came out
screen-filling (`min(78%, 320px)`); Simon brought it down to a quarter of
that, then back up 2x from there, landing at `min(39%, 160px)`. Padding and
font scaled down and back up alongside it, though not by the same factors
each time — a literal quarter of the original 19px font is unreadable, so
each pass stopped at whatever stayed legible rather than following the
ratio exactly. A light emboss (a soft radial highlight instead of a flat
fill, plus inset light/dark edges and a thin warm-toned inner border) was
added at the same time, for the "old tarot deck" look Simon asked for.

**A new path icon, same conventions as the first two icon passes**:
`shapeForNode` in `components/lesson-v2/v2-node-icon.jsx` returns `"swipe"`
for this round type, rendered as a tick chip and a cross chip side by side,
inside a plain rounded-square badge (`.v2-shape-swipe`) — a genuinely new
outer silhouette, not reused from hex/square/oct, so all six mechanics
stay visually distinct on the path at a glance.

## The swipe round's feedback, after playing it for real

The first pass resolved every swipe the same way regardless of whether it
was right — chip flies off in the swiped direction either way, with only
the wash color hinting at correctness mid-drag and nothing at all for a tap
via the tick/cross buttons. Simon's own testing caught this immediately:
no real feedback, and the controls sat far enough apart (pinned to the
stage's own left/right edges) that the tick-left/cross-right mapping wasn't
obvious without already knowing it.

**Correct now burns**: `spawnBurst()` scatters 16 small gold/silver spark
elements outward from the chip's own position at the moment it resolves —
plain DOM spans, WAAPI-animated on random angles/distances, each removing
itself on its own `animationend` rather than living in React state (there
can be several bursts in flight if someone swipes fast, which one piece of
state couldn't represent). The chip itself brightens and desaturates
through the burn before fading, rather than flying anywhere.

**Wrong now shakes and settles, not flies off**: a red flash on the same
`::after` wash pseudo-element the drag already uses, plus a translateX
wobble that ends back at center — "bounce back," literally, not an exit in
the swiped direction. Still counts as a miss and still advances to the
next card afterward; only the visual changed, not the scoring.

**Both animations carry the drag's own release position in their first
keyframe** (`startTransform`, built from `dragOffset`) rather than starting
flat, since a swipe that resolves via drag-past-threshold releases from
wherever the finger was, not from dead center — starting the burn or shake
from center instead would have visibly snapped the chip before either
animation even began.

**Tick/cross moved to the center, directly under the card**, and are
colored green/red at rest now instead of only once dragged past the commit
threshold — both changes in service of the same thing Simon asked for:
which side means what should be obvious before anyone touches the card,
not something spread across two edges of the screen to discover mid-drag.

**The background art dropped its greyscale filter** and shows in full
color — the original spec called for greyscale deliberately, but Simon's
call after seeing it played was that color read better in practice.

## Wrong now blocks; correct now leaves properly

A further round of live feedback changed what "wrong" actually does, not
just how it looks:

**A miss no longer advances the deck.** The card shakes longer than before
(900ms, more oscillations), flashes red, and settles back at its own
resting position — but stays `current`. The learner has to answer it
correctly to move past it; wrong attempts can repeat as many times as it
takes. `SwipeChip` no longer remounts on a miss (the parent's `queue`
doesn't change), so its own local state — `entryRotation` especially —
survives across retries, which is what lets the shake settle back to
*that* card's own resting tilt instead of a generic zero. A `busy` prop
(the parent's `resolving` flag) disables the tick/cross buttons and
dragging for the shake's own duration, so a second attempt can't queue up
underneath it.

**Only the first wrong attempt on a card counts as a miss for the round's
own review pass** — `loggedMissRef` (a `Set` of `listKey`s) makes sure
failing the same card three times before finally getting it right doesn't
queue it for replay three times over. It still gets the one second look
its actual miss earned it, same as any other card.

**The success animation stopped snapping to center first.** It used to
settle at the middle of the screen before glimmering and fading in place;
now it keeps drifting toward whichever side was swiped the entire time —
glimmer, then the outside-in disintegration, all while still travelling.
Resolving via a tap (not a drag) still gets the same drift, just starting
from a standstill at center rather than wherever a release left it.

**The disintegration itself is a `clip-path: circle()` shrinking from
150% down to 0%**, animated via WAAPI alongside the existing
brightness/saturation burn and the perimeter dust burst — eating the card
away from its own edges inward rather than a flat opacity fade, which is
what "from the outside in" actually needed. A brightness spike (a
"glimmer") plays first, while the circle is still fully open, before the
shrink starts.

## Cloze picked up five fixes of its own

Separate feedback, same session, on `cloze-round-player.jsx`:

**A real bug: dropping onto an already-filled blank read as wrong.**
`BankChip`'s hit test walked every blank in `blankRefs` and only checked
whether the *dropped word's* `blankKey` matched — it never checked whether
the blank it landed in was already taken. A word dropped on top of an
already-filled blank triggered the same reject shake and `missedRef` bump
as a genuinely wrong drop. Fixed by skipping any blank with `.is-filled` in
the hit-test loop entirely, so a filled blank isn't a *wrong* target, it's
no target at all — same as missing the sentence completely.

**The small reference card is tappable now**, reusing `Inspector`
(`components/lesson/options.jsx`) exactly the way the path screen's
companion card already does — same overlay, same dismiss, no new pattern.

**A full-bleed, greyed card sits behind the whole exercise now** —
`.cloze-bg`/`.cloze-bg-scrim`, the same idea as the swipe round's own
background but with a flat dark scrim rather than a top/bottom gradient,
since cloze's sentence text needs even legibility across the whole screen,
not just clearance around a centered chip. `.session.is-drag-lesson` picked
up `position: relative` to anchor it — harmless for every other round type
that uses the same class, since nothing about position:relative changes
anything for a screen with no absolutely-positioned children of its own.

**Leftover distractors fade out one at a time as Continue appears**, 0.5s
apart per chip (`fadingDelay` on `BankChip`, applied as a plain
`transition-delay`) rather than everyone at once or not at all — they used
to just sit there, unused and unexplained, once the round was won.

**Continue is pinned to the bottom of the screen now**
(`.cloze-continue`, `position: absolute`, anchored past the tab bar) instead
of sitting inline in the chip row wherever the centering spacers happened
to land it — matches how `.swipe-continue` already anchors its own round's
Continue button.

## Known gaps, honestly

The reduced-motion fallback is a plain opacity fade-in on the new chip, not
a true two-element cross-fade (the old chip doesn't stay mounted to fade
out under it) — matches the spirit of "no flying or tilting," not the
letter of "cross-fade between chips," given the added complexity of
keeping two chips alive briefly wasn't worth it for an accessibility
fallback path.

The double review layer (round-internal, then node-level) hasn't been
weighed against just how much repetition it puts in front of a learner who
misses one card out of eight — it's exactly what both the spec and the
existing `0038` contract ask for taken together, but nobody's watched a
real person sit through it yet.

## Cloze, one more pass: bigger card, a completion shimmer

**The reference card is 50% bigger** (`125px` up from `83px`, same spot in
`.reference-art`'s width rule) — the compact card that sits above the
sentence was hard to make out at the old size once it was competing with
the new full-bleed background art behind it.

**The whole sentence shimmers once when the last blank lands correctly**,
not just the individual word that just landed — `sentenceRef` on
`.cloze-sentence`, fired from the same `stage === "ready"`
`useLayoutEffect` that already kicks off the chip fade-out, so it lines up
with "the round is won" rather than "a word fit." `shimmer()` picked up a
duration parameter (was hardcoded to `SHIMMER_MS`) written to a
`--shimmer-duration` custom property, since the per-word shimmer and the
sentence-wide one don't want the same timing.

That duration started at the per-word default and got tuned twice from
live feedback: first to 500ms to line up with the 0.5s-per-chip fade-out,
then — "make the shimmer slower and more visible" — up to 1400ms, with its
own `.cloze-sentence.is-shimmering::after` override widening the sweep
band and pushing its peak to solid white, rather than reusing the
per-word chip's narrower, dimmer gradient. A sweep that reads clearly on a
36px chip disappears against a full sentence of body text at the same
width and brightness.
