# Spec_Lesson_Format_Bible
*Converted from `Spec_Lesson_Format_Bible.pdf`.*

---

## Page 1

ZODIACTAROT · INTERNALREFERENCE
Lesson Format
Specification
The complete, standalone bible for every lesson interaction in
Zodiac Tarot — mechanic, rules, difficulty logic, data
requirements, and pixel-perfect screen references for Formats
A, B, and C.
Accompanying files. This document is designed to be read alongside exactly three
other things: the Card Data Model Reference (table definitions and full data
appendices), the image assets (card art and symbol icons), and the
zodiac_tarot.db database. Nothing else is required to build against this spec.
Formats covered: A · Match to Grid (grouped as Cards / Symbol / Shadow) • B · True/False Statement •
C · Board Matching — Screens shown with illustrative example content, not final copy.
Zodiac Tarot — Lesson Format Specification Page 1 of 17

---

## Page 2

Overview
All current lesson content is generated from three underlying interaction architectures — Format A (Match to
Grid), Format B (True/False Statement), and Format C (Board Matching). Each architecture is specified once —
mechanic, rules, interaction states, and wireframes — followed by its content variations, each with its own
difficulty-scaling logic and data requirements.
Read Section 1 first: it defines the interaction, error-handling, and hint rules every format inherits, so the performat sections below don't repeat them.
Out of scope: session- and curriculum-level decisions — which grid size or difficulty tier to serve on a given round,
session pacing, the hint content itself, or progress-bar behavior on a mid-session exit. Those live one layer up
from the lesson formats specified here.
1 Shared Interaction Model every format inherits this
2 Format A — Match to Grid Cards / Symbol / Shadow
3 Format B — True/False Statement
4 Format C — Board Matching
Zodiac Tarot — Lesson Format Specification Page 2 of 17

---

## Page 3

1. Shared Interaction Model
These rules apply across every lesson format unless a format's own section explicitly overrides one.
Selection
Tapping an image-based option selects it directly; pressing and holding opens it full-screen for inspection,
then returns without changing the selection. A quick tap never triggers inspect.
Tapping a text-based option selects it directly — no separate button.
Equal-weight options always render at the same size regardless of their position in a grid or stack.
Only one option is selected at a time; selecting a different option moves the selection.
Selecting is always a separate action from submitting — a footer Continue button confirms the answer.
Text that overflows its allocated space shrinks toward a legible minimum, wraps up to a capped number of
lines, then truncates with a long-press-to-expand overlay. Read-only reference/anchor panels scroll internally
instead of truncating, since there's no selection gesture to protect on a read-only element.
Hint
Every round shows a Hint control in the top bar (see every figure in this document). Tapping it does one of two
things, depending on what's on screen: it either eliminates one incorrect candidate from an option-based
screen, or surfaces additional context about the fixed reference the learner is trying to match.
Open question: this maps cleanly onto Format A, which always has both a fixed reference and a candidate
list. Format B's binary TRUE/FALSE choice has no "candidate to eliminate," and Format C's tile board has no
single fixed reference — what Hint actually does on those two screens still needs a format-specific decision.
Whatever a hint shows or removes is itself curriculum content, populated per round when the curriculum is
populated — no supporting data exists yet for any format.
Error handling (default)
Wrong pick: the screen shakes, a red cross badge appears, and the option switches to wrong-state styling,
then becomes disabled for the rest of the round (an image option remains inspectable).
The learner keeps retrying until the correct option is picked — a round never ends on a miss under this default.
Format B overrides this (see Section 3).
Correct pick: green border and checkmark badge, a short reveal, and the action button relabels to “Next.”
Only the first wrong attempt in a round is logged for spaced repetition; retries within the same round aren't
logged again.
Layout
A round's fixed reference item (the content that stays constant while the learner evaluates candidates)
anchors to one edge of the screen in its own panel, vertically centered within that panel.
Text candidates fill the remaining space as a full-width vertical stack, regardless of how many there are.
Zodiac Tarot — Lesson Format Specification Page 3 of 17

---

## Page 4

