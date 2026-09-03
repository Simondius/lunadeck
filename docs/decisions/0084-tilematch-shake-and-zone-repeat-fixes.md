# 0084: A wrong tile-match pair no longer shakes its own correct partner too, and a 3-element card's zone round no longer plays twice

## The tile-match bug

Simon: "this has a bug. multiple elements get selected when I select one."
Reproduced on the Hierophant's node-2 tilematch: tapping the wrong image
against a text tile made three tiles shake red, not two.

`TileMatchPlayer`'s `shaking` state was a flat `Set` of the two mismatched
keys, and `tileClass(key, side)` checked `shaking.has(key)` with no `side`
in that check. Every pair's image tile and text tile share one `key` by
design (that's how a correct match is even detected — `next.left ===
next.right`), so marking a key "shaking" lit up *both* of its
occurrences — the one actually tapped, and its own correct partner
sitting untouched on the other side. Tap the wrong text next to a real
image, and that image's own real match (elsewhere in the same column)
would shake too, for no reason visible to the player.

Fixed by giving `shaking` the same `{ left, right }` shape `selected`
already uses, rather than a flat `Set` — `tileClass` now checks
`shaking[side] === key`, matching exactly how `is-selected` was already
scoped correctly. `matched` stays a flat `Set` on purpose: a real match
*should* mark both the image and the text inert, that's the intended
outcome of pairing them.

## The zone-round repeat

Separately, Simon: "when there are only 3 elements then dont repeat the
tile match and element match sessions. only have multiple instances of
that when there are more than 3 elements so it is not repetitive."

The recent element-wiring pass gave every new card's node-2 two identical
zone rounds back to back before its tilematch round, regardless of how
many elements the card actually has — three taps, then the exact same
three taps again, then the tilematch. Trimmed every card with 2 or 3
elements (Magician, Emperor, and the 16 majors from the wiring batch) down
to one zone round; Lovers, the only card with more than three elements
(four), keeps both. Fool's own four zone rounds are a different, older,
hand-authored structure — genuinely four distinct rounds, not a lazy
duplicate — and untouched.

## Verification

Rebuilt Hierophant's zone-then-tilematch flow live in the browser twice:
once reproducing the original bug (three tiles shaking on one wrong tap),
once confirming the fix (only the two actually-tapped tiles shake, and a
full correct run matches all three pairs cleanly). Confirmed via a script
across every `data/v4/*_section.json` that node-2 now shows exactly one
`zone` round for every 2-3-element card and two for Lovers alone.
`npm run build` passes.
