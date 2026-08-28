# Spec_Meta_Hygiene_Systems
*Converted from `Spec_Meta_Hygiene_Systems.pdf`.*

---

## Page 1

ZODIAC TAROT
Meta & Hygiene Systems Specification — Account, Navigation, Friends, Streak
Status Final for this design pass — decisions closed out, ready to hand off.
Scope Account creation, avatar selection, the bottom tab bar container, the Friends tab
(global user list), friend progress markers on the Path, and the daily streak
counter. The Challenge tab is designed separately. Path and Draw tab internals
are already specified — see Companion files.
Companion files Spec_MainPath.pdf · Spec_Daily_Draw_Tab.pdf · UX_Style_Guide.md ·
Spec_Data_Model_Backend.pdf
Explicitly deferred Real friend-request/accept flow (this pass is a closed group where every account
automatically appears to every other account). Streak freeze/repair.
Password-based auth or account recovery. Any settings/edit screen — username
and avatar are both permanent once confirmed at account creation.
1. Purpose & Scope
The Main Path spec intentionally left XP and streak out of its status bar, and the Data Model Backend reference is
explicit that users, progress, and social systems are a separate effort. This document is that effort's first pass: the
account a learner creates before they ever see the Path, the bottom tab bar that gets them between Path / Draw /
Challenge / Friends, the global Friends list, friends' progress shown on the learner's own Path, and the daily streak.
This is a closed-group prototype: every account that exists is visible to every other account on the Friends tab. There
is no invite, request, or block flow — that's real "friending" and is out of scope for this pass, noted for a future thread.
2. Screen & Flow Inventory
Screen Purpose Entry point(s)
Username Entry First screen a new install shows. Single username field,
checked live for duplicates.
App launch, no existing
local account
Avatar Picker Grid of 9 avatars drawn at random from the avatar_XXX
collection, with a refresh option.
Continue from Username
Entry
Path / Draw / Challenge /
Friends (tab bar)
Persistent bottom navigation across the app's four top-level
surfaces.
Always visible once an
account exists
Friends Flat, global list of accounts with at least one node complete,
sorted by path progress %.
Friends tab
Path (friend markers) The existing Path screen, extended with friend avatar markers
at their current node.
Path tab
3. Account Creation
Deliberately minimal for this prototype: a username and an avatar, nothing else. No password, no email, no recovery
flow — those are real-auth concerns for a later pass once the app moves past a closed-group prototype.

---

## Page 2

3.1 Username
• One text field. Checked against the users table as the learner types (debounced), not only on submit — the Continue
button stays disabled until the current value is both non-empty and confirmed unique.
• On collision: the field outlines in red and shows an inline “Username already taken” message immediately below it
(Figure 1, state 2). The learner edits the same field and rechecks; there is no separate retry screen.
• Because there is no password, the username is also the entire identity of the account — there is no login screen
after creation. Returning to the app with the same local install goes straight to the Path; there is no cross-device
sign-in in this pass.
• The username is permanent once Continue succeeds. There is no rename flow anywhere in the app — consistent
with there being no account settings/profile screen at all (Section 5).
3.2 Avatar Selection
Assumes a flat collection of pre-made, already-cropped avatar image files (avatar_001.png, avatar_002.png, …
naming pattern — exact contents are a content/asset task, not a design decision left open here). The picker draws 9
of them at random into the grid (Figure 1, state 3):
• A REFRESH control sits between the title and the grid. Tapping it swaps all 9 tiles for a new random draw of 9 from
the full collection — it replaces the whole grid, not just the unselected tiles, and can be tapped any number of times
before confirming.
• Selection follows the Global Style Guide's existing image-option rule: tap to select (gold ring, Figure 1), long-press to
inspect full-screen. Only one avatar may be selected at a time. Since REFRESH replaces the whole grid, it also clears
any current selection — the learner selects again from the new 9.
• Confirm writes the chosen avatar's file reference to the new user record and proceeds straight into the app at the
Path.
• The avatar is permanent once Confirm succeeds — the same rule as the username (Section 3.1). There is no
avatar-change flow anywhere in the app.

---

## Page 3

