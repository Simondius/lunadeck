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

| who | what | status |
| --- | --- | --- |
| Simon | An alternative curriculum, reachable via dev console → Path → Content → v2. Grew overnight (31 Aug) from one section to five — Fool, Lovers, Magician, Empress, Emperor — and from two round shapes to five (keyword, zone, cloze, choice, tilematch); see [`0037`](decisions/0037-v2s-fool-section-is-bespoke.md), [`0038`](decisions/0038-v2-nodes-review-their-own-mistakes.md), [`0035`](decisions/0035-v2-grows-to-five-cards-and-three-new-round-types.md). Followed same day by a live morning playtest pass — node reorder, real drag-target/touch bugs fixed, choice round switched to drag-onto-card, dev console gained skip-without-completing controls, and the path screen got chunky per-type icons + a tappable companion card per section; see [`0036`](decisions/0036-morning-playtest-fixes-for-the-five-card-build.md). **Merged into `main`** 31 Aug, rebased onto #52/#53 first — the collision points Tia flagged (`app/globals.css`'s end-of-file additions, `dev-console.jsx`'s `clamp()`) were reconciled by hand; `lib/progress.js` and `tabbar.jsx` merged clean since v2 never touches either | **Done** — 31 Aug |
| Tia + Claude | Reading tab, Mentor tab, Social tab | **Merged** 31 Aug — #50, #52, #53. Nothing in flight |
| Claude | Review of Simon's v2 (#54), which neither Tia nor Simon can read as code. Two passes: [`0039`](decisions/0039-two-fixes-from-reviewing-v2.md) fixed a broken tile asset and a stale node count, [`0040`](decisions/0040-fixed-overlays-measure-the-frame-not-the-window.md) fixed all three v2 drag overlays landing hundreds of px off above 900px. Two things left open deliberately, both judgement calls rather than defects: `v2-fool-section-nodes` is fully merged but Simon merged `main` into it after #54 landed and kept his own `dev-console.jsx`, so **that branch has lost #52's fix** — new work should branch from `main`, not continue there. And tilematch's detail images carry `alt=""`; the round tests visual recognition, so no honest alt text exists and it needs a spec answer, not an attribute | **Merged** 31 Aug — #55, #56 |

*Claimed* means nobody's hands are on it yet but it is spoken for: don't build
it, do feel free to work anywhere else. *In progress* means someone is actively
in those files right now.

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

**The reader answers; the path teaches** (`0025`, `0026`, `0032`). Five tabs
now: Path, Deck, Reading, Mentor, Social.

The character moved out of Reading and into **Mentor**, which holds the art and
a line saying it is not built, and nothing else. Reading carries no notion of a
person any more — not the portrait and not the strings — and its image is the
deck's own front. The route is still `/reader` and so are the class names,
deliberately: renaming is churn for strings nobody sees. `SYSTEM_PROMPT` still
opens "You are the reader", which is the model's persona rather than a name
anyone reads, and is left alone until Mentor has a job.

Reading is one screen that arrives in order. A status bar and a rule anchor the
top, borrowed from the path so the two read as the same app; then the deck
front, one line, one button, and no title, since the picture says what it is.
Nothing about questions is visible until you have drawn. The daily draw deals
three seeded cards instantly and the reader reads them: the words land at
~8.5s, which the card reveal now covers entirely. Asking your own question
opens underneath, behind a rule, and pulls three fresh cards.

That status bar deliberately carries **no "n of 78"**. The Deck tab already has
one and it counts cards the curriculum has taught; a second denominator here,
counting cards the draw has turned up, would be a different number wearing the
same clothes on the neighbouring tab. `0007` keeps one definition of *known* so
the path, the unit pages and the deck can never disagree. The rule under the
status bar is the path's 2px with none of its meaning: this tab has no
completion to report.

**The three get the screen first** (`0030`). Pressing Daily draw hands each
card a full-screen turn, 2.6s apart, tap to go early and skip to leave, playing
once per draw. It is overlaid on the results page rather than replacing it, so
the reading's ~8.5s call runs while the reveal plays. A tap on the last card leaves, like
the other two: if the reading is in you land on it, and if not you land on the
waiting fan, which moves and so reads as working. Skip stays for leaving early. Two things to know if
you touch it. The backdrop is opaque from the first frame and must stay that
way, because an opacity animation with `fill: both` holds its `from` state in
a backgrounded tab and the page showed through. And it is pinned to the frame's
top at `100dvh` with the page locked at scroll zero, because `.app-frame`'s
transform makes it the containing block for fixed children and it is the whole
scrolling page, not the viewport.

**The reader has real art** (`assets/misc/reader_MASTER.webp`, 1536x2752).
The greeting's portrait is derived from it by `scripts/make_reader_portrait.mjs`
— a 2:3 crop at 900px, the same generated-not-hand-edited rule the card circles
and avatars follow. Change the crop numbers in that script and re-run it.

