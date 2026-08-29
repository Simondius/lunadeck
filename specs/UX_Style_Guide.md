# Zodiac Tarot — Global Design Style Guide

This holds only **cross-cutting patterns that any lesson format can reuse**
— generic interaction primitives, error handling, layout principles, and
process standards. It does not hold anything specific to one format's own
mechanic (e.g. what makes "Choose Card From Keywords" or "Choose Meaning
From Card" its own thing). That stays in that format's own locked spec.

**Rule of thumb for what goes where:** if changing it would mean changing it
in more than one future format's spec, it belongs here instead. If it only
makes sense in the context of one specific exercise mechanic, it belongs in
that format's own spec, not here.

Attach this file (not the full chat history) to the start of each new
lesson-format design thread. At the end of a thread, replace this file with
the updated version — don't accumulate both.

Compiled after: Lesson Formats 01–09 (01 – Choose Card From Keywords through
09 – True/False Talking Point Statement). Last revised during the Lesson
Format Bible consolidation pass, 2026-08-20.

---

## 1. Selection & Interaction

- **Equal-weight options must always render at the same size.** If several
  options are presented as parallel choices (any one could be correct),
  they must be visually identical in size no matter how they're arranged —
  e.g. a 3-card layout with 1 card alone on its own row must not make that
  card smaller or larger than the 2 below it; a 4-row vertical stack must
  not make any one row taller than the others.
- **Whether an option can be tapped directly to select it depends on its
  content type, not on the format it appears in:**
  - **Image-based options are directly tappable to select, with inspect
    available via long-press.** A tap on an image-based option selects
    it — same as a text option, no separate button. Pressing and holding
    an image opens it full-screen for inspection (back button, or
    releasing the press, returns to the board without changing anything
    selected); a quick tap never triggers inspect. This replaces the
    format's own separate "choose this card"-style button, which no
    longer exists — the tile itself is both the inspect and select
    target, disambiguated by gesture (tap vs. long-press) rather than by
    a second control.
  - *(Superseded rule, kept for history: earlier formats used tap-to-
    inspect + a separate select button for image options. Changed
    2026-08-18 to support Tile Match, which needs a direct tap-to-select
    gesture for its fast-paced matching interaction. Any locked format
    whose interaction flow still describes a separate select button for
    image options needs its spec revisited — see the flagged list below.)*
  - **Text-based options carry no such ambiguity** (there's nothing to
    zoom into), so the text block itself may be the tap target for
    selecting — no separate button needed. The whole block still needs a
    visible selected state (border/fill/badge), it just doesn't need its
    own extra control to get there.
  - A single screen can mix both: e.g. a fixed reference image that's
    inspectable-but-not-selectable, alongside a set of text options that
    are directly tappable.
  - **Text-based options that overflow their allocated space follow the
    same tap/long-press vocabulary as images.** Text shrinks toward a
    defined minimum legible size and wraps up to a capped number of lines
    to try to fit its cell. If it still doesn't fit at that floor, it
    truncates with an ellipsis at the last full word, and the option gains
    a long-press-to-expand affordance identical in mechanism to image
    inspect: a full-screen overlay with the complete text, Back (or
    releasing the press) returns without changing the current selection,
    and a quick tap still only selects. This makes "long-press to see the
    full thing" one consistent idea across the app regardless of whether
    what's compressed is an image or a paragraph of text.
  - **This is distinct from, and does not replace, the existing pattern
    for read-only fixed-reference/anchor panels** (e.g. a keyword panel or
    an anchor block above a grid), which continue to scroll internally
    rather than truncate, per Format 01's precedent. The distinguishing
    principle: truncate + long-press-to-expand applies to anything
    **selectable**, because scrolling and tap-to-select are a poor
    combination on the same element (easy to trigger one meaning the
    other); internal scrolling applies to anything **read-only**, where
    there's no selection gesture to protect. A format with both a
    selectable grid and a read-only anchor panel (e.g. Format 01) uses
    both patterns side by side, one per element, not one or the other for
    the whole screen.
  - **Content types should be classified up front as "bounded" (always
    fits, e.g. a single keyword, a short category label) or "long-form"
    (may need expand, e.g. a full keyword set, collated reading notes) so
    that hint copy naming the long-press gesture is decided once per
    content type, not recomputed per round** — otherwise the hint text
    would flicker in and out depending on which specific content happened
    to get served, which reads as inconsistent.
- Only one option may be selected at a time; selecting a different
  (non-eliminated) option moves the selection.
- Selecting is a separate action from submitting. A footer Continue/submit
  button confirms the answer; selecting an option alone does not submit.
- **A Hint control is available every round**, surfaced in the top bar
  alongside the progress indicator. It either eliminates one incorrect
  candidate from an option-based screen, or surfaces additional context
  about the fixed reference, depending on what the screen shows. This maps
  cleanly onto any format with both a fixed reference and a candidate list;
  formats without that shape (a binary choice with no candidates to
  eliminate, or a board with no single fixed reference) need a
  format-specific decision about what Hint actually does, not an assumed
  default. Whatever a hint shows or removes is curriculum content,
  populated when the curriculum is populated — no supporting data exists
  yet for any format. *(Added 2026-08-20 — see Section 9.)*

## 2. Error Handling

- **Wrong selection:** the screen shakes, a red X badge appears on the
  selected option, and the option's own border/fill switches to the
  wrong-state styling. *(As of 2026-08-18, this applies uniformly to text
  and image options — image options are no longer button-based; see
  Section 1's superseded-rule note. Any format spec still describing a
  separate button changing its label on a wrong image selection is stale
  and needs updating — see the flagged list at the end of this guide.)*
- The wrong option becomes disabled for the rest of the round — grayed out,
  no longer selectable (an image-based one remains inspectable via
  long-press).
- The learner keeps retrying until they select the correct option, even if
  only one candidate remains. A round never ends on a miss.
- **Correct selection:** green border + checkmark badge, a short reveal
  line appears, and the action button relabels to "Next."
- Only the *first* wrong attempt in a round is logged for spaced-repetition
  purposes — retries within the same round aren't logged again.

## 3. Layout

- A round's **fixed reference item** (the one piece of content that stays
  constant while the learner evaluates candidates against it — e.g. a
  keyword list, or a card's image) is anchored to one edge of the screen
  (top or bottom, whichever reads more naturally for that format) in its
  own panel. Panel content is vertically centered within that panel, not
  top-aligned.
- The **candidate options** fill the remaining space, arranged either as a
  grid (2 → single row; 3 → 1 centered on its own row, 2 below; 4 → 2×2) or
  as a vertical stack of full-width rows, whichever suits the option
  content — text-heavy options generally read better as stacked rows,
  image options as a grid. Whichever arrangement is used, the candidate
  block is centered in its allocated space when it doesn't fill it.
- **Card art defaults to the largest size the available vertical space
  allows, on every screen that shows it.** This is a global default, not a
  per-format choice — a format spec should only call out card sizing at
  all when it deliberately departs from this default (e.g. capping a board
  size specifically to keep this rule intact rather than shrinking art to
  fit more rows). *(Added 2026-08-20 — see Section 9.)*
- Full content is preserved at every option count — no downgrading (e.g. no
  truncating a keyword list, no shrinking card art to a thumbnail) to save
  space.
- Variable-length text (e.g. card names, keyword lists) reserves fixed
  space sized to the longest real value in the dataset (e.g. a 2-line
  clamp), so layout never shifts depending on which content gets served.

## 4. Content & Difficulty Sourcing

- Difficulty is driven by existing data fields (e.g.
  `card_similarity.difficulty_score`) rather than new authored content,
  wherever the data already supports it.
- General distractor-tiering formula: **Easy** = all distractors "clearly
  distinct," **Hard** = all "confusable," **Medium** = a mix (excluding
  all-easy).
