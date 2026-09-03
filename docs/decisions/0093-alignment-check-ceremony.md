# 0093: Alignment Check gets an opening and closing ceremony

## Brief

Simon: an intro screen for Alignment Check nodes - the card shining and
shimmering, stars and planets rotating around it and ending up in a line,
then "Alignment Check" in a cosmic font with a funny, card-specific pun
subheading about being about to get tested ("See how much of a Fool you
really are"), light-hearted and whimsical. A matching resolution step at
the end declaring the reader ready to proceed. Explicitly asked for a test
animation on one card first, to approve before it rolls out to all 22.

## What this is

A pilot, gated to The Fool only (`ALIGNMENT_CEREMONY_CARDS` in
`app/v4/play/[section]/[node]/page.js`), not yet applied to the other 21
cards' own Alignment Check nodes - those keep the plain `NodeSession` with
no ceremony, exactly as before, until this is approved.

Three new components in `components/lesson-v2/`:
- `alignment-check-intro.jsx` - the opening screen. Three stars (the exact
  sparkle path and size/opacity ramp from `v2-node-icon.jsx`'s own "align"
  icon, 0089) and two decorative planets swirl out from the card and
  settle into the same three-star line that icon promises, the card
  itself shimmers once early and again with a bigger glimmer right when
  the stars finish settling, then the title and a per-card pun fade in.
  Tapping anywhere skips straight to the fully-settled state, the same
  "never trap an impatient user in a cutscene" rule `chapter-player.jsx`'s
  shimmer-skip and `unit-complete-celebration.jsx`'s wait-skip both follow.
- `alignment-check-outro.jsx` - the resolution screen. Same three stars,
  already settled (no swirl - it opens already "aligned"), the same
  glimmer plays once on mount, title "Aligned.", a per-card line declaring
  readiness, and the node's own real `nextHref`/`nextLabel`.
- `alignment-check-session.jsx` - thin wrapper: shows the intro, then on
  "Begin" mounts the actual `NodeSession` (completely unchanged rounds),
  swapping in the outro as `NodeSession`'s own `renderComplete` override
  in place of the generic `NodeCompleteCelebration` - one ceremony at the
  end, not two celebrations stacked.

`alignment-check-shared.jsx` holds the three stars' shared coordinates and
the sparkle SVG, so the intro's ending pose and the outro's opening pose
can't drift apart into two different-looking "lines."

`node-session.jsx` gained one new optional prop, `renderComplete` -
`({nextHref, nextLabel}) => ReactNode`, replacing the default complete-
stage block entirely when supplied. Every existing caller (v1/v2/v3/v4's
other nodes) passes nothing and is unaffected.

## Per-card puns

`INTRO_LINES`/`OUTRO_LINES` (in the intro/outro components respectively)
are TEST_ONLY maps with exactly one entry each (Fool). Every other card
falls back to a generic line. Writing genuinely funny, card-specific pairs
for the other 21 - in the same voice as `node-complete-celebration.jsx`'s
own `CARD_AFFIRMATIONS` pools - is follow-up work once the animation
itself is approved, not part of this pilot.

## Verification

Played the Fool's own Alignment Check live end to end: intro swirls and
settles correctly, tap-to-skip snaps straight to the settled state with no
mid-flight jump, the six rounds underneath play exactly as before, the
outro shows the same settled line and a working "Back to Path" link.
`npm run build` passes. Every other card's own Alignment Check node
checked unaffected (still the plain `NodeSession` + generic celebration).

## Addendum: the shimmer never actually rendered, and the card now grows into place

Simon: couldn't see the shimmer at all - and separately asked for the card
to start at 20% size and grow (wobbling, shimmering) to full size over the
same stretch the stars take to swirl and land, with the payoff glimmer
following 0.5s after they settle.

The "couldn't see it" report turned up a real bug: both shimmer classes
had been applied straight to the `<img>` element, but `::before`/`::after`
generated content doesn't render on replaced elements (`<img>`, `<input>`)
in any browser - the CSS was correct, it just had nothing to attach to.
Fixed by wrapping the art in a `<div className="alignment-ceremony-art-
frame">` and moving every animation/shimmer/glow rule onto that wrapper;
the `<img>` itself is now just a plain, unstyled fill.

That wrapper is also where the new grow-and-wobble entrance lives
(`is-entering`, `alignment-card-grow`): scale 0.2 → 1 with a decaying
rotation wobble, timed to the exact same 2360ms the star swirl
(`alignment-star-swirl`, 2000ms + up to 360ms of per-star stagger) takes to
land, so the card and the stars finish together. Its own shimmer sweeps
across it four times over that same 2360ms (590ms × 4), reusing the
generic `.is-shimmering` gradient. The payoff glimmer (`is-aligned-
glimmer`, unchanged in substance from the first cut) now actually renders
now that it's on the frame - `animation-delay: 500ms` still holds it back
until half a second after the stars settle. The outro keeps its own quick
plain fade-in (`is-fading-in`) rather than the grow - it opens already
aligned, there's no swirl for a growth to sync against.

Verified via `getComputedStyle` at two points after a fresh navigation:
immediately on mount (`is-entering`, `transform: scale(0.2)`, `::after`
mid-sweep) and after the reveal timeout (`is-aligned-glimmer`, `::after`
running `shimmer-sweep-wide`) - confirming the glimmer that silently did
nothing before now genuinely animates. A mid-flight screenshot shows the
card visibly smaller, wobbled off-axis, and mid-shimmer while the stars
and planets are still swirling. `npm run build` passes.

## Rollout: all 22 cards

Simon approved the animation and asked for it on every Alignment Check
node. Removed `ALIGNMENT_CEREMONY_CARDS` from `app/v4/play/[section]/
[node]/page.js` entirely - the capstone branch always renders
`AlignmentCheckSession` now, no gate.

`INTRO_LINES`/`OUTRO_LINES` grew from one entry each to all 22, one pun
per major grounded in that card's own reading notes
(`data_card_talking_points.csv`), in the same spirit as `node-complete-
celebration.jsx`'s own `CARD_AFFIRMATIONS` - light, a little silly, never
inventing content the source guidebook doesn't support. The generic
fallback line stays in both files as a defensive default (nothing outside
the 22 majors calls into an Alignment Check node, but the map lookup
degrading gracefully instead of rendering `undefined` costs nothing).

Verified live on The World and The Devil (opposite ends of the deck's own
tone) - both playing icon-accurate, correctly punned. Restarted the dev
server once mid-check after a stale Turbopack module graph threw a
`ReferenceError` for the just-removed `ALIGNMENT_CEREMONY_CARDS` on one
request; a fresh browser tab and a from-scratch `npm run build` both
confirmed the actual source was already correct - a dev-server caching
artifact, not a real bug.
