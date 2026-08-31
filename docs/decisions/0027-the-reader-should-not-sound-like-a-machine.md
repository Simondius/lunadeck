# 0027 — The reader should not sound like a machine

**Date:** 2026-08-30
**Status:** Accepted

## Context

The readings were fluent, correctly grounded, and obviously machine-written.

Tia, reading one: *"work on the copy, it reads as obviously AI right now."*

The first instinct — ask for "more natural" prose — would not have worked,
because the problem is not that the model writes badly. It writes with every
rhetorical device deployed at once, all the time. So the tells were measured
rather than guessed at, on two real readings.

**Antithesis, once every 50 words.** "or it can be", "and also", "rather than"
twice. Balanced opposites are a special effect; three per paragraph is a tic.

**Every paragraph closing on an epigram.** This was the loudest one. *"Focus is
the gift and also the risk."* *"…it's the temperature you want: sustaining
rather than flashing."* Each is a decent line. A reading where every paragraph
ends on one has no good lines, because nothing stands out from anything else.

**Em dashes at two or three per reading**, always in the same appositive shape.

Sentence length was fine — 3 to 28 words, genuinely varied — which is worth
recording because it is the tell everyone reaches for first and it was not the
problem here.

The outside reading agrees on the diagnosis and, usefully, on the cause. The
[Wikipedia signs-of-AI-writing catalogue][wp] lists negative parallelisms
("not X, but Y") as a top-level tell. Colin Gorrie's [rhetorical analysis][cg]
names the same three devices — parallelism, antithesis, tricolon — and puts the
cause precisely: the models do not lack technique, they lack *taste*, applying
devices uniformly where a writer would reserve them. [Daniel Miessler][dm] adds
the consequence: "if everything is an unveiling, then none are."

[wp]: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
[cg]: https://www.deadlanguagesociety.com/p/rhetorical-analysis-ai
[dm]: https://danielmiessler.com/drafts/ai-cliches-old-rhetoric-on-autoplay

## Decision

The system prompt's VOICE section now gives budgets rather than adjectives.
Asking for "natural" prose gets you prose that performs naturalness; asking for
*at most one em dash* is checkable.

- **At most one line in a reading built to land.** Named as the loudest tell,
  with both real examples quoted so the model can recognise the shape. Other
  paragraphs end plain, concrete, or unresolved.
- **Contrast rationed.** One balanced opposite per reading; three is a machine.
- **One em dash maximum.**
- **Concrete before abstract.** The reader can see these cards — a rearing
  horse, a hand holding a cup — and should say what is there before reaching
  for what it represents. Abstraction doing all the work is what hollow sounds
  like.
- **No explaining a comparison after making it**, and no restating a point in a
  tidier second version.
- **Permission to be uncertain.** *"I'd want to know more about…"* is a real
  thing a reader says and nothing a machine writes unprompted.
- **130–190 words**, down from 150–220. Less room rewards restraint.

## Consequences of the first pass

**It worked, measurably.** Same two prompts, same measurements:

| | before | after |
| --- | --- | --- |
| antithesis markers | 3 — one per 50 words | 1 — one per 172 words |
| em dashes | 2 | 0 |
| sentences (daily) | 9 | 15 |
| paragraph closers | epigram, epigram | *"It's worth being open to that."* / *"That first-week feeling."* |

It also took the uncertainty invitation unprompted: *"I'd want to know what
happens at the point you usually quit."* And it got more concrete — *"the
actual half-built thing on your desk"*, *"a king holding a sword upright,
seeing the whole board."*

## Amendment, same day: budgets were not enough

Tia, on the next reading: *"still reads like AI. get rid of the em dashes all
together."*

She was right, and the measurements showed why. The budgets had not removed the
tics, they had **relocated** them. The budget of one em dash produced two,
twice. What filled the space the banned moves left:

- fragment as a rhetorical beat: *"Not away from ordinary things. Into them."*
- correcting negation: *"not by being fastest"*
- tricolon: *"a teacher, a structure, a habit"*
- anaphora: *"That might be a person… It might be the version…"*
- narrating its own interest: *"this is the part I find most interesting"*
- the falsely homely closer: *"inside a normal Tuesday"*

That last one is worth naming properly. Reaching for warmth through a small
domestic noun is a machine's idea of intimacy, and it reads as fake precisely
because it is doing the job a real specific detail would do, without having one.

**So the em dash stopped being a request.** `stripEmDashes` in
`lib/reading.js` removes them from every reading before it leaves the route,
substituting a comma, which is correct for the appositive shape the model
actually reaches for. The route logs when it fires, so a prompt that keeps
slipping stays visible rather than being silently patched over. This is the one
voice rule that can be enforced instead of asked for, so it is the one with
tests — which partly answers the "undefended" consequence below.

**The rest were named individually, with the model's own output quoted back**,
and the frame changed from "write prose" to "write like someone talking across
a table". Length cut again, 130–190 to 110–170.

Measured on fresh readings: em dashes 2 → 0, correcting negation 2 → 0,
fragments-as-beats 1 → 0. Closing lines went from *"…something that holds the
flame steady inside a normal Tuesday"* to *"Speed on its own won't get you
there."* and *"I'd ask which project you abandoned most recently, and what was
happening in it the week you stopped."*

A tricolon survived that pass in both readings, in the same place: giving
examples. Sharpening the rule to name that case, with both instances quoted,
cleared it. One fragment-as-beat still slipped through (*"Not laziness."*).

**The pattern worth remembering: naming a tic removes it, and the next one
appears.** Three rounds in, the readings are visibly better and the method is
whack-a-mole. It works because each round quotes the model's actual output back
at it, which is cheap and repeatable. It is not convergence, and there is no
reason to think a fourth round would find nothing.

## Amendment: the invitation is not the reading

Tia, on the greeting screen: *"the description is a little dry and not
mystical."*

Worth being precise about the apparent contradiction, because the next person
to touch `SYSTEM_PROMPT` will hit it. The rules above ban the mystical
register: no "the universe", no forecasting dressed as certainty, plain words.
Those rules govern the reader **while it is reading**, where mysticism is how
a machine sounds when it has nothing specific to say and is reaching for
atmosphere to cover it.

The greeting is a different job. It is not answering anything; it is the
candlelit room in the portrait, and it should say so. *"Sit. The deck is cut
and the candles are low."* is static copy in a component, not something the
model generates, so it costs the readings nothing.

**The split to keep: atmosphere in the furniture, plainness in the answers.**
If the readings ever start sounding like the greeting, that is the tell that
something has leaked.

## Consequences

**This is style, and style is not a passing test.** A handful of readings is a
small sample. The measurements say the tics went down; whether the voice holds
across a hundred readings, or drifts into a *different* recognisable tic, is
unknown and would need someone reading a month of them.

**One voice rule is defended; the rest are not.** The em dash is enforced in
code and covered by four tests, because it is a property of the output string
rather than a judgement about it. Everything else in VOICE — the tricolon, the
fragment, the epigram budget — lives only in `SYSTEM_PROMPT`, and a future edit
could quietly undo any of it with nothing failing.

That gap is deliberate. Asserting on generated prose in a unit test means
either spending a token per run, or asserting against a fixture that stops
being the live output the moment the prompt changes. The honest alternative is
what was done here by hand: generate a few readings, count the tics, compare.
Worth turning into a script if the voice regresses more than once.

**A related change lands with this one.** The reader's portrait is no longer
shown once the cards are down. Tia: *"once the cards are pulled, hide the
reader image at the top."* It was competing with the thing the person actually
drew to look at. You meet the reader on the way in; after that the cards are
the subject.
