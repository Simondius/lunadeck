# 0052 — Story's dev tools, and a decision-based progress bar

**Date:** 31 Aug 2026
**Status:** Accepted

## Context

Three small follow-ups from the same playtest pass as `0050`, all about
navigating and measuring a chapter rather than its content.

## The dev console's ‹ › skip controls now work in Story

`components/dev-console.jsx`'s skip buttons already existed for every
curriculum round (`lib/dev-console-bridge.js`'s `registerNodeSkip`/
`subscribeNodeSkip` pub/sub) - a node session mounts, calls
`registerNodeSkip({onNext, onPrev})`, and the console's own buttons appear
and forward taps back to whichever session is on screen. `ChapterPlayer`
now does the same: `onNext`/`onPrev` jump `beatIndex` directly (clamped to
the chapter's own bounds) and clear every transient bit of state a real
tap would - a wrong-answer flash, a bubble mid-dismiss - so skip never
strands the screen mid-animation state that only a real interaction would
have produced. Nothing about the reveal-card animation itself is
special-cased for skip: landing on a `reveal` beat via `›` still plays its
entrance in full, the same as arriving there by tapping through.

## The Story menu lists chapters by name, not one link to the index

The dev console's `Story` group had one action, "Open Story," linking to
the chapter index - a way in, not a way to any particular chapter. It now
lists every chapter as its own button (`Dave Part 1: The Reading Room`,
`Riley Part 1: Riley`, ...), pulled directly from `CHAPTERS` so a new
chapter appended to `data/story/chapters.js` shows up here with no
further wiring. Matches `Path`'s own subgroup, which has always listed
v1/v2/v3 by name rather than one generic "go to the path" link.

## The progress bar counts decisions, not beats

It tracked `chapter.beats.length` - every dialogue line, every reveal,
every choice, one segment each. That measures how much narration is left,
not how much of the reading the learner has actually *done*. It now
filters to `choice` and `draw` beats only: `decisionBeats.length` segments,
`decisionsDone` of them filled in, counted from how many decision beats
sit before the current one in the array. Chapter one, three choices and no
draws, now shows three segments instead of eight - each one a moment the
reader actually decided something, not a step through dialogue they only
watched.

## Verified

`npm run build` succeeds. In a real browser: the dev console's `›` button
advances chapter one from its opening line straight into the first
choice, skipping the tap; `‹` returns to the opening line correctly. The
Story group's menu lists both chapters by their part label and title, and
tapping one navigates straight to that chapter's play route. The progress
bar renders exactly three segments for chapter one (matching its three
choice beats) rather than eight.
