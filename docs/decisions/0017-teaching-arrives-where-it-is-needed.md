# 0017 — Teaching arrives where it is needed, not all at once up front

**Date:** 2026-08-29
**Status:** Accepted

## Context

`0013` fixed A2's unreadable options and noted the learner had seen them
before. `0015` removed the description from the intro and noted they now
hadn't. `0016` narrowed the intro to two or three keywords and noted it again.
Three decisions in a row observed the same hole and none of them closed it: node
2 asks "which meaning belongs to this card?" against four sentences the learner
has never read.

Tia, playing it: *"i see what you mean about having never seen this description
before. the fix should be just like the previous lesson, if this is the first
time you're see something, have a previous lessons that informs the player."*

The pattern was already in the app; it just only ran once. The section intro
teaches the keywords and the keyword round asks for exactly those (`0016`).
Everything after that beat was quizzing content that had never been shown.

## Decision

**Teaching is a beat inside the section, placed immediately before the first
round that needs it** — not a single screen at the top that has to carry
everything the section will ask.

The meaning gets the first one: after the keyword round, before A2, a screen
showing the card and its opening line, ending on "Remember this — you'll be
asked next." The same promise the keyword screen makes, and true for the same
reason.

The teaching text is the *naming* opener ("The Fool stands at both the start
and end…") while A2's correct option is the *anonymised* one ("This character
stands at both the start and end…"). Same sentence, different subject, so
`0013`'s no-name-leak rule holds and the round still can't be won by spotting
the card's name.

**It is not a node.** No XP, nothing to miss, never queued for review — a
screen you pass through, like the section intro. It does take a tick on the
progress bar, which already counts screens rather than nodes.

**It only appears at a first meeting.** A round declares what it needs
(`teaches: "meaning"`), and the play page places a beat before the first round
in a *standard* section that needs it and answers to that section's own card. A
review section re-serving a card the learner already met gets nothing; a recap
section gets nothing.

Matching is on the round's `answerKey`, not the node's card key: the node shape
that reaches the client carries no card key. Worth remembering — the node
object inside `lib/rounds.js` is much richer than the one the browser sees.

## Consequences

**A2 is recognition again, on purpose.** The learner reads the sentence, then
picks it out of four a moment later. That is what the keyword round does too,
and the section still escalates past it: node 4's talking points and the
true/false statements ask for the same card without the sentence in front of
them.

**Notes are the next gap.** Node 4 asks "which reading notes belong to this
card?" against text the learner has never seen — exactly the same hole, one
node later. The mechanism is already general: those rounds are marked
`teaches: "notes"`, and nothing consumes that yet. Left undone deliberately,
because the teaching text there would be the correct option verbatim, and that
wants a moment's thought about whether the beat should show all three notes or
one.

**A section is now up to nine screens.** Eight rounds plus a beat, plus the
intro. Worth watching for length, especially once notes get a beat too.
