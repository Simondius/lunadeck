# 0043 — The scanner actually reads the card

**Date:** 2026-08-31
**Status:** Accepted
**Supersedes:** the "card recognition is not real" half of `0042`

## Context

`0042` shipped the Guide tab with a placeholder where recognition should be:
capture a frame, pause, then offer a random card to confirm. Tia scanned a card,
was told the wrong thing, and pointed out that the repo already contains images
of all 78 cards, so guessing better ought to be possible.

It is, and it works.

## Why a vision call rather than matching the masters

The obvious reading of "you have the images" is template matching: fingerprint
the 78 masters, fingerprint the frame, take the nearest. That is free and works
offline, and it was the wrong choice here. A photograph of a card on a table is
rotated, perspective-skewed, lit from one side and surrounded by background. Any
hash of the whole frame is dominated by the table, so the real work is card-edge
detection and rectification, which is a substantial piece of image processing to
get right before the matching even begins.

The cards carry their own names in print. Reading text off a photograph is a
solved problem, so the deck's own labelling is a better signal than its pixels.
The repo's card list still does the important work: it is the enum the answer
must come from, so the model cannot invent a card, misname one, or return a key
that `liveSpreadFromKeys` would silently drop.

Haiku 4.5, not Opus. This is reading a name against a closed list, and it runs
once per card: a six card reading would otherwise be six Opus calls before the
reading itself. Note that Haiku rejects `effort` outright — "This model does not
support the effort parameter" — which is why this route has no `effort` where
the reading routes do.

## What the deck actually prints, which is the whole trick

Getting this right required opening the assets rather than assuming, and the
first two attempts failed because I assumed.

- **Major arcana.** Wide bottom banner: the name, "THE TOWER". Small top banner:
  a roman numeral, "XVI". Either identifies the card.
- **Court cards.** Bottom banner: the full name, "KNIGHT of SWORDS".
- **Numbered minors.** Bottom banner: **the suit alone**, "PENTACLES". The
  number is *not* there. It is an arabic numeral in the small top banner, "2".

That last case is the whole difficulty. "PENTACLES" narrows the answer to
fourteen cards, and the bottom banner is the easiest thing in the frame to read,
so a model that reads it and stops feels finished while being thirteen-fourteenths
wrong.

My first fix made this worse. Having assumed the name banner read "FOUR OF
PENTACLES", I instructed the model to read the whole name including the number
word. There is no number word, so it complied by inventing one: the Two of
Pentacles came back as "FOUR OF PENTACLES" at high confidence. A prompt that
asks for something that does not exist gets a confident fabrication.

## The two fixes that worked

**Both orientations in one request.** A reversed card is the same picture turned
180 degrees, so the route sends the frame as shot *and* rotated, and asks which
view is the right way up. Whichever way the card lay, one view has legible
text. `reversed` is then derived from the answer rather than judged: if the
rotated view is the upright one, the card was upside down.

This mattered more than expected. From a single view, identity on upside-down
cards was 3/6, and the wrong answers came back at *high* confidence — the Two of
Cups read as The Lovers, The World as The Moon. Unable to read inverted text, it
fell back to imagery and guessed confidently.

**A field per banner.** `bottom_banner` and `top_banner` are separate required
fields, both before `card_key`. Same trick as `READING_SCHEMA`'s ordering
(`0028`): the model fills the schema top to bottom, so asking for each banner
separately forces it to look at both before committing. With one combined field
it read the bottom banner, stopped, and returned "SWORDS" at high confidence,
never having examined the numeral that distinguishes the fourteen cards
answering to that.

Frames are normalised to 768px wide, sized for the small top numeral rather than
the easy wide banner.

## Measured

26 cases, every third card of the 78, alternating orientation. One run per
change, same cases each time.

| | identity | orientation | confidently wrong |
|---|---|---|---|
| single view | 21/26 | 26/26 | 4 |
| + "read the number word" (the bad fix) | 22/26 | 26/26 | 3 |
| + two views, one banner field | 23/26 | 26/26 | 1 |
| + a field per banner | **25/26** | **26/26** | **0** |

The remaining miss is the Four of Cups read as the Three, and it came back
`low`, so the app asks instead of assuming. That is the behaviour that matters:
**zero confidently wrong** is worth more than the last point of accuracy,
because a wrong answer at high confidence ends up in someone's reading and a
low one ends up as a question.

## What the confirm step does with confidence

It stays, and it is not an apology. A real photograph in a real room will
sometimes be wrong, and being asked is cheaper than finding a card you never
pulled in your reading.

- **high** — the card, stated, with a way to change it.
- **low** — the card, offered as a question, with the picker one tap away, and
  the reason said plainly: the name could not be read, so this came from the
  picture.

The identified card is shown the right way up even when it was pulled reversed.
The question on this screen is *which card*, and turning the answer upside down
to mirror the photo makes the name harder to read. Orientation is carried by the
checkbox, which arrives already ticked.

## Two bugs found by testing rather than reading

**Capture could be a dead tap.** `stage` became `live` when `play()` resolved,
which can happen before the first frame arrives, and `capture()` then returned
silently on a zero-width video. Capture is now gated on a frame having arrived
and being at least 240px wide, with the hint saying so. Found against a
canvas-backed stream that reports 2x2 until its first paint, which produced a
capture the server correctly rejected as too small to be a card.

**The scanner ran full width.** It was the one screen in the app not capped at
`--shell`, so on a desktop frame the two confirm cards grew to 370px each and
pushed the button that accepts them off the bottom — the same complaint as the
Reading tab's draw button. Capped, with a `max-height` on the images as well.

## Verified

The route, against 26 repo masters, as above.

The client path, end to end through the UI, by pointing the video element at a
canvas-backed `MediaStream` showing a real card: capture, the identifying state,
the live call, and the confirm screen. Upright gave "The Tower" with
high-confidence copy and the checkbox clear; the same card drawn upside down
gave "The Tower" with the checkbox **already ticked**, and accepting it stored
"The Tower reversed" with no manual input. The failure state renders the route's
own message. Checked at 375x812 and on a desktop frame, with the accept button
above the fold in both.

`next build` compiles, 43 tests pass, `check_rounds` clean.

## Still not verified

**A real camera, and a real photograph.** The Browser pane blocks device
capture, so every frame tested has been a clean render of a master image, not a
card on a table in room light at an angle. The accuracy above is an upper bound,
and the failure modes on real photographs are unknown. Recognition degrading to
`low` and asking, rather than to a confident wrong answer, is the thing designed
to hold when that happens.
