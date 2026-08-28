# Spec_Challenge_Tab
*Converted from `Spec_Challenge_Tab.pdf`.*

---

## Page 1

ZODIAC TAROT — Challenge Tab Specification
Status: Final for this design pass — decisions closed out, ready to hand off.
Scope: The third of the four bottom-tab surfaces — a head-to-head quiz a learner sends to one friend at a time, built from the same
lesson-format vocabulary as the main Path, with hard-fail scoring and a live score-comparison twist for the receiver.
Companion files: Spec_Meta_Hygiene_Systems.pdf (tab bar, Friends list, account model — this spec assumes that friend graph exists and
is readable), Spec_Lesson_ Format_Bible.pdf (formats A1/A2/A6/B/C reused here, with explicit overrides), Spec_Curriculum_Design.pdf /
data_curriculum_nodes.csv / data_unit_metadata.csv (unit gating), data_card_similarity.csv (distractor difficulty), UX_Style_Guide.md .
Explicitly deferred: Anything the Meta spec already deferred (real friend request/accept, streak freeze). Rematch / re-challenge
shortcuts. Any leaderboard or aggregate (non-head-to-head) stat beyond the per-friend win/loss balance. A nudge or reminder mechanic
for a pending challenge (considered and cut for this pass, Section 8.2).
1. Purpose & Scope
The Challenge tab lets a learner test a friend on content both of them have actually been taught, using the app’s existing lesson formats
rather than new content or new exercise mechanics. Its identity next to Path (linear teaching) and Draw (solo collection) is social and
competitive: a fixed 10-question quiz, played twice — once by the sender, once by the receiver — with hard-fail scoring so a single
mistake costs a point rather than allowing the retry-until-correct safety net the Path uses during first-time teaching.
Two people play the same generated question set, in the same order, asynchronously. This is a deliberate constraint carried through the
whole spec: it’s what makes the receiver’s live “your score vs. their score so far” comparison (Section 9.3) possible at all — if the
receiver’s quiz were freshly regenerated, there would be nothing meaningful to compare question-by-question.
2. Screen & Flow Inventory
Screen Purpose Entry point(s)
Challenge Home (locked) Pre-Unit-3 state: explains the unlock requirement,
no friend picker available.
Challenge tab, before the learner’s own Unit 3
completion
Challenge Home (friend picker) Tab landing screen once unlocked: friend picker,
or list of in-flight/past challenges once any exist.
Challenge tab, post-Unit-3
Choose Friend Global friend list, recently-challenged sorted first,
each row showing head-to-head win/loss balance.
Challenge Home → “New Challenge”
Set Parameters Difficulty, content coverage (unit cap or All),
content-type multi-select.
Friend chosen
Take Challenge (sender) The generated 10-question quiz, hard-fail scoring,
per-question score reveal.
Confirm parameters
Sender Recap Question-by-question review: the learner’s
answer vs. the correct answer, for all 10.
Sender finishes the quiz
Take Challenge (receiver) Same 10 questions, same order; parameters
shown but not the sender’s score; live score
comparison after each question.
Tapping a pending-received challenge card
Result Screen Win, loss, or tie reveal with its animation; balance
updates.
Receiver finishes the quiz
Challenge Home (list state) Sent/received challenges in progress or
completed.
Challenge tab, once ≥1 challenge exists
3. Unlock Requirement
The Challenge tab is locked until the learner’s own Path progress reaches Unit 3 complete. Before that, the tab shows a locked
state — a padlock illustration, the learner’s own progress toward Unit 3, and the line “Complete Unit 3 to unlock friend
challenges.” No friend picker, no list, nothing else is reachable from this screen.

---

## Page 2

