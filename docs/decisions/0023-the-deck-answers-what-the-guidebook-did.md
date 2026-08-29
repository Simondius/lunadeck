# 0023 — The deck answers what the guidebook was for

**Date:** 2026-08-29
**Status:** Accepted

## Context

`0022` moved the Guidebook button around the unit heading twice and it still
did not sit right. Looking at the page it opened explained why: it was four
things, and three of them were duplicates.

Opened on day one, a unit guidebook showed the unit's intro paragraph, a row of
eight locked card circles, three stats, and a nine-row table listing every
section. Eight of those nine rows read `S1 — 7 exercises` with a dash where the
card's name goes, because names are withheld until earned. The circles repeat
the path. "Cards known" repeats the deck. "Minutes left" is an unverified
estimate from the CSV. The one thing with no other home was the paragraph.

Tia: *"i think that anything the guidebook gives, the player could get in the
deck tab instead. they should be able see the preview for each card. their
progress, collection, etc. when you tap on a card to read its detail there
should be some way to access its lesson?"*

## Decision

**The guidebook page and its button are gone.** `app/units/[unit]/page.js` and
`components/guidebook.jsx` deleted, with the dead CSS that served them; the
unit heading is now progress, name, chevron.

**A card knows where it came from.** `getAllSections` carries the unit name and
section id, and a card's page in the deck uses it twice:

- **Earned** — a link at the foot of the entry, *"Play this card's lesson
  again · First Light · Section 1"*. Replaying a finished section was already
  possible from the path, so this is a shortcut, not a new power.
- **Not earned** — a line saying *"Taught in First Light · Section 1"*, and no
  link. The path unlocks in order and a route straight into a future section
  would walk around that.

That is the guidebook's only non-duplicate job — *what is this and where does
it come from* — answered on the card you actually asked about rather than a
unit at a time, in a list of dashes.

## Consequences

**This deviates from `Spec_MainPath` §2**, which lists a Guidebook modal per
unit. Flagged rather than silently followed, per `CLAUDE.md`: the spec was
written before the path carried the sections inline, and a unit-level table of
contents is redundant once the path *is* the table of contents.

**`unit_intro_copy` is now unread by the app.** *(Tried on the path and taken
back off again the same evening — see 0022's third amendment. Both unit
sentences are unrendered by design now; the data stays for a surface that
wants them.)* It is the one thing the
guidebook held that nothing else does — the sentence explaining that "Cutting
Air" means the Swords suit turning hard. The names went image-led the same day
(`0022`), so that sentence matters more than it did, not less, and it currently
renders nowhere. The data is untouched and the obvious homes are the unit
heading of the unit you are currently in, or the recap intro at the end of a
unit. Deliberately left for Tia to choose rather than guessed at.

**The deck's locked cards still show a number in a dashed circle, not art.**
The ask mentioned a preview per card; withholding the art is what makes
finishing a section feel like earning something, so changing it is a design
call rather than a gap to fill quietly.
