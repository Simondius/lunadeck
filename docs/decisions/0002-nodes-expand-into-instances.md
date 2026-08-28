# 0002 — A node expands into one or more format instances

**Date:** 2026-08-28
**Status:** Accepted

## Context

`cards_to_recall_count` is the curriculum's only difficulty axis. It grows on
nodes 5–7 of every section — the Major/Minor sort reaches 6 cards, True/False
reaches 5, Board Matching reaches 6 — while unit recaps and cumulative reviews
reach 8.

Every lesson format, though, is specified as a single screen with a single
target. Format A3's grid is permanently two fixed labels. Format B shows one
statement. Format C caps at 3 rows to keep card art readable (Global Style
Guide, Section 9). None of them has anywhere to put a sixth card.

The prototype resolved this by ignoring it: `buildRound` read only
`node.card_key` and dropped the rest, and `formatC` sliced `cards_involved` to
the first three. 68 A3 nodes, 74 B nodes and 65 C nodes were being played at
the difficulty of section 1. The entire progression was flat.

## Decision

A node builds an **array** of format instances rather than one round.
`buildNode` returns that array; the session plays them back to back before
moving on.

- A3 with N cards → N sorts, one card each.
- B with N cards → N statements, one card each.
- C with N cards → boards of 3, split so no board is left with a single row
  (4 cards becomes 2+2, not 3+1). An eight-card unit recap is three boards.
- A1, A2 and the symbol formats stay at one instance — they name one target
  and the rest of `cards_involved` are its distractors.

This is not a new concept. The Global Style Guide's curriculum progress
indicator (Section 7) already assumes it, in as many words: "a Tile Match round
with 4 board-refreshes renders 4 segments… the unit of progress is always one
whole instance of the format."

577 nodes now expand to 1081 instances.

## Consequences

The difficulty curve the Curriculum Design Spec describes actually plays.

The session's progress bar now measures instances rather than nodes, so it
reaches 100%. It is still a continuous fill, not the segmented bar the Style
Guide specifies — segments are one per node in a *section*-sized lesson, and
the prototype still plays a whole unit in one go. That belongs with the Main
Path work, not here.

Nothing yet decides which instance a mistake is logged against. Format B logs
every wrong answer and Format C logs every wrong tile, so a six-instance node
can log six misses. Whether the mistake-review queue (Main Path Spec, Section
7) replays the instance or the node is undecided.
