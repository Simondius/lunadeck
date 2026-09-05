# Handoff: Lunadeck — violet system

> **Status — 4 Sep 2026. Read this before the rest.**
>
> This is the delivery note for the violet redesign, written in August
> against the v1 build. It is now **half live and half history**, and the
> split is clean:
>
> - **The design system is current, and still authoritative.** Every token
>   in the table below matches `:root` in `app/globals.css` exactly, and the
>   type scale, radii, spacing steps, accent-contrast rule and asset paths
>   govern every screen in the app today. Nothing in *Design tokens* has
>   been superseded.
> - **Everything from *Screens* onward describes a build that no longer
>   exists.** v1, v2 and v3 were removed on 3 Sep (`0082`) and v4 is the
>   app's only path. The routes, the eight A/B/C exercise formats and the
>   four-tab bar those sections instruct against are all gone.
>
> Those sections are kept rather than deleted, because they are the design
> reasoning behind screens that do still exist in changed form — and
> rewriting them to describe v4 would invent a handoff nobody delivered.
> **Read them as a record of what was asked for in August, not as
> instructions to follow.** Each says inline where it no longer holds.

### What actually shipped

| this document says | the app today |
| --- | --- |
| §1 Path — `app/page.js`, a serpentine of ten unit stops with `.stop-art` progress rings | `app/page.js` re-exports `app/v4/page.js`: one continuous winding scroll of **27 units** across 22 card sections, each unit a run of `.trail-step` node icons under its own heading, with the unit's character portrait. No `.stop` rule survives in `globals.css`. |
| §2 Unit detail — `app/units/[unit]/page.js` | **Route removed** (`0082`). v4 has no per-unit page; the path itself is the only index. |
| §3 Lesson session — `app/units/[unit]/play/session.jsx`, formats A1–A7 / B / C | **Route and all eight formats removed.** v4 plays at `app/v4/play/[section]/[node]` with six formats: the untagged keyword pair, plus `zone`, `cloze`, `choice`, `tilematch` and `swipe` (`components/lesson-v2/node-session.jsx`). |
| §4 Deck tab, *new route, e.g. `app/deck/page.js`* | **Shipped**, at exactly that path, plus `app/deck/[card]` for a single card. |
| §5 Daily draw, *new route, e.g. `app/draw/page.js`* | **No Draw tab.** The daily draw lives inside the Reading tab (`app/reader`), beside the three-card spread. |
| §6 Section / unit complete | Superseded by v4's own node-complete celebration and the two-screen card-unlock ceremony (`0076`), plus a mid-unit Alignment Check ceremony (`0093`). |
| four-tab bar: Path / Deck / Trials / Draw | **Five tabs: Path / Deck / Guide / Reading / Social**, Guide centre and accented. Trials was never built — `Spec_Challenge_Tab.pdf` is still in `specs/` for when it is. Draw folded into Reading. |
| the four additions the build *has no UI for* — per-unit progress, streak + overall progress, Deck tab, bottom bar | **Two and a half of four.** The Deck tab and the bottom bar shipped, as did the streak counter (on Social and Friends) and the in-lesson segmented progress row. **Still not built:** progress rings on the path, and the overall curriculum progress bar — `.overall` and `.overall-fill` are still in `globals.css` with no consumer. |
| progress is not persisted at all | **It is** — `lib/progress.js`, `localStorage` key `lunadeck.progress.v1`. |

Two whole features arrived after this handoff and are not in it at all: the
**Guide** tab, a live reading with a physical deck and a camera scan
(`0042`–`0044`), and **Story mode**, the narrative half of v4
(`0048`–`0056`).

## Overview

A visual redesign of the Lunadeck prototype (github.com/LousyBones/lunadeck, branch `main`). Structure and curriculum logic are unchanged: same routes, same eight exercise formats, same CSV-driven data. What changes is the surface — a deeper ink base, a violet accent replacing the gold, colder muted greys, card art carrying more visual weight — plus four additions the current build has no UI for:

1. per-unit progress (rings on the path, segmented progress in a lesson)
2. a streak counter and overall curriculum progress
3. card-collection completeness (a Deck tab)
4. a four-tab bottom bar: Path / Deck / Trials / Draw

Also newly designed: the Daily Draw tab, the three symbol formats (A4, A5, A7), and the section- and unit-complete screens.

## About the design files

