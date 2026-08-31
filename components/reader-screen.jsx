"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProgress } from "@/components/use-progress";
import {
  isSectionComplete,
  today,
  recordDailyDraw,
  recordDailyReading,
  recordRevealSeen,
  drawnToday,
  recordReading,
  clearReading,
} from "@/lib/progress";
import { pickDailyDraw } from "@/lib/draw";
import CardReveal from "@/components/card-reveal";
import { MAX_QUESTION, SPREAD } from "@/lib/reading";

// The Reader tab.
//
// One screen, arriving in order. You meet the reader; you press the one
// button; they deal three and say what today looks like; and only then does
// asking your own question appear underneath. Nothing about the second half is
// visible before the first is done — the tab is a sitting-down, not a control
// panel. See docs/decisions/0026.
export default function ReaderScreen({ deck }) {
  const progress = useProgress();
  const day = today();
  const dealt = drawnToday(progress, day);
  // Nothing scrolls under the tab bar while the reader is still thinking, so
  // the shell's clearance padding would only add height to scroll off.
  const awaiting = Boolean(dealt) && !dealt.takeaway && !dealt.reading;

  return (
    <main
      className={`shell starfield${dealt ? " is-seated" : " is-greeting"}${
        awaiting ? " is-waiting" : ""
      }`}
    >
      {dealt ? (
        <Seated deck={deck} dealt={dealt} progress={progress} day={day} />
      ) : (
        <Greeting deck={deck} progress={progress} day={day} />
      )}
    </main>
  );
}

// --- before the draw ----------------------------------------------------

// Deliberately one thing: the reader, a line, a button. No deck box, no second
// heading, nothing about questions yet.
function Greeting({ deck, progress, day }) {
  // Rendered after mount only: toLocaleDateString runs in the server's
  // timezone during SSR and the browser's on hydration, and those differ
  // either side of midnight.
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
  }, []);

  const met = progress.drawnCardKeys.length;

  const deal = () => {
    // The unit the learner is actually in — the first section they haven't
    // finished. Reading it off the first unknown card in deck order would jump
    // around, since deck order is the printed deck, not the teaching order.
    const pending = (deck.sections ?? []).find(
      (section) => !isSectionComplete(progress, section.nodeIds)
    );

    const known = [];
    for (const section of deck.sections ?? []) {
      if (section.cardKey && isSectionComplete(progress, section.nodeIds)) {
        known.push(section.cardKey);
      }
    }

    const spread = pickDailyDraw({
      cards: deck.cards,
      knownKeys: known,
      drawnKeys: progress.drawnCardKeys,
      reversedKeys: progress.reversedCardKeys,
      currentUnit: pending?.unit ?? 1,
      seed: day,
    });

    recordDailyDraw({
      cards: spread.map(({ card, reversed }) => ({ cardKey: card.key, reversed })),
      day,
    });
  };

  return (
    <>
      {/* The path anchors itself with a status bar and a rule, and this screen
          had neither: it opened cold on a picture floating in the middle of
          nothing, which is why it read as thin beside the path rather than as
          focused. Same classes, so the two screens are recognisably the same
          app.

          Deliberately NOT "n of 78". The Deck tab already shows a /78, and it
          counts cards the curriculum has taught. This would have counted cards
          the draw has turned up, a different number with the same denominator
          on the neighbouring tab. 0007 keeps one definition of "known" so the
          path, the unit pages and the deck can never disagree; a second /78
          would have broken exactly that. A bare count claims nothing and
          rivals nothing. */}
      <header className="statusbar">
        <div>
          <span className="statusbar-where">Today&rsquo;s reading</span>
          <span className="statusbar-count">{date}</span>
        </div>
        {met > 0 ? (
          <span className="statusbar-count">
            {met} {met === 1 ? "card" : "cards"} drawn so far
          </span>
        ) : null}
      </header>

      {/* A rule, not a progress bar: the same 2px the path uses, with none of
          the meaning. This tab has no completion to report. */}
      <div className="statusrule" />

    <div className="reader-greeting">
      {/* The deck itself, not a person. The character moved to the Mentor
          tab; this screen is about the cards. */}
      <div className="reader-portrait is-deckfront">
        <img src="/assets/misc/deck_box_lid_MASTER.png" alt="" />
      </div>

      {/* The visible title is gone: the art says who this is, and a heading
          over it was naming the picture. The h1 stays for screen readers,
          which still need a document heading. */}
      <h1 className="sr-only">Reading</h1>

      {/* No first person and nobody speaking: the invitation is about the
          cards now, not about who deals them. Atmosphere still belongs here
          rather than in the readings, per 0027. */}
      <p className="reader-intro">
        Three cards for the day ahead, and what they add up to.
      </p>

      <button className="action" type="button" onClick={deal}>
        Draw cards
      </button>
    </div>
    </>
  );
}

// --- after the draw -----------------------------------------------------

