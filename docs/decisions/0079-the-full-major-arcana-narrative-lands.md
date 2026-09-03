# 0079: All 27 units' narrative content is written and wired in

## Context

`0078` scaffolded the lesson content and data plumbing for the remaining 19
Major Arcana units (9-27) and validated unit 9 (Dave/Magician) end to end,
including the first real use of `chapter-player.jsx`'s `draw` beat. This
decision covers finishing the rest: units 10-27's start/end narrative pairs
(36 files), registered into `data/story/chapters.js`.

## What was built

Each remaining unit's pair was written against the exact `u9-dave-*.json`
template from `0078` — same field shapes, same beat sequence, same four-
emotion vocabulary (`neutral`/`confusion`/`anger`/`realisation`), same
single location (`The Reading Room` / `background_library`, the only
background asset that exists). Every interpretive claim in every unit's
dialogue traces back to `data_card_keywords.csv`,
`data_card_talking_points.csv`, or `data_card_descriptions.csv` for that
unit's card — nothing invented, per the standing rule in `CLAUDE.md`.

**The draw sequence's past/present/future is each character's own last two
taught cards, oldest first, then the new card.** Dave and Riley now teach
disjoint sets of the 19 new majors (10 for Dave, 9 for Riley — odd units
are Dave's, even are Riley's, continuing the alternation `0074`
established), so this was computed once as a fixed table and handed to
each writer verbatim rather than left for them to infer — a wrong slot
order is a subtle bug that only shows up by actually playing the unit.
`availableCards` in each end file is those 3 correct answers plus 2 decoy
card_keys drawn from whatever had already been taught by that point in the
path; each unit's decoy pair was asked to differ from its own character's
immediately preceding unit, for variety across a run of nine or ten units
back to back.

**Both closing units get a deliberate final beat.** Unit 27 (Dave, The
World) closes his arc with an explicit callback to his very first reveal
in `u1-dave-start.json` — the Fool he drew at the very start of the course
— mirroring the World's own "the journey that started with the Fool ends
here" framing pulled straight from the card's talking points. Unit 26
(Riley, Judgment) was written to avoid a tidy bow: her closing line
explicitly declines to claim she's "got it figured out," matching
Judgment's own sense of an honest reckoning rather than resolution.

## How it was produced

Four background agents each wrote a contiguous run of units (Dave
11/13/15/17/19, Dave 21/23/25/27, Riley 10/12/14/16/18, Riley 20/22/24/26)
in parallel, each handed: the exact template files, the real CSV rows for
its assigned cards, the character's established voice from earlier
chapters, and the precomputed draw-sequence table above — so no agent had
to infer continuity across units it couldn't see. None touched
`chapters.js`, `data/v4/units.js`, or any `_section.json`; those were wired
centrally afterward to avoid four agents editing the same shared file
concurrently.

## Verification

- All 36 files pass `python3 -m json.tool` (valid JSON).
- A custom structural check confirmed: every `reveal`/`draw`/`availableCards`
  card_key exists in `data_tarot_cards_base.csv`; every end file has exactly
  3 draw beats covering slots 0/1/2 with no duplicates; every draw beat's
  `answer` is present in that file's own `availableCards`; every
  `availableCards` array has exactly 5 entries; every `emotion` string is
  one of the four allowed values.
- `python scripts/check_data.py` passes.
- `npm run build` succeeds, generating 58 `/story/play/[chapter]` pages (up
  from 20), confirming every new slug registered in `chapters.js` resolves.
- Played unit 10 (Riley/Emperor) live in the browser end to end: the start
  narrative's reveal and choice/elaboration beats render correctly with
  real card art, and the end narrative's `draw` mechanic correctly presents
  all 5 candidate cards, accepts the correct pick, slots it into Past, and
  advances to Present with the used card removed from the pool — confirming
  the mechanic generalizes beyond unit 9, the only unit it had been
  exercised on before this.
- `npm test` still fails on the pre-existing, already-tracked issue from
  `0068`: 11 story art files for chapter-01/chapter-02 that exist locally
  but were never committed (they live on branch `commit-story-art`, not yet
  merged). None of this batch's new content is implicated — every failure
  named points at the original two chapters, not any of units 9-27.

## Follow-ups

- The 19 new cards' zone rounds still carry placeholder element data
  (`0078`) pending Simon's separate extraction process.
- The `commit-story-art` branch still needs merging to actually turn
  `npm test` green; unrelated to this branch's own work.
- The full course (27 units, all 22 Major Arcana) has not yet been played
  start to finish by a human — only unit 9 (fully, prior decision) and unit
  10 (partially, this decision) have been walked in a browser. Worth a full
  playtest pass before calling the expansion done.
