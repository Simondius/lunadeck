# 0029 — The takeaway gets a headline, and the card names get out of its way

**Date:** 2026-08-30
**Status:** Accepted

## Context

`0028` put the takeaway at the top of the screen and it looked wrong there.

Tia:

> *"this screen is pretty ugly now right? I'm wondering if the font
> inconsistency is playing a part here. That takeaway at the top of the screen
> just floating looks odd. I think it needs more special treatment. Perhaps by
> also introducing some break lines in the paragraph so it's not a wall of
> text."*

Measuring the computed styles found something neither of us had named: **the
hierarchy was inverted.**

| element | face | size |
| --- | --- | --- |
| `.takeaway` — the answer | Fraunces (display) | 19px, running 7 lines |
| `.detail-name` — a card's label | Fraunces | **21px** |

A card's name was set larger than the answer the whole screen exists to
deliver. That is the ugliness: the eye is pulled to a label.

Two other faults came out of the same measurement.

**A display face was doing body work.** Fraunces is high-contrast and built for
short bursts. Forty words of it ran seven lines and read as a slab, which is
the "wall of text" Tia named.

**The block changed alignment four times.** Takeaway left, position centred,
name centred, orientation centred, note left. Five elements, four switches.

## Decision

**The takeaway is split in two, and the split is structural rather than
visual.** The model now returns a `headline` alongside the takeaway: five to
ten words, a statement rather than a title, written last so it is informed by
everything above it in the schema.

This is deliberately not Tia's suggested mechanism. Inserting hard line breaks
inside a paragraph would fix the wall on one screen width and break on others,
since where a break lands depends on the viewport. Asking for a headline
achieves the same thing at any width and gives the display face something it is
actually good at.

**The display face carries one line; the body face carries the rest.** Headline
is Fraunces at 27px. Takeaway drops to Inter at 15px, in `--muted-warm`.

**Card names come down to 17px** so nothing below the headline outranks it, and
orientation folds onto the name's line rather than claiming a fourth row.

**Text in the block is left-aligned.** No more ping-pong.

**The card art stays centred.** Amended after Tia saw the first cut: flush
left it left a wide empty gutter down one side of every card. Centring an
image is not the same move as centring text, and conflating the two was an
over-correction. The four switches this decision removed were all text, and
those stay left.

**A left accent rule and a mono "TODAY" label anchor the block.** Tia's word
was "floating". A full panel was considered and rejected: the most important
thing on the screen usually wants space rather than a box, and the rule plus
the label borrow the app's existing label language without boxing it in.

## Consequences

**Measured after:** headline 27px over card name 17px, both Fraunces; takeaway
39 words across 5 lines of Inter instead of 7 of Fraunces; all five elements
left-aligned; no horizontal overflow.

**Three type families still appear on this screen** — Fraunces, Inter,
JetBrains Mono. That is the app's system, not a fault: mono is the label voice
everywhere in Lunadeck, and the path and deck use the same three. The problem
was never how many faces, it was which face was doing which job.

**The headline is another thing the model can get wrong.** It is required by
the schema, so a missing one fails validation and the route returns its
lost-their-thread error. A *bad* one — a title like "On momentum", or a card
name — is only guarded by the prompt. Watched, not tested; the note in `0027`
about undefended prompt rules applies to this one too.

**Legacy readings render without a headline.** `Takeaway` skips the line when
it is absent, so a draw stored before this change still shows its takeaway.
