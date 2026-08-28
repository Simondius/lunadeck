# 0003 — Symbol formats: where distractors come from, and what carries a label

**Date:** 2026-08-28
**Status:** Accepted

## Context

Formats A4, A5 and A7 cover 26 nodes and were unbuildable: no builder existed,
and the app never loaded `data_symbol_images.csv` or
`data_symbol_significance.csv`. Eight of the 26 are in Unit 1 — the first one
lands on the third node of the first lesson.

Two things had to be settled to build them.

**Where distractors come from.** Unlike A1/A2, the curriculum names only the
section's card on a symbol node — `cards_involved` has one entry and there is
no distractor list. Every symbol node is `distractor_tier = easy`.

**What carries a name.** The Lesson Format Bible says symbol icons are "always
paired with a Category: Name label, since an icon alone doesn't identify itself
the way card art does." But naming the icon is the entire question on all three
formats.

## Decision

Distractors are selected at build time from `data_symbol_images.csv`, seeded by
`node_id` so a node always renders the same way:

- **A4 / A7** — Easy tier per the Bible: every distractor from a different
  category than the target, one per category, so a 4-option grid spans Planet /
  Zodiac Sign / Element / Suit and is eliminable by shape.
- **A5** — same-category only, so a miss is a genuine content mix-up rather
  than a category tell. Three options.
- Modality is excluded everywhere. `symbol_significance` carries three
  modalities but `symbol_images` has no asset for them, so they can be neither
  reference nor candidate.

On labels, the Global Style Guide's Section 4 rule wins: a candidate never
shows the identity that would give the answer away. So A4's reference icon is
unlabelled, A7's candidate icons are unlabelled, and the "Category: Name" label
appears only where it is not the answer — as A4's text candidates and A7's text
anchor. The Bible's labelling rule is really about cards and icons shown
*incidentally*, not about the thing being asked after.

## Consequences

**One conflict is being carried, not resolved.** The Bible excludes Suit from
A5's pool entirely. The curriculum schedules an A5 node on Ace of Swords
(U2-S12-N3), whose symbol *is* a Suit, and excluding Suit would leave that node
with no pool at all. Suit-vs-Suit is used there — four suits gives a valid
three-option round. Either the Bible's exclusion needs narrowing, or that node
should be re-formatted as A4/A7. Flagged for the next spec pass.

Symbol art is a gold glyph on an opaque white plate, so symbol tiles take the
plate's own white as their background rather than sitting a white square inside
a dark panel. Generating transparent-background variants with a script — the
way `circle` and `avatar` crops are derived — would look better against the
dark theme and is the preferred long-term fix; it was not done here because it
adds 30 binaries to a repository the README already flags for Git LFS.
