# 0019 — The card masters carry a white bleed strip, cropped at render

**Date:** 2026-08-29
**Status:** Accepted

## Context

Tia, on the A2 screen: *"this screen looks janky"*. Four faults, stacked.

**The card art was cut off.** Not by CSS: every one of the 78 masters in
`assets/cards/master/` carries a solid white strip down its right edge, 24 to
27 pixels of an 840-pixel-wide export, measured across the whole set. Framed by
`.reference-art`'s rounded corners it reads as a rendering fault rather than as
part of the picture.

**The card sat hard against the left.** `.reference-art` is a `<button>` set to
`display: block`, which shrink-wraps to the image it contains, so the parent's
`text-align: center` had nothing to act on — while `.reference-name` below it,
being text, centred normally. Card left, name centred, options full width.
Nothing was broken enough to fail a check; it just looked wrong.

**The fourth option ghosted through the footer.** The footer's gradient is
`var(--ink) 66%` upward, and the button sits from 20% to 82% of the footer's
height — so its top half floats over the translucent part, and an option
scrolled underneath showed through it as grey text behind the word "Check".

**And four sentences plus a 33dvh card do not fit.** At the full reference size
the last option started below the fold on every screen size tested.

## Decision

The masters are the artist's source files, not derived art, so they are not
rewritten here. The strip is cropped at render:

```css
img[src*="/cards/master/"] { aspect-ratio: 813 / 1456; object-fit: cover; object-position: left center; }
```

813 is 840 less the widest strip found, so the narrowest-stripped cards lose at
most 3px of real art.

`.reference-art` gets `margin-inline: auto`. The footer's gradient goes opaque
to 82%, clearing the button. And `Reference` takes a `compact` flag, set
whenever the candidates are text: four sentences need the room, four card
images are being compared to each other and keep the large reference.

## Consequences

**The source exports are still wrong, and this only patches the app's own
`<img>` tags.** The derived circle crops in `assets/cards/circle/` are cut from
the masters and carry the same strip — 36 white pixels across the centre row of
The Fool's — so the path's node circles show it and this rule cannot reach
them. The proper fix is upstream: re-export the masters without the bleed, then
rerun `scripts/script_make_path_circles.py` and `script_make_avatars.py`. Worth
doing before launch, and worth a `check_data.py` rule that fails on a white
column at a master's edge.

**A phone still scrolls on the longest A2 rounds.** With the compact reference,
node 2 fits whole at 390px; later cards whose openers run to three lines each
leave the fourth option below the fold. That is a legitimate scroll now that
the footer no longer ghosts, but it means the learner can answer without having
seen every option, and the honest fix is fewer or shorter options rather than
more compression.

**Image-option rounds have the same overlap, untouched.** Four card images at
184×315 cannot fit above the footer on a phone, so the bottom row is half
covered. Sizing them to the available height would put them near 107px wide —
small, though they are tap-to-inspect. Left alone deliberately: it is a design
call, not a bug fix.
