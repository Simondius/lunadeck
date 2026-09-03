# 0094: Every cloze round carries at least 2 blanks

## The rule

Simon: fill-in-the-blank rounds should always have at least 2 blanks.
Auditing every cloze round's own `blanks` array found 57 with exactly 1 -
short, single-sentence "fact" cloze rounds (a card's own node-4 tier and
every capstone's plain-cloze round, `n9-r*`/`n7-r*`/`cap-r*` ids) across
every one of the 22 cards, both hand-authored and generator-built.

`0086`'s own `targetBlankCount(wordCount)` already scaled blanks by
paragraph length, but its floor was 1 (`Math.max(1, ...)`), sized for "a
paragraph under 10 words only needs one or two" - in practice every short
single-sentence fact round landed on exactly one.

## The fix

**Baked data**: a one-off script reconstructs each offending round's full
original sentence (the `{b1}` placeholder plus its own answer), picks the
longest remaining real word in it (skipping a short stopword list - the
same "length > 5, not a stopword" heuristic `blankRealWord()`'s own
fallback already uses) as a second blank, and rewrites `text`/`blanks`
together in one regex pass so the two replacements can't collide or
double-match the same word. One round (Emperor's "Gives shape and order to
what was still raw potential") had no word left over 5 characters and
needed a manual second blank (`shape`). No distractors were added - the
word bank a learner picks from is `blanks[*].answer` + `distractors`
together (`cloze-round-player.jsx`), so a second blank just contributes
its own answer as a new correct chip.

**Generator**: `targetBlankCount`'s floor is now `Math.max(2, ...)`, and
`buildScaledCloze`'s own word-limit trim loop stops at `blanks.length > 2`
instead of `> 1` - the blank-count floor now wins over the word-limit trim
Simon set for `0085`'s recap screen. `keywords.length || 1` no longer caps
the initial target either: a card with only one or two real keywords
still gets a second (or third) blank via `blankRealWord`'s own
longest-real-word fallback, exactly as the baked-data fix above already
relies on.

## Verification

Zero cloze rounds left under 2 blanks across all 22 cards; every `{bN}`
placeholder in every round's `text` has a matching `blanks` entry and vice
versa. `0092`'s own distractor-count floor and `0091`'s donor-card spread
both re-checked unaffected (this fix never touches `distractors` or
choice/swipe content). `npm run build` passes. Played Fool's own node-4
live - the newly-two-blank round rendered both dashed blanks and both
correct-answer chips (`Beginning`, `cycle`) alongside the existing
distractors. The generator's own code change was verified by static
review and `node --check` rather than a full rerun - the baked data is
already correct on its own, and rerunning would only re-churn `0091`'s
and `0092`'s already-settled donor-card/silly-word balance for no benefit.
