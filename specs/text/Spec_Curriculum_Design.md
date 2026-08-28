# Spec_Curriculum_Design
*Converted from `Spec_Curriculum_Design.pdf`.*

---

## Page 1

Zodiac Tarot
Curriculum Design Specification
Implementation reference for the card-learning curriculum: unit/section/node structure, lesson-format sequencing,
difficulty progression, and the spaced-review system. Companion data files: data_curriculum_nodes.csv and
data_unit_metadata.csv.
Scope Detail
Cards covered All 78 cards (Major + Minor Arcana). Reversed/Shadow meanings are out of scope for
this spec — planned as a separate later unit.
Content source Existing base tables: card_key is the join key across all tables, including the two
curriculum files this spec describes.
Lesson formats used A1, A2, A3, A4, A5, A7, B, C (8 of the 9 defined formats). A6 — Shadow Meaning
Recognition — is excluded.
Structural units 10 Units → 78 Sections → 577 Nodes total.

---

## Page 2

1. Curriculum Hierarchy
The curriculum follows a four-level structure. Each level is defined by a target session length, not a fixed content
count — the counts below are what that target produces when applied to this specific 78-card dataset.
Level Size Target duration Definition
Unit 6–10 Sections 1–2 hours A thematically coherent block of the teaching
order, chunked in units of 8 sections (final unit: 6).
Section 7–10 Nodes 2–3 minutes/node Introduces exactly one new concept: one card.
Nothing smaller or larger qualifies as "one
concept."
Node 1 exercise type,
played 1+ times
60 sec (no mistakes) –
180 sec (several
mistakes)
The atomic play unit. Mistakes on first attempt are
logged and replayed at the end of the node.
Lesson 1 rendered
exercise
seconds One instance of a lesson format (A1, B, C, etc.),
populated live from the base content tables via
card_key.
1.1 Section = One Card
A section always introduces exactly one card_key. This is what keeps "one small new concept" concrete and
enforceable in data rather than left to editorial judgment per section.
1.2 Card Teaching Order
Sections are ordered globally across all 78 cards from easiest to hardest, not grouped by arcana type or suit. The
order is a force-ranked sequence combining:
• Major Arcana — a 3-tier intuitiveness rating (1 = instantly graspable, 3 = needs real explanation), scored against:
cultural familiarity, image concreteness, name-to-meaning transparency, and singular vs. compound concept. Within
a tier, cards keep their canonical 0–21 order, since the source description text narrates each card as building on the
previous one.
• Minor Arcana — structural tier by rank (Ace = 1, Court = 2, Numbered 2–10 = 3), with a suit-order hypothesis (Cups
→ Wands → Pentacles → Swords) and a court-rank order (Page → Knight → Queen → King) breaking ties within a
tier.
• Explicit overrides — four numbered cards with unusually transparent imagery (Three of Swords, Ten of Swords,
Ten of Cups, Ten of Pentacles) are pulled ahead of the rest of their numbered tier.
The full ordering is authoritative in data_curriculum_nodes.csv via section_number_global (1–78). It
should be treated as a first-draft, tunable ranking, not an immutable sequence — the scoring inputs it's built from are
documented so it can be re-derived if any of those judgment calls change.
1.3 Unit Grouping
Units are formed by chunking the 78-card teaching order into groups of 8 sections (9 units), with the remaining 6
cards forming a final tenth unit. Because the order already ranks by difficulty, later units are harder by construction —
Unit 10 contains the four hardest Major Arcana cards (Hanged Man, Temperance, Moon, Judgment) and the hardest
Swords numbered cards. Full unit contents, names, and descriptive copy live in data_unit_metadata.csv.

---

## Page 3

2. Lesson Formats Used
Eight of the nine defined lesson formats are used in this curriculum. Format A6 (Shadow Meaning Recognition) is
intentionally excluded — it depends on a card's upright meaning already being known and belongs to a separate
future Shadow/Reversed unit.
Code Name Role Mechanic
A1 Choose Card From
Keywords
Isolation Anchor: keyword list, or an alternate text form
(anonymized description). Learner picks the matching
card art from a small grid.
A2 Choose Meaning From
Card
Isolation /
Near-context
Anchor: card art. Learner picks the matching
description text. Anchor text form rotates across a
section's nodes (condensed description → collated
talking points) so the same card isn't tested via one
memorized string.
A3 Major/Minor Arcana ID Standing skill A visual/structural classification task (Major vs.
Minor), not a meaning-recall task. Runs in every
section from Section 1 onward, including before any
card has real reviewable content.
A4 Symbol Identification Isolation
(symbol-intro
sections only)
Card art → symbol name. Used only in sections that
introduce a new symbol (every Major Arcana card;
the first card of each suit).
A5 Symbol Meaning Match Isolation
(symbol-intro
sections only)
Meaning phrase → matching symbol. Suit is excluded
from this format's distractor pool by design.
A7 Symbol Selection From
Label
Isolation
(symbol-intro
sections only)
Label/name → matching symbol icon.
B True/False Talking Point Interleave /
Review
Standalone true/false statements. In review nodes,
statements are drawn from the new card plus
recently-taught cards. No fixed reference card.
C Board Matching Interleave /
Review
Tile-matching grid across multiple cards
simultaneously. Requires at least 2 known cards to
be meaningful — not used in Section 1.
2.1 Symbol-Layer Rotation
The three symbol formats (A4, A5, A7) are not fixed to one node — they rotate in sequence (A7 → A4 → A5 → A7…)
across every section that introduces a new symbol, so all three formats get regular use rather than one dominating. A
symbol is "new" in exactly two cases: every Major Arcana card (each has a unique Planet or Zodiac Sign), and the
first card of each suit (its Ace), which introduces that suit's symbol. The other 52 Minor Arcana cards (courts and
non-Ace numbered cards) have no new symbol to teach, so their symbol-slot node is replaced with a second isolation
pass on the new card instead (see Section 3.1).

