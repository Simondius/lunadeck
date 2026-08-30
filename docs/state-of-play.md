# State of play

Working notes for whoever — or whatever — picks this up next. Not a spec: the
specs are in `specs/` and they win. This file exists because two agents worked
on the same defect from opposite ends within three hours on 29 Aug, and neither
knew the other was there.

**Keep it current.** If you change something structural, change the paragraph
that describes it in the same PR. A stale orientation file is worse than none,
because it gets believed.

---

## In flight

Update this section when you start and when you stop. It is the cheapest way to
stop two people rebuilding the same thing.

| who | what | since |
| --- | --- | --- |
| Simon | An alternative curriculum, reachable from the dev console, with the changes held behind that toggle | 30 Aug |
| Tia + Claude | Free — say what you are taking | — |

## Before you start

1. **Read `main`'s recent log**, not just the last thing you did. The other
   party may have merged since.
2. **Check the highest number in `docs/decisions/`** before claiming one. On
   29 Aug we both took 0019 and 0020 and had to renumber afterwards.
3. **Say what you are taking**, in the table above.

---

## Where it stands

All 577 curriculum nodes are playable, expanding into 1081 format instances — a
six-card sort is six sorts, an eight-card recap is three boards, so the
curriculum's only difficulty axis actually plays. Unit 1 has been walked end to
end in a browser at 390px, boards included, with no dead ends; every screen type
has been swept for clipping and console errors. That is a floor, not a verdict.
It says nothing about whether the exercises *teach*.

**The path is the sections.** One continuous winding scroll of all 92 sections,
each unit's heading inline before its first. The heading is a single button —
progress, name, chevron — and pressing anywhere on it folds the unit. Units are
named for images rather than contents: First Light, Water Bearers, Fixed Stars,
The Turning Wheel, Storm and Star, Tidewater, Kindled Fire, Deep Earth, Cutting
Air, Beyond the Veil.

**Teaching arrives where it is needed** (`0017`, `0018`). The course used to
teach once at the top of a section and then quiz things it had never shown. Now
every round declares what it assumes the learner has seen, via `needs()` in
`lib/rounds.js`, and the play page drops a teaching beat in front of the first
round that assumes something untaught:

| topic | who assumes it | the beat shows |
| --- | --- | --- |
| keywords | A1 keyword picker | the section intro, already |
| meaning | A1 anonymised, A2 meaning, C boards | the card and its opening line |
| notes | A2 talking points, B true/false | the card and its first three reading notes |
| symbol | A4, A5, A7 | the icon, its label, and its phrases |

182 beats across 78 sections. A beat is not a node: no XP, nothing to miss,
never in the review queue. Placement is derived, never keyed to a node number,
and `check_rounds.mjs` fails the build if a round declares nothing. A3 (Major or
Minor Arcana) is the one exemption — it tests a category the course explains
nowhere, which is a real gap of a different kind.

**A1 runs card → keywords** (`0014`, `0016`). The card sits face up and its
keywords are mixed with wrong ones; the learner selects every one that belongs.
Format K is the only multi-select round in the app, a deliberate amendment to UX
Style Guide §1. A first meeting asks for at most three keywords and the intro
teaches exactly those. The round packs itself to fit two lines on a 390px phone,
dropping distractors first, because "two lines" cannot be a chip count when
*levity* and *openness of the heart* do not cost the same.

**The deck is a door, not a trophy case** (`0024`). All 78 cards show their art
and name — greyed if unlearned, with the same values the path uses — and all 78
open. A card's entry offers its lesson either way, naming the destination so a
jump is visible as a jump. The full entry stays gated on finishing the section.

**There is no unit guidebook** (`0023`). It duplicated the path, the deck and the
masthead. This deviates from `Spec_MainPath` §2 deliberately: that spec predates
the path carrying its sections inline.

**A section commits atomically.** Progress is held in memory during play and
written once at the end, after the mistake-review queue. Abandoning saves
nothing. A section played out of order from the deck counts identically.

---

## Things that will bite you

- **A silent hole is the failure mode here.** The symbol formats quizzed a symbol
  the intro had stopped showing, for three decisions, and nothing broke. The path
  scrolled 40px sideways on every phone because a full-width row was translated
  62px and the overhang was blank. Neither was visible; both took measurement.
  When a screen stops showing something, or starts moving something, measure.
