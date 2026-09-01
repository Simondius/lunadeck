# 0049 — Dev console's top-level groups collapse

**Date:** 31 Aug 2026
**Status:** Accepted

## Context

The dev console's menu had exactly one top-level group (`Path`) until Story
(`0048`) added a second. With one group, showing every subgroup and action
inside it at all times cost nothing - there was nothing else on the menu to
scroll past. With two, Simon asked for `Path` and `Story` to sit as
collapsed top-level items that expand into their own subgroups on tap,
rather than both dumping their full contents into view at once.

## What changed

`components/dev-console.jsx` gained one piece of state, `openGroup` -
which top-level group name is currently expanded, or `null`. Each group's
own label is a button now, not a plain `<span>`; tapping it sets
`openGroup` to that group's name (or clears it, if it was already the one
open), and only the currently-open group renders its subgroups and
actions. `openGroup` resets to `null` whenever the console itself closes
(the FAB is tapped again, or an action runs) so it never reopens
mid-expanded from a previous visit.

A small chevron (`.dev-console-group-chevron`, a rotated CSS border, not
an icon file - consistent with every other glyph in this component)
flips between pointing down and up to show which state a group is in.

## Verified

`npm run build` succeeds. Opened the console in a real browser: both
`Path` and `Story` render collapsed by default, tapping one expands it
and shows the chevron flipped, tapping the same one again collapses it,
and running any action (e.g. "Open Story") closes the whole console with
`openGroup` cleared - confirmed by reopening it and seeing both groups
collapsed again rather than whichever was last expanded.
