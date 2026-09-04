# 0098 — The UI exports itself for Figma

4 Sep 2026. Tia wanted the UI as PNGs she could drag around in Figma by hand.

## What already existed

`assets/` is 358 raster files — 78 card `master` renders, 78 `circle` crops, 78
`avatar` crops, 78 `cardelements`, and 30 suit/planet/zodiac/element symbols.
(The elements are the odd one out: they cover only the 22 major arcana, three
or four cut-out symbols each. Their count matching the other three at 78 is a
coincidence, and I first wrote this note down as "78 each" because of it.)
None of that needed exporting; it drags straight in. What had never existed as an image was
the **interface**: the tab bar, the path nodes, the feed row, the round shells.
All of it is HTML and CSS, so the only way to get a picture of it is to render
it and take one.

`scripts/export_ui.mjs` does that over the running dev server, driven by a
manifest of `{name, route, selector, prepare}`. `npm run export:ui` writes 30
files into `exports/figma/` (gitignored) at 3x, plus a README it regenerates
each run so the file list can't go stale.

Playwright uses the Chrome already installed rather than downloading its own
Chromium (`channel: "chrome"`), so the dev dependency is a few MB.

## Why a picked list and not a sweep

`globals.css` has 397 top-level classes. Exporting all of them would produce
mostly noise, so the manifest names 18 pieces and 12 screens. Adding another is
one line.

Three of the fifteen Tia and I first agreed on turned out not to exist as UI:

- **the right/wrong badge** — `.badge-right`/`.badge-wrong` live only in
  `components/lesson/options.jsx`, which nothing imports. It is orphaned from
  the v1–v3 removal (`0082`).
- **the board column** — `.board-column` has no consumer at all. Dead CSS.
- **the node-complete card** — `.complete-card` is on the card detail page.
  v4's completion screen is `.node-complete-celebration`.

`.activity-card` was also the wrong selector for "the feed item": it is one
card thumbnail inside the row. The row is `.activity`.

Substituted in: `.tile-match-grid`, `.reference-card`, `.topbar`, the node icon
as SVG.

## The five things that were bugs first

**A fresh browser has empty localStorage,** so without seeding, every screen
renders its zero-state — no streak, no known cards, no draw. `SEED` is written
via `addInitScript`, before any page script runs. Seeding a takeaway also means
the reader never calls the API, so an export run costs nothing.

The seed has to come **from the data**. Guessing the capstone node id as
`capstone-1` produced a 12-day streak next to "0 / 78 cards learned", because
`knownCardKeys` only counts a card once every node in its section is complete
and the capstone is one of them. `allNodeIds()` reads the real ids.

**`omitBackground` does not give a transparent cutout.** It clears the
browser's default white; the app's own dark ground is painted by
`body`/`.shell`/`.session` *behind* the clip, and an element screenshot
captures those pixels. `TRANSPARENCY_CSS` strips them for the duration of the
shot — and has to `display: none` the round backdrops rather than clear their
background, because `.cloze-bg` and `.swipe-bg` are `<img>` elements. The first
run cut the cloze sentence out with the Chariot still showing through it.

**Clipping to `.app-frame` is not a screen.** Below 900px the frame is an inert
wrapper with no height of its own, so it grows to content: the path came out
1260×99750, which is a diagram of the whole trail rather than a picture of a
phone. Screens are viewport shots now, exactly 420×900.

**Hiding dev chrome by class name missed the minimised FAB,** which is the
state this script puts the console in, leaving a moon badge in the corner of
all 30 files. It hides on the `dev-console` prefix instead.

**A shared `MediaStream` is not reusable.** Chrome's own fake camera feed is a
green test pattern — mechanically a working camera, useless as a design asset —
so `fakeCamera()` overrides `getUserMedia` with a canvas painting a real master
render. Two details: the canvas has to be *in the document* or it never
composites and produces no frames, and `getUserMedia` must return a **fresh**
stream per call, because React invokes the scanner's effect twice in
development and the first run's cleanup stops the tracks of whatever it was
given. Sharing one stream left the second consumer with stopped tracks
reporting a 2×2 frame, which never satisfies `MIN_FRAME_WIDTH`, so the scanner
sat on "Waiting for the first frame…".

## Mid-lesson pieces come from the dev skip, not from playing

`.tile-match-grid`, `.node-complete-celebration` and the ceremony only exist
part-way into a node. Rather than automate real answers — drags, taps, and a
correct-answer path per round type — `prepare` clicks the dev console's own `>`
control (`lib/dev-console-bridge.js`), which steps a node's rounds without
answering them. No node anywhere starts with a tilematch round, so that one
needs exactly one skip; `chariot/1` holds a single round, so one skip there
lands on the celebration.

## SVG where the source is already vector

Three components draw inline `<svg>`: the streak flame, the node icons, and the
alignment orbit. Figma imports those as editable paths, which beats pixels, so
the exporter writes a `.svg` beside the PNG **when the clipped element is
itself an svg** — pointing a manifest entry at the svg directly, rather than
grabbing the first one found inside a larger element, which produced a
`profile-stats.svg` that was actually just the flame.

Their computed paint is inlined on the way out. The flame takes its colour from
`.flame-body`/`.flame-core` in the stylesheet and the node icons use
`currentColor`; neither travels with a standalone file, and the first export
was two black silhouettes.

## Known limits

The tab glyphs are CSS shapes, not icon files. They export as correct pixels
and can never be editable vectors — restyling those in Figma means redrawing
them.

Some pieces are translucent by design (the drag chips, the celebration line,
the topbar). A faithful cutout of a pill that borrows the dark ground behind it
looks washed out on a light canvas. The generated README says so and names the
backdrop colour.

The celebration exports without its glitter, and the ceremony mid-reveal: both
animate, and a still is a still.