The old 500x500 placeholder is why the portrait could never be made bigger
without going soft: at 305 CSS px on a 3x phone it was upscaling 1.83x. The
900px derivative renders 1.02x at 3x, so display size is no longer limited by
the art.

The deck front is shown on the way in and not afterwards — once the cards are
down they are the subject.

**The white bleed was not fully dead** (`0032`). `0019` trimmed the 78 card
masters; `assets/misc/deck_box_lid_MASTER.png` was missed and still had 26
near-white columns, inside the 24-to-27 range `0021` measured. It went
unnoticed because the lid was only ever a small deck-back button.
`scripts/trim_export_bleed.mjs` trims it, is a safe no-op on a clean image, and
takes any path — running it over three card masters returns "no bleed found",
which independently confirms `0019`.

**The reading arrives structured** (`0028`): a takeaway plus one note per card,
not prose that gets sliced up. The takeaway sits alone at the top and has to
stand on its own, because most people will read it and nothing else. Under it
each card renders one per row at 285px, up from 104px three-abreast, with its
own note. The notes are still one continuous argument with the joins intact, so
read top to bottom they are a single reading. Field order in `READING_SCHEMA`
is load-bearing: `cards` first, `takeaway` last, so the takeaway is written
after the notes it summarises. Readings stored under the old prose shape still
render, via a fallback that can go whenever nobody has one.

Both readings go through `app/api/reading/`, which calls Claude with the
guidebook rows for exactly those cards as the only permitted source for what
they mean. **The voice is tuned by naming tics, not by asking for "natural"**
(`0027`). Em dashes are stripped in code and covered by tests, because that is
a property of the string. Everything else — no tricolon, no fragment-as-beat,
no correcting negation, at most one line built to land — lives only in
`SYSTEM_PROMPT` and nothing defends it. Treat an edit there as a change to the
product, and read a reading afterwards.

Generated prose, sourced substance: the path teaches these cards and the reader
must not contradict it. This is the first part of the app that
needs a server and a key; see the environment note below, and note the daily
draw now spends an API call per person per day simply by being opened. Reader
pulls deliberately do not feed `drawnCardKeys`, and the daily draw
deliberately does not touch `streakDays` — whether a draw should credit the
app's streak is a cross-tab call `Spec_Daily_Draw_Tab` §10 puts outside this
feature, and it is still open.

**Social is scaffolding, and says so** (`0034`). A fifth tab: a profile block
whose two numbers are real — cards known and path percent, computed by the same
`knownCardKeys` the deck uses, now shared from `lib/progress.js` so a second
definition cannot appear — an editable local display name, a card avatar, and
empty states elsewhere. The activity feed carries **sample data** from
`lib/demo-friends.js` so the layout can be judged: real card keys, takeaways
written against those cards actual rows so nothing contradicts the curriculum,
and a line under the feed saying the people are not real. One file, one export,
delete it when accounts arrive.

**The feed shows daily draws only, never questions** (`0034`). A question is
something a person typed about their own life; the daily draw is the only part
of the Reading tab that is not private, since nobody chose its cards and nobody
said why. If a second event type is ever added, it is not that one.

It **departs from `Spec_Meta_Hygiene_Systems` §5.1** on purpose: that spec
designs one flat list of a closed group with *no search, no profile screen and
no friending*, and says real friending is "a future pass once the group stops
being closed". This is that pass. `Spec_Challenge_Tab` assumes the same graph,
so the account model is worth settling before either is built for real.

**A section commits atomically.** Progress is held in memory during play and
written once at the end, after the mistake-review queue. Abandoning saves
nothing. A section played out of order from the deck counts identically.

**v2 exists as a sandbox, not a second curriculum yet** (`0037`). `app/v2` is
reached from the dev console (Path → Content → v2) rather than the tab bar,
and every section in it is bespoke, not built on `lib/rounds.js`'s
node/instance/format model: no hints, no XP. Content lives in
`data/v2/*_section.json`, not `data/data_curriculum_nodes.csv`, and
`components/lesson-v2/*` is new code, not a fork of `components/lesson/*`.
Nothing here calls `completeSection` — v2 has no node ids to collide with
v1's, so nothing is written to `lunadeck.progress.v1` at all. The moment v2
wants to persist anything (XP, a resume point, unlock state), that's a real
design question, not a default to fall into.

