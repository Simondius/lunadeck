"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@/components/use-progress";
import {
  isSectionComplete,
  today,
  recordDraw,
  drawnToday,
} from "@/lib/progress";
import { pickDraw } from "@/lib/draw";

// Placeholder copy — the handoff flags the journal prompt as not final. One
// line per keyword slot so it at least reads as though it noticed the card.
function promptFor(card, reversed) {
  if (reversed) return `Where might ${card.name.toLowerCase()} be overplayed right now?`;
  const first = card.keywords[0];
  return first
    ? `Where did ${first.toLowerCase()} show up for you today?`
    : `What does ${card.name} ask of you today?`;
}

export default function DrawScreen({ deck }) {
  const progress = useProgress();
  const day = today();

  // Rendered after mount only: toLocaleDateString runs in the server's timezone
  // during SSR and the browser's on hydration, which differ either side of
  // midnight and mismatch.
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    );
  }, []);
  const already = drawnToday(progress, day);

  const known = new Set();
  // Deck order is teaching order enough for a preview window; the real signal
  // is which sections are finished, which the path already computes.
  for (const section of deck.sections ?? []) {
    if (section.cardKey && isSectionComplete(progress, section.nodeIds)) {
      known.add(section.cardKey);
    }
  }
  // The unit the learner is actually in — the first section they haven't
  // finished. Reading it off the first unknown card in deck order would jump
  // around, since deck order is the printed deck, not the teaching order.
  const pending = (deck.sections ?? []).find(
    (section) => !isSectionComplete(progress, section.nodeIds)
  );
  const currentUnit = pending?.unit ?? 1;

  const result = already
    ? {
        card: deck.cards.find((c) => c.key === already.cardKey),
        reversed: already.reversed,
      }
    : pickDraw({
        cards: deck.cards,
        knownKeys: [...known],
        drawnKeys: progress.drawnCardKeys,
        reversedKeys: progress.reversedCardKeys,
        currentUnit,
        seed: day,
      });

  if (!result || !result.card) {
    return (
      <main className="shell starfield">
        <div className="masthead">
          <h1 className="unit-title">Tonight&rsquo;s draw</h1>
          <span className="standfirst">{date}</span>
        </div>
        <p className="unit-intro">
          Every card seen, both ways up. There is nothing left to draw — the
          deck is yours.
        </p>
      </main>
    );
  }

  const { card, reversed } = result;

  if (!already) {
    return (
      <main className="shell starfield">
        <div className="masthead">
          <h1 className="unit-title">Tonight&rsquo;s draw</h1>
          <span className="standfirst">{date}</span>
        </div>
        <p className="unit-intro">One card, once a night. Turn it when you&rsquo;re ready.</p>
        {/* The deck itself is the control. A footer .action here would sit
            under the fixed tab bar, which owns bottom:0 on every tab. */}
        <button
          type="button"
          className="draw-art"
          onClick={() => recordDraw({ cardKey: card.key, reversed, day })}
          aria-label="Draw tonight's card"
        >
          <img src="/assets/misc/deck_box_lid_MASTER.png" alt="" />
        </button>
        <p className="gesture-hint">Tap the deck to draw</p>
      </main>
    );
  }

  return (
    <main className="shell starfield">
      <div className="masthead">
        <h1 className="unit-title">Tonight&rsquo;s draw</h1>
        <span className="standfirst">{date}</span>
      </div>

      <div className="draw-art">
        <img
          src={card.master}
          alt={card.name}
          className={reversed ? "is-reversed" : undefined}
        />
      </div>

      <p className="draw-name">{card.name}</p>
      <p className="draw-line">
        {reversed ? "Reversed" : "Upright"}
        {card.symbol ? ` · ${card.symbol}` : ""}
        {known.has(card.key) ? "" : " · Not yet taught"}
      </p>

      <div className="anchor is-centred">
        {card.keywords.map((word) => (
          <span key={word} className="keyword">
            {word}
          </span>
        ))}
      </div>

      <p className="unit-intro">{reversed ? card.reversed : card.meaning}</p>

      <div className="prompt-card">
        <span className="prompt-card-label">Sit with this</span>
        <p>{promptFor(card, reversed)}</p>
      </div>

      <div className="stats">
        <div>
          <span className="stat-value">{progress.streakDays}</span>
          <span className="stat-label">Night streak</span>
        </div>
        <div>
          <span className="stat-value">{progress.drawnCardKeys.length}</span>
          <span className="stat-label">Cards drawn</span>
        </div>
        <div>
          <span className="stat-value">{progress.reversedCardKeys.length}</span>
          <span className="stat-label">Seen reversed</span>
        </div>
      </div>

      <p className="footer-meta">Your next card is ready tomorrow</p>
    </main>
  );
}
