# 0008 — A section commits atomically, and misses get a second look

**Date:** 2026-08-29
**Status:** Accepted

## Context

`Spec_MainPath` Section 7 describes a step between the last exercise of a
section and its completion screen: if anything was missed on the first
attempt, a bridge screen appears, and every missed exercise is re-served in
its own real format before the lesson can close. Section 7.4 then says
something the build contradicted:

> exit straight back to the Path with nothing saved for that attempt … a
> section is either fully completed (including its full review queue) or it
> didn't happen.

Until now each node committed to the store the moment you passed it. Leaving
halfway kept whatever you'd done, and there was no queue to leave in the
middle of.

## Decision

**A section commits in one write, at the end.** The session holds completed
nodes, misses and hints used in memory and calls `completeSection` once —
after the review queue, when there is one. Abandoning calls nothing, so
nothing is saved. This is what makes 7.4 true rather than aspirational, and it
removes the partial-section state that a resume feature would otherwise have
to reason about.

Two consequences fall out of the single write. XP and the streak are awarded
per section rather than per node, and a section replayed after completion pays
out nothing a second time — `completeSection` only counts nodes it hasn't
already banked.

**The queue is evaluated once, at the end of the run**, not per node, exactly
as 7.1 says. It holds *instances*, not nodes: a six-card sort that went wrong
on the fourth card replays the fourth card, not all six. Each replayed screen
is tagged "Second look · Review n of N" where the format line normally sits.

**The close control now returns to the Path**, from the lesson, the bridge and
every review screen, per 7.4 — previously it returned to the unit page.

## Consequences

**Format B cannot "retry until correct" in review.** 7.3 says a round never
ends on a miss during the review either, but Format B's whole mechanic is that
a wrong answer ends the round immediately with no retry — the Bible calls this
out as an explicit override of the shared model. Re-serving it and demanding a
correct answer would mean asking a binary question whose answer the learner has
just been shown. Here, B advances once resolved and the donor reveal does the
teaching. Formats A and C are unaffected: both already require a correct answer
before they will advance.

**The exit copy blends two specs.** `Spec_MainPath` Section 8 wants
"Perfect lesson!" and "Lesson complete!" as the two headlines; the violet
handoff's completion screen is card-centric — "The Empress / is yours". The
handoff wins on the headline, as the newer design pass, and Section 8's
distinction moves into the body copy, which reports first-try accuracy and
then either "Every one, first try" or "…the questions you missed will come
back around soon."

Not built: a mid-lesson resume, which 7.4 explicitly rules out, and the
spaced-repetition scheduling that would make "come back around soon" literally
true. Misses are recorded per node and nothing yet re-serves them in a later
session.
