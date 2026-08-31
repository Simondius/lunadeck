# 0034 — Social is scaffolding, and says so

**Date:** 2026-08-31
**Status:** Accepted

## Context

Tia:

> *"I want to introduce profiles, since I do want friend functionalities in the
> future too. Can you build another tab called social, on this page carve out
> space for a round profile picture, the users name and their card unlock stats
> at the top. Under that, leave space for updates on my friends activity, there
> should be a button to take the player to another page to manage friends, that
> other page should list friends and have a search bar to find friends."*

There is no account system and no server. Progress is per-browser
`localStorage`. So most of what this screen shows cannot be real yet, and the
question is what to put in the space instead.

## The spec says something different, deliberately departed from

`Spec_Meta_Hygiene_Systems` §5.1 designs the Friends surface as **one flat list
of a closed group**, sorted by path progress, with the learner's own row tagged
"(you)" — and explicitly:

> *"there is no search, no request/accept step, and no way to remove someone
> from view. Real friending (a smaller, opt-in circle) is a future pass once
> the group stops being closed."*

It goes further: *"no profile screen anywhere in the app for this pass — not
for the learner's own account, and not for viewing a friend's."*

So this ask departs from the spec in three ways: a profile block, a search, and
a separate manage-friends surface. **All three are the "future pass" §5.1
names**, which makes this an intended progression rather than a contradiction —
but it is a departure and `CLAUDE.md` says to flag rather than silently follow.
Flagged. The spec's own model is still the better one for a closed group; it is
the closed group that Tia is moving away from.

## Decision

**The profile block is real.** Its two numbers are the learner's own and are
computed the same way the deck and path compute theirs.

`knownCardKeys` moved out of `deck-screen.jsx` into `lib/progress.js` for this.
`0007` keeps one definition of "known" so the path, unit screens and deck can
never disagree; a second caller was the moment that stopped being enforced by
having only one. It is shared now, so the next screen cannot quietly write its
own — which is exactly the mistake nearly shipped on the Reading tab the day
before, where a second `n of 78` with different semantics was one commit from
landing.

**The name is editable and local.** `displayName` in the progress store, 24
characters, no account attached. It identifies nobody and is sent nowhere. This
goes slightly beyond "carve out space", and it earns that by making two of the
three profile elements real instead of one.

**The avatar is a card, not a photograph.** The `avatar` crops already exist, it
suits the app, and it makes no promise of an upload with nowhere to upload to.

**Everything else is an empty state that says what it is waiting for.** The
activity feed and the friends list are both empty and both explain why. No
invented friends, no plausible feed of people who do not exist.

This is the same judgement `0025` made about the disabled "Ask a question"
button it inherited, and `0032` made about the Mentor tab. A surface that
appears to work and does not is worse than one that admits it — and at the
scale of a social feed, fake content would also be the hardest thing to notice
was fake.

**The search is wired, not faked.** It filters an array that happens to be
empty, rather than pretending to reach a server. When accounts arrive the only
change is where the array comes from.

## Amendment, next morning: the feed gets sample data after all

Tia, having read the argument above: *"can you populate the friends activity
feed with some fake activity for now? It should tell me the cards that my
friends pulled today and ideally the takeaway."*

Her call, and a reasonable one: a feed cannot be judged empty, and this is the
surface where the layout question — how much room three cards and a takeaway
need next to somebody's name — only answers itself when something is in it.

**The feed carries daily draws and nothing else**, and that is a rule rather
than a gap in the fixture. Tia: *"the friend activity should only be the daily
draw, not any of the further questions."*

The reason is worth stating so it survives: a question is something a person
typed about their own life — the job, the relationship, the thing they have not
told anyone — and it has no business on someone else's screen. The daily draw
is the only part of the Reading tab that is not private, because nobody chose
its cards and nobody said why they wanted them. If the feed ever grows a second
event type, it is not that one.

It follows that no event needs a label saying which kind it is. *"drew three"*
was describing the three cards directly beneath it, so the line is now just the
timestamp.

**Three more rules kept while writing it**, and worth keeping if it is edited:

**Real card keys only.** Names and art resolve from the deck at render, so the
fixture holds keys and nothing else. A made-up key drops out rather than
rendering a broken image.

**The takeaways do not contradict the cards.** Each was written against that
card's actual keywords and reversed notes: The Hermit reversed as solitude
tipping into isolation, Eight of Cups as leaving certainty behind, Knight of
Cups reversed as charm without follow-through. A feed that says something about
a card the curriculum disagrees with is the same fault as a reader that does,
just somewhere nobody would think to check. `0025`'s "generated prose, sourced
substance" applies to hand-written placeholder prose too.

