# 0056 — Story mode: card focus/glow, post-choice elaboration, and a round of polish

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

A single large playtest pass on the four shipped chapters, covering how a
revealed card behaves, how a wrong or right answer is acknowledged, and a
handful of smaller readability fixes. Recorded together since they landed
in one sitting and several depend on each other.

**A card stays in focus instead of shrinking away.** The single-card
reveal used to settle into a small "resting" spot beside the pile once
dismissed. Simon's call: it should keep taking up the majority of the
free space beside the character instead. `CARD_RESTING` is gone; a
revealed card just stays at (an enlarged) `CARD_FOCUS` for the rest of
the chapter.

**Multi-card readings get a `focusSlot`.** For a three-card reading, that
same focus spot is shared: whichever card is currently under discussion
sits there, its own table slot glowing to say so, and the other two
slots' cards grey out (`filter: grayscale`, not reduced opacity — Simon's
own correction, since opacity let the table linework show through and
read as washed-out rather than de-emphasized). A later beat can carry a
`slot` field pointing at a card already on the table, which animates it
back up into focus and re-glows its slot — this is what a unit's "quiz me
on what we already drew" follow-up beats use.

**Wrong choices stay disabled, they don't just flash.** `eliminatedKeys`
(reset per beat, not per app-load) tracks every option tapped wrong on
the *current* beat permanently — tinged red, `disabled`, no retry —
separately from `flashKey`, which only drives the brief shake/flash
animation and clears itself after 900ms.

**Elaboration bubbles.** A correct choice can carry a `beat.elaboration`
array — one or more reader-voiced lines shown in their own bottom-anchored
speech bubble (`.story-reader-bubble`, visually distinct from the
client's own bubble) before the beat actually advances. This is what let
every chapter's choice *options* get shortened to similar length and
complexity across the correct and wrong answers (previously the correct
option was often longer and more descriptive, which gave it away) — the
fuller reasoning moved into the elaboration instead of the option text.

**The client's speech bubble moved below the face, tail measured live.**
It used to sit above the character's head, overlapping the face. It now
sits at chest level with an upward-pointing tail, and that tail's
horizontal offset is measured directly off the DOM (the character's own
center) rather than a fixed percentage of the bubble's own width — a
percentage drifts off the character as dialogue length changes how wide
the bubble renders.

**Smaller fixes in the same pass:** any revealed or slotted card can be
tapped to view full-screen (`.story-zoom-overlay`); the plain narration/
reader caption moved off the stage into the content panel below it
(`.story-caption` is a normal block now, not an absolutely-positioned
overlay) — reversing part of `0050`'s "overlap on top of the image" call
for this one element, since the reader's own speech bubble and the new
elaboration bubble both still stay on-image; "Tap to continue" retires
after a few real taps, persisted in `localStorage` across chapters, since
the point is "the learner already gets the mechanic"; and the dev console
can now minimize to a small icon in the frame's top-right corner instead
of only ever being the full draggable FAB.