`Lunadeck Current.dc.html` in this bundle — committed as
`specs/design/Lunadeck_Violet_Reference.dc.html` — is a **design reference**, not production code. It renders every screen as a fixed-width panel in one page so they can be compared side by side; the markup inside it is inline-styled and not meant to be copied.

The exception is `globals.css` — that one **is** meant to be used. It is a drop-in replacement for `app/globals.css` that keeps every existing class name, so the current components keep working after the swap. Implement everything else by editing the existing Next.js components as described below.

Turn 1 in the HTML file is the **current** UI recreated as a baseline (gold, unchanged). Turns 2 and 3 are the redesign. Ignore turn 1 except as a before/after reference.

## Fidelity

**High-fidelity.** Colors, type sizes, spacing and radii are final and are all in `globals.css` as custom properties. Match them. The one thing that is not final is copy for screens with no data behind them yet (Daily Draw journal prompt, Trials tab) — treat that as placeholder.

## Design tokens

All defined in `:root` in `globals.css`.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0c0a14` | page background (was `#15131f`) |
| `--surface` | `#16131f` | flat panels |
| `--raised` | `#201b2e` | image placeholder backgrounds |
| `--panel` | `linear-gradient(140deg,#181423,#100e1a)` | anchors, statements, tiles |
| `--accent` | `#8f52c4` | primary accent (was `--gold #e3b25c`) |
| `--accent-dim` | `#6e3a9e` | gradient ends |
| `--accent-bright` | `#c9a6f0` | accent text on dark |
| `--accent-ink` | `#f7f2ff` | text on a filled accent surface |
| `--parchment` | `#f2ede3` | body text |
| `--muted` | `#7f8aa8` | secondary text (was warm `#8b83a6`) |
| `--muted-warm` | `#a49cb8` | body copy at reduced emphasis |
| `--faint` | `#5f6880` | meta lines, disabled |
| `--good` / `--good-text` | `#6bbf7b` / `#8fd49c` | correct |
| `--bad` / `--bad-text` | `#d9605f` / `#e59a99` | wrong |
| `--line` | `rgba(242,237,227,.1)` | hairlines |
| `--shell` | `420px` | content width, unchanged |
| `--tabbar` | `74px` | bottom bar height |

Type: `--display` Fraunces 600, `--body` Inter 400/500, `--mono` JetBrains Mono — the same three families the app already loads in `app/layout.js`. No font changes.

Scale actually used: display 33 / 31 / 28 / 24 / 23 / 19 / 18 / 17 px; body 14 / 13.5 / 13 / 12.5 / 12 px; mono 11 / 10 / 9.5 / 9 px with letter-spacing 0.08–0.18em, uppercase. Radii: 999px pills, 14px panels, 12px options, 10px buttons and tiles. Spacing steps: 4, 6, 7, 10, 12, 14, 16, 18, 20, 22, 26 px.

Accent contrast rule: on a filled `--accent` surface use `--accent-ink` (`#f7f2ff`), never the dark ink — at this violet lightness dark text fails contrast.

## Screens

### 1. Path (`app/page.js`)

> **Partly superseded.** The route is still `app/page.js`, but it re-exports
> v4's path, and almost nothing below describes what is on it. The `.stop`
> constellation gave way to one continuous scroll of `.trail-step` icons; the
> masthead, standfirst, streak pill and `.overall` progress bar are not on the
> path at all — the masthead and standfirst ended up on the Deck screen, and
> the streak pill on Social and Friends.

Purpose: pick up where you left off; see the ten units and how far you are.

Layout: `.shell.starfield`, 26px 22px top/side padding, bottom padding `--tabbar + 26px`.

