# Spec_Daily_Draw_Tab
*Converted from `Spec_Daily_Draw_Tab.pdf`.*

---

## Page 1

ZODIAC TAROT · DAILY DRAW
Daily Draw Mechanic
Collection wall, deck pull, the progressive reveal loop, and reversed
draws on repeat cards.
Includes pixel-accurate mobile mockups of every screen state.
Reference spec · draft for solo design pass, not yet reviewed by a collaborator.

---

## Page 2

Screen mockups
Pixel-accurate mobile mockups (375×812pt frame) built from the actual project data and card art,
rendered at 3× scale. Every stacked region below was allocated its own box up front — see Section
8 for the layout rule this follows.
1. Collection wall (tab home)
All 78 cards, sectioned Major Arcana then Minor Arcana
by suit. Scrolls under a docked deck pile, with a fade cue
signaling more content.
1. Collection wall, on cooldown
Deck dims and shows a countdown while the cooldown is
active. Already-collected tiles stay fully tappable for
replay.

---

## Page 3

2. Draw — full-screen reveal (upright)
Tapping the deck pops a not-yet-collected card upright
and expands it to fill the screen, letterboxed so the full
card is always visible.
5. Expand and collect
Continuing out of the final sub-phase returns the card to
full screen. One more tap sends it into an open wall slot.

---

## Page 4

3. Keywords — mid-reveal
Card is letterboxed to stay fully visible when shrunk. One
blank per keyword the card actually has (count varies 2–7
across the deck).
3. Keywords — all revealed
Worst-case count (7 keywords) shown fully, with Redo /
Continue now available.

---

## Page 5

3. Description
card_descriptions.description_condensed — the named
version, since the art above already shows the card.
3. Reading points — mid-reveal
Same one-tap-per-item pattern as keywords, sourced
from card_talking_points in note_order.

---

## Page 6

3. Reading points — worst case (7 of 7)
The tallest real combination in the dataset. Content
scrolls with a fade cue rather than colliding with the
button row below — see Section 8.
2. Draw — full-screen reveal (reversed)
Drawing an already-collected card pulls it reversed. The
whole card rotates 180°, with a tag that stays upright.

---

## Page 7

3. Reversed meaning panel
A single static phrase from reversed_reading_notes — no
progressive reveal, no reading-points equivalent exists in
the data.

---

## Page 8