---

## Page 4

3. The Section Node Spine
Every section runs the same 7-node template, in order. The format and anchor text rotate node-to-node for variety,
but the underlying pattern is fixed and repeats identically across all 78 sections.
Node
#
Format Phase Content rule
1 A1 Isolation Keyword-list anchor. First exposure: keywords →
card.
2 A2 Isolation Card art → matching description (condensed text).
3 A7 / A4 / A5 (rotating) — or
A1 second pass if no new
symbol
Isolation New symbol taught, OR a second anchor-variant
pass (anonymized description) on the new card.
4 A2 Near-context Third text form (collated talking points). Distractor
pool starts folding in one recently-taught card once
one exists.
5 A3 Standing skill Major/Minor sort. Recall pool size grows across the
course (see Section 4).
6 B Interleave /
Review
True/False. Self-contained statements about the
new card only until a review pool exists; mixed-card
statements thereafter.
7 C — or A2 third pass if
Section 1
Interleave /
Review, closing
Board Matching against recently-taught cards.
Section 1 substitutes a 4th text-form A2 pass, since
no second card exists yet to tile against.
3.1 Why Nodes 1–4 Never Get Harder
Nodes 1–4 always operate on exactly one target card (cards_to_recall_count = 1) with easy-tier distractors, in
every section from the first to the last. This is deliberate: repeating the same 1–3 cards across a rotating set of
formats should read as variety, not escalating difficulty. Real difficulty growth is confined entirely to Nodes 5–7,
described next.

---

## Page 5

4. Difficulty Progression
Difficulty increases in exactly one dimension across the curriculum: the number of cards a learner must correctly
recall within a single node. This is confined to Nodes 5, 6, and 7, and follows a capped, gradually-increasing formula
keyed to global section position (section_number_global, 1–78):
Node Formula (integer division) Range Notes
Node 5 (A3) min(1 + (section_global − 1) ÷ 10, 6) 1 → 6 cards Standing-skill sort grid grows
every 10 sections.
Node 6 (B) min(1 + (section_global − 1) ÷ 15, 5) 1 → 5 cards True/False statement set grows
every 15 sections.
Node 7 (C) min(2 + (section_global − 2) ÷ 12, 6) 2 → 6 cards Board Matching grid grows
every 12 sections, starting from
Section 2.
Review-pool cards for Nodes 5–7 are selected by recency: the N most recently taught cards prior to the current
section, where N is one less than that node's recall count for the section (the new card fills the remaining slot). This
recency bias is intentional for these three nodes — it targets short-term consolidation of what was just learned.
Long-range retention is handled separately (Section 5).
4.1 Expected Session Length
At an assumed typical pace of ~90 seconds per node (the midpoint of the 60–180 second node range, reflecting
occasional but not frequent first-attempt misses), the full 577-node curriculum runs to approximately 864 minutes
(14.4 hours) end to end. Units 1–9 land at roughly 84–90 minutes each; Unit 10 (6 sections) at roughly 67 minutes —
both within the 1–2 hour unit target even before accounting for mistake-driven replay time.

---

## Page 6

5. Spaced Review System
Nodes 5–7's recency-biased pools are effective for reinforcing what a learner just saw, but by design they stop
referencing a card once it falls outside the recency window. Three additional node types exist specifically to
counteract that and keep older cards in active rotation for the life of the curriculum.
Node type Count Trigger Selection rule
Throwback 17 Every 4th section, from
Section 8 onward
The 2–3 cards with the longest gap since their last
genuine exposure, explicitly excluding anything
already inside the current recency window. Format
alternates B / C. Skipped if fewer than 2 stale
candidates exist.
Unit Recap 10 After the last section of
every unit
Board Matching (format C) across every card taught
in that unit. No new card is introduced.
Cumulative
Review
4 After Units 3, 6, 9, and 10 The 6 stalest cards from across ALL previously
completed units (not just the current one), format
alternating C / B.
5.1 "Genuine Exposure" Definition
For staleness ranking and for any future analytics, a genuine exposure means a card the learner actually had to
correctly identify or recall — not a card that only appeared as a wrong-answer option. Concretely:
• Formats A1, A2, A4, A5, A7 — only the target card (first entry in cards_involved) counts. Distractor cards listed
alongside it do not.
• Formats A3, B, C — every card listed in cards_involved counts, since these formats require correctly identifying
or matching multiple cards simultaneously.
Every card is guaranteed a minimum of 7 genuine exposures from its own introducing section alone (one per node,
Nodes 1–7), before any later review. With the review system above included, the realized average across all 78 cards
is approximately 17.5, with a floor of 8 for the very last card taught.

