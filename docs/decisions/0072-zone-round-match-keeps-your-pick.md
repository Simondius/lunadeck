# 0072 — A wrong cross-tap keeps your original pick, and the match event slows down

**Date:** 3 Sep 2026
**Status:** Accepted

Two playtest follow-ups to `0069`'s tap-then-tap zone rounds.

## A wrong guess doesn't cost your original selection

Tap a button, then tap the wrong zone: the old behaviour cleared both
sides back to nothing, so a second attempt meant reselecting the button
before trying a different zone. Simon's call: whichever side was already
selected *before* the cross-tap should survive it — only the side just
tried and rejected resets. `triggerWrong(zoneKey, buttonKey, keep)` now
takes the selection to restore, passed in by whichever of `tapButton`/
`tapZone` already held a selection when the mismatched tap arrived.

## The correct-match event is slower and denser

The first pass (button flies in, card bursts into glitter and
colourizes) read as a snap into place, not the event Simon's original
spec described — "the button is infusing the card with its own life
force." `FLIGHT_MS` (zone-chip-flight.jsx, the single source of truth both
it and zone-round-player.jsx import from) went 480ms → 600ms; the burst's
own impact-then-disperse (zone-highlight.jsx) went 700ms → 1000ms, with an
extra hold-and-glow keyframe in the middle rather than dispersing
immediately after impact; the permanent colour reveal's own fade-in
matches at 1000ms so it arrives with the burst, not ahead of it.

Also new: `zone-chip-flight.jsx`'s own `spawnDust()` scatters ten gold/
silver motes along the flight path (same technique `swipe-round-player.jsx`'s
`spawnBurst()` already established for its card-edge dust), and
`zone-highlight`'s own dust pattern went from six dots to ten. `spawnDust`
is called once per real match — guarded by a `dustSpawned` ref inside the
mount effect that fires it, since unlike the WAAPI `.animate()` calls
alongside it (where a Strict Mode dev double-invoke is harmless — two
identical animations on one node are indistinguishable from one), a
second unguarded call would genuinely double the number of real DOM nodes
appended.
