# 0062 — A mid-unit "mini capstone" for every single-card unit

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Simon asked for a small checkpoint node partway through each unit — "a
mini challenge" — rather than only testing everything at the very end.
Discussed three shapes (a single existing-format round reused mid-unit;
a small single-card mashup; a genuinely new no-retry format) and Simon
picked the middle one: reuse the review units' own mashup node shape
(`0059`), just scoped to one card instead of three, since it needed no
new engine work and still reads as a real capstone — multiple formats,
testing real recall, not just one more round of the same mechanic.

## What it is

`scripts/build-v4-capstone-nodes.mjs` builds `data/v4/capstone_nodes.
json`: one node per card (Fool, Lovers, Empress, keyed by card slug), not
per unit — there's nothing character-specific about testing "do you know
this card," so unit 1 and unit 2 (both Fool) share the same node, same
as unit 3/4 (Lovers) and 5/6 (Empress). Each node is three rounds — plain
keyword-tap, cloze, and choice — every round naming its own card via the
`0059` per-round override, with real cross-card distractors throughout
(same standard as `0058`/`0059`/`0060`/`0061`).

`singleCardLessonSteps()` in `app/v4/page.js` splices this node into the
middle index of each unit's own 5-lesson array (`Math.floor(length/2)`,
landing it as lesson 3 of the resulting 6), so every single-card unit now
runs: intro → vocab → **mini capstone** → readings → keywords → full
picture. Routed as its own pseudo-section, `<card>-capstone`, through the
same `/v4/play/[section]/[node]` route the mashup nodes already extended
(`0059`) — `-capstone` keeps it from colliding with the real card
section of the same name, and there's always exactly one node per card,
so `<node>` is always `1`.
