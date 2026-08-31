# Draft: alternative curriculum, The Fool section

**Superseded in scope by `docs/decisions/0035`, uncommitted as of 31 Aug.**
This file still describes The Fool specifically and is accurate as far as it
goes, but v2 is no longer just the Fool — four more sections (Lovers,
Magician, Empress, Emperor) and three more round types were built overnight
per `overnight_instructions.md` (not checked in). Read 0035 for the current
whole picture; this file is kept for the Fool-specific detail it still has
that 0035 doesn't repeat.

**Status: draft, not locked, but built.** This is the alternative curriculum
claimed in `docs/state-of-play.md` (reachable from the dev console: Path →
Content → v2). The Fool section is six nodes deep so far —
`data/v2/fool_section.json` + `components/lesson-v2/{node-session,
round-player}.jsx` — content and shape are Simon's own, dictated directly
rather than derived from the CSV curriculum. See `docs/decisions/0037` (why
JSON, why bespoke, why it touches no progress) and `0038` (why the
mistake-review queue is scoped per node, not per section, and the real bug
that made the round-1 tutorial silently not play).

## The shape

A node is one lesson: a fixed sequence of rounds, played start to finish,
reached directly at `/v2/play/<node number>`. Two round shapes exist:

- **2-word pairs** (nodes 1–3): one correct keyword, one wrong word. Drag the
  right one onto the card.
- **6-word rounds** (nodes 4–6): three correct keywords, three wrong words.
  Drag every correct one; the wrong ones pop once the last correct word
  lands.

**Node 1's first round only** plays the drag tutorial — the looping demo,
interruptible by a tap. No other round on any node shows it, including a
missed Node 1 round 1 replayed in review.

**Mistakes come back at the end of the same node.** Get a round wrong (drag
the wrong word before the right one) and it's queued; once every round in the
node has been played once, a bridge screen ("N to look at again") replays
just the missed ones, then the node is complete. See `0038` for why this is
scoped to the node rather than v1's whole-section review.

## The six nodes

1. **exploration, levity, nonconformity** — 6 rounds, each keyword twice,
   against the "obviously wrong" distractor tier. Round 1 is tutorialised.
2. **intuition, speed, play** — 7 rounds, same format (a 7th round adding
   `spontaneity` was folded in after the fact).
3. **All 6 keywords above, once each** — 7 rounds, against the "closer, not
   confusing" distractor tier (a 7th round adding `spontaneity` was folded in
   the same way as node 2).
4. **6-word rounds, 5 rounds**, cycling combinations of all 7 keywords
   (including `spontaneity`) against the obviously-wrong and closer tiers.
5. **6-word rounds, 5 rounds**, same 7 keywords against a harder, more
   abstract distractor tier Simon supplied fresh for this node (`creation`,
   `wisdom`, `destruction`, and others — not from the original table).
6. **6-word rounds, 5 rounds**, correct set fixed at `spontaneity`,
   `intuition`, `play` throughout; wrong words are a remix of distractors
   already used elsewhere in the section (Simon's call, rather than
   supplying 15 new words) — see `0038`.

## Open questions (for the next iteration)

- The end-of-node screen is a bare placeholder ("Node N complete.").
- Whether this becomes real `data_curriculum_nodes.csv` rows or stays
  outside the CSV curriculum entirely, and what that migration looks like if
  so.
- Node 6's distractors are a remix, not hand-picked per round — worth a real
  pass if this format is kept.
