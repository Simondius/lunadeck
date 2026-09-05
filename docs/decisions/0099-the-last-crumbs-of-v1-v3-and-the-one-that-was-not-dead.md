# 0099 — The last crumbs of v1-v3, and the one that was not dead

**Date:** 2026-09-04
**Status:** Accepted

## Context

Removing v1, v2 and v3 (`0082`) left three things behind that nothing in the
app reaches any more:

1. `components/lesson/options.jsx`, the last file in a directory `0082`
   otherwise emptied
2. the `.board` / `.tile` CSS for Format C board matching, and the `.grid` /
   `.option` / `.badge` CSS for the v1 option tiles
3. a comment at the top of `app/page.js` saying "v1, v2, and v3 all live on at
   their own routes, reachable from the dev console"

The third is the one CLAUDE.md warns about specifically: a stale orientation
comment is worse than none, because it gets believed. There is no `app/v1`,
`app/v2` or `app/v3`. Anyone reading that comment goes looking for routes that
were deleted the day before.

## The one that was not dead

`options.jsx` was reported as orphaned, on the strength of this grep:

```
grep -rn "components/lesson/" --include=*.js --include=*.jsx app components lib | grep -v lesson-v2
```

It returns nothing, and the conclusion looks safe. But the `-v lesson-v2`
filter — there to skip the *other* lesson directory — is hiding the only
import there is:

```
components/lesson-v2/cloze-round-player.jsx:6:import { Inspector } from "@/components/lesson/options";
```

That is live code on the default route: `app/v4/play/[section]/[node]` →
`node-session.jsx` → `cloze-round-player.jsx` → `Inspector`. Deleting the file
would have broken every cloze round in the course — 22 cards' worth — and it
would have broken at build time, not in a test, because nothing under
`components/` has unit tests.

Of the file's five exports, `Inspector` is the only survivor. `ImageOption`,
`TextOption`, `gridClass` and `Footer` have no callers anywhere, and neither
does the module-private `Badge` they share.

## Decision

**`Inspector` moves to `components/lesson-v2/inspector.jsx`**; the other four
exports and `Badge` are deleted with the rest of the directory. The point of
the original task — `components/lesson/` should not exist — still holds. The
component just has to land somewhere first, and the directory its only caller
lives in is the obvious place.

The alternative was keeping `components/lesson/options.jsx` as a one-export
file. That leaves a directory named for a component tree that no longer
exists, which is the same kind of misleading residue as the `app/page.js`
comment.

**The CSS goes with the components that used it.** Removed:

| removed | why |
| --- | --- |
| `.grid`, `.grid-2/3/4` | only `gridClass()` emitted these |
| `.option`, `.option-image/-symbol/-name/-text/-binary`, `.binary`, and the four `.option.is-*` states | only `ImageOption` / `TextOption` rendered them |
| `.badge`, `.badge-wrong`, `.badge-right` | only `Badge` rendered them |
| `.board`, `.board-column`, `.tile`, `.tile-image`, `.tile-name`, `.tile-text`, and the three `.tile.is-*` states | Format C board matching, gone since `0082` |
| `.footer`, `.footer-hold` | only `Footer` rendered them |

191 lines. Kept, because they are still live and sit inside or beside those
blocks:

- **`.is-shaking` and `@keyframes shake`** — `tile-match-player.jsx` puts
  `is-shaking` on the two tiles actually tapped. It is easy to mistake for
  part of the dead `.tile` block it sat next to; it is a distinct keyframe
  from `choice-option-shake`, and it now carries a comment saying so.
- **`.footer-meta`** — `reader-screen.jsx:447`.
- **`.inspector`, `.inspector-name`, `.inspector-close`** — `Inspector`.
- **`.tile-match-tile` / `.tile-match-grid`** — different classes from
  `.tile`. A CSS class selector does not match a prefix, so these were never
  styled by the block that went.

## Note on the specs

`specs/Design_Handoff_Violet.md` documents `.option-image`, `.option-text`,
`.badge-wrong`, `.tile` and `.tile-text` as part of the v1 formats it was
drawn against — "same routes, same eight exercise formats, same CSV-driven
data". Those eight formats went in `0082`, along with the components that
rendered them. The handoff describes a build the app no longer is, so this
change does not conflict with a live spec; it finishes a removal the spec
already outlived.

That left the handoff itself stale, which was called out here and then fixed
in the same PR. **It is annotated, not rewritten**, and that is the choice
worth recording. The document is a delivery note: a designer's account of
what was asked for in August, against a build that has since been replaced.
Rewriting its screen specs to describe v4 would invent a handoff nobody
delivered, and would destroy the design reasoning behind screens that do
still exist. Deleting it would lose the same thing. So:

- A **status block** at the top splits it in two. The *Design tokens*
  section is still authoritative — every token in it was checked against
  `:root` in `app/globals.css` and matches exactly. Everything from
  *Screens* onward is history.
- A **what actually shipped** table maps each of the six screen sections,
  the tab bar, the four promised additions and the state model onto what
  the app has today.
- Each screen section carries a one-paragraph marker saying what survived
  and what did not, so a reader who lands mid-document is not misled.
- Four outright factual errors are corrected in place: the design file's
  name and path, a deleted CSV in the copy-sources list, the claim that
  progress is not persisted (it is — `lib/progress.js`), and the four-tab
  bar (five tabs shipped, and Trials never did).

Checking it turned up two things nobody had recorded. **Two of the four
additions the redesign was commissioned for were never built**: progress
rings on the path, and the overall curriculum progress bar. And `.overall` /
`.overall-fill`, the CSS drawn for that second one, is still in
`app/globals.css` with no consumer — the same kind of crumb as the rest of
this note. Flagged in the handoff, not swept here.

## Still there

Two more classes in `app/globals.css` have no consumer, and neither is swept
here — both are flagged where someone will trip over them rather than fixed
blind:

- `.spec-note`, which never belonged to the lesson components.
- `.overall` and `.overall-fill`, drawn for the overall curriculum progress
  bar that was never built (see above).

## Consequences

- `components/lesson/` no longer exists. `components/lesson-v2/` is the only
  lesson component tree, which is what its name has implied since `0082`.
- `app/globals.css` drops from 6747 to 6557 lines.
- `npm test` stays green: 43 tests, 11 story assets, 501 rounds and 551 beats.
- `specs/Design_Handoff_Violet.md` no longer reads as instructions for a build
  that does not exist, and says which of its own promises went unbuilt.
- Next time, run the grep without the filter that hides the answer.
