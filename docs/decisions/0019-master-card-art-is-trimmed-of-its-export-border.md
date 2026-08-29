# 0019 — Master card art is trimmed of its export border

**Date:** 2026-08-29
**Status:** Accepted

## Context

The teaching screen renders the full master card from `assets/cards/master/`.
On screen the cards showed a pale strip down the right-hand edge, and on a
handful of them a pale band along the bottom.

The rendering was not at fault. Measured in the browser, the `<img>` fills its
`.complete-card` container exactly — zero gap on any side, and the rendered
aspect ratio matches the file's native ratio to four decimal places. The
strips were inside the image files.

A pixel scan found blank border on **77 of the 78 masters**:

- **72 have a white column on the right.** 62 of those are exactly 27px; the
  rest run 4–26px. The near-uniformity of that 27px, across cards of several
  different canvas sizes, marks it as an export artifact rather than anything
  drawn on purpose.
- **8 have a blank band top or bottom**, 1–41px.
- One file is clean.

## The masters are JPEGs, not PNGs

Worth stating plainly, because it is surprising and it shaped everything
below: every file in `assets/cards/master/` is a **JPEG carrying a `.png`
extension**. Browsers sniff content rather than trusting the extension, so
nothing is broken, but two consequences matter.

First, it explains the borders' odd edges. They are not uniformly white:
`minor_cups_king`'s are grey (channel means 229.8 and 213.0), `minor_cups_06`
has a faintly blue-tinted row, and most borders fade into the artwork over a
pixel or two. That is JPEG ringing around a hard white-to-dark boundary, not
paint — and it is why a naive "is this pixel white" test kept leaving a line
behind.

Second, it dictates how the crop must be done. Re-saving these as real PNGs
takes the deck from **12.2 MB to 91.5 MB** — a 7.5× inflation for identical
pixels, which in a git repository is permanent. An earlier attempt at this
change did exactly that before it was caught.

## Decision

Crop the blank border off each affected master, in place, **losslessly**.

76 cards are cut with `jpegtran -crop`, which rewrites the existing DCT
coefficients without ever decoding the image. No re-encoding, no generation
loss, and the deck stays at 12.2 MB. JPEG can only do this when the crop's
top-left corner sits on an MCU boundary; every card here is trimmed from the
right and/or bottom only, so the offset is (0,0) and the constraint is met.

`minor_cups_king` is the one exception. It needs 1px off the left and 5px off
the top, which is not MCU-aligned, so it is re-encoded at quality 95 with the
original's 4:2:0 subsampling. One card, one generation of loss, recorded here
rather than left to be discovered.

Verified against the originals, comparing decoded pixels in the retained
region:

- **71 cards are byte-for-byte identical**
- **6 differ only in their single final row or column** — chroma upsampling at
  the trailing edge, since 4:2:0 chroma is half-resolution and the last line
  loses its partner after the cut. 0.02–0.08% of pixels, max delta 2–29 in one
  channel, coefficients untouched.
- **1 card** (`minor_cups_king`) is the re-encode above, PSNR 43.7 dB.

### The border test

A line (row or column) is border when, **taken as a whole**, it is
near-neutral — spread between its channel means ≤ 25 — and either

- **bright**: channel mean ≥ 235 and ≥ 60% of its pixels light, or
- **clean**: channel mean ≥ 205 and ≥ 85% of its pixels light

where *light* means every channel ≥ 200. Trimming is capped at 5% of the
relevant dimension — the largest real border is 3.3% — and any card reaching
the cap is skipped for a human rather than trimmed on a guess. None reached
it.

Each clause earns its place:

- **Judge the line, not its pixels.** Earlier attempts tested each pixel and
  required 95–99.5% of a column to qualify. Both left a visible line behind,
  because the last column or two is where JPEG ringing and anti-aliasing blur
  the boundary. On `major_00_fool` the final two columns average
  `[252, 253, 248]` and `[251, 251, 233]` — plainly border — yet only ~70% of
  their pixels pass a per-pixel test, because the sun's orange feathers
  through them. Column -2 then drops to `[99, 80, 57]`. The cliff is enormous
  and a line mean sees it instantly; a pixel headcount does not.
- **The second, dimmer clause** catches borders that are not quite white, such
  as `minor_cups_king`'s grey edges above.
- **Neutrality protects the artwork.** Brightness alone is unsafe:
  `minor_swords_03` has a bottom region reading `[252, 232, 216]` — bright,
  but *cream*, and it is artwork, 217 rows of it. Its channel spread of 36
  excludes it. The limit of 25 rather than 20 admits one faintly blue-tinted
  row on `minor_cups_06` (spread 20.5); raising it to 30 or 35 admits nothing
  further, so the boundary is stable rather than arbitrary.

### Rows also need a name-plate guard

Every card carries a white name plate at its foot — "THE WORLD",
"QUEEN of CUPS". On most cards it is an inset banner with artwork continuing
below it; on `major_21_world` and `major_20_judgment` it is full-bleed and
runs to the bottom edge. Both look identical to a brightness test, and an
early pass took 28px off The World's title block before the mistake was
caught.

What separates them is what sits *inside* the blank band. Reading rows upward
from the bottom edge:

```
major_21_world   ######++++++++++++####          white runs on into the text
minor_cups_04    #########             +++++++   band, then ARTWORK, then the plate
minor_cups_07    #####.........................  band, then artwork, then the plate
```

So a row band is trimmed only when the 30 rows just inside it are **not**
plate-like (mean lightness < 50%). Where they are, the band is part of the
plate and that edge is left alone. The rule holds `major_21_world` and
`major_20_judgment` automatically, by measurement rather than by name.

Columns need no such guard — the plate never reaches a side edge.

## Derived art

Not regenerated, and it does not need to be: the trimmed edges sat outside the
circular mask in both the `circle` and `avatar` crops.

One coordinate did need moving. `script_make_avatars.py` carries 33 hand-tuned
override boxes in native master pixels. Thirty-two still fall inside their
trimmed masters, but `minor_swords_06` reached x=815 on a master now 813 wide;
its box is shifted 2px left to `(513, 565, 813, 865)`, preserving its 300px
width and framing. `minor_cups_king` is the only card trimmed from the top
(5px), which would shift y-coordinates — it has no override, so nothing moved.

## What this leaves for later

**The `.png` extensions are wrong.** Renaming to `.jpg` would mean touching
`image_file` in the card CSV and the path builders in `lib/`, so it is left
alone here. Anyone writing tooling against these files should not trust the
extension.

**The generation scripts cannot currently be run.** Both
`script_make_path_circles.py` and `script_make_avatars.py` carry hardcoded
container paths from the session that wrote them (`SRC_DIR = "/mnt/project"`,
`OUT_DIR = "/home/claude/circles"`), which exist in no checkout. Anyone
following "rerun the script; don't hand-edit a crop" will find the script does
not run.

**`CROP_SIDE = 840` in `script_make_path_circles.py` is now stale.** It is
documented as "the source width", which is no longer true of any master. Left
as-is it crops a non-square box and stretches the result. It should be derived
from the image (`im.width`) before circles are next regenerated.

**The deck still ships in 18 distinct sizes.** Trimming brought 61 cards to an
identical 813×1456, but 16 remain off-ratio, up to 0.7037. That is handled at
render time — see [0020] and UX_Style_Guide §10 — not in the files.
