# 0057 — v4: a path that alternates Story mode narrative with v3 lessons

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

v3 teaches five cards (Fool, Lovers, Magician, Empress, Emperor) with no
story around them. Story mode is a separate, fully-linear narrative mode
(Dave and Riley, `0048`–`0056`) with no lessons in it at all. Simon asked
for a third path, v4, that alternates the two: narrative that introduces
a card, the actual lesson content for that card, then narrative that
comes back and quizzes the reading on it. v4 sits beside v3 at `/v4`,
reachable from the dev console the same way v1/v2/v3 are — v3 stays the
live default until v4 is proven out.

## Six units, one per character-plus-card

| Unit | Character | Card | Narrative shape |
|---|---|---|---|
| 1 | Dave | Fool | start: greeting + reveal + first read · end: deeper Q&A |
| 2 | Riley | Fool | same shape, mirrored |
| 3 | Dave | + Lovers | start: Lovers alone · end: Fool+Lovers (Present/Future) |
| 4 | Riley | + Lovers | same shape, cards in the other order |
| 5 | Dave | + Empress | start: Empress alone · end: full Fool+Lovers+Empress |
| 6 | Riley | + Empress | same shape, different draw order per character |

Magician and Emperor aren't part of v4 — not in this unit map. Every
unit follows the same fixed shape: **one start-narrative node, seven
lesson nodes, one end-narrative node.** `data/story/chapters.js` gained a
second export, `V4_CHAPTERS`, for the twelve new narrative files this
needed (a start/end pair per unit) — kept deliberately separate from the
original `CHAPTERS` array and its own next-chapter auto-link, since a
unit's start node is followed by seven lesson nodes before its end node,
and only v4's own path page knows that sequencing. `getNextChapter()`
still only ever searches `CHAPTERS`, so a v4 narrative node's own
chapter-complete screen correctly falls back to "Back to Story" instead
of wrongly skipping straight past the lesson nodes.

Units 1–2 are splits of the original single-card chapters (the greeting
through first interpretation becomes the start node; the follow-up
Q&A becomes the end node, with a short "back again" narration bridging
them). Units 3–6 needed genuinely new narrative — the existing three-card
chapters (`chapter-03`/`chapter-04`) are single continuous readings drawn
in one sitting, which doesn't decompose along "one card's story per
unit." Every end-narrative node also picks up the misconception-beat
pattern from `0056` as its primary shape — the character actively testing
a plausible misreading ("so does the Lovers mean I'll meet my person?"),
several beats deep, per Simon's own brief for what an end node should do.

## Regrouping v3's lesson nodes, not rewriting them

v3's `data/v3/{fool,lovers,empress}_section.json` already group rounds
into nodes (14, 14, and 13 respectively) in a specific resequenced play
order (`0046`) that the array itself encodes — `app/v3/page.js` never
re-sorts it. Per Simon's own choice, v4 collapses each card down to
exactly 7 nodes by merging *adjacent* existing nodes — no rounds dropped,
no reordering. `scripts/build-v4-sections.mjs` does this once (a genuine
build step, not a runtime transform) via a binary-search partition that
minimizes the largest resulting group, and writes the result to
`data/v4/*_section.json` as real, reviewable data files. `app/v4/play/
[section]/[node]/page.js` then plays them through the exact same
`NodeSession` component v2/v3 already use, unchanged — it only takes a
`basePath` and doesn't care which section data it's fed.

## A dramatic character node, and companion art in a new role

`app/v4/page.js` reuses v3's winding-trail markup/CSS wholesale
(`.trail`, `.v2-*`) for lesson nodes, but the start/end narrative steps
get a new node type — `.v4-character-shape` — rather than being forced
through the existing circle/hex/square/oct lesson shapes, which were
never meant to represent a scene. It's a larger, glowing portrait crop
("a new icon that is more dramatic," Simon's own brief) rather than a
flat geometric glyph. The trail's existing floating "companion" card
(`.v2-companion`, one per widest point the trail bends to) swaps its
usual card art for the unit's own character portrait instead — a
placeholder for the scenario-specific art Simon described ("Dave in a
cubicle," "Riley with a guitar") that doesn't exist yet, swappable later
without touching the mechanism. Both needed a light backing
(`#e7e3da`) added behind the portrait: the character art
(`reading-scene-sketch-v2`) is transparent-ground line art meant to sit
on a light page, and read as nearly invisible against the path's own
dark starfield background without it.
