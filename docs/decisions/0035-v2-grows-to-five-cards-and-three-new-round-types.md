# 0035 — v2 grows to five cards and three new round types

**Date:** 2026-08-31
**Status:** Accepted (built overnight, unreviewed — Simon is asleep; he
plays this back and decides what ships)

## Context

Simon left overnight instructions (`overnight_instructions.md`, not checked
in) to extend v2 from one section (The Fool) to five — Fool, Lovers,
Magician, Empress, Emperor — and to add three round types beyond the
existing keyword-pair and zone shapes: fill-in-the-blank (`"cloze"`),
tap-one-of-four (`"choice"`), and a match-the-pairs recap he added as a
follow-up message (`"tilematch"`, not in the original written spec). The
hard constraint was explicit: **no commit, no push** — everything here sits
uncommitted in the working tree for him to test and decide on.

This doc records what was built, and — per his instruction to "note what
you assumed and why... not by stopping" — every place a call had to be made
without him there to ask.

## What's new

**Data**: `data/v2/{lovers,magician,empress,emperor}_section.json`, plus two
extensions to the existing `data/v2/fool_section.json` — nodes 8–10 (cloze
description, cloze reading notes, choice), and a `"tilematch"` round
appended to node 1. A `data/v2/sections.js` manifest orders all five and
resolves a slug to its data.

**Routing**: `/v2/play/[node]` (Fool-only) became `/v2/play/[section]/[node]`.
`NodeSession` now takes `sectionSlug` and `nextSection` so a node's "next"
link can cross from one card's last node into the next card's first, not
just increment a number — see `getNextSection` in `sections.js`.

**Three new round players**, dispatched by `round.type` in `node-session.jsx`
exactly the way `"zone"` already was:
- `cloze-round-player.jsx` — drag words into blanks in a sentence. Each
  word-bank chip checks its drop point against every blank's own DOM rect
  (not one shared target, since a sentence has several), reusing
  `drag-chip.jsx`'s pointer-capture pattern rather than `zone-chip.jsx`'s,
  since these are short words, not long phrases needing the shrink-while-
  dragging treatment.
- `choice-round-player.jsx` — tap one of four; wrong taps shake and greyed
  out (stay visible, just excluded), reusing the *existing* `.chip.is-wrong`
  /`.is-correct` classes from the keyword rounds' reveal state rather than
  inventing a parallel color scheme.
- `tile-match-player.jsx` — Simon's addition, not in the written spec: tap
  an image tile and a description tile to pair them, both columns shuffled
  independently so position never gives a pair away. Appended to every zone
  node as one more round, built from that node's own already-authored
  elements (no new data to write — see below).

**Two small fixes** he flagged after loading the app to check first:
`.drag-layout .prompt`'s font-size was matched to `.reference-name`'s actual
rendered size on that screen (16px, the `.is-compact` variant every drag
round uses — not the base 18px, which he named as a live possibility and
asked me to check rather than assume). The bridge and complete screens
(`node-session.jsx`) got the same bottom-anchored `.bridge-layout` treatment
the round screens already had, so "Review" and the next-node link sit where
every other Continue-style button does instead of jammed under the prompt.

## Assumptions made without him there to ask

**Tile-match pairs, images, and grid shape.** "2×3 with images on left,
descriptions on right" generalizes to "2 columns, however many rows the
card's zone node has elements" — 2×1 for Magician/Emperor (2 elements), 2×2
for Lovers (4), 2×3 for Fool (6). Pairs are drawn from the zone node's own
already-authored `elements` (key/text), so no new content was written for
this — only an `image` field pointing at the base (non-`_1`-suffixed)
crop in `assets/cards/cardelements/` for each key, since duplicate-looking
export variants existed for some cards and the base name was the reasonable
default.

**`app/v2/page.js`'s per-node labels are hand-mapped, not derived at
render time**, because "obvious-wrong" vs "real-word" vs "mastery"
distractor tiers aren't distinguishable from the word lists alone — only
from how each node was authored. Fool's word-node progression predates this
build and doesn't match the other four cards' shape (it has an extra
closer-distractor tier they don't), so it has its own label array rather
than sharing one. If a node's content changes later, its label in
`app/v2/page.js`'s `LABELS` map needs updating by hand — it will not drift
into wrongness silently, but it also won't self-correct.

**`circleForKey` is duplicated, not imported, in `app/v2/page.js`.** That
page needs `useState` for the collapsible unit headers, so it's `"use
client"` — and `lib/data.js` reads CSVs via `node:fs/promises` at module
scope, which breaks Turbopack's client bundle the moment anything
client-side imports *any* export from that module, even an unrelated pure
one. This was a real build failure during this session (`the chunking
context does not support external modules (request: node:fs/promises)`),
not a style preference — copying the one-line function was faster and
lower-risk than splitting the page into server+client halves the way
`app/page.js`/`components/path-screen.jsx` do it.

**The choice prompt is one static line** ("Which of these is true of this
card?") reused for every round on every card, matching the schema example
literally rather than writing 30-some bespoke prompts.

## Known gaps, honestly

**The cross-section "next" link (a section's last node completing into the
next card's first node) was not played to completion end-to-end** — round
counts on final nodes (6–7 rounds each) made a full manual playthrough of
every section impractical overnight. The in-section case (`Node N` →
`Node N+1`) and the final-section case (Emperor's last node → "Back to v2")
were both verified live; the middle case is the same ternary branch with
`nextSection` non-null instead of null, with no additional logic specific to
it, so it should hold — but it's the one seam Simon should check first.

**Decision numbering risk.** Local `main` only has decisions through 0025;
Tia's own unmerged branches (last checked earlier this session, network
access unavailable overnight to recheck) had independently claimed 0026
through 0034 for unrelated Reader-tab work. This doc uses 0035 to clear
that — worth a final check against her latest branch state before this
merges, same renumbering risk `CLAUDE.md` already warns about.

**Everything else from `docs/draft-alt-path-fool-section.md`'s open
questions still stands** — end-of-node screens are still placeholders, and
whether this becomes real `data_curriculum_nodes.csv` rows is still
undecided.