**It says it is not real.** One mono line under the feed: *"Sample activity.
There are no accounts yet, so these people are not real."* Small enough not to
spoil the look of the thing, plain enough that a teammate opening the app is
not misled. It goes when the data does.

**Isolated to one file.** `lib/demo-friends.js`, which nothing but the Social
page imports, exporting one function. Replacing it with a real fetch is a
one-line change at the call site, and the file's own header says to delete it.

The usernames are the ones `Spec_Meta_Hygiene_Systems` Figure 3 uses in its
worked example, so the placeholder at least matches the documented design.

**Managing friends is reached from the section heading, not from under the
feed.** Tia: *"if a player has a lot of friends, the manage friends button
would eventually be quite hard to find."*

Right, and it is the kind of fault that gets worse exactly as the feature
succeeds: the more friends someone has, the further they scroll past all of
them to reach the control that manages them. On the heading it stays put
however long the feed grows, and it sits where the thing it acts on begins.

Its tap target is padded to 39px tall with the height given back by a negative
margin, so the heading row stays 21px. The unpadded link was 21px, which is a
thumb-sized miss.

**The same people appear in the friends list**, asked for after the feed. Its
rows follow `Spec_Meta_Hygiene_Systems` §5.1 as written — avatar, username, a
thin progress bar with the percentage, a flame and a streak, sorted by progress
descending with the learner's own row in its natural position tagged "(you)"
rather than pinned to the top. The departures this decision records are about
search and profile screens; how a row looks was already designed and there was
no reason to redesign it.

Two small departures inside that:

**A learner at 0% still sees themselves.** §5.1 hides 0% accounts from the list
entirely, which on day one would hide someone from their own list. The rule
reads as being about other people cluttering a global list, so it is applied to
friends and not to you.

**The search is real, over placeholder data.** Case-insensitive substring over
every row including your own. Verified: "moon" finds moonchild22, "HOLLOW"
finds hermit_hollow, "tia" finds your own row, "zzz" gives the empty state.
When accounts arrive the only change is where the array comes from.

**`Flame` moved to its own component.** It was defined inside
`path-screen.jsx` and the friends rows need it; shared rather than copied so
the two cannot drift, with the comment explaining the two-path SVG moved along
with it.

**Friends can be removed, behind a confirmation screen.** A quiet × on the row
opens a dialog naming the person: *"Remove moonchild22?"*, what it means, and
Remove / Cancel.

The first cut put those two buttons inline in the row. Tia: *"make sure there
is a confirmed screen before successfully removing a friend, in case a player
taps it accidentally."* She is right, and the reason is worth keeping: two
touches only guard against a mis-tap if the second one is somewhere else. Both
inline buttons landed within a few pixels of the ×, which is the shape of a
double-tap rather than a defence against one.

Everything accidental about the dialog resolves the safe way. **Cancel takes
focus on open, not Remove**, so a stray Enter or Space closes it rather than
completing the thing it exists to guard. Escape cancels. A tap on the backdrop
cancels. A tap on the panel does not, which needs `stopPropagation` since the
panel sits inside the scrim that closes it. Remove is styled as destructive
rather than as the app's primary, so it does not read as the obvious next tap.

You cannot remove yourself; your row has no ×.

The scrim covers the frame rather than the window, and its opacity is set
outright rather than animated in — both lessons from the card reveal in `0030`,
where `100dvh` was the wrong height and an animation that never ran left an
overlay invisible.

**Removals are component state, not storage.** There is no friend graph to
remove anyone from, so persisting the deletion of somebody who does not exist
would be inventing a second kind of fiction on top of the first. They return on
reload, and the note at the foot of the screen says so.

This is a third departure from §5.1, which says there is *"no way to remove
someone from view"* — for the same reason as the other two: that model is a
closed group nobody opted into, and this one is not.

## Consequences

**Five tabs now.** Path, Deck, Reading, Mentor, Social. The bar was already
`grid-auto-flow: column` with `1fr` columns; measured at 375px each tab is 62px
and no label clips. It will not take a sixth without shortening labels.

**Nothing here is tested.** No pure logic was added worth a unit test — the
screens are presentation over a store that already has tests. The name round
trip and the empty states were checked in a browser.

**The activity feed has no data model.** Deliberately: what an activity event
*is* depends on decisions not yet made — whether a draw is visible to friends,
whether streaks are shared, what `Spec_Challenge_Tab` needs from the same
graph. Designing that now would be guessing at three specs at once.

**`Spec_Challenge_Tab` is downstream of this.** It says outright that it
"assumes that friend graph exists". Whatever shape the graph takes here, that
tab inherits it, so the account model is worth settling before either is built
for real.