Figure 1 — Challenge tab, locked state. Shown against “Unit 2 of 3 complete” as an example.
This threshold exists to guarantee a workable question pool (Section 6.3) — Units 1–3 together cover roughly 24 cards, comfortably
enough for 10 distinct questions — rather than as an arbitrary pacing gate. It also means a friend who hasn’t reached Unit 3 yet isn’t
challengeable either: Section 5.2’s unit cap is min(challenger's current unit, receiver's current unit) , and that minimum needs to
clear Unit 3 for either side of the pair to generate a reliable set. The Choose Friend list (Section 4) only surfaces friends who clear that
bar.
4. Challenge Tab Home
Once the learner has cleared Unit 3, the tab opens directly to Choose Friend (Section 5) the first time — there’s nothing else to show
yet.
Once at least one challenge exists (sent or received, of any status), the tab home becomes a list, newest-activity-first, of every challenge
involving this learner:
Awaiting you — a challenge someone sent that this learner hasn’t completed yet. Shows the challenger’s avatar/name and the
chosen parameters (Section 6) but never their score (Section 10.1). Tapping opens Take Challenge (receiver).
Awaiting them — a challenge this learner sent that the friend hasn’t completed. Non-interactive beyond a “Waiting on their move”
note — there is no nudge or replay affordance here (Section 8.2), since the sender’s own play-through is already recorded.
Completed — resolved challenges (win, loss, or tie), most recent first, showing final score and outcome. Tapping re-opens the
Sender/Receiver Recap for that challenge (read-only replay of the answer-by-answer breakdown, Section 8.4 / 11.2).

---

## Page 3

Figure 2 — Challenge Home once challenges exist: one of each state, plus the tab bar’s unseen-activity badge.
A persistent “New Challenge” entry point (button or FAB) is always available from this list state, routing to Choose Friend.
Tab bar badge: a small dot on the Challenge tab icon (not a numeric count) appears whenever this learner has ≥1 unseen item
requiring attention — a newly-received challenge, or a newly-completed result on a challenge they sent. It clears the moment the
corresponding item is opened, independently for each item (i.e. having both an unseen challenge and an unseen result still shows one
dot; opening one doesn’t clear the other).
5. Choose Friend
Reuses the Friends tab’s global list ( Spec_Meta_Hygiene_Systems.pdf §5.1) as its data source, re-sorted and re-filtered for this context:
Sort order: friends this learner has challenged or been challenged by most recently (by either direction’s created_at ) rank first,
most-recent first; the remainder of the global list follows in that spec’s existing progress-% sort.
Eligibility filter: a friend only appears here if their own current unit is Unit 3 or later (Section 3) — otherwise no reliable question
pool exists between the two players yet.
Row content: avatar, username, and a head-to-head balance for this specific friend pair — e.g. “3–1” (wins–losses, this learner’s
perspective; ties don’t move this number, Section 11.3) — rather than the Friends tab’s progress bar/streak. A pair with no history
yet shows “0–0”, not a blank state, so the format is consistent from the first challenge on.
Friends with an already-open challenge against this learner in either direction are still selectable here for a new challenge in the
other direction — reverse-direction challenges are explicitly allowed (Section 8.2).

---

## Page 4

Figure 3 — Choose Friend: recently-challenged friends pinned to the top, head-to-head balance chip per row.
6. Set Parameters
Three choices, all required before generation, presented as one screen:
6.1 Difficulty
Single-select: Easy / Medium / Hard. Drives distractor confusability and grid/board size within whichever formats get used (Section
7.2) — it is not itself a format or content choice.
6.2 Content Coverage
Single-select: Up to Unit N, or All content.
N is computed as min(challenger's current unit, receiver's current unit) — a learner can never be quizzed past what either player
has actually reached. Because both players have already cleared the tab’s own Unit 3 gate (Section 3), N is guaranteed to be at least
3.
The eligible card pool for “Up to Unit N” is the union of card_keys_covered across data_unit_metadata.csv rows 1..N — that column
is per-unit, not cumulative, so the union has to be computed at generation time rather than read off a single row.
“All content” pools every card either player has been taught — i.e. the same computation with N = the lower of the two current
units, but framed to the learner as “everything you both know” rather than a unit number, since by definition it’s already the largest
pool the unit-cap option could ever reach.
6.3 Content Type
Multi-select, minimum one required: Keywords · Description · Reading Notes · Shadow Meaning. Maps directly onto existing
content columns and existing lesson formats — no new authored content anywhere in this tab, consistent with the Draw tab’s own
precedent:
Content type Source column(s) Formats it can be served through

