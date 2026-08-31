# 0032 — The mentor moves out of the reading

**Date:** 2026-08-30
**Status:** Accepted

## Context

Tia:

> *"introduce a fourth tab, called 'mentor', use the image of the reader in
> this tab and leave it at that for now. Then remove all notion of the reader
> character on the reading tab. Just replace the imagery with the image you
> have of the front of the zodiac tarot card series for now."*

The reader was doing two jobs at once. It fronted the Reading tab as a
character — a portrait, a first-person invitation, "Ask the reader", "the
reader is considering" — while what the tab actually delivers is a reading of
three cards. Splitting them lets each be one thing.

## Decision

**A fourth tab, Mentor**, at `/mentor`, carrying the reader art and a line
saying it is not built. Nothing else. The tab bar was already
`grid-auto-flow: column` with `1fr` columns and rebalanced on its own; all four
tabs measure 79px and sit inside the frame.

Saying *"Not built yet"* rather than dressing the screen up is deliberate, and
it is the same judgement `0025` made about the disabled "Ask a question" button
it inherited: a control that appears to offer something it cannot do is worse
than an empty room with a sign on it.

**The Reading tab loses the character entirely.** Not just the portrait — every
user-facing string that spoke as a person:

| was | now |
| --- | --- |
| "Sit. The deck is cut and the candles are low. Three cards for the day ahead, and I'll tell you what I see in them." | "Three cards for the day ahead, and what they add up to." |
| "Ask the reader" | "Ask a question" |
| "The reader is considering…" | "Reading the cards…" |
| "The reader couldn't answer." | "Couldn't answer that one." |
| "The reader's account is out of credit." | "The account is out of credit." |
| "The reader lost their thread." | "The reading came back malformed." |

**Its image is the deck's own front**, which is what the tab is about now.

## Consequences

**`SYSTEM_PROMPT` still opens "You are the reader in Lunadeck".** That is the
model's persona, not a user-facing name, and the readings never announce it —
but they do speak in the first person (*"I'd ask which project you abandoned
most recently"*). Left alone deliberately: the voice work in `0027` is three
rounds deep and re-pointing the persona risks undoing it for a change nobody
can see. Worth revisiting once the Mentor tab has a job, because *who* is
speaking in a reading is then a real question rather than a naming one.

**The route is still `/reader`, and so are the class names.**
`reader-screen.jsx`, `.reader-greeting`, `.reader-portrait`, `.reader-intro`.
Renaming them is churn for strings nobody sees, and the tab bar comment already
records why the route kept its name. Flagged so the next person knows the
mismatch is deliberate rather than a leftover.

**The deck box lid still carried the white bleed, and now does not.**
`0019` trimmed the 78 card masters; `assets/misc/deck_box_lid_MASTER.png` was
not in that pass and still had **26 solid near-white columns** of its 840 —
inside the 24-to-27 range `0021` measured across the card set, so the same
export batch and the same fault. It went unnoticed because the lid was only
ever shown as a small deck-back button; at full size on the greeting it would
have read exactly as the "card is cut off" complaint that started `0019`.

`scripts/trim_export_bleed.mjs` does the trim, refuses to run on an image
without a strip so re-running is safe, and takes any path. Spot-checking three
card masters with it returns "no bleed found", which independently confirms
`0019` did what its record says. Trimmed: 814x1456, ratio 0.559 — the canonical
`--card-ratio`, which is further confirmation it came from the same export.

**The deck front is sized from its height, not its width.** Width-first plus
the greeting's `54dvh` cap cropped 54px off the top and bottom and took the top
of the ZODIAC wordmark with it. Acceptable on a photograph, wrong on a printed
cover, where a sliced title reads as a rendering fault. Height now drives width
through the ratio: 262x470 against a source of 814x1456, ratios matching to
within 0.0007, so nothing is cropped at all.
