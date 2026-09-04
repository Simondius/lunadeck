# 0096: The "missing" story art was sitting right here, and the mirror that hid it gets cleaned now

## What Simon asked

After confirming everything code/data-wise was committed and pushed, Simon
asked whether Tia would get every asset she needed on a pull, and then:
"can you refactor the code so I don't need to give her any instructions
for it to work." Asked to confirm the target - the answer was the 11
story-art files flagged as missing (Dave/Riley portraits in several
emotions, a library background, a table prop, a hands prop) - `0068`'s
own `SceneImage` fallback already keeps a missing image from looking
broken (a blank circle with an initial letter instead of a browser's own
broken-image icon), but the ask was to close the gap properly if at all
possible, not just degrade it more gracefully.

## The actual finding

It was possible. All 11 files were sitting on this exact machine the
whole time - in `public/assets/`, not `assets/`. `public/assets/` is a
gitignored mirror `scripts/copy-assets.mjs` builds from `assets/` (the
real, tracked source) before every `dev`/`build` - but the script only
ever *copied onto* it, never cleaned it first. Someone had `public/
assets/` populated with this art before its own source under `assets/`
was ever committed (the files carry no deletion in git history - they
were never added at all, the exact `0068` failure mode), and every
`predev` run since just layered a fresh copy of what *is* tracked over
the top, leaving the untracked leftovers untouched and fully
functional. The app looked complete on this machine for the same reason
it looked complete on the original author's machine in `0068`: a stale
local copy standing in for a commit that never happened. `npm test`
still caught it correctly (it reads `assets/`, never `public/assets/`) -
this was a case of not listening to a check that was already red.

## Two fixes

**Restored the actual art**: copied all 11 files from `public/assets/`
into their real home under `assets/` and committed them. Verified they're
genuine finished line art (viewed `riley_neutral.png` directly), not
placeholders - `npm test` goes from "11 distinct story assets referenced
but not in the repo" to "11 distinct story assets referenced, all
present."

**Fixed the mirror itself**: `copy-assets.mjs` now `rm -rf`s `public/
assets/` before copying, instead of copying over whatever was already
there. This is the part that actually answers "no instructions needed" -
without it, this exact failure mode can recur on anyone's machine,
silently, for as long as their own `public/assets/` happens to predate a
gap in `assets/`. A clean mirror means `public/assets/` can never again
show art that `assets/` - the thing git actually ships - doesn't have,
on this machine or anyone else's, now or later.

## Verification

`npm test`: 43/43 logic tests plus "11 distinct story assets referenced,
all present." Ran `copy-assets.mjs` directly and diffed `assets/` against
the rebuilt `public/assets/` - identical file lists. `npm run build`
passes. Played `u2-riley-end` and `u1-dave-end` live and the v4 path
screen itself - Riley's and Dave's real portraits render everywhere
`0068`'s fallback used to be the only option, console clean throughout.
