# 0059 — v4: genuine cross-card mashup nodes, and a per-round card override

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

`0058`'s two review units each got 3 lesson nodes — one of each card's two
cut nodes, reused via their own original single-card routes, specifically
*because* `NodeSession` takes one `cardKey`/`cardName` per section and
hands it to every round inside a node for that round's own reference-card
art. A genuinely mixed node (Fool, Lovers, and Empress rounds together)
would show the wrong card's art for two-thirds of its own rounds under
that scheme.

Simon then asked for exactly that: two more nodes per review unit that
are "hard mash ups of different lesson formats covering each of the
cards" — so the constraint that ruled it out the first time needed
solving properly instead of working around.

## The fix: a round can name its own card

`node-session.jsx` now resolves `roundCardKey`/`roundCardName` as
`round.cardKey ?? cardKey` / `round.cardName ?? cardName` before handing
them to whichever round player is rendered. Every round across v1's
CSV-built format objects and v2/v3's own hand-authored ones has neither
field, so this changes nothing for them — the fallback is exactly the
old per-section behavior. A mashup round just sets its own `cardKey`/
`cardName`, and its reference art follows.

## Four new nodes, two per unit, all real content

`scripts/build-v4-mashup-nodes.mjs` builds `data/v4/mashup_nodes.json` -
two nodes per review unit (`unit7`, `unit8`), six rounds each, alternating
round format (plain/cloze/choice) and card on every round so no two
consecutive rounds share either. Unit 8's pair is different content from
unit 7's, not the same rounds re-run — the two units sit back to back on
the same path, so identical content would just repeat.

Every distractor — a plain round's wrong word, a cloze blank's wrong
filler, a choice round's wrong option — is a real, true line from one of
the *other* two cards in the unit (e.g. "harmony," "partnership," and
"nourishment" all show up as wrong answers on Fool rounds, since they're
genuinely the Lovers' and Empress's own vocabulary), matching the
difficulty philosophy `0056`/`0058` already established for narrative
choices: a distractor should only read as wrong once you actually know
which card you're looking at, not on sight.

## Routing without a second route tree

A mashup node's `href` is `/v4/play/<unit7|unit8>/<n>` — the *same*
`/v4/play/[section]/[node]` route the single-card sections already use,
not a nested one. `NodeSession`'s own "complete" screen hardcodes its
next-node link as `${basePath}/play/${sectionSlug}/${n+1}`, so a nested
route (`/v4/play/mashup/unit7/2`) would have made that auto-generated
link 404. The route page now just checks `mashup_nodes.json`'s own
`unit7`/`unit8` keys before falling through to `getSection()` for a real
card slug.
