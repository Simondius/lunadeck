# 0068 — Story art is checked, and its absence is drawn

**Date:** 2026-09-02
**Status:** Accepted

## Context

Story mode and v4 merged (`0048`–`0067`) referencing eleven images under
`assets/reading-scene-sketch-v2/`: eight character portraits, a library
background, a table and a pair of hands. None of them had been committed.

They exist on the machine they were made on, so the feature looked finished
there. On `main` every chapter drew four broken-image icons over an empty cream
rectangle, and v4's path, which is now the default route, showed a blank circle
where the client's face goes. The first screen of the app was visibly broken for
everyone except the author.

Nothing caught it. `scripts/check_rounds.mjs` reported "108 distinct assets
referenced, all present" the entire time, truthfully: it walks the curriculum
rounds, and narrative art is not in them. The gap was not that nobody checked,
it is that the check did not reach this far.

Two changes, because the two problems are different. One stops it shipping
again. The other stops it looking like a broken app while the art is in transit.

## The check

`scripts/check_story_assets.mjs`, wired into `npm test`.

The paths are derived, not listed. Story art is composed at runtime from a base
plus a character, an emotion or a background name, so a hardcoded list in the
script would rot the first time a chapter used a new emotion. Instead it reads
the same data the app reads and builds the same paths the app builds:

- the literal layers, scraped out of the two consumers' own source, so a new
  always-present layer is covered the moment someone adds one
- characters in the emotions the beats actually play them in, not the cross
  product — a character who never gets angry needs no angry portrait
- the backgrounds the chapters name, and v4's per-unit neutral portraits

It also asserts that both consumers still declare the same `ASSETS` base, so
moving the art directory fails loudly here rather than quietly checking an
empty one.

**This turns `npm test` red until the art is committed.** That is deliberate.
The repository does reference eleven files it does not have; a green suite would
be describing a different repository. The failure names every missing path and
the file that wants it, so the fix is a commit, not an investigation.

## The fallback

`components/story/scene-image.jsx`. A failed load renders the same box with the
same classes, minus the browser's broken icon, and a character can pass an
`initial` — the one thing the scene genuinely loses without its art. With it you
can still tell whose reading you are in.

Two details worth keeping.

**`onError` alone does not work, and this was measured rather than reasoned.**
The first version of the component changed nothing on screen. These pages are
server-rendered, so the `<img>` is in the HTML the browser receives; it starts
fetching immediately and the 404 returns long before React hydrates and attaches
a handler. The error fires at a node that is not listening yet and is never
heard again. So the mounted element is also asked directly whether it already
failed: `complete && naturalWidth === 0`.

**Most of the layers should collapse to nothing, not to a placeholder.** The
background, table and hands are scenery, sized by their own image's dimensions,
so without one they have no height. Leaving them that way is correct: a grey
slab where the table should be reads as more broken than an absent table. Only
the character keeps a footprint, because it is the only one carrying
information.

## Not done

The art itself, which cannot be invented. Eleven files, named by the checker.
