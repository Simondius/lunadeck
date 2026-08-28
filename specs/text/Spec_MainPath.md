# Spec_MainPath
*Converted from `Spec_MainPath.pdf`.*

---

## Page 1

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 1
ZODIAC TAROT
Main Path Specification
Screen-by-screen spec for the primary learning path: unit banner, node states, seamless
cross-unit progression, lesson entry, the mistake-review transition, unit recap, and lesson
exit — with an interactive prototype and a QA'd wireframe gallery.
Status Final for this design pass — decisions closed out, ready to hand off
Scope Main path structure and screen flow only. Individual exercise formats (A1–A7, B, C) are
designed and locked in their own separate threads per the Global Style Guide, Section 5, and
are represented here only as lightweight stand-ins.
Companion files Zodiac_Tarot_Curriculum_Design_Spec.pdf (unit/section/node structure) ·
Zodiac_Tarot_Global_Style_Guide.md (cross-cutting interaction rules) ·
data_unit_metadata.csv · data_curriculum_nodes.csv
Working prototype ZodiacTarotMainPath.jsx — interactive React build of every screen in this spec, click-through,
built against real content from Units 1–2. Final pass: seamless cross-unit progression, real
Unit Recap flow, progress-based Unit Menu.
Reference content Unit 1 — “Instant Classics” (The Fool through The Lovers, plus recap) flows directly into Unit 2
— “Completing the Court” (Ace of Swords through King of Cups, plus recap). 18 sections total
across the two units modeled.
Card art Deferred. Only The Fool and Ace of Cups have embedded art in this prototype; every other
node uses a placeholder glyph. Final art per card is a separate pass — see Section 3.2.
1. Purpose & Scope
This spec defines the main learning path: the screen a learner lands on, how it represents
locked/current/completed progress, how a lesson is entered and exited, how the app transitions a learner
through a mistake-review step before a lesson is allowed to close, and — closed out in this final pass — how
the path moves a learner from one unit into the next without requiring any navigation decision. It follows core
Duolingo path conventions (winding node path, unit banners, segmented in-lesson progress, a gem/heart status
bar) re-skinned to the app's own visual identity. XP and streak — also core Duolingo conventions — are
intentionally absent from this pass; they're being specified separately.
Explicitly out of scope: the internal mechanics of any one exercise format (Choose Card From Keywords,
Choose Meaning From Card, Board Matching, etc.). Per the Global Style Guide, each format is designed and
locked in its own thread with its own full interaction spec and wireframe set. This document shows two
single-card exercises and one recap stand-in in illustrative form only, using real content, to give the progression
and review logic something concrete to act on.

---

