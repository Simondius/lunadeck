# 0042 — The Guide reads your own deck

**Date:** 2026-08-31
**Status:** Accepted

## Context

Mentor held the reader's portrait and the line "Not built yet." `0032` said it
would stay that way until it had a job. Tia gave it one: support someone doing a
live reading with real cards. Renamed to **Guide** to match.

The flow she asked for: start a reading, scan cards and be told what they are,
say when you have finished, submit for interpretation, then ask more about the
cards or scan further ones if you pull again. Share the session. End it and
start fresh.

## Why this is a different feature from the Reading tab

Reading and the daily draw both deal for you. The app picks the cards, so it
knows the spread, fixes it at three, and assigns each card a position it wrote
itself.

None of that holds here. A person is sitting with a physical deck, has laid out
however many cards they felt like, in whatever arrangement they use, and is
telling the app after the fact. So:

- the count is variable, not three
- the cards carry no positions, because nobody assigned any
- more cards can arrive mid-session, and the reading has to be redone

Hence `lib/live-reading.js` rather than an extra branch in `lib/reading.js`.
The live prompt has a section the dealt one cannot need — **what you do not
know** — telling the reader not to refer to a card's position, not to say "the
first card", and not to invent a spread shape. Verified in the live output: zero
positional references.

Adding a card discards any interpretation already given. `lib/guide-session.js`
does that, not the screen, so no caller can forget. A reading of five cards is
not a reading of six with a paragraph bolted on.

## What is real and what is not

**The camera is real.** `getUserMedia`, rear lens by preference, live
viewfinder, and the captured frame is kept and shown. It needs `localhost` or
HTTPS, and it degrades: denied access and a browser with no camera both fall
through to choosing the card by hand, with the reason said plainly.

**Card recognition is not.** There is no vision model wired up, so the step
between "captured" and "this is the Eight of Cups" is a placeholder.

That placeholder is shaped as a **confirmation** rather than an assertion, which
matters twice over. It does not lie: the screen asks whether it got the card
right instead of announcing that it did. And it is not throwaway work, because
real recognition needs this step anyway — a photo of a tarot card in a dim room
at an angle will be wrong often enough that confirm-and-correct is part of the
feature rather than an apology for it. One muted line admits the guess is
currently random, so a playtester with a real deck knows why it keeps being
wrong and goes straight to the picker instead of concluding the tab is broken.

**Sharing is drawn, not wired**, as Tia asked. The four targets are `disabled`
rather than absent: the shape stays reviewable, and nobody taps one expecting a
share sheet and gets silence. The glyphs are CSS shapes, not brand marks —
shipping a logo is a trademark question this prototype does not need.

## The voice is one definition

`VOICE_RULES` and `WHERE_YOU_STOP` are now exported from `lib/reading.js` and
composed into all three prompts (dealt reading, live reading, follow-up).

This is the part most worth getting right. It took three rounds to stop this
prose sounding machine-written (`0027`), and the em-dash ban had to become code
because a prompt budget is a request. A second reader carrying its own copy of
those rules would undo that in one tab only, which is the hardest kind of
regression to notice — nobody diffs two prompts looking for a missing bullet.
The safety block is shared for the stronger version of the same reason: it is
what sends a health or money question to a professional, and it must not be
possible for one tab to have it and another not.

`SYSTEM_PROMPT` was verified byte-identical after the extraction, by capturing
it before and comparing.

## Smaller decisions

**Own storage key.** The session lives in `lunadeck.guide.v1`, not in
`lib/progress.js`. It is not progress: nothing is earned, nothing counts toward
a streak, and a reading someone did with their own deck should not be able to
corrupt the record of what they have learned. Clearing either leaves the other
alone. It persists at all because the cards are on a physical table, and losing
a session to an accidental refresh means picking six cards up and rescanning.

**Reversals are first-class.** A physical card lands reversed, and every scanned
card has a Flip control. This is the one place in the app where the data comes
from a person reading a real object, so it is the one place a mistake needs
undoing without starting over. Both repairs, flip and remove, are 44px tall:
the posture is someone holding a card in their other hand.

**Follow-ups are prose, not a schema.** One answer to one question has nothing
to lay out, and a schema would only add a way for it to fail validation. The
turns are sent as alternating messages rather than flattened into one prompt, so
the model sees its own previous answers as its own. That worked: asked why a
reversal mattered, it referred back to a phrase from its own earlier note.

**Shared API error handling.** `lib/api-errors.js`, used by both routes. The
credit-balance case is why: the reader's first live call ever failed on an empty
balance, the route flattened it to "couldn't answer (400)", and we went looking
at the request instead of the account. That fix is worth having once.

**`useScrollLock`.** The scanner and both dialogs hold the page still. This
already existed as an inline pattern in `card-reveal.jsx` and
`friends-screen.jsx`; rather than add a fourth copy it is now a hook, with
those two left alone because their locks sit inside effects already doing
something else.

## Verified

The whole flow, with real browser input: start, camera blocked and falling
through to the picker, search narrowing 78 cards to one, two cards scanned, one
flipped to reversed, both persisted. A real interpretation came back with zero
em dashes, zero positional references, and the reversed card read as reversed
from its guidebook row. A follow-up came back grounded in the prior answer. The
session survived a reload with the reading and the follow-up intact. Ending it
asked first, cancelled on Escape, and on confirm cleared the guide key and left
the progress key alone.

Both routes' validation paths return the right message, including the reading
route after its error handling was extracted. 43 tests pass, `check_rounds` is
clean, `next build` compiles.

## Not verified

**The camera has never been seen working.** The Browser pane blocks device
capture, so every run of this took the fallback path. The `getUserMedia` call,
the viewfinder, the capture-to-canvas and the rear-lens preference are all
unexercised. Tia's own Chrome on `localhost` will prompt for permission and is
the first real test of that half.
