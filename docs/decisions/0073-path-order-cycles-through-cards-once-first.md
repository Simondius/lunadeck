# 0073 — The path cycles through every card once before repeating any

**Date:** 3 Sep 2026
**Status:** Superseded by 0074, same day

Simon's follow-up call, after seeing this in the browser: this fixed
the repeats but produced Dave's *entire* arc playing before Riley's
starts, which read as its own kind of wrong (he explicitly wanted the
characters to keep alternating). 0074 keeps the "no card twice in a row"
goal but gets there a different way - by having Riley teach a different
card order instead of reordering the array - so plain numeric 1-8 order
(the original array, restored) alternates *and* never repeats.

`UNITS` (`data/v4/units.js`) used to play straight through 1-8: two units
on the Fool back to back (1, 2), then two on the Lovers (3, 4), then two
on the Empress (5, 6). Simon's call: back-to-back repeats of the same card
read as repetitive. The array's own order is now 1, 3, 5, 2, 4, 6, 7, 8 -
one unit per card, then cycle back for the second - while every unit's own
`unit:` number, character, and content stay exactly as they were; only the
*order* they're offered in changed.

This is safe alongside the multi-card end-readings each unit's own
narrative leans on (unit 3's end reading references unit 1's Fool
reading, unit 5's references both; unit 4 references unit 2, unit 6
references both): each character's own units still play in increasing
order relative to *each other* (1 before 3 before 5; 2 before 4 before 6),
which is the only ordering those references actually depend on. Dave's
whole arc now plays uninterrupted before Riley's starts, rather than
alternating - a side effect Simon didn't ask for by name but which follows
directly from "no card twice before every card once."

`getAllSteps()`/`getNextPathStep()` (`data/v4/units.js`) and `/v4`'s own
path rendering (`app/v4/page.js`) both already iterate `UNITS` in array
order, so reordering the array was the entire change - no other file
needed to change for the path itself to reflect it.