## Page 2

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 2
2. Screen Inventory
Screen Purpose Entry point(s)
Path Home surface. Shows continuous progress across units as
one vertical node path — not one screen per unit.
App launch; “Continue”
from Exit
Unit Menu Simple list of all 10 units with real lock/current/done state, for
jumping around. Optional — not required to advance.
Menu button, top-left of
the status bar
Unit Guidebook Read-only modal with the tapped unit's intro copy. Guidebook button on that
unit's inline banner
Lesson Entry
(sheet)
Preview of the current section before committing to play it. Tapping the current
(glowing) node
Lesson The section's exercises, played in sequence, with a
segmented progress bar.
“Start Lesson” on the
Entry sheet
Recap Entry /
Recap
A distinct, lighter entry + review flow for a unit's closing recap
node — no single card to anchor on, so it doesn't reuse the
single-card Entry/Lesson screens.
Tapping a unit's recap
node
Mistake-Review
Bridge
Interstitial shown only if the learner missed at least one
exercise on first attempt.
End of a lesson's main
run, if anything was
missed
Exit / Lesson
Complete
Summary of first-try accuracy and which card was mastered
(or, for a recap, that the unit is complete).
End of a mistake-free
run, or after every
missed exercise is
reviewed
3. Path Screen
The path is a single, continuous vertical scroll spanning every unit the learner has reached — not a separate
screen per unit. Nodes come directly from data_curriculum_nodes.csv; unit boundaries and banner copy come
from data_unit_metadata.csv.
3.1 Unit Banner (inline, not sticky)
Each unit's banner — unit_number, unit_name, unit_tagline, and a Guidebook button — renders inline in the
scroll, immediately before that unit's first node, rather than as a header fixed to the top of the screen. Scrolling
past a unit's last node (its recap) naturally reveals the next unit's banner and first node in the same continuous
motion — this is the mechanism behind Section 3.4. A true scroll-linked sticky header (swapping which banner
is pinned to the top as you scroll, the way Duolingo's own path does it) is a reasonable future polish but was not
necessary to make the flow feel seamless, so it's out of scope for this pass — see Section 11.
3.2 Node States

---

## Page 3

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 3
State Visual treatment Interaction
Locked Flat dark fill, muted lock glyph, no card identity shown. Not tappable
Current Enlarged (90px vs. 74px), gold gradient fill, pulsing halo ring, floating
“START” callout above it.
Tap → opens Lesson
Entry (or Recap Entry)
Completed Gold gradient fill, small star badge on the corner. Shows real card
art for The Fool and Ace of Cups; every other card shows a
placeholder glyph (a major-arcana sigil, or a suit mark for minors)
instead — art is deferred, not missing by accident.
Not tappable — replay is
a closed decision, not an
open item (Section 11)
Unit Recap Diamond silhouette instead of a circle, distinguishing it from
single-card sections at a glance; chest icon once reached.
Same states as above,
different shape
3.3 Below the Path
A dimmed, dashed-border teaser for the unit after the last one with real content sits at the bottom of the scroll,
with a lock icon and its unlock_requirement string, so the path never dead-ends without showing what's next —
even once a learner reaches the edge of what this prototype has built out.
3.4 Linear Progression Across Units
This is the default and only path a learner needs. Finishing a unit's recap marks it completed and promotes
the next unit's first section to current — exactly like finishing any other node. Nothing about that transition is
special-cased: the same “mark completed, promote the next node” logic that advances a learner from Section 1
to Section 2 within a unit is what carries them from one unit's recap into the next unit's first card. The next unit's
banner is already sitting in the scroll immediately below, so continuing feels like turning a page, not being
routed somewhere new.

---

## Page 4

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 4
The transition point
Unit 1 Recap done; Unit 2 banner + first node
ready, same scroll
Fresh start
Still just Unit 1 — nothing changes about day
one
3.5 Unit Navigation Menu
A button in the top-left of the status bar opens a flat list of all 10 units from data_unit_metadata.csv. This menu
is opt-in only — for a learner who wants to jump around, revisit a finished unit's banner/guidebook, or peek at
what's ahead. It plays no part in normal forward progress, which happens on the path itself per Section 3.4.
Unlock state is real, not decorative: a unit shows DONE once every one of its nodes is completed, CURRENT
for whichever unit contains the in-progress node, and locked otherwise. Units 1 and 2 are backed by actual
node data in this prototype, so their menu state genuinely reflects play; Units 3–10 have no content built out yet
and stay statically locked regardless of progress.

---

## Page 5

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 5
Menu — fresh start
Unit 1 current, everything else locked
Menu — after Unit 1
Unit 1 DONE, Unit 2 CURRENT —
computed, not hardcoded

---

## Page 6

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 6
4. Lesson Entry (Sheet)
A bottom sheet, not a full screen — the path stays visible and dimmed behind it, so entering a lesson never
feels like leaving the map. Content is pulled straight from the section's card: card art, its first three
data_card_keywords.csv entries (in keyword_order), and an exercise/time estimate derived from the section's
7-node spine.
Dismissable: “Not now” or tapping outside the sheet returns to the Path screen with no progress change.
Lesson Entry sheet
Real keywords: Exploration, Levity,
Nonconformity
5. Lesson Screen
Scope boundary: this section documents only what the main-path layer owns — the segmented progress bar,
the hearts counter, and the close (X) control — not the exercises themselves. The two exercises shown below
are illustrative stand-ins (Format A1 and A2-style, using The Fool) so the mistake-logging behavior has real
content to act on. Each format's actual interaction spec, wireframes, and difficulty tiering live in that format's
own locked thread.
5.1 Progress Bar
One segment per node in the section (7, per the curriculum spine), per the Global Style Guide's curriculum-level
progress indicator: unfilled/border-gray until a node completes, then fills solid gold. It never updates mid-node.
5.2 Error Handling (inherited, not redefined here)

---

## Page 7

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 7
Wrong-answer visuals follow the Global Style Guide exactly: shake + red X badge + the option disabled for the
rest of the round; the learner keeps retrying until correct; only the first wrong attempt per round is logged. This
spec adds nothing new here — it only defines what happens after that logging, at the session level (Section 7).
Node 1 (A1-style)
Keyword anchor, unlabeled candidates
Wrong attempt
Shake state, red badge, tile disabled
Correct + reveal
Green badge, reveal line, segment fills
Node 2 (A2-style)
Fixed card reference, text candidates
Wrong attempt
Same error pattern, applied to text
options
Correct + reveal
Segment 2 of 7 fills

---

## Page 8

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 8
Nodes 3-7 stand-in
Named but not designed in this thread
6. Unit Recap
The last node of every unit is a recap — a Board Matching round (Format C) across everything taught in that
unit, with no single new card to anchor the screen on. Rather than force it through the single-card
Entry/Lesson/Exit screens, the recap gets its own lightweight equivalents so the copy and imagery stay honest
about what it actually is.
Screen What's different from the single-card version
Recap Entry A chest icon in place of card art; eyebrow reads “UNIT n · RECAP”; title “Board Match Review”;
no keyword chips, since there's no single card's keywords to show.
Recap Lesson A single illustrative stand-in screen (this format is designed in its own thread, same as any other)
rather than the two-exercise sequence a normal section runs.
Recap Exit Headline “Unit n complete!” instead of a lesson-complete message; a chest icon instead of a
card thumbnail and “mastered” label; the stat reads “8/8 cards in this unit”; the note names the
next unit by title instead of talking about a missed question.
Completing the recap uses the exact same “mark this node completed, promote the next one to current” logic
as any other node — this is what makes Section 3.4's cross-unit transition work without special-casing.

---

## Page 9

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 9
Recap Entry
Chest icon, no keywords
Recap Lesson
Board Matching stand-in
Recap Exit
Names the next unit by title

---

## Page 10

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 10
7. Mistake-Review Transition (“Bridge”)
What happens between the last exercise and the exit screen if the learner logged any first-attempt mistakes
during the lesson. Every exercise missed on the first try gets reviewed before the lesson can close — not
just one representative one.
7.1 Trigger
Evaluated once, at the end of a section's 7-node run — not per-node. Each node the learner got wrong on the
first attempt is added to that lesson's own missed-exercise queue (in the order it was missed). If the queue is
empty, the learner goes straight from the last node to the Exit screen. If it has one or more entries, the Bridge
screen is inserted before Exit.
7.2 What the Bridge Does
Element Content
Icon A single card-flip glyph — visually distinct from both the lesson's error state (red/shake) and the
celebratory exit (confetti/gold), so it reads as a calm checkpoint, not a penalty.
Headline “Let's lock that in” — deliberately not phrased as a correction or a scolding.
Subtext Names the size of the queue and the card by name, singular or plural as needed, e.g. “You
missed one question on The Fool — let's take another look at it before you finish” vs. “You
missed 2 questions … let's take another look at each one.”
Action “Review it” to work through the queue, or close (X) to abandon the lesson — see Section 7.4.
7.3 The Review Itself
“Review it” steps through the missed-exercise queue one at a time, in the order they were missed — each
screen tagged “SECOND LOOK” and labeled “Review n of total” so the learner always knows where they are.
Each exercise is re-presented in its own real format — a keyword-match miss is re-served as a keyword-match
exercise, a meaning-match miss as a meaning-match exercise — this is not a generic flashcard replay. A round
never ends on a miss here either: the learner keeps retrying until correct before the queue can advance. The
button reads “Next Review” until the last item, then “Finish Lesson.”
This maps directly onto the curriculum's own “genuine exposure” rule (Curriculum Design Spec, Section 5.1): a
card only counts as genuinely exposed if the learner actually had to identify or recall it, not merely see it pass
by. Requiring a correct answer on every missed exercise — not just a sampled one — keeps the review step
consistent with that definition instead of quietly downgrading it to a partial or passive re-read.

---

## Page 11

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 11
Bridge — 1 missed
Singular phrasing
Bridge — 2 missed
Plural phrasing, “each one”
Review 1 of 2
First missed exercise, in its own format
Resolved, item 1
Button reads “Next Review,” not “Finish”
Review 2 of 2
Second missed exercise, different
format
7.4 Abandoning a Lesson
The close (X) control is available on the Lesson screen, the Bridge screen, and every Review screen. In every
case it does the same thing: exit straight back to the Path with nothing saved for that attempt. There is
deliberately no mid-lesson resume — a learner who leaves before reaching Exit simply starts that section over

---

## Page 12

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 12
from Node 1 next time. This keeps the mistake-log and progress model simple: a section is either fully
completed (including its full review queue) or it didn't happen.
Abandon from Lesson
The Fool stays “current,” not completed
Abandon from Bridge
Same result — no partial credit for the review
8. Exit / Lesson Complete Screen
One screen, two copy states, chosen by whether the Bridge was shown. The difference is deliberately in tone
and stat only — both are framed as a successful lesson, since the mistake was already resolved before
reaching this screen. (The Unit Recap uses its own distinct variant of this screen — see Section 6.)
Variant Headline Stat shown Subtext
Clean (0 missed) “Perfect lesson!” 7/7 · Correct on first try “You nailed The Fool on the first try,
every time.”
Reviewed (1+
missed)
“Lesson
complete!”
6/7 · Correct on first try “The Fool is in your deck now — the
question(s) you missed will come back
around soon.” (singular/plural
matches the actual missed count)
XP and streak are intentionally not shown on this screen. Both were placeholders in an earlier pass and are being specified
separately as their own economy system — this spec should not be treated as a reference for either. The card thumbnail and
“mastered” label always reflect the section's own card, regardless of which variant is shown.
“Continue” is the only exit from this screen. It returns to the Path with the just-played node marked completed
and the next node promoted to current — regardless of which copy variant was shown, since both represent a
passed lesson.

---

## Page 13

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 13
Exit — reviewed
6/7 · no XP/streak shown
Exit — clean
7/7 · no XP/streak shown
Back on Path
Same completion result either way

---

## Page 14

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 14
9. Full Screen Flow
From Action To
Path Tap menu button Unit Menu (optional)
Unit Menu Tap an unlocked unit's banner / Close Path (no change)
Path Tap current node (single card) Lesson Entry (sheet)
Path Tap current node (recap) Recap Entry (sheet)
Lesson Entry “Start Lesson” Lesson
Recap Entry “Start Review” Recap Lesson
Lesson Entry / Recap Entry “Not now” / tap outside Path (no change)
Lesson Complete final node, nothing missed Exit (clean variant)
Lesson Complete final node, 1+ missed Mistake-Review Bridge
Bridge “Review it” Review 1 of N
Review n of N (n < N) Answer correctly → “Next Review” Review n+1 of N
Review N of N (last) Answer correctly → “Finish Lesson” Exit (reviewed variant)
Recap Lesson “Continue” Recap Exit
Exit / Recap Exit “Continue” Path (node completed, next node
current — next unit's banner + first
node if that node was a recap)
Lesson / Bridge / any Review /
Recap Lesson
Close (X) Path (no progress saved)
10. Data Sourcing
UI element Source
Unit number / name / tagline data_unit_metadata.csv — unit_number, unit_name, unit_tagline
Guidebook modal copy data_unit_metadata.csv — unit_intro_copy, shown verbatim
Section order / card per node data_curriculum_nodes.csv — section_number_global, card_key, card_name
Unit recap presence data_unit_metadata.csv — has_unit_recap
Next-unit teaser lock copy data_unit_metadata.csv — unlock_requirement

---

## Page 15

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 15
UI element Source
Entry-sheet keywords data_card_keywords.csv — keyword, ordered by keyword_order, first 3 shown
Entry-sheet / node card art data_tarot_cards_base.csv — image_file (per README_FIRST.txt, sourced from
/Images/, not the PDF gallery copy). Deferred for all but two cards in this prototype.
Exercise anchor/candidate text
(illustrative only)
data_card_descriptions.csv — description_condensed, and data_card_keywords.csv
Unit Menu rows data_unit_metadata.csv — unit_number, unit_name, unit_tagline,
unlock_requirement, for all 10 units. Lock/current/done state for Units 1–2 is computed
from live node status, not stored.

---

## Page 16

Zodiac Tarot — Main Path Specification Final — this design pass
Companion: Zodiac_Tarot_Curriculum_Design_Spec.pdf · Zodiac_Tarot_Global_Style_Guide.md Page 16
11. Decisions Closed This Pass
• Cross-unit progression is linear by default. Finishing a unit's recap flows straight into the next unit on the
same path, with no menu step required. The Unit Menu exists only for optionally jumping around.
• Completed nodes are not replayable. This was evaluated and decided against — there is no replay entry
point anywhere in the prototype for a completed node. Not an open question.
• Node-level card art is deferred, not missing. Every node besides The Fool and Ace of Cups intentionally
renders a placeholder glyph once reached, rather than blocking on final art before the path structure could be
reviewed.
12. Open Items
• Final card art per node, sized and legible at 74–90px — worth checking against the Card Space-Filling Rule
(Global Style Guide, Section 9), since that rule was written against much larger reference sizes.
• The Unit Menu is a flat list, not a mini path — it doesn't show per-unit progress (e.g. “5 of 8 sections done”)
beyond current/locked/done. Worth revisiting once mid-unit-progress data has a natural home in this menu.
• A true scroll-linked sticky unit banner (the header pins to the top and swaps as you scroll between units, the
way Duolingo's own path works) was intentionally not built this pass — inline banners already deliver the
seamless feel at lower implementation risk. Worth a follow-up pass once this ships.
• Only Units 1–2 have real section/card data in this prototype. Units 3–10 exist in the Unit Menu (names,
taglines, unlock strings) but have no path content — extending that is straightforward from
data_curriculum_nodes.csv whenever it's prioritized.
13. QA Note
Every screen in this spec was captured from the working prototype, not drawn separately — the wireframes
above are screenshots of real interaction states, reached by actually clicking through the flow in a headless
browser rather than by construction. This final pass verified, end to end: a full Unit 1 lesson with a logged
mistake (bridge → queued review → exit); a clean lesson with no mistakes; abandoning from the Lesson and
from the Bridge; the Unit Recap flow (Recap Entry → Recap Lesson → Recap Exit); the cross-unit transition
itself, confirmed by scrolling past the completed Unit 1 recap straight into Unit 2's banner and first node in one
continuous path; and the Unit Menu correctly flipping from “Unit 1 current” to “Unit 1 done, Unit 2 current” once
that transition occurred. No new layout bugs surfaced in this pass; the fixes from earlier passes (an escaped
answer badge, confetti clipping past the phone's rounded corners, and the Unit Menu list overflowing its own
sheet) remain fixed and were re-verified. All of the above is in the current build of ZodiacTarotMainPath.jsx.
