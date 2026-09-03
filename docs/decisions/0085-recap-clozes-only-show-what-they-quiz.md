# 0085: A node-7 recap cloze shows only the sentence(s) it's actually quizzing, and the High Priestess's own zone round covers every moon on her card

## The High Priestess's own zone round

Separately, Simon: "moon hit zone should cover all 3 [really 4] moons on
the page." The High Priestess's own "Find the Elements" zone round only
had one tap-zone rect for its "Moon" element, over the small crescent
sitting in her hair — the card actually draws four distinct moon shapes
(a golden crescent above her head, that hair crescent, a bright orb by her
raised hand, and a large crescent to her left), and only one was tappable.
Measured all four directly against the master art
(`assets/cards/master/major_02_high_priestess_MASTER.png`, 813×1456) via
PIL brightness-thresholding within hand-picked crop windows, then added
the other three as additional entries in the element's own `rects` array
— the zone-round player already supports more than one rect per element
(each is checked independently as a valid tap target for that element).

## Context

Simon flagged a screenshot of the High Priestess's node-7 recap: the full
condensed description rendered as one paragraph, with the word-bank
distractors pushed off the bottom of the screen — reachable only by
scrolling, unlike every other round in the app. Asked for a broader audit
of screens that push interactive parts below the fold, with the fix being
to reduce descriptor text rather than redesign the screen.

## Root cause

`scripts/build-v4-new-cards.mjs`'s node-7 ("The Full Picture") blanks one
or two real keywords inside a card's full `description_condensed` text,
but used the *entire* paragraph as the round's own displayed text —
50-90 words for a round only ever testing one or two of them. The
original Fool/Lovers/Empress recap (hand-authored, a different, older
shape) avoids this by splitting the same idea across several short rounds;
this generator's own node-7 never got the equivalent treatment.

## Fix

`trimToBlankSentences()` now keeps only the sentence(s) that actually
contain a `{bN}` placeholder, discarding the rest of the paragraph — the
untouched sentences were never being tested, so nothing pedagogical is
lost by not showing them. Where both blanks still land in their own long
sentence and the combined trim exceeds 42 words (calibrated against a real
screenshot: 33 words fit with room to spare, 54 pushed the word bank off
screen) — Sun and Death, specifically — the round drops to just the first
blank rather than ship something that still overflows.

Applied to all 17 cards this generator produced. `capstone_nodes.json`,
Lovers/Magician/Emperor/Fool/Empress's own hand-authored or mechanically-
regrouped recap rounds are untouched — those already use a denser blanking
approach (7-12 blanks across the same paragraph, closer to every content
word actually being tested) that shipped before this session and isn't
part of the pattern this fix addresses. Fool's own 12-blank recap is a
separate, likely pre-existing case of the same *symptom* (a long block of
text at the very end of its own node) — flagged here rather than touched,
since it's hand-authored content this project's own rule says not to
regenerate.

## Verification

Rebuilt and checked live: High Priestess (33 words) and Sun (down from 54
to a single-blank round) both now render fully on one screen, word bank
included, at the same viewport the original bug reproduced on.
`npm run build` passes; all 17 regenerated files remain valid JSON.
