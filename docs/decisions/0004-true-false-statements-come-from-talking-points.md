# 0004 — True/False statements come from talking points

**Date:** 2026-08-28
**Status:** Accepted

## Context

The prototype's Format B built its statement from
`card_descriptions.description_condensed` — a full paragraph. The README says
the opposite: `data_card_talking_points.csv` holds "the statement pool for the
True/False format." The Lesson Format Bible allows both, listing description,
keywords and talking point as separate content tiers, and
`data_curriculum_nodes.csv` names neither: its `anchor_variant` is
`mixed_card_statements`.

With no tier selector anywhere in the data, something had to be picked.

## Decision

Statements come from `card_talking_points`, chosen deterministically by
`node_id`.

A talking point is a single clause — "Determined forward motion — ambition
finally in gear" — which is what a True/False judgement is actually made
against. A condensed description is several sentences covering several claims,
and asking whether all of it belongs to one card is a different, vaguer task.

For a False round, the donor is another card named in the same node, matching
the Curriculum Design Spec's own rule that review statements are "drawn from
the new card plus recently-taught cards." The 15 nodes that name a single card
have no sibling to borrow from and previously could only ever be True; they now
draw a donor from `card_similarity` at the Easy tier, so the answer isn't
guessable from the shape of the round.

Across the whole curriculum this lands at 140 True to 139 False.

## Consequences

The Bible's own open item now matters more: a False statement borrowed from a
highly confusable card can read as true of the shown card too. It names Five of
Cups / Three of Swords as a live example and recommends auditing all 1,226
`difficulty_score = 1` pairs. Nothing here does that audit; drawing donors from
the node's own recently-taught pool rather than from the most-confusable pairs
keeps the exposure low for now.

The description and keyword tiers the Bible defines are still unimplemented,
and the curriculum has no field to request them.
