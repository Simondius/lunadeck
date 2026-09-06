# 0100 — Journey mode: scaffold and unit 1 (The Fool)

**Date:** 2026-09-06
**Status:** Accepted

## Context

Simon wants to explore a new, narrative-driven UX alongside the existing
Path course (v4): a simplified story introduces a card; when the narrative
segment concludes, the card is added to the reader's deck, where the
existing formal lessons can be reached for deeper study. Progress on the
narrative side and progress on the deck side are meant to gate each other
two ways once both exist for real.

Two structural questions were on the table: build this as a branching
"path version" / "story version" menu inside the current codebase, or
start a fresh codebase and port pieces across. Given the repo's own
history — v1 through v4 evolving in place, and a standalone Story mode
that shipped on its own and was later folded into v4 (`0048`, `0057`) once
product direction converged — staying in one repo and adding a new
top-level mode is the same move this codebase has made before, and it
keeps "port the elements lesson format" a same-repo import rather than a
cross-repo copy-paste. Decision: same repo, Journey is a new top-level
mode, not a menu branch buried inside v4.

Per Simon's instruction, Journey becomes the *default* mode (`app/page.js`
now re-exports `./journey/page` instead of `./v4/page`); Path/v4 is paused,
not removed — its code and curriculum are untouched, and it is reachable
from the dev console's new "Open Path (legacy)" link. Units are built one
at a time; this change ships unit 1, The Fool, and the scaffold everything
else in Journey will reuse.

## Global animation library, not per-screen styling

Simon was explicit that a request like "make the text shimmer more" should
be a single edit, not a hunt across every screen. So every Journey visual
behaviour lives in one CSS block in `app/globals.css` ("Journey mode —
global animation library"): how narrative text swipes in from the right
(italic), how action/sound-effect text swipes left-to-right with a gold
and silver dust band then sparkles (straight, not italic — reserved for
lines actually written with asterisks in the script, e.g. `*Thud*`; a line
that merely *describes* an event in prose, like "Oops, dropped them..", is
narrative), how a visible card breathes gently as if alive, and the full
tap-to-answer sequence (0.2s expand/contract punch, 0.3s gold sweep,
golden "selected" hue, each distractor disintegrating independently over
0.2–0.6s) versus the wrong-answer shake-and-revert. `prefers-reduced-motion`
collapses all of it to near-zero duration without breaking the state
machine that waits for it.

The React components (`components/journey/*`) only ever toggle classes and
manage timing/sequencing — `journey-text.jsx`, `journey-choice-group.jsx`,
`journey-card.jsx`, `journey-player.jsx`. None of them hardcode a duration
or a color; those numbers live only in the CSS.

## Art: extracted from the mocks, not screenshotted whole

Tia's 27-screen mock walkthrough (dropped into this repo directly at
`assets/Journey Fool prototype images/` — not committed; it's Simon's raw
source dump, ~35MB, and everything usable from it is now extracted into
`assets/journey/fool/`) is a fully-composited set of flat images: each
screen already has its caption text and, for several screens, its buttons
baked into the art. Using those images as-is for the background would have
meant either double-rendering the caption (once baked into the image, once
from our own animated `JourneyText`) or abandoning the animated-text
requirement entirely for this unit.

Instead, each background asset is the mock's own illustration with its
caption band cropped off (the caption itself is rendered live, from the
exact same script text, by `JourneyText`), and the card art is cropped
once — from the mock screen where it appears largest and cleanest against
a plain background — and reused everywhere the card appears via
`cardArt`, rather than re-cropped per screen. Two mock screens turned out
to be pixel-identical to others once cropped (screens 4 and 9 shared a
background; 19 and 25 shared a different one) and are pointed at the same
asset file rather than duplicated. Screen 1 of the mock set is a preview
of the Guide screen after the card unlocks — not a beat of the player
itself — so it isn't reproduced; the app's existing Guide/Deck screens
already show a card once it's known.

Result: `assets/journey/fool/card-face.png` (one card crop) and fifteen
background images under `assets/journey/fool/backgrounds/`, covering all
26 playable beats (the 27 mock screens minus screen 1). `data/journey/units/fool.js`
carries the exact caption text from the mocks verbatim, plus two beats the
mocks have that a first read of the walkthrough missed: a silent
reaction-shot beat (both characters gasping, no caption) and the starfield
"reveal" beat right after the last multiple-choice question resolves.

## Progress: a fourth, deliberately separate store

`lib/journey-progress.js` is `lunadeck.journey.v1` in localStorage,
tracking only which unit slugs are complete — separate from Path's
`lunadeck.progress.v1`, Guide's own store, and the bug-reporter's reporter
memory. Same reasoning as the existing separate stores: Journey's
completed-unit shape isn't the same as Path's completed-node shape, and
designing a shared/unified store now, before the two-way
narrative-gates-deck-gates-narrative mechanic actually exists, would mean
guessing at a shape rather than building the one the real mechanic needs.
`knownCardKeys(units)` exists so the deck side has something to read once
that gating work starts, but nothing consumes it yet.

## What's next

Two-way gating between narrative progress and deck progress (nothing
enforces it yet — Journey and the deck are just both readable, not
linked), a real path/menu view once a second unit exists (today `/journey`
is a flat list of one), and porting an existing lesson format (e.g.
elements) into a Journey unit the way Simon described wanting to reuse the
old codebase's material.