- Reveal/explanation text reuses existing descriptive fields rather than
  authoring new copy, when an existing field already fits the purpose.
- Distractor-to-distractor relationships may be left unconstrained (accepted
  v1 limitation) unless a specific format needs otherwise.
- Ties among equally-eligible candidates are broken randomly.
- Content that identifies *which* candidate is correct by name (e.g. a
  card's own name) must never appear on an anonymous candidate option
  itself, even if that same name is shown elsewhere on screen as a fixed
  reference (e.g. labeling the target card at the top). Showing it on the
  fixed reference aids recognition; showing it on a candidate gives the
  answer away.
- **A card shown anywhere outside its own printed art (e.g. a small tile in
  a board or grid) gets an explicit name label alongside it** — the art's
  own printed name plate is generally too small to read reliably once the
  art itself has been sized down. *(Added 2026-08-20 — see Section 9.)*

## 5. Process & Documentation

- One lesson format is designed and locked per thread.
- Each locked format gets a standalone spec PDF: rules of play, difficulty
  tiering, full interaction spec, wireframes for every state/option-count
  combination, and explicit data requirements (including any gaps).
- Wireframe/diagram QA: every sub-element stays within its own allocated
  bounding box; every generated wireframe set is rasterized and visually
  inspected — across every state variant, not just the first — before being
  presented.

When a format's own spec appears to contradict a rule in this guide, this
guide wins. Flag the conflict and update the format's spec to match — don't
quietly let two documents disagree. Conversely, a genuinely reusable pattern
discovered while designing one format's spec belongs in *this* document, not
duplicated or left stranded in that format's own spec.

## 6. Resolved: 2026-08-18 image-selection rule change

Section 1's image-option rule changed from "inspect-only tap + separate
select button" to "tap selects, long-press inspects," to support Tile
Match's fast-paced matching interaction. This was checked against every
previously locked format:

- **Format 01 (Choose Card From Keywords) — REVISED, but flagged for
  re-verification (2026-08-18).** Its candidate cards were the selectable
  options via a separate "choose this card" button per the old rule.
  Selection Model (new section), Interaction Flow, and wireframes (all
  three grid sizes × 4 states, plus the retry sequence and the long-press
  inspect overlay) were redone under tap-to-select + long-press-to-inspect.
  See `LessonFormat_01_ChooseCardFromKeywords_REVISED.pdf`. **However**,
  while working the data-design pass for Tile Match, the original Format
  01 spec turned out to have more scope than this revision covered — it
  defines three anchor variants (A: keyword list, B: `description_
  anonymized`, C: collated `card_talking_points`), not just the single
  keyword-list version the revision addressed. The revision's tap-select/
  long-press-inspect mechanics are still correct, but it needs to be
  redone against the full three-variant original before being treated as
  current.
- **Format 08 (Symbol Selection From Label) — REVISED.** Its candidate
  icons were the selectable options via a separate "Choose" button per the
  old rule. Selection Model, Interaction Flow, and wireframes
  (default/selected/correct/incorrect) were redone the same way. See
  `LessonFormat_08_SymbolSelectionFromLabel_REVISED.pdf`.
- Formats 02, 03, 04, 06, 07, 09 — checked, **unaffected.** In every one of
  these, images appear only as a fixed, non-selectable reference (a target
  card, a reversed card, a lone symbol icon); the actual selectable
  options in each are text rows or fixed text buttons (TRUE/FALSE,
  Major/Minor Arcana), which were never button-based image options and
  don't use the old rule either way.

Both flagged formats are now current. No open items remain from this
change.

## 7. Curriculum-Level Progress Indicator

Introduced during the Tile Match design thread, but this is **not specific
to Tile Match** — it applies whenever a lesson groups multiple instances of
any format (the same format repeated, e.g. 5× True/False, or a mixed
sequence of different formats) into one session. Tile Match simply
surfaced the need first, because it's the first format whose own round
already spans more than one screen (a fixed number of board-refreshes per
round) — but the same gap exists at the curriculum level for every format:
none of them have any way to show progress through a multi-instance group.

- A **thin, segmented progress bar** is reserved as its own strip at the
  very top of the screen, above everything else in that format's own
  layout (prompt line, fixed reference panel, grid, footer button — all of
  it starts below this bar). It is laid out first, and every format's own
  regions treat it as already-claimed space, the same way they'd treat a
  device status bar.
- **One segment per instance** in the current group (e.g. grouping 5×
  True/False lessons together renders 5 segments; a Tile Match round with
  4 board-refreshes renders 4 segments). Segments are small and unlabeled
  — no fraction, no count printed next to them. This is a subtle
  orientation cue, not a headline stat.
  - Filled (accent color) = instance already completed.
  - Empty (border-gray) = instance not yet reached.
- **Update timing:** a segment fills the moment one full instance
  completes — e.g. a True/False round answered correctly and dismissed via
  "Next," or a Tile Match board fully cleared — right before the next
  instance loads. It never updates mid-instance (e.g. per sub-attempt, per
  tile match, per wrong guess); the unit of progress is always "one whole
  instance of the format," regardless of how many steps that instance
  itself takes internally.
- This bar belongs to the **curriculum/session-composition layer**, not to
  any individual format's own spec — a format spec should reference it
  ("this format's screen renders below the curriculum progress bar, if
  present") rather than redefine it. Whether a given lesson uses grouping
  at all, and how many instances are grouped together, is a curriculum
  decision out of scope for any single format's spec, consistent with
  Section 4/5's existing pattern of leaving grid-size and difficulty-tier
  *selection* to the curriculum layer while formats themselves only define
  *how* those choices render.
- Open item: no design yet for what happens if a single format instance is
  abandoned mid-way (e.g. the learner exits before finishing one Tile
  Match board) — does the segment for that instance stay empty, or is
  there a partial/in-progress visual state? Left for the
  learner-progress/curriculum layer to define alongside session resume
  behavior generally.

## 8. Text Overflow on Selectable Options (2026-08-18)

Introduced during the Tile Match data-design pass, generalized immediately
since it's a layout primitive any format with selectable text could hit,
not just Tile Match. See Section 1 for the rule itself (truncate +
long-press-to-expand for selectable text; internal scroll stays the
correct answer for read-only anchor/reference panels, per Format 01's
existing precedent — the two patterns coexist, one per element, based on
whether that element is selectable).

Checked against every existing format:

- **Format 01 (Choose Card From Keywords)** — the card-name label under
  each card cell truncates at 2 lines with no expand affordance today.
  Real-world risk is low (card names realistically never exceed 2 lines),
  but it's technically inconsistent with the new rule. Low-priority fix:
  add long-press-to-expand to the name label for full consistency, even
  though it may never actually trigger. The format's anchor panel (all
  three variants) is read-only and already uses internal scroll — no
  change needed there.
- **Format 02 (Choose Meaning From Card)** and **Format 05 (Symbol Meaning
  Match)** — both size their selectable rows to the longest real value
  across the full dataset by explicit design ("no truncation"), so neither
  should ever hit the new rule's truncation branch. This assumption has
  not been verified against real content lengths yet (a pre-existing open
  item in both specs, not a new one) — worth confirming once real data is
  loaded, since the new rule gives a defined fallback if that assumption
  ever turns out to be wrong.
- **Format 07 (Shadow Meaning Recognition, Scaffolded)** — the anchor
  panels (Variants A/B/C) are read-only, same as Format 01's, and
  unaffected. The candidate shadow-meaning rows are selectable text but
  have no explicit sizing commitment in the current spec (unlike Formats
  02/05's stated worst-case sizing) — recommend either adding the same
  worst-case sizing commitment, or explicitly relying on the new
  truncate-and-expand rule as the fallback, so this doesn't silently
  depend on candidate phrases happening to be short.
- **Formats 03, 04, 06, 08, 09** — checked, unaffected. Content on
  selectable options in each is short by construction (fixed two-word
  buttons, "Category: Name" labels, hand-edited true/false clauses) with
  no realistic overflow case.

No formats need changes to ship the new rule; Format 01's name-label gap
and Format 07's sizing-commitment gap are both flagged as low-priority
follow-ups, not blockers.

## 9. Card Space-Filling Rule (2026-08-20)

Introduced during the Lesson Format Bible consolidation pass, while
capping Board Matching's row count. The two decisions are linked: Board
Matching originally supported a 4-row board, but at 4 rows the only way to
fit the board on screen is to shrink each card tile below a size where the
art is easily readable — which defeats the point of a format whose entire
premise is visual recognition. Rather than leave that as a one-off fix
scoped to Board Matching, the underlying principle was generalized into a
standing rule:

- **Card art defaults to the largest size the available vertical space
  allows, on every screen that shows it** (Section 3). Any format that
  needs to depart from this — showing cards smaller than the space would
  otherwise allow — must say so explicitly and justify it, rather than
  shrinking art as an unstated side effect of some other layout decision.
- Direct consequence for **Board Matching**: board size is capped at 2–3
  rows (previously 2–4). The dropped 4-row/Hard-by-row-count tier's
  difficulty contribution is absorbed by the format's existing
  content-pairing ladder, which now carries more of the difficulty range
  on its own — a 3-row round using the hardest content pairing is the
  format's new difficulty ceiling.
- Direct consequence for **any format showing a card at reduced size
  outside its own printed art** (e.g. a small board tile, a dense grid
  cell): the card's printed name plate becomes too small to read reliably,
  so an explicit name label must be shown alongside the art (Section 4).
  This was previously implicit/inconsistent — some formats relied on the
  art's own printed name, others didn't show a name at all outside the
  full-size reference panel.

Checked against every existing format:

- **Formats 01, 02, 03, 06, 07, 09** — show card art only as a single
  full-size reference panel or full-size grid tile at 2–4 options; all
  already render cards near the largest size their layout allows, since
  none of them cram more than 4 cards into a single screen. Unaffected in
  practice, though worth a pass to confirm none are leaving avoidable
  margin unused.
- **Format 10 (Tile Match)** — directly affected, per above: row cap
  lowered to 2–3, and board tiles now carry an explicit name label
  alongside the art. Needs its wireframes and difficulty section redone
  against both changes.
- **Formats 04, 05, 08** — symbol-icon formats, not card-art formats; this
  rule doesn't apply to them directly, though the same space-filling
  principle is reasonable to extend to icon sizing in a future pass if
  icon tiles are ever found to be under-sized.

Open item: no numeric minimum card size is defined yet — "largest the
available space allows" is a relative rule, not a pixel floor. Worth
adding a concrete minimum once real device targets are picked, so a
format with an unusually tight layout (e.g. many stacked elements above
the art) has a hard floor to fall back to rather than shrinking
indefinitely.


## 10. Card Shape Consistency (2026-08-29)

Sibling to §9. That rule governs how *large* card art is drawn; this one
governs its *shape*. They do not conflict: a card still fills the largest
space its layout allows, it simply keeps a constant shape while doing so.

The master art is not dimensionally consistent. Of 78 masters, 61 are exactly
813x1456 and a 62nd matches their ratio of 0.5584 within 0.25%. The
remaining 16 are stray export sizes running as wide as 0.7037
(`minor_cups_06`, 924x1316), which is 25.7% squatter than the deck norm.
Their heights (1316, 1400, 1428, 1344, 1372, 1260) suggest a separate export
batch rather than drift.

Because `.complete-card` fixes width and lets height follow the file, those
16 rendered visibly shorter — 245px against the deck's 308px — and every
element below the card shifted up with them. On a lesson flow that pages
through one card after another, the card box changed shape and the layout
flinched.

- **Full card art renders at a single canonical ratio on every screen that
  shows it.** The ratio lives in one place, the `--card-ratio` token in
  `globals.css`, currently `813 / 1456`. A screen showing a full card sets
  `aspect-ratio: var(--card-ratio)` on the card frame and `object-fit: cover`
  on the image. No screen should let a card's own file dimensions decide the
  shape of its frame.
- **The art on disk is not altered to fit.** Normalising the files would mean
  cropping up to 20% off an illustration, squashing it, or padding it back
  out — all destructive, and all to solve what is a presentation problem.
  The 16 outliers are therefore cropped at display time only, by roughly 22px
  a side at 172px wide. Re-exporting them at the canonical size would remove
  even that, and is the preferred long-term fix.
- **This rule is about full card art**, not the derived `circle` and `avatar`
  crops, which are square by construction and already consistent.

Open items:

- `.reference-art` still sizes cards by `width: 100%` with `max-height: 33dvh`
  and no `object-fit`. When that cap binds, the image is *distorted* rather
  than cropped — a pre-existing bug, independent of the outliers, and not
  fixed here because the screens using it were not reviewed. It should adopt
  the same token.
- The canonical ratio is currently inherited from whatever the 62-card
  majority happens to be, rather than chosen. If the deck is ever re-exported,
  that is the moment to pick it deliberately.
