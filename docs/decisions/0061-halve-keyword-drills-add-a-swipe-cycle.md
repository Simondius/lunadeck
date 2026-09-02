# 0061 — Halve the repetitive keyword-tap rounds, add one swipe cycle instead

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Every card's "plain" keyword-tap rounds (the ones with a bare `words`
array, no `type`) drill the same small vocabulary — 5 to 7 words per
card — over and over: Fool alone had 35 of them across six nodes, mostly
just reshuffling the same seven words into different 2-3-word subsets.
Simon's call: cut it by half, and replace what's lost with one `swipe`
round (the existing "does it match?" true/false format, previously only
used with full reading-note sentences) that cycles through every one of
a card's real keywords plus an equal number of distractors, once each,
rather than the same handful of words in rotation.

## What changed

For every card, in both `data/v2/*_section.json` and `data/v3/*_section.
json` (identical round content by convention, `0046`): each node whose
rounds are plain keyword-tap got trimmed to `ceil(count / 2)` rounds, and
one new node (`node-kw-swipe`) was inserted right after the last such
node in that file's own order — same relative spot in both v2 and v3
despite their different resequenced orders, since it's always right
before the closing choice/capstone rounds in either. That new node holds
one `swipe` round: every real keyword for that card as a match, and an
equal number of real keywords from the *other* four cards as
non-matches — the same "a distractor should only read as wrong once you
know the card" standard `0058`/`0060` already established, not filler
words.

`app/v3/page.js`'s own per-card `LABELS` arrays gained one entry each
("Every keyword, once") at the matching position. `data/v4/*_section.
json` are generated files (`scripts/build-v4-sections.mjs`, `0057`) and
were rebuilt from the fixed v3 source rather than patched separately —
which also shifted what "the two most repetitive nodes" are for `0058`'s
review-unit cut (`CUT_INDICES` in `app/v4/page.js`): re-picked so neither
cut node is the new keyword-swipe one, since that's exactly the content
this whole change was meant to add, not remove again.
