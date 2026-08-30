# 0025 — The reader answers; the path teaches

**Date:** 2026-08-30
**Status:** Accepted

## Context

The Reader tab was two half-things stacked: a one-card nightly draw, and below
it a disabled "Ask a question" button with *"Not built yet — the reader can't
answer"* underneath. A dead control on a shipped screen.

Tia's ask was to make it one feature — a person you pull cards from daily, who
will then take an open question and read three cards against it.

The first objection raised against this was wrong, and it is worth recording
why, because the same mistake is easy to repeat. `CLAUDE.md` says *don't invent
card content*, and `Spec_Daily_Draw_Tab` §10 says *no new authored content
anywhere in this tab*. Both were read as forbidding a generated interpretation.

Tia:

> *"the purpose of the reader tab is not education though. the player is not
> pulling cards in the tab to learn, like they are in the path... they are just
> taking away the interpreted answer to their question - this is not an
> educational feature."*

That is right, and it is right on the letter as well as the spirit. The
no-invention rule enumerates keywords, talking points, descriptions and symbol
meanings — the canonical per-card facts the curriculum teaches and *tests*. An
interpretation of three cards against one person's question is none of those.
It is a synthesis at read time, retained by nobody, graded by nothing. And §10
governs the collection mechanic, which `0007` already declined to build.

## Decision

**Two beats, one feature.** The nightly three is the ritual; asking is what
buys an interpretation. The draw is the habit, the question is the reading.

**The nightly three shows cards, not lessons.** Name, orientation, and two of
the deck's own keywords per card. No meaning panel, no prompt, no exercise. The
tab is not a second curriculum, and `0024` already made every card in the Deck
tab open in full for anyone who wants one.

**A question pulls three fresh cards and calls Claude.** `app/api/reading/`
takes the question, pulls a spread, and sends the model the guidebook rows for
those three cards — keywords, condensed meaning, reversed note, talking points
— as the only permitted source for what a card means.

**Generated prose, sourced substance.** This is the line the feature rests on.
The reader may write freely; it may not decide what The Tower means. The path
teaches these same cards, and a reader that contradicts the lesson is worse
than no reader. `lib/reading.js` builds the grounding and holds the system
prompt; both are unit-tested without spending a token.

**The reader's three positions are voice, not canon.** *Where you are*,
*What's moving*, *Where it leads* are the reader's framing of what it is doing.
They are not taught, not tested, and make no claim to be tarot orthodoxy —
which is what keeps them clear of the no-invention rule.

**Reader pulls are not collection.** `recordReading` does not touch
`drawnCardKeys`. Asking a question is not drawing a card, and if it were,
anyone could drain the nightly pool by asking enough questions.

**No date seeding on a question's spread.** The seed in `lib/draw.js` exists to
stop a learner rerolling the nightly card until they like it. For a question
someone chose to ask, a fresh pull is the point. The nightly three keeps its
seed, via a new `pickDailyDraw` that reuses the tuned pool weights per slot.

**The reader is bounded in its prompt.** A question about health, money, legal
trouble or someone's safety gets the reading *and* a plain line that this is a
question for a professional. Cheap to set up front, awkward to retrofit.

## Consequences

**The Reader tab can no longer ship as a static export.** `app/api/reading/` is
a Node route. `next.config.mjs` sets no `output: "export"` today, so nothing
breaks now, and state-of-play records that nothing is hosted yet — but the
static-export path noted there no longer covers the whole app.

**It needs `ANTHROPIC_API_KEY` in `.env.local`.** Everything else in the app
runs without it. With no key the route returns 503 and the screen says so in
plain words rather than failing silently. `.env.local.example` is committed.

**The nightly draw's streak question is still open, and deliberately.**
`recordDailyDraw` does not touch `streakDays`. `Spec_Daily_Draw_Tab` §10 puts
"should a draw credit the app's streak" outside this feature as a cross-tab
gamification call, so it was left alone rather than quietly decided here. The
old screen displayed the *lesson* streak under the label "Night streak", which
was misleading; that row is gone.

**The reading is not streamed.** A reading is ~200 words but adaptive thinking
makes the wait real. The button says "The reader is considering…" and the
request is a single non-streaming call. Streaming is the obvious next
improvement and would suit the fiction — the reader speaking rather than
appearing — but it complicates the client, and this PR is already wide.

**`recordDraw` is gone, replaced by `recordDailyDraw`.** Stored state from
before this change holds a single `draw`; `readDailyDraw` migrates it to a
one-card daily draw on read, so nobody loses today's card or gets dealt twice.

**The live call is verified.** Amended the same day, once a key and credit were
in place. First real question — *"I keep starting new projects and abandoning
them"* — returned 210 words in 8.8s on Queen of Wands / Page of Swords / Three
of Swords, and every substantive claim traced back to a sourced row: *arriving
message*, *watch for mental overload*, *a wound that has to open before it can
close*. The one step beyond the rows was reading Wands as fire, which is the
suit's own element and sits in the card's symbol field. Nothing invented.

**That first call also found a bug.** It failed on an empty credit balance and
the handler flattened the API's own message — *"Your credit balance is too
low"* — into *"couldn't answer (400)"*, which sent us inspecting the request
rather than the account. The route now logs the API message whole and passes
setup-shaped failures (credit, billing, quota) through to the screen, because
they name something the person running the app can go and fix. Worth noting
that this class of bug is invisible until a real call is made.
