# 0011 — The path is sections, and the course teaches before it quizzes

**Date:** 2026-08-29
**Status:** Accepted

## Context

Two problems, one of them serious.

**The path was showing units, not sections.** Tapping a unit opened a page
listing its eight sections; you picked one from there. Two levels of navigation
where a language-learning path has one.

This was a spec conflict nobody had resolved. `Spec_MainPath` Section 3 is
explicit — "a single, continuous vertical scroll spanning every unit the
learner has reached — **not a separate screen per unit**" — with unit banners
rendered inline in that scroll (3.1) and the Unit Menu demoted to something
that "plays no part in normal forward progress" (3.5). The violet handoff then
redesigned that screen as ten unit stops with progress rings, and the build
followed the handoff. The older spec was right and got quietly overruled.

**The course only quizzed.** Checked against all 577 rows: every `format_code`
is an exercise, and there is no `intro`, `teach` or `study` node type anywhere
in the curriculum. Node 1 of every section is labelled "first exposure" and it
is a multiple-choice question — the learner is asked to identify The Fool from
four cards before being shown anything about it, so the only available strategy
is guessing. A card's meaning appeared exactly once, in the reveal *after* an
answer. The teaching was the consolation prize for a guess.

## Decision

**The path is the sections.** One continuous scroll of all 92 of them — 78
standard, 10 recaps, 4 cumulative reviews — winding down the screen, with each
unit's banner inline immediately before its first section. Units stop being a
navigation step.

Node states follow Spec_MainPath 3.2, including the part the previous build got
backwards: **only a completed section shows its card**. Current and locked
nodes show no card identity, because the card is what finishing the section
gives you and the path shouldn't hand it over early. The current node is
enlarged and lit with a floating START callout; locked nodes carry a lock;
recaps are diamonds rather than circles so they read differently while
scrolling.

**A "meet the card" screen opens every section.** Card art, name, its planet or
sign (or suit, for a minor), its keywords, and its full meaning — then Start
the exercises. A recap has no new card, so it shows every card the unit taught
instead.

It is a screen rather than a curriculum node deliberately. A teaching node
would mean rewriting `data_curriculum_nodes.csv` — 577 nodes becomes 655, and
play order, unit counts and all three time estimates shift with it. A screen
costs nothing in the data and is where `Spec_MainPath` already puts a Lesson
Entry sheet (Section 4), which was specified and never built.

**No card content is authored.** Every string on the teaching screen already
exists in `data/` — `description_condensed`, `card_keywords`,
`major_arcana_symbols`, the base table's suit. CLAUDE.md forbids inventing card
content and nothing here does.

**The unit page becomes a guidebook.** Reference rather than navigation,
reached from a unit's inline banner: intro copy, the cards it covers, progress,
and a list of its sections. Card names stay hidden there until their section is
done, matching the path.

## Consequences

The teaching step is untimed and unscored — it is not a node, so it awards no
XP, cannot be missed, and does not appear in the progress bar. That is the
right shape for study, but it does mean a learner can skip straight past it,
and nothing records whether they read it.

The Unit Menu from Spec_MainPath 3.5 was not built. With every unit's banner
now inline on the path, scrolling is the menu for a ten-unit course; a separate
flat list would be a third way to reach the same places.

A locked path is 85 anonymous circles. That is the honest consequence of not
spoiling cards, and it is what the spec asks for, but it makes the far end of
the path visually repetitive.

Whether a single screen is *enough* teaching for a tarot card is a content
question this does not answer. It shows what the guidebook says. Whether a
learner should also be walked through the card's symbols one at a time, the
way the symbol formats test them, is open.