- **Restart the dev server after editing `data/`** — see `CLAUDE.md`. Costs a
  round trip every time it is forgotten.
- **`public/assets` is a mirror.** `scripts/copy-assets.mjs` refreshes it on
  dev/build. Regenerate art in `assets/` and test without re-running it and you
  are looking at the old files.
- **The node object in `lib/rounds.js` is much richer than the one the browser
  sees.** The client-side node carries no `cardKey`; only the round does. Match
  on `answerKey` or `teachesFor`.
- **Anything fixed to the bottom collides with the tab bar** (`bottom: 0`,
  `z-index: 10`). Five times so far. Clear `--tabbar`, or don't use a fixed
  footer on a tabbed screen.
- **Progress is written once per section.** `completeSection` is the only path
  into the store from a lesson. Don't reintroduce per-node writes.
- **Recap sections are addressed `sections/RECAP`,** and their node ids read
  `U1-S8-UNIT_RECAP-N1`, not `…-RECAP-…`.
- **16 masters are stray export sizes** (up to 924×1313 against the canonical
  813×1456). `0020` normalises them at render; re-exporting those 16 would remove
  the need. The 78 avatar crops still carry the old white bleed, but nothing
  renders an avatar yet.

## Checks

`npm test` runs the logic tests and `scripts/check_rounds.mjs`, which builds all
1081 instances and asserts each is playable: answer among candidates, board sizes
legal, assets present, donors correct, no option naming its own card, no keyword
distractor that is secretly one of the target's own keywords, every keyword round
inside two lines, and every round declaring what it assumes was taught.
`python scripts/check_data.py` validates the CSVs.

A verifier that lives outside the repo drifts: `check_rounds.mjs` sat in a
scratch directory for two PRs and was silently checking an anchor shape that had
changed.

## Open questions

- **Nobody has played a full unit as a learner.** A machine has, which only
  proves nothing crashes. Every real fix on 29 Aug came from Tia playing two
  nodes of section 1. Still the highest-value hour available.
- **Free play skips the difficulty ramp.** The deck lets anyone start any card's
  lesson. Difficulty is carried by `cards_to_recall_count` and by which cards a
  node draws distractors from, both of which assume arrival in order. Jumping to
  Beyond the Veil works but is a hard first meeting, and nothing warns them.
- **The recaps are thin.** A standard section is 10–23 screens, median 16. A unit
  recap is one node, 2 to 6 screens — the moment where a unit's eight cards come
  back together is shorter than any single card's section.
- **The dev console is not stripped from production, only hidden.** `layout.js`
  gates rendering on `NODE_ENV`, and that works — nothing renders in a production
  build, verified. But the `import DevConsole` is static, so the component's code
  ships inside a 32KB client chunk: "Unlock all", "Reset" and `unlockAll` are all
  in the bundle. Not a security boundary (the section lock never was), but it is
  dead weight, and it will grow as the console does. A `next.config` alias
  swapping the module for a stub in production would make it true.
- Teaching beats are untimed and unscored — a learner can tap past one with
  nothing recorded.
- A3 asks "Major or Minor Arcana?" and the course explains that distinction
  nowhere.
- A2 on a phone still scrolls when a card's opener runs to three lines, so a
  learner can answer without having seen the fourth option. Image-option rounds
  have the same overlap.
- `XP_PER_NODE` and `HINTS_PER_SECTION` are invented — the design shows "+3 XP"
  and "HINT · 2" without saying what awards them.
- `missedNodeIds` is append-only, so a first-try score cannot be repaired by
  replaying. The streak freezes once every node is banked.
- 30 Format C board texts contain their own card's name. Content-bound — the
  checker reports them rather than fixing them.
- The Empress's condensed entry opens on a neighbouring card rather than itself.
  The opener rule works around it; the source text is worth a look.

## Not built

Spaced repetition (misses are recorded but never re-served); accounts and real
persistence (progress is per-browser); the fuller Daily Draw from `0007`; the
Challenge tab, which needs the friend graph first; Format A6, reversed meanings;
a real desktop layout rather than a phone in the middle of the screen; and
deployment — static export is verified working at 195 pages, but nothing is
hosted and `lunadeck.app` needs DNS.