Image candidates (card art or symbol icons) arrange as a grid based on option count, since a single row can't
show portrait card art at a usable size once there are more than two: 2 → one row of 2; 3 → two tiles on the first
row, one centered on the second row; 4 → 2×2.
Card art defaults to the largest size the available vertical space allows on every screen that shows it — this is
a global default, not a per-format choice. A format spec only needs to call this out when it deliberately departs
from it (see Format C, which caps board size specifically to protect this rule).
Full content is always preserved — no truncating a keyword list or shrinking art to save space.
Variable-length text reserves fixed space sized to the longest real value in the dataset, so layout never shifts
round to round.
Difficulty (default formula)
Where a similarity table exists for the content type in play: Easy = every distractor scores “clearly distinct,” Hard =
every distractor scores “confusable,” Medium = a mix (excluding all-easy). A candidate's own identifying name
never appears on an anonymous option, even if that same name is shown elsewhere as the fixed reference.
Note: the similarity data this formula relies on ( card_similarity ) is a first-draft judgment call rather than
measured data, and should be expected to need hand-adjustment as real lesson use surfaces miscalibrated
pairs.
Figure 1 — Shared interaction states
Every grid-based format (Format A's variants) reuses the same four visual states below. Defining them once here
keeps every screen in this document, and every future one, visually consistent.
Figure 1 — Default / Selected / Correct / Wrong — the shared state vocabulary referenced throughout Section 2.
Zodiac Tarot — Lesson Format Specification Page 4 of 17

---

## Page 5

2. Lesson Format A — Match to Grid
One fixed reference item is shown; a grid of 2–4 candidates sits below or beside it. The learner selects a
candidate and confirms with Continue. A wrong pick doesn't end the round — the learner keeps retrying
until the correct candidate is chosen.
2.1 Rules of play
One item is the round's target; the grid contains the target's own correct answer plus 1–3 distractors, for a grid
of 2, 3, or 4.
Select, then confirm with Continue — selecting alone never submits.
Retry-until-correct: a wrong confirm doesn't end the round; the learner keeps attempting until the correct
option is chosen, even if only one candidate remains.
Only the first wrong attempt per round counts as a miss for spaced repetition — the round always resolves
correct on completion.
Whenever candidates are images, a one-line hint (“Tap to choose · Hold to inspect”) is shown once, above the
grid.
2.2 Layout shapes
Format A has three layout shapes, depending on which side (reference or candidates) holds the image and
which holds the text, and whether the grid is fixed or variable. Whenever candidates are images, they follow the
option-count grid arrangement: 2 → one row; 3 → two on top, one centered below; 4 → 2×2. Card art uses this
arrangement directly; symbol icons use the same arrangement at a squarer aspect ratio. Each shape is
implemented across four states — Default, Selected, Correct, Wrong (Figure 1).
2.3 Selection model & interaction flow
If the fixed reference is an image: inspect-only, never selectable.
If the fixed reference is text: read-only, never selectable; scrolls internally rather than truncating if it overflows
its panel.
Candidates follow the shared selection rule from Section 1: images tap-to-select / long-press-to-inspect; text
rows tap-to-select directly, truncate-and-expand if they overflow.
Select → highlight; selecting a different, non-eliminated option moves the selection.
Continue, correct → green border and checkmark, brief reveal, Continue relabels “Next.”
Continue, wrong → shake, red border and cross, option disabled (still inspectable if image-based), remaining
options stay live.
2.4 Lesson content types: Cards, Symbol, Shadow
Format A's seven variants split into three underlying content types. The type isn't just a content label — it
determines which UI framing elements a screen uses:
Cards — reference and/or candidates are full 78-card deck art. Uses the standard portrait card frame
(rounded corners, drop shadow) and, wherever a card is shown outside its own printed art, an explicit name
Zodiac Tarot — Lesson Format Specification Page 5 of 17

---

## Page 6

label alongside it.
Symbol — reference and/or candidates are Planet/Sign/Element/Suit icons. Uses the squarer icon tile, and
always pairs an icon with its “Category: Name” label, since an icon alone doesn't identify itself the way card art
does.
Shadow — the reference is a reversed card, optionally paired with an upright scaffold anchor. Adds the
reversed badge and the dashed-border anchor panel on top of the standard Cards framing.
The three groups below are ordered to match rollout priority: Cards ships first (it's the format learners are
expected to meet earliest), then Symbol, then Shadow.
CARDS A2 · A3 · A1 — full card art, standard framing
A2 — Choose Meaning From Card
Reference: Card image Candidates: Text (keyword sets) Grid: 2–4 Pool: Single-deck
Distractor confusability only ( card_similarity ). No content variants — reuses the target card's own keyword
set as-is.
A2 — Fixed card art → 3-option keyword-set text stack.
Data: card_keywords ; card_similarity ; card_images
Zodiac Tarot — Lesson Format Specification Page 6 of 17

---

## Page 7

A3 — Major/Minor Arcana ID
Reference: Card image Candidates: Text (fixed 2 labels) Grid: Fixed 2 Pool: n/a
Which card is drawn — no distractor selection exists (only 2 fixed labels). Easy = visually unambiguous cards.
Hard = Minor Arcana court cards, which read as “just a person” the way Major Arcana figures do. Handgraded, not a scored data field.
A3 — Fixed card art → permanently fixed 2-option stack (Major / Minor), the one non-variable grid in Format A.
Data: tarot_cards_base (arcana_type); card_images
Zodiac Tarot — Lesson Format Specification Page 7 of 17

---

## Page 8

A1 — Choose Card From Keywords
Reference: Text (3 content variants) Candidates: Card images Grid: 2–4 Pool: Single-deck
Distractor confusability ( card_similarity ) × which of 3 anchor variants is served: (A) full keyword list, (B)
description with identity stripped, (C) 2–3 collated reading points, joined. Design-hypothesis ordering: B
easiest → A → C hardest.
A1 — Text anchor (keywords) → 3-option card-image grid. Retry-until-correct; no card name is ever shown on the
anchor.
Data: card_keywords ; card_descriptions (identity-stripped); card_talking_points ; card_similarity ;
card_images
SYMBOL A4 · A5 · A7 — Planet / Sign / Element / Suit icons
Wherever the pool draws from symbol content, the excluded category is Modality — it has no icon asset in
symbol_images , so it can't appear as a candidate or reference image. Suit is included in A4 and A7's pool; it is
excluded only from A5, where the design intent is same-category-only matching (Planet vs Planet, Sign vs Sign,
etc.) and Suit isn't part of that same-type-confusability test.
Zodiac Tarot — Lesson Format Specification Page 8 of 17

---

## Page 9

A4 — Symbol Identification
Reference: Symbol image Candidates: Text (“Category: Name”) Grid: 2–4
Pool: Mixed-category (Planet/Sign/Element/Suit), no Modality
Category mix is the primary lever. Easy = every distractor drawn from a different symbol category than the
target (eliminable by shape alone). Hard = one or more distractors drawn from the same category as the
target (forces genuine within-category recall). A hand-authored symbol-to-symbol similarity grouping can
further tier the Hard-tier choice once that data exists; until then it's random within category.
A4 — Fixed symbol icon → 4-option label grid spanning all four eligible categories, including Suit (“Suit: Wands”).
Data: symbol_images ; symbol_significance (name, type) — filtered to exclude symbol_type = Modality
Zodiac Tarot — Lesson Format Specification Page 9 of 17

---

## Page 10

A5 — Symbol Meaning Match
Reference: Symbol image Candidates: Text (meaning phrases) Grid: 2–4
Pool: Same-category-only, no Modality
None — fully random selection. Target and all distractors share the same symbol type by design (a miss is a
genuine content mix-up, not a category tell). Distractor choice is random within type; no tiering exists.
A5 — Fixed symbol icon → 3-option meaning-phrase stack, same-type-only pool.
Data: symbol_images ; symbol_significance (phrase, phrase_order) — filtered to exclude symbol_type =
Modality , same-type only
Zodiac Tarot — Lesson Format Specification Page 10 of 17

---

## Page 11

A7 — Symbol Selection From Label
Reference: Text (“Category: Name”) Candidates: Symbol images Grid: 2–4
Pool: Mixed-category (Planet/Sign/Element/Suit), no Modality
Mirrors A4 in the opposite direction. Easy = every distractor icon drawn from a different category than the
label — eliminable by shape alone. Hard = one or more distractor icons from the same category as the label,
forcing genuine within-category visual recall.
A7 — Fixed “Category: Name” label → 3-option symbol-icon grid, same merged 4-category pool as A4.
Data: symbol_images ; symbol_significance — filtered to exclude symbol_type = Modality
Zodiac Tarot — Lesson Format Specification Page 11 of 17

---

## Page 12

SHADOW A6 — reversed card + scaffolded anchor
A6 — Shadow Meaning Recognition
Reference: Reversed card image + optional text anchor Candidates: Text (shadow phrases) Grid: 2–4
Pool: Single-deck
Distractor confusability ( card_similarity ) × which of 4 scaffold variants is served, most → least support: (A)
upright description ( description_condensed ) shown alongside the reversed card, (B) upright keyword list, (C)
one upright talking point, chosen at random from the card's entries, (D) no anchor at all. Ordering intentionally
keeps B easier than C. Variant D at hardest distractor tiering is the format's own capstone difficulty.
A6 · Variant A — Reversed card art, rotated at render, paired with its own upright description as a reasoning anchor → 3-
option shadow-phrase stack.
Data: card_images (rotated at render); card_descriptions ; card_keywords ; card_talking_points (one row,
chosen at random, for Variant C); card_similarity
Zodiac Tarot — Lesson Format Specification Page 12 of 17

---

## Page 13

3. Lesson Format B — True/False Statement
One fixed image plus one short statement is shown. A coin flip decides whether the statement is True
(belongs to the shown item) or False (borrowed from a different, confusability-chosen donor item). The
learner picks TRUE or FALSE and confirms — unlike Format A, a wrong answer ends the round
immediately.
3.1 Rules of play
A 50/50 coin flip decides True vs. False for the round.
Selecting TRUE or FALSE is the select action; Continue is the separate confirm action.
No retry-until-correct — a wrong answer ends the round immediately with feedback. This overrides Section 1's
default: a binary choice has no remaining candidate to fall back to.
If the round was False, after correct/incorrect feedback the learner sees the donor item's full art and its own
statement, with time to read, before Continue advances — regardless of whether their answer was itself right
or wrong.
True rounds have no donor and no reveal screen — Continue advances straight after feedback.
Every wrong answer logs as a miss immediately, since there is no retry to distinguish a first attempt from a
later one.
3.2 Example screens
Main screen (Default/Selected/Correct/Wrong per Figure 1), plus the donor-reveal screen shown after any False
round — its own screen, not an overlay.
B · Main screen — FALSE selected, awaiting Continue. No retry
exists here — a wrong confirm ends the round immediately.
B · False-statement reveal — Fires on every False round
regardless of the learner’s answer — this is what completes
the learning, not just the score.
3.3 Selection model
The fixed image panel is inspect-only, never selectable.
TRUE/FALSE are two equal-size buttons — a binary control, not a candidate list. Tapping one selects it; tapping
the other moves the selection.
Zodiac Tarot — Lesson Format Specification Page 13 of 17

---

## Page 14

The reveal screen has nothing selectable — read-only content with a single Continue action.
3.4 Difficulty tiering
Two independent axes combine. (1) When the round is False, the donor item is chosen by confusability against the
shown item: Hard rounds borrow from a highly confusable donor; Easy rounds borrow from a clearly distinct one,
using the same similarity-score mechanism as Format A. (2) Independently, the description and keyword content
types each have their own easy/hard tier (Section 3.5) — the two axes haven't been validated together yet.
3.5 Content types & difficulty tiers
Content
type
Tier Source / rule
Description Easy card_descriptions.description_condensed
Description Hard card_descriptions.description_anonymized (identity/character reference
removed)
Keywords Easy Full keyword list, concatenated into one string
Keywords Hard Random 2–3 keywords, concatenated into one string
Talking point Single
tier
One card_talking_points entry, chosen at random
description_condensed was written to be used as-is for this format — no editorial trimming step is needed. The
requirement instead sits with the UI: the statement panel needs to comfortably support longer text than a single
short clause, and where a given statement still doesn't fit, it falls back to the shared hold-to-inspect pattern from
Section 1 rather than truncating or forcing content to be shortened.
Open item — talking-point redundancy. A check of card_talking_points against the deck's mostconfusable pairs found no verbatim duplicates, but at least one pair has talking points that make the same
underlying claim in different words: Five of Cups (“Loss that deserves to be felt, not rushed past”) and Three
of Swords (“Pain acknowledged honestly heals faster than pain denied”). A False round pairing these could
read as true either way, which is a validity issue rather than intended difficulty. Ten of Pentacles / King of
Pentacles is a milder version of the same thing. Recommend auditing all difficulty_score = 1 pairs
(1,226 pairs) before this content ships.
3.6 Data requirements
All content types: card_images (shown item and, on False rounds, the donor item);
card_similarity.difficulty_score (donor selection).
Description tiers additionally: card_descriptions.description_condensed (easy) and
card_descriptions.description_anonymized (hard).
Keyword tiers additionally: card_keywords .
Talking-point tier additionally: card_talking_points .
Zodiac Tarot — Lesson Format Specification Page 14 of 17

---

## Page 15

4. Lesson Format C — Board Matching
A two-column grid of N rows (2N tiles) is shown, with no fixed reference item — every tile is
simultaneously an answer and a distractor for every other tile on the board. The learner taps one tile per
column to attempt a match, evaluated immediately.
4.1 Rules of play
Grid size is 2 or 3 rows (2N tiles total); each row's left and right items form one correct pair, shuffled across the
board. Capped at 3 rows to protect Section 1's card-size default — a 4-row board only fits by shrinking card art
past the point of being easily readable, which works against the entire point of a visual-matching format.
Image↔text is the only column-content configuration: left column is card or symbol art, right column is text.
No footer Continue button — tapping a tile in one column selects it; tapping a tile in the other column
immediately evaluates the pair. This overrides Section 1's default separate-confirm rule.
Wrong tiles are not disabled — they flash wrong-state, then return to default/selectable, overriding Section 1's
default disable-on-wrong rule.
Every wrong attempt logs as a miss, not just the first — since there's no single “target” item, this format has no
first-attempt-only scoring concept.
Correct pair: both tiles show correct state briefly, then are removed entirely, leaving an empty gap — no reflow.
Once every pair on the board is matched, the lesson instance completes automatically — there is no Continue
button anywhere in this format, including at completion.
Pair selection itself uses no confusability/similarity scoring — pairs are drawn at random from the eligible pool,
since every other pair's tiles already function as automatic distractors. Symbol pairs exclude Modality,
consistent with Format A.
4.2 Example screen
Shown at the format's maximum board size of 3 rows. Each image tile shows the card's name alongside its art —
the art's own printed name plate is too small to read reliably at tile size, so this is a separate, larger UI label,
matching the pattern already used for card names elsewhere in the app.
Zodiac Tarot — Lesson Format Specification Page 15 of 17

---

## Page 16

C · Board Matching (Tile Match) — Mid-round, left tile selected and awaiting a right-column tap. No fixed reference and no
Continue button anywhere in this format.
4.3 Difficulty & content scaling
Two independent, stackable levers set a round's difficulty.
Lever Rule
Row count (primary) 2 rows = Easy, 3 rows = Hard.
Card image↔text ladder,
easiest→hardest
Anonymized text (full-sentence prose, most explanatory) → Complete keyword set
(terser, requires reconstructing meaning from fragments) → Partial keyword set (2–3
words, harder purely because information is withheld) → Complete reading notes
(collated across several life-areas at once; least distilled, hardest).
Symbol image↔text ladder,
easiest→hardest
Type: name (e.g. “Planet: Mercury” — near-direct identity label) → Complete meaning
(the symbol's full joined symbol_significance phrase set, in phrase_order —
requires genuine interpretation to connect back to the icon).
With row count capped at two tiers, the content-pairing ladder now carries more of the difficulty range on its own
— a 3-row round using the hardest content pairing is this format's ceiling. Both ladders are a design hypothesis,
not yet validated by playtesting.
4.4 Data requirements
Image side: card_images / tarot_cards_base , or symbol_images (filtered to exclude symbol_type =
Modality ).
Zodiac Tarot — Lesson Format Specification Page 16 of 17

---

## Page 17

Text side, card pairing: card_descriptions.description_anonymized (anonymized text),
card_talking_points (complete reading notes, all rows joined), card_keywords (complete keyword set, full
ordered list joined).
Partial keyword set (2–3 words): must be selected by a rule that guarantees the chosen subset is uniquely
identifying among that round's other items — e.g. picking the smallest keyword subset for a card that doesn't
collide with any other card's subset in play that round. A random slice without this check risks two cards
producing indistinguishable partial sets, which breaks the puzzle's single-solution property.
Text side, symbol pairing: symbol_significance.symbol_type + symbol_name (Type: name tier);
symbol_significance.phrase , all of a symbol's phrases joined in phrase_order (Complete meaning tier).
4.5 Current limitations
No visible difference yet exists between a tile the learner hasn't attempted and one that was wrong earlier
and reset to default.
Symbol image↔text pairing's two tiers are both a design hypothesis, same status as the card ladder — not
yet validated by playtesting.
Zodiac Tarot — Lesson Format Specification
Zodiac Tarot — Lesson Format Specification Page 17 of 17
