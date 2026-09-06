# 0101 — Journey unit integration playbook

**Date:** 2026-09-06
**Status:** Accepted

## Why this doc exists

Two Journey units have now been built the same way — The Fool (`#98`,
`#100`) and The Magician (`#103`, `#104`) — from a raw dump of Tia's mock
PNGs into `assets/journey/<unit>/`. Both times, real bugs made it to Simon
before being caught, and both times the root cause was a step in this
process that wasn't written down anywhere, so nobody (human or Claude
session) knew to check it. This doc is that checklist. Follow it top to
bottom for the next unit; don't skip the QA section even though it's the
most tedious part — every item in it exists because skipping it already
broke something once.

## Input: what you're starting from

Tia drops a numbered sequence of raw screen PNGs (`1.png`, `2.png`, ...)
either straight into `assets/journey/<unit>/` (Magician) or into a
`assets/Journey <Unit> prototype images/` holding subfolder (Fool) — check
both locations. These raw files are never committed (too large, and
`assets/journey/<unit>/*.png` numbered files match a gitignore pattern
already in place) — only what gets *extracted* from them below is.

## Step 1 — Read every screen, work out the beat map

Open each screen in order and read it as a strip: most are one line of
dialogue or narration over a background; some are the multiple-choice
"guess the word" rounds; one early screen is usually a preview of the
Guide/unlock screen (not a beat — the app's own Guide/Deck screens already
cover that once the card is known, so skip it); one is usually just what
`revealCard`'s existing flash/glow/card-settle animation already produces
on top of another beat's background (also not its own beat — check
`journey-player.jsx`'s `revealCard` handling before assuming a screen
needs a dedicated entry). Everything else maps 1:1 to a beat in
`data/journey/units/<unit>.js`.

Copy captions verbatim, including any deliberate lowercase/informal
spelling in the source (Fool and Magician both do this — don't
"correct" it).

## Step 2 — Extract the art

**Card art**: crop once, from whichever screen shows the card largest and
cleanest against a plain background, into `assets/journey/<unit>/card-face.png`.
Reuse that single crop everywhere via the beat's `cardArt` field — never
re-crop per screen. React never remounts the card `<img>` within a unit
because its `src` never changes, which is exactly why transitions don't
need to handle the card layer at all (see `journey-player.jsx`).

**Backgrounds**: if the mock bakes caption text into the background art
(both units so far have), the text has to come out before the file is
usable — `journey-player.jsx` renders the caption live from script text,
so a baked-in caption would double up. De-caption with `cv2.inpaint`
(`INPAINT_TELEA`) over the caption's row band, but widen the mask well
past the visible glyphs (~60px margin, to catch shadow bleed) and blend a
Gaussian-blurred copy of the result across a wide (~40px) linearly
feathered region — a tight, unfeathered mask leaves a visible seam or a
ghosting/striping remnant of the text. Two narrower attempts on Magician
both showed exactly that before the wide-mask-plus-feather version worked
cleanly.

**Before creating a new background/shared asset, check for duplicates**:
against other screens in the *same* unit (two mock screens can be
pixel-identical once cropped — Fool had two such pairs, pointed at the
same file rather than duplicated) and against *already-shipped* units'
`assets/journey/shared/` folder (Magician's card-back-glow screen turned
out to be pixel-identical to Fool's own `reveal-glow.jpg` — it's the
tarot deck's generic card-back design, not art tied to one card; it lives
in `assets/journey/shared/card-back-reveal.jpg` now and both units point
there). Skipping this check means committing a redundant multi-hundred-KB
duplicate of art that already exists.

## Step 3 — Write the data file

Follow `fool.js`'s schema exactly in the new unit's `data/journey/units/<unit>.js`:
`kind` (`"line"` / `"choice"` / `"unlock"`), `bg`, `cardArt`, `textStyle`
(`"narrative"` for prose/quoted dialogue, `"action"` **only** for lines
literally marked with asterisks like `*Thud*` — a line that just
*describes* an action in prose is still narrative), `options` with
`correct: true` on exactly one per round.

**Caption position — check this per unit, don't assume**: the default
global caption position (`top: 70%`, i.e. low in the frame) matches
Fool's compositions, where the empty space is at the bottom. It does
**not** hold universally — Magician's road-scene mocks put the empty sky
(and the caption) at the *top* instead, and shipping with the default
made the caption sit over busy artwork, harder to read, and in the wrong
place versus the mock. Before writing the data file, measure the actual
caption ink position (as a percentage down the frame) directly in a
handful of this unit's own raw mocks — don't infer it from a different
unit's convention. If it differs from the default, add the value as a
new opt-in per-beat field (see `captionPosition: "high"` in `magician.js`
and the matching `.journey-caption.is-high` rule in `globals.css`) rather
than changing the global default, which would fix the new unit while
silently regressing every unit already shipped.