1 · Enter username
Choose a username
This is what friends will see on the
Friends list.
e.g. hermit_hollow
Button is disabled until the field
has a valid, unchecked username.
CONTINUE
2 · Duplicate check
Choose a username
hermit_hollow
Username already taken
Checked live against the users table;
field stays red until it resolves.
CONTINUE
3 · Pick your avatar
Pick your avatar
SHOW 9 MORE
01 02 03
04 05 06
07 08 09
9 of the avatar_XXX collection,
shown at random. Permanent once
confirmed — cannot be changed later.
CONFIRM
Figure 1 — Account creation: username entry, duplicate-username error, avatar picker.
4. Bottom Tab Bar
A persistent four-item bar — Path, Draw, Challenge, Friends — docked to the bottom of every top-level screen once
an account exists. It is a fixed-height container that every screen's own content treats as already-claimed space, the
same way the Main Path spec treats the top status bar: nothing else is drawn into or scrolls under this strip.
• Exactly one tab is active at a time; the active tab gets the filled gold icon, gold label color, and a short gold underline
tick (Figure 2).
• Switching tabs preserves each tab's own scroll position and in-progress state (e.g. leaving mid-Path and returning to
Friends and back does not reset the Path scroll) — consistent with how the Main Path spec already treats the Unit
Menu as a non-destructive detour.
• Path and Draw are fully specified elsewhere (Spec_MainPath.pdf, Spec_Daily_Draw_Tab.pdf). Challenge is being
designed in a separate thread. This document only owns the bar itself and the Friends tab behind the fourth icon.

---

## Page 4

Path tab active
PATH DRAW CHALLENGE FRIENDS
Friends tab active
PATH DRAW CHALLENGE FRIENDS
Persistent across Path / Draw / Challenge / Friends. Fixed height; screen content
reserves this strip the same way it reserves the top status bar.
Figure 2 — Bottom tab bar, shown with Path active and with Friends active.
5. Friends Tab
5.1 Global List
Every account in the closed group appears in one flat, non-paginated list — there is no search, no request/accept
step, and no way to remove someone from view. Real friending (a smaller, opt-in circle) is a future pass once the
group stops being closed.
• Sort order: descending by path progress % (nodes completed ÷ total nodes across all ten units), tie-broken by
created_at (earlier account ranks higher). The learner's own row appears in its natural sorted position, tagged “(you)”
rather than pinned to the top — Figure 3 shows this at 82%, in first place only because that happens to be the highest
progress in the example data.
• Each row: avatar, username, a thin progress bar with the percentage, and the learner's current streak as a small
flame + number (Figure 3).
• Accounts with 0% progress — no node completed yet — are hidden from the list entirely. An account appears the
moment its first node completes, not at the moment its username is confirmed.

---

## Page 5

