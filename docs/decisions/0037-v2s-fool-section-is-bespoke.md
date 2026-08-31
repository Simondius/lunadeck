# 0037 — v2's Fool section is bespoke, and touches no progress

**Date:** 2026-08-30
**Status:** Accepted

## Context

The first pass at `app/v2` (scaffolding-only, same day) was a literal clone of
Unit 1 / Section 1: same node ids, same `components/lesson/*` formats, reached
via `/v2` instead of the real path. That was enough to prove the dev-console
door worked, but Simon's actual spec for the section (see
`docs/draft-alt-path-fool-section.md`) is a drag-to-card interaction with no
analogue in `lib/rounds.js`'s node/instance/format model — no hints, no
mistake-review queue, no XP, and a round that ends on a correct or incorrect
*drag* rather than a submitted answer.

Forcing that into the existing `Format` components would have meant bending
an abstraction built for a different kind of round. It was replaced outright
instead.

## Decision

**`app/v2/play` now reads `data/v2/fool_section.json`,** not
`data/data_curriculum_nodes.csv`, and renders it with
`components/lesson-v2/fool-drag-section.jsx` — new code, not a fork of
`components/lesson/session.jsx`. The JSON is deliberately the whole story for
now: one card, four rounds, each a flat list of `{ text, correct }` words.
`docs/draft-alt-path-fool-section.md` said JSON was fine to iterate against
before deciding whether this becomes a real curriculum row; this is that.

**The words are real content, not placeholders.** Correct answers are The
Fool's own core keywords from `data_card_keywords.csv` (`exploration`,
`levity`, `nonconformity`). Wrong answers are drawn from the keyword sets of
the cards the curriculum already treats as Fool's confusables in
`cards_involved` — Hermit, Hierophant, Devil — never invented and never one
of Fool's own extended keywords (`intuition`, `speed`, `play`,
`spontaneity`), which would be true of the card and so a dishonest "wrong."

**Nothing here touches `lunadeck.progress.v1`.** There's no `completeSection`
call anywhere in `components/lesson-v2` — not neutered, just never wired in.
The section has no node ids to collide with v1's, so there's nothing this
needs to guard against yet; the moment v2 grows enough to want XP, streaks,
or unlock state, that's a real design question (its own store key? shared
shape? something else?), not a default to fall into.

## Consequences

Playing v2's Fool section to completion or abandoning it midway leaves no
trace anywhere — no localStorage write, no way to resume partway through a
round. The completion screen (`FoolDragSection`'s `complete` branch) is a
placeholder by design: "Section complete." and a link back to `/v2`, per
Simon's own note that the ending is a placeholder he'll iterate on.

The drag mechanic (`components/lesson-v2/drag-chip.jsx`) uses pointer
capture and a `getBoundingClientRect` hit test against the card, the same
family of technique as `components/dev-console.jsx`'s draggable FAB. It does
not use HTML5 drag-and-drop, which behaves inconsistently across touch and
mouse.