---

## Page 7

6. Data File Reference
6.1 data_curriculum_nodes.csv
One row per playable node. 577 rows total.
Column Type / Values Meaning
global_play_order Integer True sequential play order across the entire curriculum.
unit_number Integer 1–10 Parent unit.
section_number_global Integer 1–78 Position in the master teaching order. Blank/repeated for
unit-level node types (see below).
section_number_in_unit Integer, or "RECAP" /
"CUMULATIVE"
Position within the unit for standard/throwback nodes; a label for
unit-level node types.
card_key String, or blank Foreign key into the base card tables. Blank for unit_recap and
cumulative_review rows, which cover multiple cards.
card_name, arcana_type String Denormalized for human readability; authoritative values live in
the base card table.
is_symbol_intro Boolean True if this section introduces a new symbol (see Section 2.1).
node_number Integer Order within its section (or within its unit-level group).
node_type standard / throwback /
unit_recap /
cumulative_review
See Sections 3 and 5.
node_id String Human-readable unique identifier, e.g. U5-S40-N7 or
U3-S24-CUMULATIVE-N1.
format_code A1 / A2 / A3 / A4 / A5 / A7
/ B / C
Lesson format to render.
format_name String Human-readable format name.
anchor_variant String Which text/asset form is used as the anchor (e.g. keywords,
card_art_to_symbol_name, tile_grid).
node_phase isolation / near_context /
standing_skill /
interleave_review /
throwback_review /
unit_recap /
cumulative_review
Design intent of the node.
cards_involved Pipe-delimited card_key
list
For A1/A2/A4/A5/A7, the first key is the target and the rest are
distractors. For A3/B/C, all keys are genuine recall targets.
cards_to_recall_count Integer Number of cards the learner must genuinely recall in this node.
distractor_tier easy /
easy_plus_one_known /
n/a
Confusability tier the distractors were drawn from.
notes String Implementation-facing explanation of this node's specific content
rule.

---

## Page 8

6.2 data_unit_metadata.csv
One row per unit. 10 rows total. Intended to drive unit-select menus and unit intro screens directly.
Column Type / Values Meaning
unit_number Integer 1–10 Primary key.
unit_name, unit_tagline,
unit_intro_copy
String Menu label, one-line hook, and 2–3 sentence intro-screen copy.
section_count,
standard_node_count,
throwback_node_count,
total_node_count
Integer Composition breakdown for this unit.
has_unit_recap,
has_cumulative_review
Boolean Whether this unit ends with a recap and/or triggers a cumulative
review.
card_count,
card_keys_covered
Integer / pipe-delimited
list
Which cards this unit teaches.
major_count,
minor_count,
dominant_suit
Integer / String Composition summary for display or analytics.
est_completion_minutes_
best_case / _typical /
_with_mistakes
Integer Session-length estimates at 60s / 90s / 150s per node
respectively.
unlock_requirement String Gating rule for the unit-select screen.
icon_image_file String Suggested representative image asset for the unit's menu tile.
menu_order Integer Display order (matches unit_number).

---

## Page 9

7. Tunable Parameters
The following are explicit, isolated parameters in the generation logic — each can be adjusted independently without
redesigning the system:
• Unit chunk size — currently a fixed 8 sections per unit (final unit: 6). Could instead follow natural content
boundaries (e.g. suit completions) rather than a fixed count.
• Card teaching order — the intuitiveness scoring weights and tie-break rules (Section 1.2) are first-draft judgment
calls, flagged for review once real learner data exists.
• Difficulty growth formulas — the divisors and caps in Section 4's three formulas control how quickly Nodes 5–7
ramp up and where they plateau.
• Throwback cadence — currently every 4th section from Section 8 onward, pulling 2–3 stale cards. Frequency and
pool size are independent knobs.
• Cumulative review trigger points — currently after Units 3, 6, 9, and 10. Could move to every unit, or a different
interval.
• Recency window size — how many sections back Nodes 5–7 and the throwback exclusion filter consider "recent"
is currently implicit in each node's own recall-count formula.
Out of scope for this spec: Shadow/Reversed meanings (format A6) and test/checkpoint nodes referenced in the
broader project plan. Both are intended as later additions layered on top of this structure, not replacements for it.
