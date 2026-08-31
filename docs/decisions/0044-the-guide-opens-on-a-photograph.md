# 0044 — The Guide opens on a photograph

**Date:** 2026-08-31
**Status:** Accepted

## Context

The Guide's opening screen was the reader portrait, one sentence and a button,
with roughly 350px of nothing underneath. Tia asked for it to be prettied up and
for the reader art to be replaced with a photograph of hands squaring a deck
over a fanned spread.

## The art

`assets/misc/guide_hands_MASTER.jpg` is the master, 929x1536.
`scripts/make_guide_hero.mjs` derives the crop, per the same rule as the card
circles, the avatars and the reader portrait: generated, never hand-edited.

The crop is 5:4 from y=520, which frames the hands and the fan and drops the
chest above and the candle below. Landscape rather than the 2:3 the reader
portrait uses, and the ratio was measured rather than chosen: a square crop is
375px tall at phone width, which put the Start reading button 84px *below* the
tab bar on a 375x812 phone. 5:4 is 300px and leaves an 11px gap. Same complaint
the Reading tab's draw button collected earlier the same day, caught before it
shipped this time.

The reader portrait is still used by nothing now the Guide has its own art. It
stays in `assets/misc/` rather than being deleted: it is the character Tia had
made, and `0032` moved it here in the first place.

## The screen

Three changes, in order of how much they do.

**The photograph carries the top.** It bleeds out through `.shell`'s 22px
padding to the frame edges, which makes it the only full-bleed image in the app,
and it fades out at the bottom through a `mask-image` gradient rather than
ending on a hard horizontal edge. The heading then sits *on* the faded part of
the picture instead of under it. A rounded rectangle with a glow, which is what
the reader portrait is, reads as an illustration placed on a screen; a bled
photograph reads as the screen.

**Three steps carry the middle.** `Pull`, `Scan`, `Read`, numbered, one line of
explanation each. This is the better use of the 350px than padding, because the
flow is genuinely unusual: you lay your own cards out on a table and then
photograph them, and no other screen in this app asks anything like that. Saying
so before someone starts is worth more than a second decorative element.

**The button ends up above the fold**, which is the whole reason the ratio and
the step padding are the numbers they are.

## Note

`scripts/copy-assets.mjs` mirrors all of `assets/` into `public/assets/`, which
means every `_MASTER` file is served: the 78 card masters, `reader_MASTER.webp`
at 1.7MB, and now `guide_hands_MASTER.jpg`. That is on the order of 15MB of
originals shipped in a build to serve derivatives nobody asks for by that name.
Pre-existing, out of scope here, and worth a pass of its own.
