# 0020 — Cards render at one canonical ratio

**Date:** 2026-08-29
**Status:** Accepted

## Context

Trimming the export borders in [0019] exposed a second inconsistency it did
not cause. The masters do not share a shape. 61 of 78 are exactly 813×1456
and a 62nd matches their ratio of 0.5584 within 0.25%. The other 16 run up to
0.7037 (`minor_cups_06`, 924×1313), 26.0% squatter than the norm, with heights
that are not 1456 at all: 1313, 1400, 1417, 1318, 1372, 1253. That reads as a
separate export batch rather than gradual drift.

`.complete-card` pins width to 172px and lets height follow the file. So those
16 drew at 245px against the deck's 308px, and the title, keywords and button
below them rose by 63px. Paging through a section, the card box changed shape
underfoot.

## Decision

Fix the shape in presentation, not in the files. `--card-ratio: 813 / 1456`
is now a token in `globals.css`; `.complete-card` sets
`aspect-ratio: var(--card-ratio)` and its image `object-fit: cover`. Every
full card draws at 172×308 regardless of what its file measures. The rule is
written up as §10 of the UX style guide, alongside §9's rule about card size —
size and shape being the same kind of cross-cutting concern.

## Why not normalise the PNGs

Three ways to make a 0.7037 file into 0.5584, all destructive:

- **crop** — 20.5% off `minor_cups_06`'s width, 12–19% off five others,
  permanently, on an app where the illustration *is* the lesson content
- **squash** — distorts the figures
- **pad** — reintroduces the border 0019 just removed

A display-time fix costs the same 16 cards roughly 22px a side on screen, is
reversible, and leaves the art intact. The genuinely correct fix is to
re-export those 16 from source at the canonical size, which would remove even
the display crop; that needs the source files, which the repo does not carry.

## Consequences

- The 62 conforming cards are unchanged — same 308px box, same pixels.
- The 16 outliers are zoomed about 20% and cropped at the sides. This was
  compared against the current rendering before adopting; the tighter framing
  reads as more consistent with the deck, but it is a real change and the
  reason is recorded here rather than left to be discovered.
- Reverting is two lines: drop the `aspect-ratio` declaration and restore
  `.complete-card img` to `width: 100%; display: block;`.

## Not done here

`.reference-art` sizes cards with `width: 100%` and `max-height: 33dvh` and
sets no `object-fit`. When that cap binds the image is *distorted*, not
cropped — a pre-existing bug independent of the outlier cards. It should adopt
`--card-ratio` too, but the screens that use it were not reviewed in this
change, and changing a layout unseen is how a fix becomes a regression.
