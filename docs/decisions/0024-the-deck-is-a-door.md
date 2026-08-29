# 0024 — The deck is a door, not a trophy case

**Date:** 2026-08-29
**Status:** Accepted

## Context

`0023` moved "where does this card come from" onto the card, but left two
things as they were: unlearned cards showed a number in a dashed circle rather
than art, and their entry named the section without linking to it. The
reasoning was that withholding the art is what makes finishing a section feel
like earning something, and that the path unlocks in order.

Tia took both apart in one line: *"yes but you can see the previews in the path
anyway - and what if a player wants to learn about a specific card and doesnt
like our linear path that makes that choice for them?"*

Both are right.

**The art was not being withheld.** The path shows every upcoming section's
card, greyed, with its name — Tia asked for that herself. So the deck was
hiding something the screen next door displays, and charging a new learner a
grid of 78 numbers for the privilege.

**And the linear path is a recommendation, not a fact about tarot.** Someone
pulls a card in the morning and wants to know what it means. Telling them to
play forty sections first is the app deciding something it has no business
deciding. The curriculum's order earns its keep by ramping difficulty, not by
being the only way in.

## Decision

**Every card in the deck opens.** Unlearned ones are greyed exactly the way the
path greys a section it has not reached — `grayscale(1) brightness(0.55)` at
0.72 opacity, the same values, so the two screens agree about what "you haven't
met this" looks like.

**Every card offers its lesson.** Learned: *Play this card's lesson again*.
Unlearned: *Learn this card now*. Both name the destination — "Beyond the Veil
· Section 5" — so a jump is a jump the learner can see themselves making.

The full entry stays gated on finishing the section. That is the part worth
earning, and now there is a one-tap route to earning it from the card itself.

## Consequences

**The curriculum ramps, and a jump skips the ramp.** Difficulty is carried by
`cards_to_recall_count` and by which cards a node's distractors are drawn from,
both of which assume the learner arrived in order. Someone starting at Beyond
the Veil gets four of the deck's most abstract majors as a first meeting. The
rounds still *work* — every distractor pool is built from the node's own cards
— but it will be harder than section one, and nothing warns them beyond the
unit's name. Watch this once real people use it; the fix, if it needs one, is a
line on the card page rather than a lock.

**The path keeps its order.** Locked sections on the path are still not
tappable. Two doors with different jobs: the path recommends a route, the deck
answers a question. Making the path tappable too would leave nothing recommending
anything.

**A section played out of order counts normally.** `completeSection` doesn't
care how the learner arrived, the path's "current" is still the first
incomplete section, and the streak and XP are per node. Nothing needed changing
for this to hold — worth noting because it is the kind of thing that usually
does.
