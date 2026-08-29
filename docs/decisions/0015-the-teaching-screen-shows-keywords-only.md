# 0015 — The teaching screen shows keywords, and says what they are for

**Date:** 2026-08-29
**Status:** Accepted

## Context

`0011` gave every section a teaching step, and `0012` kept it short: art,
name, symbol line, keywords, one orienting sentence. Played, it is still three
kinds of information stacked on a first meeting — a planet, seven keywords and
a sentence of cosmology — with nothing saying which of them the next four
minutes will actually ask for.

Tia: *"we dont want to overwhlem the new player with info. remove the planet
and the description. on this page instead it should say something like
'remember these, you'll be quizzed on them next!'"*

## Decision

The card intro shows the art, the name and the keywords, and closes on
"Remember these — you'll be quizzed on them next."

The symbol line and the opening sentence are gone from this screen. Both are
still in `getCardIntro`, and both are still on the card's own page in the deck
— `0012`'s point was that depth arrives when the learner goes looking for it,
and a first meeting is the wrong moment.

The line itself is UI copy, not card content, so it does not cross `CLAUDE.md`'s
"never author card content" rule. It also happens to be true: N1 is now the
keyword picker (`0014`), so the very next screen asks for exactly what this one
just showed.

The recap intro is untouched — it has no new card, and its line explains what
the screen is rather than adding to it.

## Consequences

**A2's options are now all unseen.** `0013` fixed A2 — "which meaning belongs
to this card?" — by serving one-line openers instead of full descriptions, and
part of that reasoning was that the intro had shown the description. It no
longer shows anything of it. So A2 is now a genuine inference from the keywords
the learner just memorised to the sentence that fits them, rather than a
recognition of text they read a minute ago.

That is probably the better exercise, and it is certainly the harder one. It is
worth watching in play: if A2 turns into a coin flip, the fix is to give the
opener back to this screen, not to lengthen the options again.

**The symbol formats teach less.** A4/A5/A7 quiz the card's symbol art (26
instances). The symbol *label* has never been what they test, and the art is
still on the card, but this screen no longer names it.
