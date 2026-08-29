# 0013 — A2 serves one-line openers, not full descriptions

**Date:** 2026-08-29
**Status:** Accepted

## Context

Found by playing the course rather than by reading it. Node 2 of the first
section asks "which meaning belongs to this card?" and offered four full
condensed descriptions — **262 words per question**, about a minute of reading
at a brisk pace, against the curriculum's own 60–180 second budget for an
entire node. The learner had seen none of them.

Two faults met here.

**The build followed the wrong document.** The Lesson Format Bible specifies
A2's candidates as *keyword sets* — "Candidates: Text (keyword sets)… Data:
card_keywords" — while `data_curriculum_nodes.csv` gives the node an
`anchor_variant` of `card_art_to_description_condensed`. `0002` resolved
conflicts like this with "the data wins, it's what the curriculum actually
plays." For this format that was wrong: the anchor_variant named a content
field, not a playable amount of it.

**And the teaching step no longer covered for it.** Before `0011`/`0014` the
section intro showed the full condensed description, so at least one of the
four options was familiar. Trimming that screen to a single orienting line —
correctly, to stop overwhelming a first meeting — removed the only place the
description appeared before being tested.

## Decision

A2's meaning options are the **opener**: the one characterising sentence the
teaching screen already showed. 72 words a question instead of 262.

Not keyword sets, though the Bible says so. Node 1 already runs keywords → card
and the Curriculum Design Spec asks for a meaning at node 2 precisely so the
two are not inverses of each other. The opener satisfies both documents' intent
— it is a meaning, and it is short enough to scan.

The full condensed description still arrives, in the reveal after answering.
So the section now reads: opener at the teaching screen → recognise it at node
2 → full description in the reveal → collated talking points at node 4.

## Consequences

`0002`'s rule — the data wins over the Bible — no longer holds unqualified. The
curriculum's `anchor_variant` says which *field* a node draws on; it does not
say how much of that field belongs on screen. Where the Bible describes an
amount, it is describing playability, and it should be believed.

Node 4 was measured at the same time and left alone: three collated talking
points across four options is 130 words a question, around 30 seconds. Heavy,
but it is the section's deeper pass and it comes after two lighter ones.

Three cards open their condensed entry on a neighbouring card rather than
themselves, so their opener is weaker than the rest — The Empress most of all.
The opener rule in `lib/data.js` works around it by preferring a sentence that
names the card, but the source text is worth a look.