function Seated({ deck, dealt, progress, day }) {
  const byKey = new Map(deck.cards.map((card) => [card.key, card]));
  const cards = dealt.cards
    .map(({ cardKey, reversed, note }, i) => ({
      card: byKey.get(cardKey),
      reversed,
      note,
      // The daily draw stores no position: the three are always dealt into
      // SPREAD's three slots, in order, so the slot is the index.
      position: SPREAD[i]?.name ?? null,
    }))
    .filter((entry) => entry.card);

  // The daily reading has to finish before asking is offered. Someone mid-way
  // through being told what today looks like should not also be looking at an
  // empty box inviting them to interrupt.
  //
  // A failed reading counts as finished. Otherwise a reader that cannot speak
  // — no credit, no network — would also lock away the questions, and the tab
  // would have nothing in it at all.
  const [dailyFailed, setDailyFailed] = useState(false);
  const spoken = Boolean(dealt.takeaway || dealt.reading);
  const settled = spoken || dailyFailed;

  // Each card carries the note about its own part in the reading. Legacy
  // draws stored before 0028 have a prose blob and no notes; those still
  // render, below, rather than being thrown away and bought again.
  const read = cards.map(({ card, reversed, note, position }) => ({
    ...card,
    reversed,
    note,
    position,
  }));

  return (
    <>
      {/* Overlaid on the results page rather than rendered instead of it, so
          DailyReading below mounts and starts its fetch while the reveal is
          still playing. That is what makes the ~8.5s call free: by the time
          the three have had their turn, the reading is usually already in. */}
      {dealt.revealed ? null : (
        <CardReveal cards={read} onDone={() => recordRevealSeen({ day })} />
      )}

      {/* No portrait here. Once the cards are down they are the subject, and
          the reader's picture above them competes with the thing they were
          drawn to look at. You met them on the way in.

          While the reader is still considering, the three sit in a row so the
          wait happens under something. They are replaced, not joined, by the
          detail below once the reading lands. */}
      {spoken || dailyFailed ? null : <Waiting cards={read} />}

      <DailyReading dealt={dealt} cards={cards} day={day} onFailure={setDailyFailed} />

      {spoken ? <ReadingDetail cards={read} legacy={dealt.reading} /> : null}

      {settled ? <AskTheReader progress={progress} day={day} /> : null}
    </>
  );
}

// The part below the takeaway: one card at a time, each with what it
// contributed. Read top to bottom these are still one argument, because the
// prompt keeps the joins between them intact ("what's pressing on that is
// ...", "and if that holds ..."). See docs/decisions/0028.
function ReadingDetail({ cards, legacy }) {
  // A draw stored under the old shape has prose and no per-card notes.
  if (legacy && !cards.some((card) => card.note)) {
    return (
      <>
        <Spread cards={cards} />
        <Prose text={legacy} />
      </>
    );
  }

  return (
    <div className="detail">
      {cards.map((card) => (
        <section key={`${card.key}-${card.position ?? ""}`} className="detail-card">
          <div className="detail-art">
            <img
              src={card.master}
              alt={card.name}
              className={card.reversed ? "is-reversed" : undefined}
            />
          </div>
          <p className="detail-position">{card.position ?? card.brief ?? ""}</p>
          <h2 className="detail-name">
            {card.name}
            <span className="detail-line">{card.reversed ? "Reversed" : "Upright"}</span>
          </h2>
          {card.note ? <p className="reading-body">{card.note}</p> : null}
        </section>
      ))}
    </div>
  );
}

// The reader's words about today's three. The cards are already on screen by
// the time this runs — dealing is instant and local, the reading is a network
// call — so the wait happens under something rather than instead of it.
function DailyReading({ dealt, cards, day, onFailure }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  // Which draw has already been sent. A ref, not state, because it has to be
  // true the instant the request goes out rather than a render later.
  //
  // Guarding on `dealt.takeaway` was not enough: React's StrictMode invokes
  // effects twice on mount in development, and both invocations ran before
  // either response had landed, so a single draw fired two readings 2ms apart
  // and the second overwrote the first on screen. Tia saw the text change
  // under her. It also billed twice.
  const requested = useRef(null);

  const fail = (message) => {
    setError(message);
    onFailure?.(true);
  };

  const fetchReading = useCallback(async () => {
    setAsking(true);
    setError(null);
    onFailure?.(false);
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: cards.map(({ card, reversed }) => ({ key: card.key, reversed })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        fail(data?.error ?? "Couldn't read these three. Try again.");
        return;
      }
      recordDailyReading({
        headline: data.headline,
        takeaway: data.takeaway,
        cards: data.cards,
        day,
      });
    } catch {
      fail("Couldn't reach the server. Check the dev server is still running.");
    } finally {
      setAsking(false);
    }
  }, [cards, day]);

  // Fires once per draw, and once only.
  useEffect(() => {
    if (dealt.takeaway || dealt.reading || error) return;
    if (requested.current === dealt.date) return;
    requested.current = dealt.date;
    fetchReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealt.takeaway, dealt.date, error]);

  // The takeaway, and only the takeaway. It is what most people will read, so
  // it sits alone at the top with the detail below it. A draw stored under the
  // old shape has no takeaway; its prose is rendered by ReadingDetail instead.
  if (dealt.takeaway) {
    return <Takeaway headline={dealt.headline} takeaway={dealt.takeaway} />;
  }
  if (dealt.reading) return null;

  if (error) {
    return (
      <>
        <p className="ask-error">{error}</p>
        <button className="action-quiet" type="button" onClick={fetchReading}>
          Try again
        </button>
      </>
    );
  }

  // The waiting visuals belong to Waiting, which owns the whole screen. This
  // component is only the fetch and its failure from here on.
  return null;
}

