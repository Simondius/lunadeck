# 0089: The mini capstone is renamed "Alignment Check" and gets its own icon

## Context

Simon: rebrand "Mini Capstone" to "Alignment Check," with an icon
representing stars aligning.

## What changed

Every card's `label: "Mini Capstone"` in `data/v4/capstone_nodes.json`
(all 22 entries — the five hand-authored cards and the seventeen this
session's generator built) is now `"Alignment Check"`. Updated at the
source too, not just the output: `scripts/build-v4-new-cards.mjs`'s own
capstone-building code and `scripts/build-v4-capstone-nodes.mjs`'s three
hardcoded labels (Fool/Lovers/Empress) both say the new name now, so
neither script would silently regress the label if it were ever touched
again — the same lesson `0088` just re-learned about node-2.

`shapeForNode()` (`components/lesson-v2/v2-node-icon.jsx`) picks a path
icon from a node's own round data — a capstone node's first round is a
plain keyword round, so without a special case it drew the same generic
icon every ordinary keyword node uses, with nothing on the path
distinguishing "Alignment Check" from "Meet the X." Added an early check
for a capstone node specifically (before the round-type rules) and a new
"align" icon: three small stars on one shared baseline, growing left to
right, reading as things coming into alignment.

The capstone id check needed a substring match, not a fixed prefix or
suffix: the five original hand-authored cards use `capstone-<slug>`
(id starts with it) while every card this session's own generator built
uses `<card_key>-capstone` (id ends with it) — `node.id?.includes(
"capstone")` covers both without caring which.

## Verification

Checked the path live: every unit's capstone step now reads "Alignment
Check" with the new three-star icon, and neighboring nodes ("Find the
Elements," "All the Keywords") kept their own existing icons unchanged.
`npm run build` passes; all 22 section files and `capstone_nodes.json`
remain valid JSON.
