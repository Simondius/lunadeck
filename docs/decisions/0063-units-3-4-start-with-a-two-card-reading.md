# 0063 — Units 3-4's start narrative becomes a two-card reading

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Units 1 and 2 are single-card Fool readings. Units 3 and 4 then added the
Lovers — but their own start-narrative still opened on a single-card
Lovers reveal, meaning a learner hits four straight single-card
narrative openers before ever seeing a multi-card spread (units 3/4's
own *end* narrative was already two cards, but the start wasn't). Simon's
call: make the start a real two-card read too, in a different
Past/Present-vs-Present/Future combination than the end uses, so units
3-4 read as a genuine step up from 1-2 rather than more of the same
shape with an extra card bolted onto the back half.

## What changed

`u3-dave-start.json` and `u4-riley-start.json` are rewritten from a
single Lovers reveal into a `slotLabels: ["Past", "Present"]` reading —
Fool in the past position (the leap already taken), Lovers in the
present (the new partnership/band decision) — using the same reveal/
slot mechanic `0054`/`0058` already established, just with a different
temporal pairing than the end narrative's own `["Present", "Future"]`.
Riley's version keeps the established mirrored order (Lovers first,
Fool second) relative to Dave's (Fool first, Lovers second) — the same
symmetry `0057`'s original three-card units already use. Both still end
on the client naming the lesson and thanking the reader, per `0056`'s
own closing convention. `u3-dave-end.json`/`u4-riley-end.json` are
unchanged — the end narrative's own `["Present", "Future"]` reading
already covers different ground.