---

## Page 5

Keywords card_keywords A1 (variant A: keyword-list anchor), A2
(keyword-set candidates), C (keyword rungs of
the image↔text ladder)
Description card_descriptions.description_anonymized /
description_condensed
A1 (variant B), A2 (condensed-description
anchor rotation), C (anonymized-text rung)
Reading Notes card_talking_points A1 (variant C: collated points), A2 (talkingpoints anchor rotation), B (True/False
statement pool), C (reading-notes rung)
Shadow Meaning data_card_descriptions.reversed_reading_notes A6 only (Shadow Meaning Recognition)
Selecting Shadow Meaning is what finally gives Format A6 a home — the Curriculum spec excludes A6 from the main Path entirely
because it depends on a card’s upright meaning already being taught, “belongs to a separate future Shadow/Reversed unit.”
Challenge’s own unit-gating (6.2, Section 3) already guarantees upright meaning is known for every card in the pool, so A6 has no
unmet prerequisite here and can be used freely.
Figure 4 — Set Parameters: difficulty pills, content-coverage radios, content-type checkboxes, generate CTA.
7. Question Generation
7.1 Format selection per question
For each of the 10 questions: pick one of the selected content types (round-robin across whichever types were multi-selected,
distributing as evenly as possible — e.g. 2 types selected → 5 and 5; 3 types → 4/3/3; remainder to the earliest-selected type), then pick
at random among that content type’s eligible formats (Section 6.3’s table). Rotating formats within a content type mirrors the main
curriculum’s own variety-over-escalation approach — this is a design hypothesis, not yet validated by playtesting.
Symbol formats (A3/A4/A5/A7) are never used — none of the four content types map to them, and Challenge has no symbolidentification goal.
7.2 Difficulty mapping

---

## Page 6

Each format already exposes its own difficulty lever(s) per the Lesson Format Bible; Challenge’s three-tier Easy/Medium/Hard selection
maps onto whichever levers the chosen format has:
Format Easy Medium Hard
A1 / A2 Grid of 2, Easy-tier
card_similarity distractors
Grid of 3, Medium-tier distractors Grid of 4, Hard-tier distractors
A6 Scaffold variant A or B (upright
description / keyword anchor shown)
Scaffold variant C (single talking
point)
Scaffold variant D (no anchor at all)
B Easy-tier confusability on the donor
(False-round) card
Medium-tier Hard-tier
C 2 rows, easiest content-pairing rung
available for the question’s content
type
2 rows, hardest rung 3 rows, hardest rung
7.3 Card pool & repetition
Target cards are drawn at random, without replacement, from the pool computed in Section 6.2. The Unit 3 unlock floor (Section 3)
guarantees this pool is large enough to fill all 10 questions with distinct cards in the ordinary case; repetition is not expected to occur in
practice, and no special-case handling for an under-sized pool is needed as a result.
7.4 Persistence
The generated 10-question set (target card, format, content-type, difficulty parameters, distractor set, and the correct answer) is stored
once, at generation time, against the challenge record — not regenerated for the receiver’s play-through. Both players answer the
identical sequence; see Section 1.
8. Taking the Challenge — Sender
8.1 Hard-fail override
Every format used in Challenge is played under a single, uniform hard-fail rule that overrides each format’s own default:
A1 / A2 / A6: normally retry-until-correct (Format Bible §2.1/§4.1’s default). In Challenge, the first wrong confirm ends the question
immediately — no further attempts. Marked wrong, with the correct option revealed alongside it.
B: already hard-fails by default (a wrong TRUE/FALSE confirm ends the round). No change.
C (Tile Match): normally a wrong tile flashes and returns to selectable, scoring nothing until the board clears. In Challenge, the
first incorrect tile pairing ends the question immediately and the whole board instance is marked wrong — the learner does
not get to keep matching the remaining pairs.
This is the one interaction rule this spec adds on top of the Format Bible; every other rule (selection model, hint behavior, layout) is
inherited unchanged.
Figure 5 — Take Challenge (sender), Format A1 shown across all four states. “Wrong” reveals the correct card alongside the incorrect pick, then advances on the next tap —
there is no retry.
8.2 One open challenge per direction — reverse direction allowed
Once a challenge from A → B is pending (B hasn’t completed it), A cannot send B another challenge until B completes the pending one
— this is scoped to the challenger → receiver direction only. B is free to send A a challenge of their own in the meantime; the two
directions are tracked as independent challenge records with independent pending/complete states. There is no nudge or reminder
mechanic for a challenge sitting in “Awaiting them” — it simply waits.

