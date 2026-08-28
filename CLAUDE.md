# Working on Lunadeck

Read `README.md` first — it explains the repository layout and the data model.
This file covers how to work in the repo, not what's in it.

## Project scope

Build a gamified mobile prototype for learning tarot reading, including
content management and social systems, following established language-learning
app conventions: a linear unit path, short repeated exercise formats, streaks,
and social features.

A second goal runs alongside the first: developing a working practice for
collaborating with Claude across design and coding tools.

## Orientation

Lunadeck is a gamified tarot learning app built around a linear lesson path.
The content model lives in `data/` as CSVs, the feature specs live in `specs/`,
and the art lives in `assets/`.

Before answering questions about curriculum structure, exercise formats, or card
content, read the relevant CSV rather than inferring from filenames. The tables
are small enough to read directly.

## Ground rules

**The specs are authoritative.** `specs/` holds the locked feature specs and the
global UX style guide. If a request conflicts with a spec, say so rather than
silently following the request.

**Cross-cutting UX rules live in `specs/UX_Style_Guide.md`.** Anything that would
apply to more than one exercise format belongs there. Anything specific to one
format's mechanic belongs in that format's own spec. Respect that split when
adding rules.

**`card_key` is the join key everywhere.** New card-level data goes in a new
table keyed on `card_key`, not as extra columns on an existing one.

**Don't invent card content.** Keywords, talking points, descriptions, and symbol
meanings come from the source guidebook. If something is missing, flag the gap
rather than writing plausible filler.

**Don't regenerate CSVs wholesale.** Edit the rows that need changing. A
rewritten file produces a diff nobody can review.

**Derived art is generated, not edited.** The `circle` and `avatar` crops come
from the masters via the scripts in `scripts/`. Rerun the script; don't
hand-edit a crop.

## Data integrity

`python scripts/check_data.py` enforces everything below, plus a few rules the
app depends on. Run it before opening a pull request that touches `data/`.

When editing `data/data_curriculum_nodes.csv`:

- `global_play_order` must stay contiguous and unique
- `node_id` must match its unit, section, and node numbers
- every `card_key` in `cards_involved` must exist in `data_tarot_cards_base.csv`
- `format_code` must be one of A1, A2, A3, A4, A5, A7, B, C
- `cards_involved` must not repeat a card — a repeat renders two identical
  options in one grid, which the learner cannot answer
- if node counts change, update the matching row in `data_unit_metadata.csv`
  (`standard_node_count`, `throwback_node_count`, `total_node_count`, and the
  three completion time estimates)

When editing `data/data_unit_metadata.csv`, `card_keys_covered` is
pipe-delimited and must agree with the cards actually referenced by that unit's
nodes.

## Conventions

- Card keys: `major_NN_name` and `minor_{suit}_{rank}`
- Asset files: `{card_key}_{MASTER|circle|avatar}.png`
- Pipe (`|`) is the in-cell list delimiter across all CSVs

## Recording decisions

Non-obvious choices — why a card sits in a particular unit, why a distractor
tier was tuned a certain way — go in `docs/decisions/` as a short numbered
note. Chat history isn't shared between collaborators; these files are.
