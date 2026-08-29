"use client";

import Link from "next/link";

// "Meet the card" — the teaching step.
//
// Until now the curriculum only ever quizzed. Node 1 of every section is
// labelled "first exposure" and it is a multiple-choice question, so the
// learner's first encounter with a card was a guess, and the meaning only
// appeared in the reveal afterwards. This shows the card first: its art, its
// symbol, its keywords and what it means. Then the section tests it.
//
// Every string here already exists in data/ — nothing about a card is authored
// in the app, per CLAUDE.md.
export default function Intro({ intro, unitNumber, unitName, sectionLabel, onStart }) {
  const isCard = Boolean(intro?.card);

  return (
    <main className="session is-intro">
      <div className="topbar">
        <Link className="quit" href="/" aria-label="Leave lesson">
          ✕
        </Link>
      </div>

      <span className="format-line">
        Unit {unitNumber} · {sectionLabel} · {isCard ? "New card" : "Review"}
      </span>

      {isCard ? (
        <>
          <div className="complete-card">
            <img src={intro.card.image} alt={intro.card.name} />
          </div>
          <p className="draw-name">{intro.card.name}</p>
          {intro.card.symbol ? <p className="draw-line">{intro.card.symbol}</p> : null}

          {intro.card.keywords.length ? (
            <div className="anchor is-centred">
              {intro.card.keywords.map((word) => (
                <span key={word} className="keyword">
                  {word}
                </span>
              ))}
            </div>
          ) : null}

          {/* One line, not the whole entry — see getCardIntro. */}
          <p className="unit-intro">{intro.card.opener}</p>
        </>
      ) : (
        <>
          <p className="prompt">{unitName}</p>
          <div className="earned">
            {(intro?.cards ?? []).map((card) => (
              <span key={card.key} className="slot" title={card.name}>
                <img src={card.image} alt={card.name} />
              </span>
            ))}
          </div>
          <p className="unit-intro">
            No new card this time — this is everything the unit taught, put back
            in front of you together.
          </p>
        </>
      )}

      {/* Inline rather than a fixed footer: this screen exists to be read, and
          a pinned CTA sits on top of the meaning it is asking you to read. */}
      <button className="action" type="button" onClick={onStart}>
        {isCard ? "Start the exercises" : "Start the review"}
      </button>
      <p className="footer-meta">
        {unitName} · {sectionLabel}
      </p>
    </main>
  );
}
