# 0097 — v4's rounds get a checker again

**Date:** 2026-09-04
**Status:** Accepted

## Context

Removing v1, v2 and v3 (`0082`) removed both of the repo's data checks with
them. `scripts/check_data.py` validated the curriculum CSVs; `check_rounds.mjs`
validated what the round builders made of them. Between them they covered the
two ways a lesson can break: bad data, and data the builders mishandle.

Neither got a successor. `npm test` became `node --test` plus (from `0068`) the
story-art check. The 43 unit tests cover `lib/draw`, `lib/progress` and
`lib/reading` — pure logic, no curriculum data at all. So from that refactor
until now, **501 rounds across 24 files and 551 story beats had nothing looking
at them**, and the only reason that was safe is that nobody had broken one yet.

CLAUDE.md asked whoever noticed to flag it. This is instead of flagging it.

## v4 needs only half the old pair

The old checker's stated principle was to use the same packer the rounds use,
"so this asserts the real rule rather than a second copy of it that can drift".
That mattered because v1 built rounds from CSVs through `buildNode`.

v4 has no such step. `node-session.jsx` hands the JSON object straight to a
player, so the data *is* what the player receives, and checking the data is
checking the round. There is no builder left to mishandle anything.

That changes how the checks were written. Each one is against what the matching
player actually reads off its round — the field lists were taken from the
players themselves, not from a schema — so `choice` is checked for what
`choice-round-player.jsx` needs and nothing more.

## What it checks, and why each one

The rule the whole thing is really for is the one the deleted checker called the
one that matters most: **an answer absent from its own candidates** traps the
learner with every option eliminated and no way to submit.

Per type, following each player:

- **choice** — the answer appears among the options exactly once. Zero is the
  trap above; more than one means two right answers.
- **cloze** — every blank appears as `{key}` in the text (a blank the text never
  shows can never be filled), every `{key}` has a blank behind it, and no
  distractor equals an answer. That last one matters because
  `cloze-round-player.jsx` builds its draggable chips from the blanks' answers
  *plus* the distractors, so a distractor that is also an answer puts the same
  word on screen twice with only one accepted.
- **zone** — every element has somewhere to be dropped: rects inside 0..1, with
  area.
- **tilematch** — every image exists, and no two tiles show the same one, since
  identical tiles cannot be told apart.
- **swipe** — something to keep and something to reject.
- **keyword** (the untagged shape) — at least one right and one wrong word, no
  two words reading the same.

Two more that apply across types:

**An unrecognised `type` is an error.** `node-session.jsx` does
`PLAYERS[round.type] ?? RoundPlayer`, so a typo does not throw: it renders the
keyword player, which reads a `words` array a zone round has never had. The
round comes up blank rather than erroring, which is the quietest possible break.

**Story beats get the same treatment**, because they have the same shape of
failure. A choice beat with nothing correct in it cannot be answered and the
reader cannot advance past it.

## Round ids are scoped to a node, not a file

The first version of this got that wrong and reported 15 problems, 10 of them
false. Ids only need to be unique within one round list: `node-session.jsx`
builds its React key as `main-${round.id}`, a session plays one node, and the
same id in two different nodes is never on screen at once.

Within a node it does matter, and five were duplicated — the appended swipe
round in each of the five original sections reused the first cloze round's id.
Renamed (`n8-r1` to `n8-r5`, and `n7-r1` to `n7-r4` in Empress).

Worth being precise about the severity, because it is easy to overstate: those
five were **harmless as they stood**. The colliding rounds are a cloze and a
swipe, and React remounts on a component type change regardless of key. But
that is an accident of which two rounds happened to collide. The key exists to
guarantee a fresh mount; two same-type rounds sharing an id would have had the
second inherit the first's filled-in answers. Relying on the types differing is
not a property anyone chose, so the checker treats any duplicate in a node as
an error.

The rename is five lines, one per file, done as a text replacement rather than
re-serialising the JSON — reformatting a section file to change five strings
produces a diff nobody can review, which is what CLAUDE.md rules out.

## Proven to catch, not just to pass

A check nobody has seen fail is a check nobody knows works, so each class was
broken on purpose and reverted: answer removed from its options, distractor set
equal to an answer, `cloze` misspelt as `clozer`, a tilematch image pointed at
a file that does not exist, an id duplicated inside a node, a zone rect
flattened to no area, every swipe card set to a match, a story choice with
nothing correct, and a card key that is not in the deck. **Nine for nine.**

Passing now: 501 rounds and 551 beats, and `npm test` covers it.

## Not covered

The old checker had one rule this does not reproduce: a candidate must never
carry the identity that answers the question, which caught 82 v1 nodes showing
a card's own name above its options. It was written against v1's A-format
shapes and does not map onto anything v4 has. If v4 grows a format where the
reference and the candidates can name the same thing, it wants reviving.