**Five sections now, five round shapes** (`0035`, built overnight 31 Aug,
uncommitted — Simon hasn't play-tested it yet): Fool, Lovers, Magician,
Empress, Emperor, routed at `/v2/play/<section-slug>/<node number>` via
`data/v2/sections.js`. Keyword pairs and zone (drag onto part of the card
art) already existed; cloze (drag words into blanks), choice (tap one of
four), and tilematch (pair an image with its meaning, appended to every
zone node) are new, dispatched by `round.type` in `node-session.jsx` the
same way zone always was. `app/v2/page.js` reuses v1's own trail styling
(`components/path-screen.jsx`'s `.trail-*` classes) instead of the old
placeholder box-per-node list.

**A node does have its own mistake-review queue**, unlike the rest of v2
(`0038`). Each node is a fixed sequence of rounds played start to finish by
`NodeSession` (`components/lesson-v2/node-session.jsx`); every round player
(`RoundPlayer`, `ZoneRoundPlayer`, `ClozeRoundPlayer`, `ChoiceRoundPlayer`,
`TileMatchPlayer`) plays one round and reports `{missed}` on completion
without knowing what happens next. `NodeSession` queues anything missed and
replays it once at the end of that same node — never re-teaching the
tutorial on a replay, and never queuing a second-look round a second time.
It's also section-aware now: a node passes `sectionSlug` and `nextSection`
so the last node in a section can hand off into the next card's first node,
not just increment a number.

---

## Things that will bite you

**`100dvh` is the window, not the frame.** At 900px and up the app draws itself
as a device and `.app-frame` caps at `min(940px, 94dvh)`, so on a tall desktop
window `100dvh` overshoots the frame by hundreds of pixels and a full-height
screen runs off the bottom. Use **`--frame-h`**, which is `100dvh` on a phone
and the frame's own height on a desktop. Three screens built on 30 Aug repeated
this before it was made a token (`0033`).

Its sharper form: **the preview pane is 561px wide, under the 900px
breakpoint,** so desktop framing is never active in it. Layout checked only
there is checked at one width and one shape. Resize past 900 before believing a
full-height screen works.

**And its other half: `getBoundingClientRect` is not `left` on a fixed
element.** The rect is in viewport coordinates; `left` is measured from the
containing block, which above 900px is `.app-frame` rather than the window. So
measuring a target and assigning the number straight to a fixed overlay puts it
out by the frame's own offset, 361px at a 1150px window, which for a 428px
frame is usually off the edge entirely. Use **`placeFixed`** from
`lib/fixed-position.js`; it finds the real containing block and subtracts it,
and returns zero when there isn't one, so the phone case is untouched. Four
bugs so far: the dev console twice (`0032`, `0033`), the reveal overlay
(`0030`), and all three v2 drag overlays (`0040`).


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

## The working environment

Written down because every one of these cost somebody an hour on 28–30 Aug, and
none of it is discoverable from the code.

**Commits are rejected if they carry a real email address.** GitHub's email
privacy returns `GH007`. Author as the account's `@users.noreply.github.com`
address — Tia's is `218612961+LousyBones@users.noreply.github.com`.

**Work on a branch and open a pull request.** Not straight to `main`, even for a
one-line change: the PR description is where the reasoning lives, and it is how
the other person reviews without reading the diff cold.

**The Reader tab needs `ANTHROPIC_API_KEY` in `.env.local`.** Nothing else in
the app does. Copy `.env.local.example`, add a key, and restart `npm run dev` —
Next reads env files at startup, so a refresh will not pick one up. Without a
key the tab still loads and the nightly three still deals; asking a question
returns a 503 and the screen says so in plain words.

**Line endings are CRLF locally against an LF repo,** with `core.autocrlf=true`
set. Don't "fix" the resulting diffs.

**A Claude session's shell may not be the machine the app runs on.** On Tia's
setup it is a Linux VM with the repo folder mounted, while `node_modules` is a
Windows install carrying only `@next/swc-win32-x64-msvc`. So from that shell:
reading, searching, editing, the Python art scripts (PIL and numpy are there)
all work — but `npm install`, `next dev` and `next build` do not, and a dev
server started there binds to a localhost the browser cannot reach. Run the app
from PowerShell on the Windows side; to verify a build, copy the source to a
cloud container and build it there.

**`public/assets` is a mirror,** refreshed by `scripts/copy-assets.mjs` on
`predev`/`prebuild`. Regenerate art in `assets/` and test without re-running it
and you are looking at the old files.

**Stale git lock files.** If a pull half-completes with `Operation not
permitted`, look for `.git/index.lock` and `.git/objects/maintenance.lock`. A
sandbox without delete permission leaves them behind and every later git command
fails oddly.

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

- **The reader has been asked one real question and given one daily reading,
  both by a machine.** Both held: ~210 words, ~8.5s, every claim traceable to a
  sourced row (`0025`, `0026`). What is still unmeasured is whether it holds
  for *your* question — a bad one, a vague one, a heavy one, the same question
  twice — and whether a daily reading stays worth reading on day thirty. That
  needs a person and a month.
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
deployment — static export was verified at 195 pages, but that predates
`app/api/reading/`, which is a Node route and cannot be statically exported
(`0025`); nothing is hosted either way and `lunadeck.app` needs DNS.