Zodiac Tarot — Daily Draw Mechanic
Status: Draft for solo design pass. Not yet reviewed by a collaborator.
A separate tab from the main app, sitting alongside (not inside) the linear curriculum path defined by
teaching_order / curriculum_nodes . Where the main tab teaches cards in a fixed sequence, this tab is a collection game: a
wall of all 78 cards, filled in by drawing from a deck, with a second layer of depth once a card has been drawn reversed.
Companion files: Zodiac_Tarot_Global_Style_Guide.md (reuse its interaction primitives),
Zodiac_Tarot_Data_Model_Reference.pdf Section 13.2 (the guidebook's "Card a Day" ritual this feature is themed on) and
Section 13.7 (the reversed/shadow rule this reuses).
1. Collection wall (tab home)
A grid of all 78 cards, styled like cards mounted on a wall, sectioned to mirror the deck's own structure:
Major Arcana — 22 cards
Minor Arcana — 56 cards, broken out by suit (Wands, Cups, Swords, Pentacles — 14 each)
Uncollected cards show as a plain card-back tile. Collected cards show their art (small). A card that has also been drawn
reversed at least once gets a distinct treatment — a gold ring around the tile plus a small gold dot badge — so "both sides done"
is visible at a glance across the wall, not just discoverable by tapping in.
The full 78-card grid scrolls under a deck pile docked at the bottom of the screen, with a fade cue signaling there's more
above/below the fold — the deck pile itself does not scroll with it. The header line reports two counts: cards collected out of 78,
and how many of those have been seen reversed too.
Completion state. The wall's real completion goal is 156 states (78 cards × 2 orientations), not 78. Once every card has been
seen both upright and reversed, the deck pile and cooldown timer disappear entirely — there is nothing left to draw. The tab
stops being a timed mechanic at that point and becomes a plain browsable reference of the completed deck: every tile stays
tappable to revisit its content (Section 3), just with no further draws to make. There is no badge, animation, or other distinct
reward moment for reaching this state — the completed wall is its own payoff.
2. Drawing a card
Tapping the deck pops a card out with a delightful, brief animation that expands it to fill the full screen. Which pool tier the draw
lands on (Section 4) decides its orientation:
A card not yet in the collection draws upright.
A card already in the collection draws reversed — the entire card renders upside down (a 180° rotation of the full card art,
not a different image or a small badge), with a small "Reversed" tag pinned top-left so it reads right-side-up even while the
card beneath it doesn't. This is a deliberate, unmissable signal before the player reads any text — the same physical-upsidedown convention the guidebook itself would use with a real deck.
A reversed pull only ever happens on a card the player has already met upright, so the shadow framing always lands on familiar
ground rather than being sprung on a brand-new card.
3. Progressive reveal
First tap on the full-screen card shrinks it to occupy the top half of the screen, using letterboxing rather than a crop — the full card
must stay visible in its entirety at every size, so shrinking introduces empty space to the sides (or top/bottom, depending on the

---

## Page 9

card's aspect ratio relative to the box) instead of cutting off any part of the art. The bottom half is reserved permanently for the
reveal panel for the rest of this flow — nothing is drawn outside that allocated region (see the layout note in Section 8). A
reversed card stays rotated 180° through this entire shrink; only its box position changes, never its orientation.
Upright path — the panel cycles through three sub-phases in a fixed order:
1. Keywords. On entry, shows one blank per keyword the card actually has ( data_card_keywords.csv , filtered to card_key ,
count varies 2–7 across the deck — never hardcode a fixed number of blanks). Each tap in the panel reveals the next
keyword in keyword_order , one at a time, so the player has a beat to guess before seeing it. Once all are revealed, Redo
and Continue appear.
2. Redo clears the panel back to all-blanks and restarts the same one-tap-per-keyword loop. Unlimited repeats.
3. Continue moves to sub-phase 2 and does not return here.
4. Description. Replaces the keyword panel with card_descriptions.description_condensed — not
description_anonymized ; this phase names the character (e.g. "The Fool stands...") since the card is already fully visible
above, so anonymizing the text would serve no purpose here (that field exists for a specific lesson format's guess-the-card
mechanic, not this one). If the text runs past the fold, the text block scrolls internally rather than resizing the card art above it.
Single Continue button (no redo needed — there's nothing to progressively reveal in this sub-phase, it's static text).
5. Reading points. Replaces the text with one blank per row from data_card_talking_points.csv (filtered to card_key ,
ordered by note_order , count varies 4–7 across the deck). Same one-tap-reveals- next-row pattern as keywords. Once all
are revealed, Redo / Continue appear again, with the same unlimited-redo behavior.
Reversed path — a single sub-phase, not three. There is no reversed equivalent of card_talking_points in the data model,
and re-running the keyword-guess phase for a card the player has already fully unlocked would just be re-teaching content
they've already earned — so the panel goes straight to:
1. Reversed meaning. Shows card_descriptions.reversed_reading_notes (an 8–15 word phrase) under a "Reversed
meaning" label. Static text like the upright description phase — a single Continue button, no progressive reveal, since there's
only one short phrase to show. Continue leads straight to Section 5 (Return to full screen).
4. Card selection algorithm
Selection only matters for new draws; replaying an already-collected tile (Section 6) is a direct pick, not algorithmic.
Pool Weight Notes
Taught, not yet collected 70% The wall should fill roughly in step with curriculum progress, so most days a new draw
reinforces something recently taught.
Untaught, not yet collected,
next 1–2 units ahead
10% Preview slot — creates curiosity about what's coming.
Any remaining not-yetcollected card5% Keeps the full 78-slot goal reachable even before the curriculum has technically "taught" every
card, and matters more as a learner nears wall completion and the taught-but-uncollected pool
runs dry.
Collected upright, not yet
seen reversed
15% Landing here draws the same card again, but reversed (Section 2). This is what completes that
card's "both sides" marker on the wall.
Collected and already seen
both sides
0% by the
algorithm
Fully retired from the pool — there's nothing left to unlock for that card. If every other tier is
exhausted, fall back to any collected-upright-only card (forcing a reversed pull) rather than a
true dead end.
Treat these weights, and the 15% tier in particular, as tunable rather than final — see Section 9.

---

## Page 10

One consequence worth noting: as a player collects every taught card, the first three tiers shrink toward zero and the algorithm
falls through to reversed pulls almost automatically. The mechanic self-transitions from "collect the wall" to "chase the shadows"
without needing a separate mode switch, and a repeat draw is never wasted content.
5. Return to full screen and collect
Continuing out of the final sub-phase (reading points for an upright draw, reversed meaning for a reversed one) expands the card
back to fill the full screen — still rotated 180° if this was a reversed draw (panel disappears entirely; this is a distinct state from
the initial full-screen reveal in Section 2, since there is no bottom panel allocated here). One more tap:
If this was a new draw (upright), the card animates into an open slot on the collection wall and the tab returns to the wall
with that slot now filled.
If this was a reversed draw, the same already-filled tile on the wall gains the "both sides" marker (Section 1) — no new slot is
used, since the card was already in the collection.
If this was a replay of an already-collected card (Section 6), the same tap simply returns to the wall with no change.
6. Replaying a collected card
Tapping any already-filled tile on the collection wall re-enters the identical upright loop (Sections 2–5) starting directly at the fullscreen reveal — skipping the deck-pop animation, since nothing is being drawn. This always replays the upright reading,
regardless of whether that card's "both sides" marker is set. Whether (and how) a player can deliberately revisit a reversed
meaning they've already unlocked, rather than only seeing it live at the moment of a reversed pull, is open — see Section 9.
7. Draw cooldown
A new card cannot be drawn from the deck pile until a configurable cooldown period has passed since the last new draw (default:
12 hours), independent of how many times the learner replays already-collected cards in that window — replay is unlimited. This
value must live in remote config / experiment tooling, not be hardcoded in the client, since it's expected to change during tuning.
It stops applying entirely once the wall reaches full completion (Section 1) — there is no cooldown to enforce when there's
nothing left to draw.
While on cooldown, the deck pile should communicate the wait state clearly (e.g. a countdown) rather than just going
dead/unresponsive on tap — a deck that looks tappable but silently does nothing on tap reads as broken, not as "come back
later."
8. Layout note for whoever builds the reveal panel
The full-screen-card → shrink-to-top-half → reveal-panel-in-bottom-half transition (Section 3) is exactly the kind of stacked-region
layout that's easy to get subtly wrong: the card's box and the panel's box must be sized so their edges meet, not overlap. Build
the shrink by giving the card exactly the top-half box and the panel exactly the bottom-half box up front, rather than shrinking the
card by some fixed offset and hoping the panel's assumed position still lines up. Check this specifically in the "reading points"
sub-phase with real (longer) card art and a 7-line talking-points list both loaded, since that's the tallest combination in the dataset
and the one most likely to reveal a boundary that doesn't quite meet — if the panel's content can overflow, it should scroll
internally with a fade cue rather than collide with the Redo/Continue buttons below it.
9. Open questions

---

## Page 11

1. Once a card's reversed meaning has been shown live (Section 2/3), is it ever re-viewable afterward, or is that one draw the
only time a learner sees it unless they remember it themselves? Section 6 currently leaves this open — tapping a wall tile
always replays upright, even for "both sides" cards.
2. Is a 15% pool weight for collected-upright-not-yet-reversed cards (Section 4) the right balance, or should it start lower and
ramp up over time so early players see more new cards before reversed pulls start appearing?
3. Once every taught card is collected and the learner is waiting on curriculum progress to unlock more, does the deck pile show
an explicit "nothing new yet, come back after your next lesson" state, or just fall through to reversed pulls indefinitely (Section
4)?
10. Explicitly out of scope
No streak counter — the wall-completion count is the progress metric for this tab; no separate flame/streak is proposed here.
If the broader app's home-tab streak should also credit a daily draw, that's a cross-tab decision belonging to the core
gamification spec, not this one.
No social sharing, leaderboard, or friend comparison of collection progress.
No push notification copy/timing — belongs to a notifications spec, though "your next card is ready" at the cooldown mark is
an obvious trigger for it to pick up.
No journal/reflection text entry — the keyword-guessing and reading-points loop already fills that "pause and think before the
answer" role structurally, without adding a free-text field to maintain.
No birthday-triggered special draw.
No completion reward (badge, animation, or otherwise) for reaching full collection.
No reversed talking points — the reversed path reuses reversed_reading_notes as-is rather than authoring a new
reversed-equivalent of card_talking_points .
No new authored content anywhere in this tab — every string sources from existing columns ( description_condensed ,
card_keywords , talking_points , reversed_reading_notes ).
