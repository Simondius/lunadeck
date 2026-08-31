# 0028 — The takeaway is asked for, not sliced off

**Date:** 2026-08-30
**Status:** Accepted

## Context

Three problems with the reading as `0026` shipped it, all Tia's:

> *"I think it will be hard to appreciate the cards on a phone screen which is
> much smaller. I also think some users will just want the pithy final
> paragraph and not care about the rest."*

**The cards were too small.** Three abreast measured 104×186 in a 375px
viewport — about 1.5cm wide on a real phone. `UX_Style_Guide` §3 says card art
should default to the largest size the available vertical space allows *on
every screen that shows it*, and three-in-a-row was already stretching that.

**The answer was buried.** The synthesis was the last paragraph, under three
paragraphs of working. Most people want the answer.

**The detail had no anchor.** One prose blob meant nothing tied a paragraph to
the card it was about.

Her proposal was to promote the last paragraph to the top and move each of the
other paragraphs under its card. The first counter-argument raised was that
this would break the woven quality — the prompt says a reading is *"the shape
the three make together, not three separate paragraphs stapled up"* — and that
per-card notes would be the stapled-up version.

That was wrong, and Tia said so:

> *"it's not separate from the takeaway... in the screenshots, first paragraph
> is how the Knight of Swords plays into it, and same theme for the following
> paragraphs. That's what I'm suggesting be moved under the image of each card.
> Not something disconnected from the takeaway."*

The reading already had this structure. Paragraph one was the first card's
contribution, two the second's, three the third's, four the synthesis. And the
joins carried it: *"What's pressing on that is…"*, *"And the Hierophant at the
end says if that holds…"*. The ask was to surface a structure that existed, not
impose one.

## Decision

**The reading comes back structured, not as prose to be cut up.**
`client.messages.parse` with `READING_SCHEMA`: three notes, one per card, then
a takeaway.

This is the part that is not merely cosmetic. Slicing the last paragraph off
would have promoted whatever happened to be there, and it was only sometimes a
summary — earlier readings ended on a fragment of the third card's argument
(*"Speed on its own won't get you there."*) and on a question back to the
person (*"I'd ask which project you abandoned most recently…"*). Both are good
last lines and neither works as a headline. Asked for explicitly, a takeaway
gets written to be one.

**Field order in the schema is load-bearing.** `cards` first, `takeaway` last,
because the model fills the schema in order and the takeaway has to be written
*after* the notes it summarises. Ask for it first and it becomes a preamble the
reading then justifies, which is backwards.

**The notes stay one argument.** The prompt is explicit that note two picks up
where note one left off, that note three says where it lands, and that the
joins stay intact. Someone reading all three in order gets one reading.

**The takeaway must stand alone.** It may not name the cards, refer to "these
three", or say "in summary" — most people will read it and nothing else.
25–45 words. Notes are 40–65 each.

**Cards render one per row at 60% of the frame.** Measured 199px wide against
the old 104px, canonical `--card-ratio` preserved.

**Notes are matched to cards by position, not by name.** The schema carries the
card name on each note purely so the route can check the model kept the order
it was given. A mismatch is logged, never repaired: silently reordering would
hide a prompt that had stopped working.

## Consequences

**Readings stored under the old shape still render.** A `dailyDraw` or
`lastReading` holding a prose `reading` and no `takeaway` falls through to the
previous layout rather than being discarded and bought again. That fallback can
go once nobody has one, which for a per-browser store means whenever we like.

**The waiting state kept its cards.** The detail layout only appears once the
reading lands, so the three sit in the old small row while the reader is
considering. Without that the screen would be empty for ~8.5s, which `0026`
deliberately fixed.

**Structured output is a second thing that can fail.** `parsed_output` is null
when the model's JSON does not validate, and the route now has a distinct error
for it (*"The reader lost their thread"*). Not seen in testing, but it is a
failure mode that did not exist when the reply was free text.

**Still to do: the full-screen sequenced reveal.** Tia asked for the three to
animate one at a time, full screen, before landing on this page. Deliberately
held back to a second change so the information architecture could be judged
first — if per-card notes had read badly, that would have been the cheap moment
to find out. It also has a real benefit worth stating: the reading takes ~8.5s
and three sequenced cards take roughly that, so the animation would hide the
latency rather than add to it. `Spec_Daily_Draw_Tab` §3 already specifies a
full-screen card reveal; follow its interaction rather than inventing a second.
