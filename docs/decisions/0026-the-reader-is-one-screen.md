# 0026 — The reader is one screen, arriving in order

**Date:** 2026-08-30
**Status:** Accepted

## Context

`0025` built the Reader tab as two beats and showed both at once. Opening the
tab gave you, in a single scroll: a portrait, a paragraph, a photo of the
physical deck box, a "Tap the deck" hint, and — already visible, before you had
drawn anything — the "Ask the reader" heading, its text box and its button.

Tia, on seeing it:

> *"I want the first thing you see each day to just be one image with perhaps a
> description and a button… I don't need this ask the reader and this big
> portrait picture of the zodiac tarot deck and booklet thing. I just want it to
> be one kind of, like, good looking, cohesive thing."*

Two separate problems, and only one of them is layout.

**The screen showed its own machinery.** Three controls competing on first
paint, two of which do nothing yet. A tab that is meant to feel like sitting
down with somebody opened like a control panel.

**And `0025` withheld the wrong thing.** It made a point of the nightly three
being uninterpreted — cards, names, keywords, nothing more — on the reasoning
that an interpretation was what asking a question *bought*. But the daily draw
is the thing most people will do most days, and the reasoning left it as the
one part of the tab where the reader does not speak. Tia's ask reversed it:
*"three cards are pulled, the reader explains their point, as it already
does."*

## Decision

**One screen, arriving in order.** Before the draw: the reader's image, their
name, one line, one button reading *Daily draw*. Nothing else — no deck box, no
second heading, and no sign that asking questions exists.

**The daily draw gets a reading.** Same route, same grounding, same voice. The
request simply carries no question, and `dailyPromptFor` asks the reader to
read the three as what today is shaped like. The system prompt is explicit that
a question-less draw must not have a question invented on the person's behalf,
and must not assume anything about their circumstances the cards did not say.

**Asking appears underneath, after the draw, behind a rule.** It is the second
half of the screen and reads as a new offer rather than more of the same.

**The cards land before the reading does.** Dealing is instant and local;
the reading is an ~8.5s network call. So the three are on screen in under
400ms and the wait happens *under* something rather than instead of it.
Measured: cards at 359ms, reading at 8540ms.

**The daily reading is stored on the draw it belongs to.** `recordDailyReading`
writes it onto `dailyDraw`. Without that, every reload would buy the same
reading again, and the reader would say something slightly different each time
about a spread that had not changed. Verified: a hard reload re-renders the
stored words with zero further API calls.

**The client chooses the daily spread, the route accepts it.** Only the client
knows what the curriculum has taught, and the three are seeded by the date so
the day deals the same cards however often the route is asked. The route now
takes an optional `cards` array and resolves it through `spreadFromKeys`, which
drops any key not in the deck rather than trusting what arrived over the wire.

## Consequences

**The daily draw now costs an API call.** One per person per day, plus one per
question. Previously the daily draw was free. At roughly a third of a penny a
reading this is not a real cost yet, but it is the first thing in the app that
spends money simply by being opened, and it will scale with users rather than
with usage.

**A dealt draw whose reading failed is a state that exists.** The cards are
written the instant they are dealt; the reading arrives seconds later. Close
the tab in between, or lose the network, and you keep your cards and get a
*Try again* under them. The fetch is guarded on both the stored reading and the
error state so a re-render never quietly buys a second one.

**`0025`'s "the nightly three shows cards, not lessons" is superseded.** The
reader now speaks about the daily three. What survives from that decision is
the part that mattered: the tab still teaches nothing, still tests nothing, and
still sources every claim about a card from the guidebook rows.

**The greeting is centred against the tab bar, not the shell.** First attempt
used a guessed `calc(100dvh - 200px)` and sat 85px high, because the shell's
own bottom padding — `calc(var(--tabbar) + 26px)` — was inside the block being
centred. Now `calc(100dvh - 26px - var(--tabbar))`, with the shell's clearance
padding dropped on this screen since nothing scrolls under the bar. Residual
imbalance 15px, top-weighted.
