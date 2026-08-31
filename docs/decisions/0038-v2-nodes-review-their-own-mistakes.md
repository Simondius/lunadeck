# 0038 — v2 nodes review their own mistakes, not the whole section

**Date:** 2026-08-30
**Status:** Accepted

## Context

Simon's content for the Fool's alternative curriculum arrived as five, then
six, separate lessons — Node 1 through Node 6, each a fixed list of rounds
(2-word pairs for nodes 1–3, 6-word rounds for nodes 4–6). His instruction for
mistakes was explicit: *"at the end of each node, use the error logic to
bring back pairs that user got wrong."* Node, not section.

v1's mistake-review (`components/lesson/bridge.jsx`, `0008`) queues missed
nodes across a whole *section* and replays them once, at the very end, before
the section commits. v2 has no section-level commit to hang that off — each
node here is its own complete, replayable unit, reached directly by URL
(`/v2/play/1` … `/v2/play/6`), with nothing that spans across them.

## Decision

**The review queue lives in `NodeSession`, scoped to one node.** Playing
through a node's rounds in order, any round where the learner dragged a wrong
word before the right one gets pushed onto a queue. Once every round has been
played once, a bridge screen appears only if that queue isn't empty ("One to
look at again." / "N to look at again."), and tapping through it replays
exactly those rounds — using the same round objects, so `RoundPlayer` remounts
fresh via a `key` change rather than needing any reset logic of its own.

**A second-look round never re-teaches the tutorial**, even if it happens to
be Node 1's first round and even though that round's own data still carries
`tutorial: true` — `RoundPlayer` reads `round.tutorial && !secondLook`, not
`round.tutorial` alone. A learner who fumbled the very first drag doesn't need
the demo again, just another try.

**A second-look round doesn't requeue, however it goes.** Same rule v1's
review pass follows: once is once. This is what keeps the loop from being
literally infinite in the pathological case where a learner keeps missing the
same round.

## Consequences

`RoundPlayer` needed a way to report "was this missed" without deciding what
happens next — that's `onDone({missed})`, called once the learner presses
Continue. It doesn't know or care whether it's being played as part of the
main sequence or a review; `NodeSession` owns that decision entirely.

Finding the actual bug behind "the tutorial step seems to be missing" during
this build is worth recording separately from the design decision above: the
first version passed `TutorialGhost` a **freshly-built plain object**
(`{ current: chipRefs.current.get(firstCorrectKey) }`) instead of a real ref.
That expression evaluates during render, before this render's own `DragChip`
ref callbacks have run in commit — so on a fresh mount it always read
`undefined`, and `TutorialGhost` treated the missing rect as a reason to
skip straight to `onDone()`. The fix was a dedicated `firstCorrectRef`
updated by the same ref-attachment mechanism as everything else in
`chipRefs`, so its `.current` is live by the time `TutorialGhost`'s own
`useLayoutEffect` runs immediately after that same commit.
