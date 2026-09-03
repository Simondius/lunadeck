# 0086: A cloze round's blank count scales with its own paragraph length, and its distractor words stop repeating

## Context

Simon, on the generator's own cloze rounds (node-7's recap and the
capstone's own cloze, both `scripts/build-v4-new-cards.mjs`): blank count
should scale with paragraph length rather than staying fixed, and the
distractor words filling out the word bank shouldn't repeat more than
three times.

Before this, node-7 always blanked exactly one or two words regardless of
how long its (already-trimmed, per `0085`) text ended up being, and every
one of the 17 cards this generator produces used the exact same three
distractor words for node-7 (`SILLY_WORDS[0..2]`) and the same two for the
capstone cloze (`SILLY_WORDS[5..6]`) — a returning learner would see
"Tuesday" and "banana" show up as the wrong answer on every single card's
recap.

## Fix

**Blank count**: `targetBlankCount(wordCount)` maps a paragraph's own word
count to a blank count via `round(wordCount / 8)`, clamped to 1-5 —
Simon's own two calibration points (under 10 words → one or two blanks,
around 30 → three to five) both land inside that curve.
`buildScaledCloze()` blanks up to that many distinct real keywords
(falling back to `blankRealWord`'s existing longest-real-word rule once
keywords run out), then applies `0085`'s own trim to just the sentence(s)
holding a blank. Screen-fit stays the harder constraint than the blank
target: if multiple blanks land in their own separate long sentences and
the trimmed result still exceeds the 42-word cap, blanks are dropped from
the end (restoring each one's real word) until it fits — occasionally
landing under the "target" blank count for a card whose real keywords
happen to sit far apart in the text, which is the right tradeoff given
`0085`'s own reason for existing.

**Distractor repeats**: a new `CLOZE_DISTRACTOR_WORDS` pool (43 words) and
a `drawClozeDistractors(count)` allocator round-robin the pool with
module-level (not per-card) usage tracking, skipping any word already
drawn three times. Scoped to cloze rounds specifically, per Simon's own
framing ("two improvements on these fill in blanks") — `SILLY_WORDS`
itself, and node-1/node-3/the capstone's own plain keyword-tap round,
keep their original fixed indices unchanged; that's a different round
type this request wasn't about.

## Verification

Across the 17 cards this generator produces, node-7 and the capstone
cloze together draw 85 distractor slots from the new pool; measured usage
tops out at 2 per word (well under the 3 cap) across 43 distinct words.
Blank counts now range 1-4 depending on each card's own trimmed paragraph
length rather than a fixed 1-2. Checked Chariot live (4 blanks, 7-item
word bank) — fits on one screen with room to spare. `npm run build`
passes; all 17 regenerated section files and `capstone_nodes.json` remain
valid JSON. The five pre-existing hand-authored cards (Fool, Lovers,
Empress, Magician, Emperor) are untouched — their own node-1/3/7 cloze
rounds are a different, older structure with their own fixed distractor
choices, out of scope here.
