"use client";

import { useState } from "react";
import { useProgress } from "@/components/use-progress";
import {
  isSectionComplete,
  today,
  recordDailyDraw,
  drawnToday,
  recordReading,
  clearReading,
} from "@/lib/progress";
import { pickDailyDraw } from "@/lib/draw";
import { MAX_QUESTION } from "@/lib/reading";

// The Reader tab: one feature in two beats.
//
// The nightly three is the ritual — the cards, named, and nothing interpreted.
// Asking is what buys an interpretation, and the reader pulls three fresh
// cards for it. That split is the whole design: the draw is the habit, the
// question is the reading. See docs/decisions/0025.
//
// Nothing on this screen teaches. The path teaches; this tab answers. Which is
// why the nightly three shows the guidebook's own keywords and stops there,
// rather than growing a second lesson inside a tab that isn't one.
export default function ReaderScreen({ deck }) {
  const progress = useProgress();
  const day = today();

  const dealt = drawnToday(progress, day);
  const byKey = new Map(deck.cards.map((card) => [card.key, card]));

  return (
    <main className={`shell starfield${dealt ? " is-seated" : ""}`}>
      <div className="masthead">
        <h1 className="unit-title">The reader</h1>
      </div>

      <div className={`reader-portrait${dealt ? " is-compact" : ""}`}>
        <img src="/assets/misc/reader_placeholder.webp" alt="" />
      </div>

      {dealt ? (
        <DealtSpread dealt={dealt} byKey={byKey} />
      ) : (
        <DealPrompt deck={deck} progress={progress} day={day} />
      )}

      {dealt ? <AskTheReader progress={progress} day={day} /> : null}
    </main>
  );
}

// --- the nightly three --------------------------------------------------

function DealPrompt({ deck, progress, day }) {
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

  const deal = () => {
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
      <p className="unit-intro">
        Sit down. Three cards to start, then ask me what you came to ask.
      </p>

      {/* The deck itself is the control. A footer .action here would sit
          under the fixed tab bar, which owns bottom:0 on every tab. */}
      <button
        type="button"
        className="draw-art"
        onClick={deal}
        aria-label="Deal today's three cards"
      >
        <img src="/assets/misc/deck_box_lid_MASTER.png" alt="" />
      </button>
      <p className="gesture-hint">Tap the deck for today&rsquo;s three</p>
    </>
  );
}

function DealtSpread({ dealt, byKey }) {
  const cards = dealt.cards
    .map(({ cardKey, reversed }) => ({ card: byKey.get(cardKey), reversed }))
    .filter((entry) => entry.card);

  return (
    <>
      <p className="suit-head reader-divider">Today&rsquo;s three</p>

      <div className="spread">
        {cards.map(({ card, reversed }) => (
          <figure key={card.key} className="spread-card">
            <div className="spread-art">
              <img
                src={card.master}
                alt={card.name}
                className={reversed ? "is-reversed" : undefined}
              />
            </div>
            <figcaption>
              <span className="spread-name">{card.name}</span>
              <span className="spread-line">{reversed ? "Reversed" : "Upright"}</span>
              {/* Two of the deck's own words, under the card they belong to.
                  A shared chip cloud was tried first: it cost 238px, pushed
                  the question box below the fold, and detached each keyword
                  from its card. No meaning, no prompt, no exercise — the tab
                  is not a lesson, and the Deck tab opens every card in full. */}
              <span className="spread-keywords">
                {card.keywords.slice(0, 2).join(" · ")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
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
        setError(data?.error ?? "The reader couldn't answer.");
        return;
      }
      recordReading({
        question: data.question,
        cards: data.cards,
        reading: data.reading,
        day,
      });
      setQuestion("");
    } catch {
      setError("Couldn't reach the reader. Check the dev server is still running.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <>
      <p className="suit-head reader-divider">Ask the reader</p>

      {reading ? <Reading reading={reading} /> : null}

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
          placeholder={
            reading ? "Ask something else…" : "What should I be paying attention to?"
          }
          onChange={(event) => setQuestion(event.target.value)}
        />

        {error ? <p className="ask-error">{error}</p> : null}

        <button className="action" type="submit" disabled={!trimmed || asking}>
          {asking ? "The reader is considering…" : "Ask"}
        </button>
      </form>

      <p className="footer-meta">
        Each question draws three new cards. Ask as many as you like.
      </p>
    </>
  );
}

function Reading({ reading }) {
  return (
    <div className="reading">
      <div className="prompt-card">
        <span className="prompt-card-label">You asked</span>
        <p>{reading.question}</p>
      </div>

      <div className="spread">
        {reading.cards.map((card) => (
          <figure key={`${card.key}-${card.position}`} className="spread-card">
            <div className="spread-art">
              <img
                src={card.master}
                alt={card.name}
                className={card.reversed ? "is-reversed" : undefined}
              />
            </div>
            <figcaption>
              <span className="spread-position">{card.position}</span>
              <span className="spread-name">{card.name}</span>
              <span className="spread-line">{card.reversed ? "Reversed" : "Upright"}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {reading.reading
        .split(/\n+/)
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i} className="reading-body">
            {paragraph}
          </p>
        ))}

      <button className="action-quiet" type="button" onClick={() => clearReading()}>
        Clear this reading
      </button>
    </div>
  );
}
