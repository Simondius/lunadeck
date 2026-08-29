# 0012 — Depth arrives after the gist, in the deck

**Date:** 2026-08-29
**Status:** Accepted

## Context

`0011` gave the course a teaching step, and then trimmed it: a first meeting
now shows the card, its symbol, its keywords and one orienting line, because
the section's own exercises escalate from keywords to the condensed
description to the collated talking points.

That left the other half unbuilt. Once a learner can pull a few cards and
half-read them, the education should get deeper — and nothing did that. The
deepest tier in the data, `description_text`, was **unused by the app
entirely**, and the deck showed the same condensed description whether the card
was learned an hour ago or weeks ago.

## Decision

**A card's full entry lives at `/deck/[card]`**, reached by tapping it in the
deck. In depth order: the art, its symbol, its keywords, the guidebook's full
reading, what the symbol itself means, and the notes for reading it in a
spread.

The full guidebook text earns its place rather than repeating what the learner
already has: measured across all 78 cards, `description_text` shares a median
similarity of **0.03** with `description_condensed` and runs roughly double the
length. It is a different treatment, not a longer one.

**Depth is gated on knowing the card, not on a progress threshold.** A card
whose section isn't finished shows a locked page explaining what opens there.
Any other rule — "after N cards", "after a review" — would be an invented
number, and the learner already tells us they're ready by tapping in.

**The reversed reading appears only once the card has actually been pulled
reversed.** Reversed meanings are a later unit in the curriculum — Format A6 is
deliberately excluded from the main path — so handing them over with the
upright entry would run ahead of the course. The daily draw is what introduces
them, and the deck then keeps them.

Every layer exists for all 78 cards: no card is missing a guidebook entry, a
symbol, symbol phrases or reading notes.

## Consequences

The deck stops being a wall of art and becomes the reference the app was
missing. That is also where an AI reader would eventually draw from.

The card pages are statically generated, so all 78 entries ship in the build
whether or not a learner has earned them. The lock is a UI state, not a
security boundary — someone typing a URL can read a card they haven't reached.
For a tarot reference that seems the right trade, but it is a choice, not an
oversight.

Nothing yet deepens the *daily draw*, which still shows the condensed
description for a card you may know well. The same page could back it.