// Reachable by skipping the reveal, or by a reading slower than it. Nobody
// should be looking at this often, but "rarely seen" is not "allowed to be
// ugly": it was three small cards pinned above an empty screen.
//
// The three fan like a hand rather than sitting in a grid, which lets each be
// half again as large, and the glow crosses them one at a time — the reader
// looking from one card to the next.
function Waiting({ cards }) {
  return (
    <div className="waiting">
      <div className="waiting-fan">
        {cards.map((card, i) => (
          <div
            key={card.key}
            className="waiting-card"
            style={{ "--i": i }}
            aria-hidden={i > 0 ? "true" : undefined}
          >
            <img
              src={card.master}
              alt={i === 0 ? "Today's cards" : ""}
              className={card.reversed ? "is-reversed" : undefined}
            />
          </div>
        ))}
      </div>

      <p className="waiting-line">Reading the cards&hellip;</p>
    </div>
  );
}

// --- asking -------------------------------------------------------------

function AskTheReader({ progress, day }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  const reading = progress.lastReading;
  const trimmed = question.trim();

  async function ask(event) {
    event.preventDefault();
    if (!trimmed || asking) return;

    setAsking(true);
    setError(null);
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Couldn't answer that one.");
        return;
      }
      recordReading({
        question: data.question,
        cards: data.cards,
        headline: data.headline,
        takeaway: data.takeaway,
        day,
      });
      setQuestion("");
    } catch {
      setError("Couldn't reach the server. Check the dev server is still running.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="reader-ask">
      <p className="suit-head">Ask a question</p>

      {reading ? <Answer reading={reading} /> : null}

      <form onSubmit={ask}>
        <label className="sr-only" htmlFor="reader-question">
          Your question
        </label>
        <textarea
          id="reader-question"
          className="ask-field"
          rows={3}
          value={question}
          maxLength={MAX_QUESTION}
          disabled={asking}
          placeholder={reading ? "Ask something else…" : "Something on your mind?"}
          onChange={(event) => setQuestion(event.target.value)}
        />

        {error ? <p className="ask-error">{error}</p> : null}

        <button className="action" type="submit" disabled={!trimmed || asking}>
          {asking ? "Reading the cards…" : "Ask"}
        </button>
      </form>

      <p className="footer-meta">
        Each question draws three new cards. Ask as many as you like.
      </p>
    </div>
  );
}

function Answer({ reading }) {
  return (
    <div className="reading">
      <div className="prompt-card">
        <span className="prompt-card-label">You asked</span>
        <p>{reading.question}</p>
      </div>

      {reading.takeaway ? (
        <Takeaway headline={reading.headline} takeaway={reading.takeaway} />
      ) : null}

      <ReadingDetail cards={reading.cards} legacy={reading.reading} />

      <button className="action-quiet" type="button" onClick={() => clearReading()}>
        Clear this reading
      </button>
    </div>
  );
}

// --- shared -------------------------------------------------------------

function Spread({ cards, showPositions = false }) {
  return (
    <div className="spread">
      {cards.map((card) => (
        <figure key={`${card.key}-${card.position ?? ""}`} className="spread-card">
          <div className="spread-art">
            <img
              src={card.master}
              alt={card.name}
              className={card.reversed ? "is-reversed" : undefined}
            />
          </div>
          <figcaption>
            {showPositions && card.position ? (
              <span className="spread-position">{card.position}</span>
            ) : null}
            <span className="spread-name">{card.name}</span>
            <span className="spread-line">
              {card.reversed ? "Reversed" : "Upright"}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// The answer, given the weight of one. The display face carries a single line
// and the body face carries the rest: 40 words of Fraunces ran seven lines and
// read as a wall, and at 19px it was smaller than the card names below it,
// which put a label above the answer in the hierarchy. See docs/decisions/0029.
function Takeaway({ headline, takeaway }) {
  return (
    <div className="takeaway-block">
      <span className="takeaway-label">Today</span>
      {headline ? <p className="takeaway-headline">{headline}</p> : null}
      <p className="takeaway">{takeaway}</p>
    </div>
  );
}

function Prose({ text }) {
  return (
    <>
      {text
        .split(/\n+/)
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i} className="reading-body">
            {paragraph}
          </p>
        ))}
    </>
  );
}
