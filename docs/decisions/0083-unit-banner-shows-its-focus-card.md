# 0083: A unit's banner names and shows its focus card, not its sequence number

## Context

The unit banner used to read "Unit N" over the narrative pun title (e.g.
"Dave's Leap of Fool"), with no visual indication of which card the unit
actually teaches beyond what the pun implies. Simon: change the structure
to a narrative title (the existing pun) with a subheading naming the focus
card, and make sure the path shows that card's own art on the banner
itself, not just later down the trail.

## What changed

`app/v4/page.js`'s unit banner button now shows, left to right: a small
card-art thumbnail, then the pun title with the focus card's name as a
subheading beneath it, then the fold/unfold chevron. "Unit N" is gone —
the pun already carries the character, and the card name underneath it
says the rest; a sequential number wasn't adding information the reader
needed.

## Built for a unit covering more than one card, even though none do yet

Simon: "later on there will be units that cover multiple cards... make
sure the design works when that's the case also but no content for that
yet." `UNITS`' own `cardSlug` field is still a single string — no data
model change here, since there's nothing to model yet — but the
*rendering* is array-based: `focusCards` is built by filtering `SECTIONS`
rather than a single `.find()`, the thumbnail row is a flex-wrap container
that already takes one image per entry, and the subheading joins every
focus card's name with " & ". A future unit with two or three cards needs
only its own data shape to grow into an array; this file's rendering loop
doesn't need to change to draw it.

The two review units (7, 8), which already technically span three cards
each via a single representative `cardSlug`, aren't touched — they still
show only that one card's thumbnail and name, same as before this change
in spirit (they showed no card indication at all previously). That's not
the "multiple cards" case Simon meant; treating it as such would mean
inventing which of the three review units should represent when nothing
asked for that.

## Verification

Checked visually in the browser: unit 1 ("Dave's Leap of Fool" / "THE
FOOL"), unit 9 ("Dave's Sleight of Hand" / "THE MAGICIAN"), and unit 7 (a
review unit, "Dave, Riley, and the Whole Deck" / "THE FOOL" — its
representative card, unchanged behavior). `npm run build` passes.
