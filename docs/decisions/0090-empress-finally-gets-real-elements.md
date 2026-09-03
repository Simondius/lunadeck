# 0090: The Empress's own "Find the Elements" node gets real content

## Context

Simon pointed at a Desktop folder (`major_arcana_card_elements/`) and
asked to integrate its PNGs and descriptors. Comparing it against the
repo turned up that its crops and tables were already committed
(`assets/cards/cardelements/major_03_empress_element_*.png`,
`docs/card-elements/tables/major_03_empress.json`) — this folder is a
local copy of the same content-authoring package documented in
`docs/card-elements/README.md`, not new material.

That README, read closely, explains why it still mattered: the package
covers 18 cards — the 17 this session's own generator built, *plus the
Empress* — "(Magician, Emperor, and Lovers already had this content in
the live app)" is the one line naming which of the five original
hand-authored cards were exempt. Empress wasn't. Checking
`data/v4/empress_section.json`'s own node-2 confirmed it: two generic
keyword-tap rounds (`love`/`harmony` vs `purple`/`spaghetti`, etc.), not
the zone-and-tilematch "Find the Elements" shape every other card has.
The real content had been sitting in the repo, fully described, correctly
delivered, simply never wired in for this one card.

## Fix

Replaced node-2's two rounds with the real pair every other card uses: a
`zone` round built directly from `docs/card-elements/tables/
major_03_empress.json`'s own `elements` array (Venus, Scepter,
Pomegranates — real rects against the master art, sourced from
`data_major_arcana_symbols.csv`/`data_symbol_significance.csv` for Venus
and picked by eye from the card's own art for the other two, per that
table's own sourcing rules), and a matching `tilematch` round pairing
each element's crop image with its own description, stripped of its
"Name: " prefix and re-capitalized — the same convention already visible
in every other card's own tilematch round.

The two keyword-tap rounds this replaced tested `love`, `harmony`, and
`beauty` — checked first that all three are already tested multiple times
elsewhere in Empress's own node-4 and node-5, so nothing about the
curriculum's own keyword coverage was lost by removing them from node-2
specifically.

## Verification

Played it live: all three zones tap-match correctly against their own
text, and the tilematch round shows the real crop art with correctly
capitalized description text. `npm run build` passes; the file remains
valid JSON.
