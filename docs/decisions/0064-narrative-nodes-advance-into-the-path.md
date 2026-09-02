# 0064 — A narrative node's "chapter complete" screen advances into the path

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Every v4 narrative node's own "chapter complete" screen fell back to
"Back to Story" (`/story`, the original flat Story-mode index) — Simon
flagged this as reverting to the wrong menu instead of moving the
learner forward into the next actual step of the v4 path (the unit's
next lesson node, or the next unit's own start narrative). This was a
known gap left over from `0057`/`0058`: `getNextChapter()` in
`data/story/chapters.js` deliberately only ever chains across the
original four-chapter `CHAPTERS` array, on purpose, since a v4 unit's
start node is followed by lesson nodes (not the next narrative node)
before its own end node — but nothing had been built yet to compute what
*should* come next for a v4 node specifically.

## What changed

`app/v4/page.js`'s own `UNITS` array and `stepsForUnit()` function moved
into a new `data/v4/units.js` — plain data plus pure functions, no
`"use client"`, so a server component can import it too. That module
gained `getNextPathStep(href)`: it flattens every unit's own step list
(in unit order, same sequence the path itself renders) into one ordered
array, finds the given href, and returns the very next step's
`{href, label}` — a lesson node if there's one left in the current unit,
otherwise the next unit's own start narrative, or `null` once there's
truly nothing left (the end of unit 8).

`ChapterPlayer` no longer assumes `nextChapter` is a Story-mode slug that
must be threaded through `/story/play/${slug}` — it now takes a plain
`{href, label}` and links there directly, plus new `backHref`/`backLabel`
props (defaulting to `/story`/"Back to Story" for the original four
chapters) for the "nothing left" case. `app/story/play/[chapter]/page.js`
checks whether the requested slug is one of `V4_CHAPTERS`: if so, it
calls `getNextPathStep()` and passes `backHref="/v4"`/`backLabel="Back to
Path"`; otherwise it keeps using `getNextChapter()` exactly as before,
so the original flat Story mode's own behavior is untouched.