Friends — global list
Friends
5 learners · sorted by path progress
H
hermit_hollow (you) 82%
14
M
moonchild22 61%
9
C
cups_and_stars 47%
5
A
aria_the_fool 33%
2
T
thegoldenwheel 12%
1
Figure 3 — Friends tab: global list sorted by path progress, with each learner's streak.
6. Friends' Progress on the Path
The Path screen (Spec_MainPath.pdf) gains one addition: a small avatar marker at whichever node each friend
currently sits on, so progress feels visible and social without leaving the main screen.
• A node with exactly one friend at it shows a single small avatar offset above the node (Figure 4, lower marker).
• A node with two or more friends clusters their avatars in a tight, slightly overlapping stack — the same visual idiom
Duolingo uses for its own path. The stack shows at most 3 avatars; beyond that, a trailing circular badge reads “+N”
for the remainder (Figure 4, upper marker: 3 shown, +2 overflow).
• Tapping a single marker or a cluster opens a small popover listing the friend(s) at that node by username and streak
— informational only, since there is no Friend Profile screen to open into (Section 5 has none in this pass).
• A friend's marker moves to their new node the moment they complete one; it does not animate the transition in this
pass (the completing learner's own device is what plays the streak/completion animation — see Section 7 — a friend's
marker on someone else's Path just updates silently).
• The learner's own progress is not marker'd on their own Path — the current-node glow already defined in

---

## Page 6

Spec_MainPath.pdf continues to serve that purpose.
Path — friend markers
+2
3 shown, capped; extra
friends collapse to +N
Single friend: no
cluster needed
Figure 4 — Friend avatar clustering on the Path: capped stack with overflow badge, and a single-friend marker.
7. Daily Streak
A basic Duolingo-style streak: no freeze, no repair, no monetization hook in this pass — just the counter and its
completion animation.
7.1 What counts
• Completing at least one Path node — a lesson node or a unit recap — on a given calendar day (device-local
timezone) increments the streak by exactly one, the first time that happens that day. A second, third, or further node
completed the same day makes no further change to the number.
• Per the Daily Draw Tab spec (explicitly out of scope there): drawing or replaying a card on the Draw tab does not
count toward the streak. Only Path completion does.
• Missing a full calendar day resets the streak to zero on the next node completion — there is no freeze item or grace
mechanic to prevent this in this pass.

---

## Page 7

7.2 Where it's shown
• A small flame-and-count chip sits in the Path's top status bar, opposite the existing menu button, with the hearts
indicator remaining centered between them (Figure 5, left). This is the status-bar real estate the Main Path spec
deliberately left for this spec to fill.
• The Lesson Complete / Recap Complete exit screens (Spec_MainPath.pdf Section 9) gain a streak strip between
the accuracy summary and the Continue button — also deliberately left blank (“no XP/streak shown”) in that spec for
this one to define.
• Each row on the Friends list (Section 5.1) shows that learner's streak as a static flame + number — that is the only
place a learner sees anyone else's streak, since there is no profile screen to show it on.
7.3 The increment animation
Plays exactly once: on the exit screen that follows the first node completed on a new calendar day. The flame
brightens and the number counts up by one on tap of Continue (Figure 5, right pair) — every other exit screen that day
shows the same number, static, with no animation. This mirrors the Main Path spec's own "exit variants differ only in
review-vs-clean, not in reward" pattern: the streak strip is the one exception the Main Path spec left open for this
thread to fill in.
Path — status bar detail
12
Streak chip sits in the existing
top status bar, opposite the menu
button; hearts remain center.
Exit — before
Lesson Complete
7 / 7 first-try accuracy
6 day streak
CONTINUE
Exit — after tap
Lesson Complete
7 / 7 first-try accuracy
7 day streak
CONTINUE
Count-up animation plays once, only on the first lesson completed that calendar day.
Figure 5 — Streak chip in the Path status bar, and the exit-screen count-up (before / after the increment).

---

## Page 8

8. Data Requirements
None of this exists yet — Spec_Data_Model_Backend.pdf is explicit that users, progress, and social systems are a
separate effort from the tarot content layer it covers. This section is that separate effort's first data ask.
Table / field Type Notes
users.user_id PK New table.
users.username string, unique Checked live at creation (Section 3.1). Permanent — no rename
flow exists.
users.avatar_file FK → avatar_sources Set once at creation (Section 3.2). Permanent — no
avatar-change flow exists.
users.created_at timestamp Tie-breaker for Friends-list sort order (Section 5.1).
users.current_streak integer Section 7.1 increment/reset logic.
users.last_completed_date date, device-local Drives the once-per-day increment and the missed-day reset, in
the device's own local timezone.
avatar_sources.avatar_id PK New table. One row per file in the avatar_XXX collection.
avatar_sources.image_file string The pre-cropped image filename, e.g. avatar_014.png. No
crop-rectangle data needed — these are already-cropped,
standalone assets, not derived from card MASTER art.
user_progress.user_id, node_id composite Needed to compute path progress % and each friend's
current-node marker (Sections 5.1, 6). Not defined anywhere yet
— this spec assumes it exists but does not design it.
user_progress is referenced here but intentionally not designed in this document — it's the
learner-progress/curriculum-layer table that Spec_MainPath.pdf's node-state system and the Global Style Guide's
curriculum progress bar both already assume exists. Whoever specs that layer should treat "friend's current node"
and "progress %" (Sections 5.1, 6) as two more reads against it, not a reason to duplicate it here.
9. Decisions Locked This Pass
Everything below was an open question during drafting and has been decided; nothing in this document is left
pending.
• Username and avatar are both permanent from the moment of account creation. There is no settings, edit, or
profile screen anywhere in the app for this pass — not for the learner's own account, and not for viewing a friend's.
• The streak's “calendar day” boundary uses device-local time, with no special handling for travel across timezones
or DST changes.
• Accounts with 0% path progress are hidden from the Friends list until their first node completes.
• Friends-list ties in path progress % are broken by created_at, earlier account first.
• A friend's Path marker (Section 6) shows their current node exactly as computed, with no separate stale/inactive
treatment — an account that stops progressing simply stays visible at its last-completed node indefinitely.
