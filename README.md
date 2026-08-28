# Lunadeck

A gamified mobile app for learning tarot reading. Learners work through a
structured path of short exercises, building recognition of all 78 cards, their
symbols, and their meanings.

This repository holds the content, data model, design specs, and application
code. The content is deliberately kept as flat CSV files so that changes are
reviewable as line diffs in pull requests.

---

## Repository layout

```
data/       13 CSVs — the entire content model (see below)
assets/     card art and symbol art
  cards/master/   78 full card images, one per card
  cards/circle/   78 circular crops, used for path nodes
  cards/avatar/   78 avatar crops, used for small UI slots
  symbols/        30 symbol images (zodiac, planets, elements, suits)
  misc/           deck box lid
specs/      feature specs (PDF) and the global UX style guide
scripts/    Python utilities that generated the derived art and data
app/        application code
docs/       decision records
```

---

## The data model

Everything keys off `card_key` — a stable identifier like `major_00_fool` or
`minor_wands_ace`. Every table that describes a card joins on it. If you add a
card-level attribute, add it as a new table keyed on `card_key` rather than
widening an existing one.

### Core card tables

**`data_tarot_cards_base.csv`** (78 rows) — the spine. One row per card:
`card_key`, `arcana_type` (major/minor), `suit`, `rank`, `card_name`,
`image_file`. Start here; every other card table is an extension of this one.

**`data_card_descriptions.csv`** (78 rows) — long-form meaning text. Holds four
variants of the same content: `description_text` (full), `description_condensed`
(with `condensed_word_count`), `description_anonymized` (character references
stripped, for use in exercises where naming the card would give away the answer),
and `reversed_reading_notes`. Also carries `astrological_label`.

**`data_card_keywords.csv`** (307 rows) — ordered keywords per card, with
`keyword_order` and a `source` field marking provenance. Used by the
keyword-based exercise formats.

**`data_card_talking_points.csv`** (345 rows) — ordered reading notes per card.
These are the statement pool for the True/False format.

**`data_minor_arcana_attributes.csv`** (56 rows) — minor-arcana-only card face
data: `suit`, `rank_tier`, the two corner glyphs, and `banner_text`.

### Symbol tables

**`data_major_arcana_symbols.csv`** (22 rows) — maps each major arcana card to
its governing symbol (`symbol_type` + `symbol`, e.g. Planet / Uranus).

**`data_symbol_significance.csv`** (137 rows) — ordered meaning phrases per
symbol, with `source_card` and `linked_element`.

**`data_symbol_images.csv`** (30 rows) — maps a symbol to its image file.

### Curriculum tables

**`data_curriculum_nodes.csv`** (577 rows) — the play order. This is the most
important file in the repo and the one most likely to need careful review when
edited. One row per node, ordered by `global_play_order`. Key fields:

- `node_id` — human-readable position, e.g. `U1-S1-N1`
- `node_type` — `standard` (546), `throwback` (17), `unit_recap` (10),
  `cumulative_review` (4)
- `format_code` / `format_name` — which exercise format the node uses
- `cards_involved` — pipe-delimited `card_key` list (the answer plus distractors)
- `cards_to_recall_count`, `distractor_tier`, `node_phase`, `anchor_variant`

**`data_unit_metadata.csv`** (10 rows) — one row per unit. Holds naming and
intro copy, node and card counts, `card_keys_covered` (pipe-delimited),
`unlock_requirement`, `icon_image_file`, and three completion time estimates
(best case, typical, with mistakes).

**`data_teaching_order.csv`** (78 rows) — the order cards are introduced,
independent of node structure.

**`data_card_similarity.csv`** (6006 rows) — every card pair, with
`mean_abs_diff`, `similarity_score`, and a `difficulty_tier`. This is what
distractor selection draws on: harder nodes pull distractors that score as more
similar to the answer.

**`data_birth_card_lookup.csv`** (21 rows) — maps a numerological birth number
to a major arcana card.

---

## Exercise formats

Eight formats appear in the curriculum:

| Code | Name |
|---|---|
| A1 | Choose Card From Keywords |
| A2 | Choose Meaning From Card |
| A3 | Major/Minor Arcana ID |
| A4 | Symbol Identification |
| A5 | Symbol Meaning Match |
| A7 | Symbol Selection From Label |
| B  | True/False Talking Point |
| C  | Board Matching |

Each format has its own locked spec. Cross-cutting interaction rules that apply
to all formats live in `specs/UX_Style_Guide.md`, not in individual format specs.

---

## The units

| # | Name |
|---|---|
| 1 | Instant Classics |
| 2 | Completing the Court |
| 3 | The Royal Court |
| 4 | Turning Points |
| 5 | Big Swings |
| 6 | The Cups Story |
| 7 | Wands in Motion |
| 8 | Grounding Down |
| 9 | Sharpening the Mind |
| 10 | The Deep End |

---

## Asset naming

Card art follows `{card_key}_{variant}.png` where variant is `MASTER`, `circle`,
or `avatar`. Symbol art follows `{Type}_{name}_MASTER.png`, e.g.
`Planet_mercury_MASTER.png`, `Zodiac_virgo_MASTER.png`.

The `circle` and `avatar` variants are derived from the masters by
`scripts/script_make_path_circles.py` and `scripts/script_make_avatars.py`. If a
master changes, regenerate rather than editing the crop by hand.

---

## Working conventions

CSVs are the source of truth for content. Edit them directly and let the diff
carry the review — don't regenerate a whole file if you're changing a few rows,
as that produces an unreadable diff.

Card art is binary and doesn't diff. Replacing masters frequently will grow the
repository, so if art iteration becomes routine, move `assets/` to Git LFS.

Decisions that future contributors would otherwise have to reverse-engineer go
in `docs/decisions/` as short numbered notes.