---

## Page 7

8.3 Per-question feedback
After each question resolves (correct on the only attempt, or hard-failed): a brief correct/wrong reveal, then the running score so far
(e.g. “3/4”). The sender sees only their own running score — there is no comparison to show yet, since the receiver hasn’t played.
8.4 Completion & recap
After question 10, the sender’s final score is recorded. No result screen shown to the sender yet — Section 1’s asynchronous design
means there’s no opponent score to resolve an outcome against until the receiver finishes. The sender instead lands on a 10-question
recap: their answer next to the correct answer for each, matching the review pattern already used elsewhere in the app for mistake
review.
9. Receiver Experience
9.1 What’s visible before playing
The receiver sees the challenge’s parameters (difficulty, unit cap/All, content types) exactly as the sender chose them — this is
informational framing, not a spoiler, since none of it reveals specific answers. The sender’s score is never shown to the receiver
before they finish playing.
9.2 Taking the challenge
Same 10 questions, same order, same hard-fail rules as Section 8.1 — the receiver plays under identical conditions to the sender.
9.3 Live score comparison
This is the feature that makes the asynchronous, persisted-question-set design (Section 7.4) worth it: after each question resolves, the
receiver sees both running scores — their own, and the sender’s score after that same question number, read back from the stored perquestion results. E.g. if the sender got question 1 wrong but the receiver got it right, the receiver sees their own “1/1” next to the
sender’s avatar reading “0/1.” This comparison updates one question at a time, in lockstep with the receiver’s own progress — never
jumping ahead to reveal how the sender did on a question the receiver hasn’t reached yet.
Figure 6 — Take Challenge (receiver): the comparison strip sits between the hint bar and the anchor panel, updating once per resolved question.

---

## Page 8

10. Result
10.1 Win, loss, or tie
Once the receiver finishes question 10, both final scores are compared:
Different scores: the higher score wins. The result screen plays a lighthearted victory animation — the winner’s avatar bouncing on
the loser’s — before settling into the final score line for both players.
Equal scores: the result is a tie. Instead of a bounce, the two avatars embrace, and a tie notification is sent to both players rather
than a win/loss notification to just one side.
Figure 7 — Result screen in all three outcomes. The tie’s embrace animation and the win/loss bounce share the same layout, just a different illustration and banner.
10.2 Notify back
Whoever didn’t just finish (the sender, in the ordinary flow) gets a badge (Section 4’s “unseen result” case) and their Challenge Home
entry moves from “Awaiting them” to “Completed,” now showing the outcome — win, loss, or tie. Opening it shows the same result
screen the receiver saw, plus access to their own recap (Section 8.4).
10.3 Balance update
The head-to-head win/loss balance shown on the Choose Friend screen (Section 5) increments for whichever player won on a decisive
result. A tie updates neither player’s win/loss balance — the pair’s record simply doesn’t move that game, though the tie itself still
appears in each player’s challenge history (Section 4) as a completed entry.
11. Data Requirements
None of this exists yet — consistent with the Meta spec’s own note that users, progress, and social systems are being built out
incrementally, separate from the tarot content layer.
Table / field Type Notes
challenges.challenge_id PK New table.
challenges.challenger_user_id /
receiver_user_id
FK → users Direction matters (Section 8.2); reverse-direction
challenges are separate rows.
challenges.difficulty enum Easy / Medium / Hard (Section 6.1).
challenges.unit_cap integer, nullable Null = “All content” (Section 6.2). Guaranteed ≥ 3
by the tab’s own unlock gate.

