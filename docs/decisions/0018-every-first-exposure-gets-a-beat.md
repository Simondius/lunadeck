# 0018 — Every first exposure gets a beat

**Date:** 2026-08-29
**Status:** Accepted

## Context

`0017` built the teaching beat and used it once, for the meaning, and closed by
naming the next hole: node 4 asks "which reading notes belong to this card?"
against notes the learner has never read.

Tia: *"Yes fix it in all places."*

Auditing the formats turned up a third, older hole. `0015` removed the symbol
line from the intro — correctly, it was clutter on a first meeting — and the
symbol formats (A4, A5, A7, 26 instances) went on quizzing a symbol the course
had stopped showing anywhere. That one had been live for three decisions
without anyone noticing, because the intro screen it used to live on was never
the same screen as the round.

## Decision

**Every round declares what it assumes the learner has been shown.** A `needs`
helper in `lib/rounds.js` puts `teaches` and `teachesFor` on the round, and the
play page walks the section in order, dropping a beat in front of the first
round that assumes something about this card the section hasn't shown yet.

| topic | who assumes it | the beat shows |
| --- | --- | --- |
| keywords | A1 keyword picker | the section intro, already |
| meaning | A1 anonymised, A2 meaning, C boards | the card and its opening line |
| notes | A2 talking points, B true/false | the card and its first three reading notes |
| symbol | A4, A5, A7 | the icon, its label, and its phrases |

A3 (Major or Minor Arcana) carries nothing. It doesn't test the card's content
— it tests a category the course explains nowhere, which is a real gap but a
different kind, and inventing an explanation would cross `CLAUDE.md`'s "never
author card content" line.

The notes and symbol beats list their content, where the rounds that follow
join it into a sentence: the same material, a different shape, so the round is
not matching a string it just read.

Placement is derived, never hard-coded to a node number. A section gets a beat
if and only if one of its rounds assumes that topic about that section's own
card — 92 sections audited against the prerendered pages, zero mismatches.
Recaps and review sections get none.

## Consequences

**182 beats across 78 sections**, and a section is now 2 to 23 screens, median
16 — three more than before at the top end. That is the cost of not quizzing
unseen material, and it is worth watching: if sections start to feel long, the
lever is the number of rounds, not the teaching.

**`load()` now memoises.** The play page went from four CSV reads to eleven, on
92 sections. The files are read-only at build time, so they are parsed once per
process; the full build runs in about 13 seconds.

**A2's options are recognition again, and that is now the design.** Read it,
then pick it out of four a moment later. The section still escalates past
recognition on its own: the true/false statements and the board matching ask
for the same cards with nothing in front of the learner.

**The check outlives the audit.** Placement was proved once, by diffing every
section's rounds against its prerendered HTML — a one-off. What stays is
`check_rounds.mjs` asserting that every round declares a `needs` topic and
names cards for it, A3 excepted. Deleting one declaration fails nine
instances, which is the point: the symbol gap survived three decisions because
nothing broke when the teaching went away, and a silent hole is the only kind
this codebase has actually shipped.