- **Masthead** (`.masthead`, flex, space-between): wordmark left (Fraunces 600 30px, -0.03em; "deck" in `--accent`), with `.standfirst` under it as a mono uppercase line — `"31 OF 78 CARDS KNOWN"`. Right column: `.streak` pill (1px `--accent-a30` border, 999px, mono 11px, `--accent-bright`) with a 7px glowing `.streak-dot`, then a mono 10px `"Daily draw ready"` line.
- **Overall progress**: 2px `.overall` track with `.overall-fill` (gradient `--accent-dim → --accent`), then `.overall-note` mono 10px `"UNIT 4 · SECTION 3 · 231 of 574 exercises"`.
- **Path** (`.path`): dotted 1px spine at `left:50%`. Each `<li>` holds `.stop`; even children mirror to the right (`flex-direction:row-reverse; text-align:right`) — this is what turns the flat list into a serpentine.
- **Stop art** (`.stop-art`): 84px, `padding:3px`, background `conic-gradient(--accent 0 calc(var(--p)*100%), rgba(242,237,227,.1) …)`. Set `--p` inline per unit from `nodesComplete / nodeCount` (0–1). The circle crop sits inside with a 2px `--ink` border so the ring reads as a ring. `.stop.is-current` scales to 96px with a violet glow; `.stop.is-done` gets a softer glow and a `.stop-tick` (22px `--accent` circle, `--accent-ink` ✓) on the bottom outer corner; `.stop.is-locked` drops to 0.42 opacity with grayscale art.
- **Stop body**: `.stop-index` mono 10px 0.14em `--accent` (`"UNIT 4 · IN PLAY"` on the current one), `.stop-name` Fraunces 600 19px (22px when current), `.stop-tagline` 12px `--muted-warm` max 22ch, `.stop-meta` mono 10px (`"57 / 57 · 8 cards"`, or the unlock requirement when locked). The current stop also gets a `.stop-cta` pill — `"Continue · 22 min"`.
- **Tab bar** (`.tabbar`, fixed): four `.tab` cells, `.tab.is-active` in `--accent`. Glyphs are CSS shapes, not icon files: `.tab-glyph` ring (Path), `.is-deck` 12×16 rounded rect, `.is-trials` rotated square, `.is-draw` half-filled circle.

Alternative home explored in the design file as 2b (editorial list with a "now playing" block, numerals instead of art). 2a — the constellation described above — is the recommended one.

### 2. Unit detail (`app/units/[unit]/page.js`)

> **Superseded — the route no longer exists** (`0082`). Kept for the argument
> in its first line, which v4 still honours: node-level detail is not
> learner-facing.

Purpose: see a unit's arc and resume the right section.

The important change: **the flat list of 57 nodes becomes 8 section rows.** Node-level detail (format code, node id, distractor tier) stops being learner-facing; it belongs in a debug view.