---

## Page 9

challenges.content_types set/array Subset of Keywords/Description/Reading
Notes/Shadow Meaning (Section 6.3).
challenges.status enum awaiting_receiver → completed .
challenges.created_at / completed_at timestamp Drives “recently challenged” sort (Section 5) and
history ordering (Section 4). No expiry logic reads
this — abandoned pending challenges are
accepted as-is for this pass.
challenges.challenger_score /
receiver_score
integer, nullable receiver_score null until they finish.
challenges.outcome enum, nullable challenger_win / receiver_win / tie . Null
while pending. Replaces a single nullable
winner_user_id so a tie has an explicit, firstclass state rather than being inferred from a null
winner.
challenge_questions.challenge_id,
question_order
composite PK 1–10, generated once (Section 7.4), never
regenerated.
challenge_questions.card_key(s) ,
format_code , content_type ,
difficulty_params , distractor_set ,
correct_answer
— Frozen at generation time.
challenge_questions.challenger_answer /
challenger_correct
— Written as the sender plays (8.1–8.3).
challenge_questions.receiver_answer /
receiver_correct
— Written as the receiver plays; read back live for
Section 9.3’s comparison.
challenge_balances.user_id_a, user_id_b,
wins, losses
— Head-to-head aggregate for Section 5’s row
display and 10.3’s update. Ties are not counted
here (10.3) — could alternatively be derived on
read from challenges rather than stored, an
open implementation choice, not a design
decision.
users.has_unseen_challenge_activity (or
equivalent)
boolean/derived Drives the tab bar badge (Section 4).
This reuses user_progress (already assumed, not designed, per the Meta spec) for Section 6.2’s per-friend current-unit read and Section
3’s own-progress unlock check, and card_similarity / card_keywords / card_descriptions / card_talking_points unchanged from the
content layer.
12. Decisions Locked This Pass
Ties are a first-class outcome, not an edge case papered over by picking a winner. Equal final scores trigger an embrace
animation (Section 10.1) and a tie notification to both players; neither player’s head-to-head balance moves (10.3).
Reverse-direction challenges are allowed. A and B can each have an open challenge pending against the other at the same time;
only same-direction resends are blocked (Section 8.2).
No nudge feature this pass. A pending “Awaiting them” challenge has no reminder mechanic — the sender waits like everyone
else (Section 8.2).
Unit 3 is the Challenge tab’s unlock threshold, gating on the learner’s own Path progress, with explicit “Complete Unit 3 to
unlock friend challenges” messaging (Section 3). The same threshold applies to friend eligibility in Choose Friend (Section 5), since
the unit-cap computation needs both sides past Unit 3 for a reliable question pool.
Challenge completions never affect the daily streak. Only Path node completions do, unchanged from
Spec_Meta_Hygiene_Systems.pdf §7.1 — Challenge is excluded the same way the Daily Draw tab explicitly is.
Abandoned pending challenges are fine as-is. No expiry or stale-state handling is needed for this pass — a challenge can sit in
“Awaiting them” indefinitely.
