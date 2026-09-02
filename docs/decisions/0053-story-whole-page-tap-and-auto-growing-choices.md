# 0053 — Story mode: whole-page tap, and choice boxes that grow instead of clamp

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Two small usability fixes Simon asked for in the same pass, both about
letting content dictate layout instead of the other way around.

**Whole-page tap.** The stage (`.story-stage`) was the only tap target for
a dialogue or reveal beat; the panel below it, reserved for choices, was
dead space the rest of the time. The `onClick` that drives
`handleStageTap` moved from `.story-stage` to the outer `<main>` itself,
gated by the same `tappable` boolean — safe because `tappable` is already
`false` during `choice`/`draw` beats, so the handler isn't even attached
then and can't intercept a choice-button tap. The quit link gets its own
`stopPropagation` so leaving the chapter doesn't also fire a dismiss tap.

**Auto-growing choice boxes.** `.story-choice-option` used
`-webkit-line-clamp: 2` to cap every option at two lines. Once options
started running longer, this just truncated the third line instead of
showing it. The clamp is gone; a box now grows to fit whatever text it's
given. "No more than one option on a given screen should need three
lines" stays a content-authoring discipline (how a chapter's options are
written) rather than something CSS enforces — a clamp can't tell you
which of two long siblings is the one that actually ran over.
