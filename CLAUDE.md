# Working on Lunadeck

Read `README.md` first — it explains the repository layout and the data model.
This file covers how to work in the repo, not what's in it.

## Project scope

Build a gamified mobile prototype for learning tarot reading, including
content management and social systems, following established language-learning
app conventions: a linear unit path, short repeated exercise formats, streaks,
and social features.

A second goal runs alongside the first: developing a working practice for
collaborating with Claude across design and coding tools.

## Working alongside someone else

**Two people work in this repo, each with their own Claude, and neither session
can see the other's context.** On 29 Aug that cost us: both agents fixed the same
white border on the card art from opposite ends within three hours, both claimed
decision numbers 0019 and 0020, and one fix silently turned the other into a bug.

So, before starting:

1. **Read `docs/state-of-play.md`.** It is the shared brief — where the app is,
   what is decided, what is open, and who is working on what right now. Update
   the "In flight" table when you start and when you stop.
2. **Read `main`'s recent log.** The other party may have merged since your last
   session, whatever your own history says.
3. **Check the highest number in `docs/decisions/`** before claiming one.

And when you finish: if you changed something structural, change the paragraph
in `docs/state-of-play.md` that describes it, in the same PR. A stale
orientation file is worse than none, because it gets believed.

## Orientation

Lunadeck is a gamified tarot learning app built around a linear lesson path.
The content model lives in `data/` as CSVs, the feature specs live in `specs/`,
and the art lives in `assets/`.

Before answering questions about curriculum structure, exercise formats, or card
content, read the relevant CSV rather than inferring from filenames. The tables
are small enough to read directly.

## Ground rules

**The specs are authoritative.** `specs/` holds the locked feature specs and the
global UX style guide. If a request conflicts with a spec, say so rather than
silently following the request.

**Cross-cutting UX rules live in `specs/UX_Style_Guide.md`.** Anything that would
apply to more than one exercise format belongs there. Anything specific to one
format's mechanic belongs in that format's own spec. Respect that split when
adding rules.

**`card_key` is the join key everywhere.** New card-level data goes in a new
table keyed on `card_key`, not as extra columns on an existing one.

**Don't invent card content.** Keywords, talking points, descriptions, and symbol
meanings come from the source guidebook. If something is missing, flag the gap
rather than writing plausible filler.

**Restart the dev server after editing `data/`.** `lib/data.js` parses each CSV
once per process, so an edit to a CSV won't show up on a refresh. `data/v4/*.json`
is imported as plain JS modules, so it usually hot-reloads on save — but a
change to a file that error'd on the last build sometimes needs the same
restart to actually take.

**Work on a branch and open a pull request**, never straight to `main` — the
description is where the reasoning goes, and it is how the other person reviews
without reading the diff cold. `docs/state-of-play.md` covers the rest of the
environment: commit-email privacy, the Windows/Linux split, line endings.

**Don't regenerate CSVs wholesale.** Edit the rows that need changing. A
rewritten file produces a diff nobody can review.

**Derived art is generated, not edited.** The `circle` and `avatar` crops come
from the masters via the scripts in `scripts/`. Rerun the script; don't
hand-edit a crop.

## Data integrity

The rules below were for `data_curriculum_nodes.csv` and
`data_unit_metadata.csv`, the CSVs behind the original v1 curriculum. Both
files (and `scripts/check_data.py`, which validated them) were removed once
v4 became the app's only path (0082-0083) — v4's own lesson content lives in
`data/v4/*.json` instead, edited directly rather than through a CSV pipeline.
There is currently no automated check standing in `check_data.py`'s place
for v4's own data; flag this if you're the one who ends up needing one.

Rules that still apply to every CSV in `data/`, v1 or not:

- `card_key` in `cards_involved`-shaped columns must exist in
  `data_tarot_cards_base.csv`
- a `cards_involved`-shaped list must not repeat a card — a repeat renders
  two identical options in one grid, which the learner cannot answer

## Conventions

- Card keys: `major_NN_name` and `minor_{suit}_{rank}`
- Asset files: `{card_key}_{MASTER|circle|avatar}.png`
- Pipe (`|`) is the in-cell list delimiter across all CSVs

## Recording decisions

Non-obvious choices — why a card sits in a particular unit, why a distractor
tier was tuned a certain way — go in `docs/decisions/` as a short numbered
note. Chat history isn't shared between collaborators; these files are.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
