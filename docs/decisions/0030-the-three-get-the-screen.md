# 0030 — The three get the screen, one at a time

**Date:** 2026-08-30
**Status:** Accepted

## Context

Tia, with the rest of the reader restructure:

> *"after drawing, animate all three cards one at a time, sequenced, full
> screen take over, then back to the reader page."*

Two reasons this earns its place, and the second is the one that is easy to
miss.

**The art has never had the screen.** Three abreast rendered at 104px. `0028`
took the detail list to 199px and `0029` to 285px, and it is still a card in a
list you scroll past. This is the only moment the illustration gets looked at
rather than referred to.

**It is also where the latency goes.** The reading is a network call that takes
about 8.5 seconds. Three cards at 2.6s each is 7.8s plus the exit. Measured end
to end: the reveal finishes at ~11s and the takeaway is already rendered
underneath — `readingAlreadyIn: true`, `stillConsidering: false`. The wait that
`0026` moved *under* the cards is now gone entirely, hidden behind something
worth watching.

## Decision

**The reveal is overlaid on the results page, not rendered instead of it.**
This is what makes the latency free: `DailyReading` mounts and fires its fetch
the moment the cards are dealt, while the reveal is still on card one. Render
the reveal in place of the results and the call would not start until it ended.

**It plays once per draw.** `dailyDraw.revealed` is stored, not held in
component state, so reopening the tab later goes straight to the reading and
closing the tab mid-reveal shows it again.

**Interaction follows `Spec_Daily_Draw_Tab` §2** rather than inventing a second
convention: the card fills the screen, and a reversed one renders rotated 180°
with its tag pinned upright, so orientation reads before any text does.

**Auto-advance at 2.6s, tap anywhere to go early, skip to leave.** The sequence
is the point, so it runs on its own; the taps are for people who do not want to
wait. Progress pips show how many are left.

**Reduced motion takes the movement, not the sequence.** Someone who has asked
for less animation still gets their three cards and still taps through them.
The card arrives rather than flying in.

## Consequences

**Two real bugs came out of building this, both found by measuring rather than
looking, and both worth recording because the causes generalise.**

*The backdrop was never opaque.* The overlay animated its own opacity from 0
with `animation-fill-mode: both`. In a backgrounded tab the animation does not
advance, so it held the `from` state and the results page showed straight
through the reveal. **A backdrop must not depend on an animation for its
resting state.** The container is now opaque from the first frame and only the
card animates.

*It did not cover the viewport.* `.app-frame` carries a transform, so it is the
containing block for fixed descendants — and it is the whole scrolling page,
3099px tall on a finished reading, not the viewport. `inset: 0` against that is
not the screen. The overlay is now pinned to the frame's top with `100dvh`, and
the page is locked at scroll zero for the duration, since a fixed child of a
transformed ancestor scrolls with it and would otherwise slide away. This is
the same containing-block mechanism that lost the dev console in `#51`; there
it was a bug, here it is the thing being relied on.

**A measurement artifact worth naming.** Several checks appeared to show the
reveal completing instantly. It was not: `location.reload()` followed by a
separate tool call measured the *pre-reload* page. Resetting state in-page and
polling within a single call showed the real sequence. Reloading between
measuring steps is not safe when the thing being measured is time-based.

## Amendment, same day: what happens at the end of the reel

The claim above, that the wait is "gone", was overstated and Tia caught it:

> *"i thought we were going to hide this screen behind the card animations, but
> i still saw it."*

It was only true if you watched the whole sequence *and* the call landed inside
it. Skip, tap through, or a call slower than 7.8s, and the reveal ended on a
timer and dropped you onto the bare considering screen it exists to prevent.
Timing something to be *usually* long enough is not hiding it.

**The first answer was to hold the reveal** on its last card until the reading
arrived. That was wrong, and Tia said so once the waiting screen had been built
properly:

> *"when the player gets to the last card in the reel, they shouldn't need to
> tap skip, just tapping should take them to the loading screen. The loading
> screen moves so it makes it clear that something is happening, but the static
> card doesn't."*

The hold only ever made sense because the screen underneath was bad. Once that
screen fans the three and moves the attention across them, it says *working*
better than a frozen card with a pulsing caption does. Holding someone on a
static image and asking them to find Skip is worse than showing them something
that is visibly running.

**So the last card leaves on a tap, like the other two.** No special case, no
`ready` prop, no in-reveal waiting line. If the reading is already in, the
results are there; if not, the fan is, and it is doing the reassuring. Skip
stays for anyone who wants out before the third card.

Measured: three taps and the reveal is gone at 4.0s with no Skip pressed,
landing on the animated fan.

**The waiting screen is still reachable, deliberately.** Skipping is an
explicit choice to leave, so it lands there, and it was built properly rather
than left as the stopgap: rarely seen is not the same as allowed to be ugly.

The three fan like a hand instead of sitting in a grid, which lets each card be
132px against the row's 104px, and the brightness crosses them one at a time on
a staggered 3.6s cycle, which reads as the reader looking from one to the next.
The line sits under them as part of the same composition rather than being
rendered separately by `DailyReading`, which is why it used to hang under a row
of cards with a screenful of nothing below.

Reduced motion keeps the fan and the dimming and drops the taking-turns.

**Two wrong numbers went into sizing that screen**, and both are worth knowing.
`--tabbar` is **74px**, not the 63px the tab bar element measures. And `100dvh`
in this frame is **838px**, not `window.innerHeight`'s 812. A min-height built
on either is wrong by tens of pixels, which is what left a 26px scroll on a
screen that should not move at all. The fix was to stop doing the arithmetic:
the shell drops its bottom padding for this screen, the same way it already
does for the greeting.

## Amendment: the card moves for its whole turn

Tia:

> *"during the carousel of cards, they animate in but sit still for a second
> before moving on. Because the card seems static in that moment, it's not
> clear that the animation is still going and that the user can sit by and not
> tap."*

The entrance ran 520ms of a 2600ms turn, so the card spent 80% of its time
perfectly still. Still reads as *finished, waiting for you* — which is
precisely the wrong message during an automatic sequence.

**One animation now covers the whole turn**: the entrance lands at 18% and the
card keeps drifting, ending 10px higher and 4% larger. The drift is small
enough not to compete with the art and continuous enough that stillness always
means stopped.

**The duration lives in one place.** `PER_CARD_MS` is written onto the reveal
as `--per-card` and both the card's animation and the pip's fill read it, so
the CSS cannot drift out of step with the JavaScript timer.

**The current pip fills over the turn**, which is the "how much longer" signal
the drift alone does not give. Reduced motion drops the card's drift and keeps
the pip filling: losing both would leave no indication at all that a sequence
was running, which is worse than the motion it was avoiding.

Verified by pausing the animation and stepping `currentTime` through it, since
the preview pane reports `document.hidden` and freezes CSS animations outright
— sampling frames there measures nothing. Entrance completes at 468ms; the card
occupies six distinct positions across the remaining 2.1 seconds.

**The detail list is now arguably too long.** Three cards at 285px make a
3124px page. With the art having had its own moment, that list could go back to
being a compact reference. Deliberately not changed here: it is a separate
judgement and Tia should see the reveal first.

**Nothing tests the reveal.** The sequence, the skip, the replay guard and the
scroll lock were all verified in a browser and none of it is in the suite.
Timing-based component behaviour needs a DOM test harness the project does not
have; `node --test` covers pure modules only.