**Quiz "correct" answers**: if the mocks don't visually mark which
option is correct (neither unit's "guess the word" rounds do), pick based
on the card's own established guidebook meaning
(`data/data_card_descriptions.csv` / `data_card_keywords.csv`) and say so
explicitly in the file's own top comment and the PR body — flag it as a
judgment call for Simon/Tia to confirm rather than treating your own read
as final.

Register the new unit in `data/journey/units/index.js` (`UNITS` array).
`components/dev-console.jsx`'s Journey group and the asset/beat
reference checks in `npm test` both key off `UNITS` already — no other
registration point should be needed.

## Step 4 — the deck circle thumbnail (do this now, not later)

**This step was missed entirely for Magician** and shipped as a live bug
(`/deck` showed Magician's old pre-Journey placeholder art for a full
release) before anyone caught it. It's easy to miss because it isn't part
of the Journey player at all — it's the *other* place this card's art
shows up.

`assets/cards/circle/<card_key>_circle.png` is a 512×512, circle-masked
crop shown on the `/deck` grid. The generic path
(`scripts/script_make_path_circles.py`'s `make_circle()`, sourcing from
`assets/cards/master/<card>_MASTER.png`) is **not** what either shipped
unit actually used — neither unit's MASTER file was touched for Journey,
so that pipeline would silently keep serving old art. Both units instead
got a bespoke crop from the unit's own `card-face.png`, built with the
same masking algorithm as `make_circle()` (upscale 4x for supersampled
antialiasing, ellipse mask, Gaussian blur(4), downscale to 512×512), then
committed directly to `assets/cards/circle/`.

Do this as part of building the unit, not as a follow-up — and as part of
QA below, actually load `/deck` and look at the new unit's thumbnail
rather than assuming the crop is correct because the script ran without
error.

## Step 5 — automated checks

```
node scripts/copy-assets.mjs && npm test && npm run build
```

`npm test` includes an asset/beat reference check ("N distinct story
assets referenced, all present" / "N v4 rounds and N story beats checked,
all playable") — this catches a missing file or a malformed beat, but it
does **not** catch anything visual. Passing tests and a clean build are a
floor, not a substitute for the QA pass below.

## Step 6 — QA pass (do not skip; every item below already broke once)

Get the dev server running first — `npm run dev` in a real terminal the
person doing QA controls directly. (A Claude session working through
`device_bash` cannot keep a background `npm run dev` process alive across
tool calls — it gets killed the instant the shell command returns, tried
twice, confirmed both times. Ask whoever's driving to start it and leave
it running instead of attempting background-process tricks again.)

With the dev server up, walk the new unit's beats live and check, explicitly:

- [ ] **Deck thumbnail**: open `/deck`, find the new card, confirm it
      shows the *new* Journey-style art, not an old placeholder. (Missed
      for Magician — see Step 4.)
- [ ] **Caption position**: on every beat, does the caption sit where the
      corresponding mock puts it — not just "readable," but in the same
      region of the frame? Check beats using the unit's default
      composition and any beats using an overridden `captionPosition`
      separately. (Wrong for Magician's road-scene beats initially — see
      Step 3.)
- [ ] **No background flash between same-`bg` beats**: step forward
      through a run of consecutive beats that share the same `bg` value
      (e.g. a multi-line dialogue sequence, or a "void" quiz sequence) and
      confirm the background does *not* visibly re-fade or flash — only
      the caption text should animate. (Broken for both units until
      `journey-player.jsx`'s `scenePhase`/`textPhase` split in `#104` —
      before that fix, *every* beat change faded the whole stage,
      including beats where nothing in the background actually changed.)
- [ ] **Transition timing on beats that DO change background**: confirm
      the fade is a deliberate, visible ~0.3s out/in (current spec,
      `TRANSITION_MS` in `journey-player.jsx`), not instant and not the
      old 0.1s.
- [ ] **Check more than one viewport size.** `.app-frame` applies a fixed
      desktop-cap layout (`width:428px; height:min(940px,94dvh)`) only at
      window widths ≥900px, so crop/letterboxing genuinely differs by
      window size, and a layout bug can be invisible at one size and
      obvious at another. Check at minimum a narrow/mobile-ish width
      (~390px) and a desktop width (≥900px, so the `.app-frame` cap
      engages). If something looks wrong, note the *exact* window
      dimensions (and whether the dev console overlay was open) when
      flagging it — "the layout is different" without those specifics
      cost real back-and-forth trying to reproduce a report that turned
      out to depend on the exact window size.
- [ ] **`npm test` and `npm run build`** both still pass after any
      QA-driven fix — re-run them, don't assume a small follow-up fix
      didn't regress something.
- [ ] If a Claude session made the fix: **confirm the edit actually
      landed on the machine running the dev server** before trusting any
      of the above. Editing through a cloud-side tool and testing through
      a device shell are two different copies of the repo; a change that
      was never synced across still shows a "clean" test run against the
      *old* file. `git status`/`git diff` on the device right before QA is
      the cheap way to catch this.

## What's next

The next unit should be able to follow Steps 1–6 above with no
surprises. If it turns up a step that wasn't covered here, add it to this
doc in the same PR — that's the whole point of keeping this list current
rather than re-discovering the same gaps unit after unit.
