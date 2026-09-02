# 0065 — Every v4 lesson node's "next" link is unit-aware

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Simon reported that finishing the Fool unit's last lesson node ("The Full
Picture") skipped straight into the Lovers section's own node 1, instead
of that unit's own end-narrative — and asked that the same class of bug
be checked across every other unit. It was worse than the one symptom
reported: `NodeSession`'s built-in "complete" screen assumed a flat,
per-card chain (`nodeNumber < totalNodes` → next node in the same raw
section array; otherwise → `nextSection`'s node 1) that predates v4's own
cut nodes, mid-unit capstone, and cross-card mashup nodes entirely. That
assumption broke in three distinct ways:

1. **Within a unit**, `nodeNumber + 1` walked the *raw* section array
   (7 nodes), not the *trimmed* 5-lesson sequence a unit actually shows —
   so finishing "Find the Elements" (raw node 2) auto-advanced into
   "First Words" (raw node 3), a node reserved for the review units and
   never meant to appear in units 1/2's own path at all.
2. **At the end of a unit**, falling through to `nextSection` always
   meant "the next card," never "this unit's own end-narrative."
3. **Mid-unit capstone and mashup nodes** are their own one-or-two-node
   pseudo-sections with `nextSection` hardcoded to `null` — finishing
   either dropped straight back to `/v4` instead of continuing into the
   unit's next real step.

## What changed

Every lesson href `data/v4/units.js`'s `stepsForUnit()` generates now
carries a `?unit=<N>` query param. This is load-bearing, not cosmetic:
two sibling units teaching the same card (1&2, 3&4, 5&6) link to the
*exact same* `/v4/play/<card>/<n>` routes, so a lesson node finishing has
no way to know which of the two units' own end-narrative "next" should
mean without it — a plain global search-by-href (`getNextPathStep`,
`0064`) always resolves to whichever unit happens to come first.

A new `getNextLessonStep(unitNumber, bareHref)` scopes the search to one
specific unit's own `stepsForUnit()` list (stripping each stored href's
query string before comparing) and returns whatever comes right after —
correctly whether that's the next lesson, the capstone, a mashup node, or
the unit's own end-narrative. `app/v4/play/[section]/[node]/page.js`
reads the `unit` search param, calls this for every branch (mashup,
capstone, and real section alike), and passes the result as new
`nextHref`/`nextLabel` props straight through to `NodeSession` —
`NodeSession` uses them verbatim when provided, completely bypassing its
own `nodeNumber`/`totalNodes`/`nextSection` math (kept, unchanged, for
v1/v2/v3, which never pass these and don't have any of v4's cut/
capstone/mashup complexity to begin with).

Verified in-browser across every failure mode above: unit 1 vs. unit 2's
identical "The Full Picture" node now correctly resolve to `u1-dave-end`
and `u2-riley-end` respectively; "Find the Elements" now advances into
the Mini Capstone, not the cut "First Words" node; the capstone advances
into "Readings, Filled In"; and unit 7's second mashup node advances into
`u7-dave-end` instead of dropping back to `/v4`.
