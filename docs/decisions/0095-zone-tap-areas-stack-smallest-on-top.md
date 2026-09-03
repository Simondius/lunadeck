# 0095: A zone round's tap targets stack smallest-first, so a bigger zone can't swallow a smaller one nested inside it

## The bug

Simon flagged a screenshot of Fool's node-2, round 2 (uranus/crescent_moon/
night_sky) as "bugged" - selecting "Uranus" from the description list and
tapping the Uranus glyph on the card did nothing at all.

Reproduced live: `night_sky`'s own rects (`data/v4/fool_section.json`)
are deliberately huge - two boxes covering nearly the whole top 59% of
the card - and both `uranus` (0.40-0.61 x, 0.10-0.22 y) and
`crescent_moon` (0.37-0.62 x, 0.40-0.53 y) sit entirely inside that same
area. `zone-round-player.jsx` rendered each element's `.zone-tap-area`
buttons in `remaining`'s own array order with no z-index of their own -
same-stacking-context absolutely-positioned siblings paint in DOM order,
so whichever renders *last* sits on top and is the only one a real tap
(or `elementFromPoint`) ever reaches. Night sky's buttons happened to
render after Uranus's and Crescent moon's, so every tap anywhere in
their shared region - which is all of Uranus's and Crescent moon's own
area - hit "Night sky" instead, silently. Confirmed via
`document.elementFromPoint()` at the Uranus glyph's own screen
coordinates: it returned the "Night sky" button, not "Uranus".

## The fix

Sorted the flattened `(element, rect)` list by rect area, descending,
before rendering - the biggest zone (night sky) now paints first, so any
smaller zone nested inside it (Uranus, Crescent moon) paints after and
sits on top, winning the hit test for its own footprint while a tap
elsewhere in night sky's own larger, otherwise-empty area still correctly
reaches it underneath. This is a general fix, not specific to this one
round: it holds for any future round where one element's rect happens to
contain another's, regardless of which card or which shuffled order
`remaining` happens to land in for a given `round.id`.

## Verification

Reproduced the exact failure via `elementFromPoint` at Uranus's own
coordinates (returned "Night sky"), applied the fix, confirmed the same
point now returns "Uranus," then played the full round live: Uranus,
Crescent moon, and both Night sky rects all matched correctly in
sequence, the card fully recolorized, and "Continue" appeared. `npm run
build` passes; console clean throughout.

## Checked every other card too

Simon asked directly - audited every `zone` round across all 22 cards
(`data/v4/*_section.json`) for one rect containing more than 30% of
another's own area, the same shape of defect. Found two more, both
already fixed by the same general code change, no data edits needed:
Devil's own `capricorn`/`horns` (69% contained) and High Priestess's
`moon`/`raised_hand` (64% - one of the four `moon` rects from `0085`
specifically). Verified both live the same way: `elementFromPoint` at
the nested element's own coordinates now resolves to the smaller zone,
and a full scripted playthrough of each round (every element matched, in
order) completes cleanly with no console errors. The other 23 zone
rounds carry no meaningfully overlapping rects at all, so nothing else
needed checking.

One test-methodology note, not a product bug: this session's own browser
automation tool occasionally failed to deliver a coordinate-based click
to a freshly-rendered button (the DOM/CSS were correct per
`elementFromPoint`, but no React state change followed) - switching
verification to `element.click()` calls on elements found by
`aria-label`/text content, with a short wait between selecting and
confirming, resolved it. Worth remembering if a future live check here
seems to silently do nothing: try `.click()` before suspecting the app.