- `.backlink` mono 11px `"← PATH"`.
- `.unit-eyebrow` mono 10px 0.16em `--accent` — `"UNIT 1 · 8 SECTIONS"`.
- `.unit-title` Fraunces 600 31px -0.03em; `.unit-intro` 13.5px/1.6 `--muted-warm` (`unit_intro_copy` verbatim).
- `.card-row`: the unit's eight cards as 40px circle crops; cards not yet taught get `.is-unknown` (grayscale, 0.5).
- `.stats`: three `.stat-value` / `.stat-label` pairs between hairlines — sections done, exercises left, minutes left (from `est_completion_minutes_typical` scaled by remaining nodes).
- `.sections`: one `.section-row` per section — `.section-id` (`S1`), `.section-card` (the section's card name), `.section-note` (`"7 exercises · keywords, meanings, symbol"`), and a right-hand `.tick` / `.section-state`. The active section uses `.is-current` (panel gradient, accent border, Fraunces title, `.section-bar` progress); later sections `.is-locked`; the recap row `.is-recap` (dashed accent).
- `.start` is now fixed to the bottom above the tab bar — `"Resume Section 5"`.

### 3. Lesson session (`app/units/[unit]/play/session.jsx`)

> **Superseded — the route and all eight formats are gone** (`0082`). v4 plays
> at `app/v4/play/[section]/[node]`; its six formats are in the table at the
> top. What survived of the topbar below is the `✕` and the segmented
> `.progress` row, in `components/lesson-v2/round-player.jsx`. What did not:
> the hint counter and the `.footer-meta` node id — v4's rounds carry no
> hints. The four per-format subsections below describe exercises the app no
> longer has.

Topbar becomes `✕ · segmented progress · hint count`. `.progress` is a flex row of one `<span>` per step in the section with `.is-done` on completed ones — replaces the single `.progress-fill` bar. The hint control shows remaining hints (`"HINT · 2"`) and, when unavailable, stays legible at `--faint` rather than fading to 30% opacity.

Every format gains a `.format-line` above the prompt (`"A1 · CHOOSE CARD FROM KEYWORDS"`), and `.prompt` grows to Fraunces 24px/1.2. `.footer-meta` keeps the node id and tier at mono 9.5px `--faint`.

#### Format A — image candidates (A1, and A3's reference)
`.anchor` keyword chips sit in a `--panel` box with an accent hairline; chips (`.keyword`) are `--accent-a12` fills with accent borders. The 2×2 `.grid` of `.option-image` cards: selection is now `box-shadow: 0 0 0 2px --accent` plus a violet drop shadow (no border, so art doesn't shift), name labels are mono uppercase 10px over a bottom gradient rather than a solid bar. Eliminated options 0.32 + grayscale with the `.badge-wrong` ✕. Gesture hint moves **below** the grid.

#### Format A — text candidates (A2, A4, A5)
`.option-text` rows, 13.5px/1.5, 15px padding with 40px right gutter for the badge. Correct state is a green ring plus a 10%-green tint.

#### Format A — symbol formats (A4 / A5 / A7)
Symbol art stays on its white plate — it is a glyph printed on white. Wrap it: `.reference-symbol` is a 10px accent-tinted frame around a 168px white plate (144px for A5, where three text options need the room). A7's label anchor (`.anchor-label`) shows the category as a small mono line above the name in Fraunces 28px `--accent-bright`; its candidate icons are unlabelled white plates in a 2×2 grid, and the design keeps the existing rule that neither reference nor candidate names itself.

A5's reveal uses `.reveal.is-symbol` (violet, not green): title `"Planet: Venus"` in `--accent-bright`, body the significance phrases joined with `·`.

#### Format B — True/False
The card and the statement move **side by side** (`.reference-split`, 118px column + 1fr) instead of stacking, so the statement, both buttons and the reveal all fit above the fold. Card gets a 1px accent ring and a 30px drop shadow. `.binary` buttons unchanged in size (18px padding, 16px/500). Reveal gains a `.reveal-head` row: state icon, title, and `+3 XP` right-aligned.

#### Format C — Board matching
Two columns of `.tile`, left images (100/150) with mono uppercase name labels, right `.tile-text` 11.5px/1.5 on the panel gradient. Selection is an accent ring. **Matched pairs now leave a dashed accent placeholder** (`.tile.is-matched`) instead of `visibility:hidden` — same no-reflow behaviour, but the board reads as progress. Footer keeps `"Match all pairs to continue"` and no button until the board is clear.

### 4. Deck tab (new route, e.g. `app/deck/page.js`)

> **Shipped**, at that path. A card's meaning opens at `app/deck/[card]`
> rather than inline.

Purpose: see collection completeness; reread a card you know.

`"Your deck"` + `32 / 78` (Fraunces 22px, accent over `--muted`), a one-line standfirst, then `.filters` chips (All / Majors / Cups / Wands / Swords / Pentacles; `.is-active` filled accent). Per group: `.suit-head` mono 10px 0.16em accent with an accent hairline under it, then `.collection` — a 5-column grid of `.slot` circles. Known cards are circle crops with a 1px accent ring; unknown are `.slot.is-empty`, dashed, showing the card's number in mono. Tapping a known slot opens its meaning (reuse the reveal copy from `data_card_descriptions.csv`).

### 5. Daily draw (new route, e.g. `app/draw/page.js`)

> **Superseded as a route.** There is no `app/draw` and no Draw tab: the daily
> draw lives inside the Reading tab (`app/reader`), which also deals a
> three-card spread. The mechanic below — one card a night, keeps the streak
> alive, no curriculum progress — is what shipped.

Purpose: one card a night; keeps the streak alive without curriculum progress.

Radial violet wash at the top plus starfield. `"Tonight's draw"` with the date in mono at the right. `.draw-art` 196px card with an accent ring and a 70px violet glow; `.draw-name` Fraunces 23px; `.draw-line` mono 10px 0.14em accent — `"UPRIGHT · PLANET: MOON · NOT YET TAUGHT"`. Keyword chips centred. `.prompt-card` holds a journal prompt in Fraunces 17px under a mono label. Bottom: a streak row (34px accent-tinted circle with the count) and the "draw again after sunset" line.

Note: reversed draws should use `reversed_reading_notes`; the design shows the upright case.

### 6. Section complete / unit recap complete

> **Superseded.** v4 ends a node on its own celebration, and a card's first
> teaching unit on a two-screen unlock ceremony (`0076`), with an Alignment
> Check ceremony mid-unit (`0093`). The section/unit split below belongs to
> v1's curriculum shape.

`.complete` container with a top radial violet wash. Eyebrow (`"SECTION 5 COMPLETE"`), `.complete-title` Fraunces 33px (two lines, e.g. "The Empress / is yours"), `.complete-body` max 30ch stating exercises and misses. Then either `.complete-card` (172px card art, accent ring, 60px glow) for a single card earned, or `.earned` — a 4-column grid of the unit's eight circles — for the unit recap. `.scoreboard`: three `.score` tiles (nights, cards, XP) with the middle one `.is-accent`. Section view ends with the eight-tick section strip; unit view ends with `.unlock` — next unit's icon, `"UNIT 2 UNLOCKED"`, name, and counts. Footer: `.action` primary plus `.action-quiet` secondary.

## Interactions & behavior

Unchanged from the current build, except where noted:

- **Format A**: tap selects, `Check` confirms, wrong picks shake (`.is-shaking`, 380ms) and eliminate that option; retry until correct. Long-press (400ms) opens the inspector. Hint eliminates one wrong option and decrements the visible hint count.
- **Format B**: no retry; answering locks both buttons and reveals. False rounds still show the donor card screen afterwards.
- **Format C**: tap left, tap right; wrong pair flashes red 500ms and clears the selection; no continue button until the board is clear.
- **New**: rings, progress ticks and the streak pill animate only via `transition` on `box-shadow`/`width`. Everything is disabled under `prefers-reduced-motion` by the rule at the bottom of `globals.css`.
- ~~Tab bar: Path / Deck / Trials / Draw. Trials is not designed yet — link it
  to a placeholder.~~ **Shipped as five tabs: Path / Deck / Guide / Reading /
  Social**, Guide centre and accented. Trials was never built and Draw folded
  into Reading; see `components/tabbar.jsx`, which records why.

## State

No new session state inside a round. New persisted values the redesign assumes:

- `nodesCompleteByUnit` and `nodesCompleteBySection` — drive `--p` on the rings and `.section-bar`
- `knownCardKeys` — drives the Deck tab, `.card-row.is-unknown`, and the "cards known" counts
- `streakDays`, `lastDrawDate` — streak pill and Daily Draw availability
- `xp` — the `+N XP` line on reveals and the scoreboard
- `hintsRemaining` per section — the topbar hint counter

~~None exist in the repo today (progress is not persisted at all), so this is
the one piece of real backend work the redesign implies.~~

**Built.** `lib/progress.js` persists to `localStorage` under
`lunadeck.progress.v1`, and `lib/progress.test.js` covers it. The names
differ from the wish-list above:

| the redesign asked for | what exists |
| --- | --- |
| `nodesCompleteByUnit`, `nodesCompleteBySection` | `completedNodeIds`, a flat list counted per unit or section as needed (plus `missedNodeIds`) |
| `knownCardKeys` | `knownCardKeys(progress, sections)`, derived rather than stored |
| `streakDays`, `lastDrawDate` | `streakDays`, `lastPlayedDate`, `dailyDraw`, `drawnCardKeys`, `reversedCardKeys` |
| `xp` | `xp` |
| `hintsRemaining` per section | `hintsBySection` |

## Assets

All from the repo, no new art:

- `assets/cards/circle/{card_key}_circle.png` — path rings, deck slots, card rows
- `assets/cards/master/{card_key}_MASTER.png` — candidates, references, draw, completion
- `assets/symbols/{Type}_{name}_MASTER.png` — A4/A5/A7 plates (white-plate art; do not tint)

Icons are CSS shapes, not files. Copy comes from `data_card_keywords.csv`,
`data_card_talking_points.csv` and `data_symbol_significance.csv` — all three
still in `data/`. `data_unit_metadata.csv` was also listed here; it was deleted
with v1 (`0082`), and v4's own lesson copy lives in `data/v4/*.json`.

## Files

- `globals.css` — drop-in replacement for `app/globals.css`. Applied in
  `313e50c`; `app/globals.css` has moved on a long way since, but the tokens
  are untouched.
- `Lunadeck Current.dc.html` — the visual reference (turn 3 = new screens,
  turn 2 = redesigned core, turn 1 = current build for comparison). In the
  repo as `specs/design/Lunadeck_Violet_Reference.dc.html`.

## Suggested order

> **Done, and then some.** All seven steps were carried out; steps 4 and 5
> named routes that have since been removed with v1 (`0082`). Kept as the
> record of how the redesign was sequenced.

1. Swap `globals.css`. The app should still render, in violet, with the old flat markup.
2. Add `.tabbar` to `app/layout.js`; add the two new routes as stubs.
3. `app/page.js`: masthead, overall bar, stop rings and states.
4. `app/units/[unit]/page.js`: sections instead of nodes.
5. `session.jsx`: segmented progress, hint count, `.format-line`.
6. Format components: the per-format notes above.
7. Deck, Daily Draw, completion screens.
