# 0006 — Three corrections to the handoff stylesheet

**Date:** 2026-08-28
**Status:** Accepted

## Context

`specs/Design_Handoff_Violet.md` describes `globals.css` as "a drop-in
replacement for `app/globals.css` that keeps every existing class name, so the
current components keep working after the swap." Three things in it don't hold.

## Decision

Take the stylesheet as authoritative and fix the three, each with a comment in
place so the change is visible to whoever folds it back into the design file.

**1. It is not a drop-in.** It drops ten classes the components were rendering:
`.nodes`, `.node`, `.node-art`, `.node-card`, `.node-format`, `.node-tag`,
`.is-review`, `.section-head`, `.progress-fill` and `.stop-body`. Swapping it
alone leaves the unit page as unstyled text and the lesson progress bar
invisible. This is intentional in spirit — the node list becomes section rows
and the bar becomes segmented — but it means the handoff's own suggested step
1, "swap globals.css, the app should still render," is not true. Both screens
were rebuilt in the same change rather than left broken.

**2. `.reveal-xp` never rendered.** `.reveal span` is specificity (0,1,1) and
`.reveal-xp` is (0,1,0), so the bare-element selector won regardless of order
and repainted the XP line 13px muted instead of 10px mono accent. Narrowed to
`.reveal > span`, which matches the body copy — a direct child — and not
`.reveal-xp`, which sits inside `.reveal-head`.

**3. `.start` was hidden under the tab bar.** Both are `position: fixed;
bottom: 0` and `.tabbar` carries `z-index: 10`, so the unit page's primary
action rendered underneath it. The handoff text says "`.start` is now fixed to
the bottom above the tab bar," so the CSS is what's wrong: it now sits at
`bottom: var(--tabbar)`.

## Consequences

Two classes were added that the design doesn't define, grouped in one
"implementation additions" block at the end of the file: `.masthead-aside` for
the streak column, and `.shell.has-action` so a screen carrying the fixed
button reserves room for it as well as the tab bar. The same block resets
`.standfirst`'s bottom margin inside the masthead, where the design's
`margin: 0 0 20px` — right for the deck tab, above the filter row — reads as a
gap under the wordmark.

`.debug-list` and `.debug-row` are also there, for the moved node view.
