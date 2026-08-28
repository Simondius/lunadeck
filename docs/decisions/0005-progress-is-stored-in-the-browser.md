# 0005 — Progress is stored in the browser, and a lesson is one section

**Date:** 2026-08-28
**Status:** Accepted

## Context

The violet redesign (`specs/Design_Handoff_Violet.md`) puts five numbers on
screen that the repo has never stored: which nodes are complete, which cards
are known, a day streak, XP, and hints left in a section. The handoff says so
plainly — "none exist in the repo today, so this is the one piece of real
backend work the redesign implies."

It also assumes a lesson is one **section**. Its progress bar is one tick per
step in a section, its unit page says "Resume Section 5", and its section rows
carry their own progress. The build until now played all 57–60 nodes of a unit
as a single session, which no segmented bar can represent — 57 ticks across a
420px shell is a grey smear.

## Decision

**Progress lives in `localStorage`, behind `lib/progress.js`.** The store
records completed node ids and nothing about the curriculum; every derived
number — per-unit rings, per-section bars, known cards, the overall count — is
computed where the curriculum data already is. Swapping in a real API means
reimplementing `read` and `write` and nothing else.

It is read through `useSyncExternalStore`, whose server snapshot is the frozen
empty state, so server-rendered HTML and first paint agree and the real numbers
arrive on the first client tick. Every storage access is wrapped — some
browsers throw on `localStorage` access alone when site data is blocked, and a
lesson that cannot save is still a lesson worth playing.

**A lesson is one section.** `/units/[unit]/play` becomes
`/units/[unit]/sections/[section]/play`, 92 routes. RECAP and CUMULATIVE are
sections too; they just hold one node and teach no new card. The node-level
detail the unit page used to list — format code, node id, distractor tier —
moves to `/units/[unit]/debug`, which is a diagnostic rather than a screen.

**Two constants are invented.** The design shows `+3 XP` on a reveal and
`HINT · 2` in a topbar but never says what awards XP or how many hints a
section starts with. `XP_PER_NODE = 3` and `HINTS_PER_SECTION = 3` are in one
block at the top of `lib/progress.js`. They are guesses that look right, not
decisions — an economy design should replace them.

## Consequences

Progress is per-browser and per-device. There is no account, so clearing site
data clears the curriculum. That is the right trade for a prototype and the
wrong one for a shipped app; Spec_Meta_Hygiene_Systems already describes the
account model that replaces it.

Streak logic is genuinely hard to check by hand — it only misbehaves a day
later — so `lib/progress.test.js` covers rollover, same-day repeats, gap
resets and month boundaries. `npm test` runs it.

Mistakes still aren't recorded. A node marks complete when its last instance is
answered, whether or not the learner missed on the first attempt, so the
mistake-review bridge in Spec_MainPath has nothing to read yet.
