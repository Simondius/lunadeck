# 0048 — Story mode: a linear narrative reading

**Date:** 31 Aug 2026
**Status:** Accepted

## Context

Simon asked for an entirely new mode, reachable from the dev console at
the same level as Path (its own top-level menu group, not a Content
subgroup - Story isn't a curriculum variant): a linear, chapter-based
narrative where the learner role-plays a tarot reader, in first person,
giving a reading to a client. Each chapter names a location and a
recurring character, offers 1-5 card slots and a pool of cards that can
fill them, and steps through a fixed sequence of dialogue and 2-4-option
multiple-choice beats - no branching in this version.

Nothing in the app does this today. A survey before building confirmed
the Guide tab (`0042`-`0044`) is the closest existing feature and shares
almost nothing usable: it's built around interpreting a *real* physical
deck via camera or manual search, has no location, no character (the
reader persona was deliberately moved out of Guide, `0032`), no card-slot
concept, and its one dialogue-shaped thing (`FollowUps`) is free-text
Q&A against an LLM, not scripted multiple choice. The one real precedent
is architectural, not visual: v2/v3's node/round-session engine
(sequence a fixed list of items, own mistake handling, done when the list
runs out) is the shape a chapter's beat sequence borrows conceptually,
even though `ChapterPlayer` isn't built on `NodeSession` directly (a
chapter's location/character/slots persist continuously across many small
beats on one screen, where a node's rounds each replace the *whole*
screen - different enough shapes that forcing one into the other would
have fought the grain of both).

## What exists now

**Routing.** `/story` lists chapters (currently one). `/story/play/<slug>`
plays one. The `/play/` segment matters: `components/tabbar.jsx` already
hides the tab bar for any route containing it (except v2's own, kept
visible on purpose) - putting the play route there means Story's
full-bleed scene gets the same immersive, chrome-free treatment v1 and v3
get, for free, with no change to `tabbar.jsx` itself.

**Data.** `data/story/chapters.js` mirrors `data/v2/sections.js`'s own
shape exactly (a flat array, `getChapter`, `getNextChapter`) - the same
job, so the same shape. `data/story/chapter-01.json` holds one chapter:
a `location` (name + a named background), a `character`, `slotLabels`,
an `availableCards` pool of card keys, and a `beats` array of three beat
types:

- `dialogue` — a speaker (`"client"` or `"reader"`) and a line; tapping
  anywhere advances.
- `choice` — a prompt and 2-4 options, exactly one `correct: true`; a
  wrong tap shakes and stays (`choice-option-shake`, the same keyframe
  every other wrong-tap in the app already uses) rather than branching
  anywhere, matching the "no branching" brief literally: there is exactly
  one path through a chapter, and a miss costs a retry, not a fork.
- `draw` — a prompt, a target slot index, and the one correct card key;
  the learner picks from whatever's left in `availableCards` (already-used
  cards are removed from the pool as slots fill), same
  shake-and-retry on a wrong pick.

**Engine.** `components/story/chapter-player.jsx` holds `beatIndex` and
`slots` state, renders whichever beat is current below a persistent
strip showing the location name and the card slots filled so far, and
swaps to a "chapter complete" screen (linking to the next chapter, or
back to `/story`) once the beat list runs out.

## What was and wasn't invented

The specific dialogue, characters, and backstory in any given chapter are
content decisions, not engineering ones — Simon's own to make and revise,
so this doc doesn't narrate them. What's an engineering claim, and holds
regardless of which chapter's script currently occupies `chapter-01.json`:
where a reading's *substance* comes from is real, not invented. A card's
meaning, wherever the dialogue or a choice's correct answer states one,
is pulled from `data_card_talking_points.csv`, not made up for the
occasion — the same rule `CLAUDE.md` already holds every curriculum round
to.

Two things are honestly placeholder, called out rather than dressed up as
finished: the location background is a named CSS gradient
(`.story-bg.is-room`), since no location art exists yet, and the
character has no portrait at all, just a name label. Both are wired so a
real image slots in later without touching the data shape or the engine -
`location.background` is already a class name, not a color value, and
`character` is already an object, not a bare string.

## Verified

`npm run build` succeeds; `/story` and `/story/play/chapter-01` both
prerender. Played the full chapter in a real browser end to end: all
three dialogue-choice-draw cycles, a deliberate wrong choice (shakes,
stays), all three card slots filling with the right art via
`masterForKey`, the used-card removal from the pool, and the completion
screen's link back to `/story`. Confirmed the dev console shows "Story"
as its own top-level group beside "Path," with "Open Story" landing on
the chapter list.

## Known gaps, honestly

One chapter exists. "Multiple characters that come back in different
chapters" is a real part of the brief that a single-chapter build can't
yet demonstrate - the `character` field is shaped to support it (an id,
not just a name, so a later chapter can reference the same one again),
but nothing has actually reused a character yet. Location art and
character portraits are both placeholder, as above. And card slots currently only
fill via the scripted `draw` beat naming an exact answer - a genuinely
freeform "any card can land here and the dialogue still makes sense"
mode would need either branching (explicitly out of scope this version)
or per-card dialogue variants, neither of which this chapter needed since
its whole arc leans on one specific sequence of cards.
