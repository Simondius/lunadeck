"use client";

import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import { isSectionComplete } from "@/lib/progress";

// The deep end of the education.
//
// A section teaches the gist — one line and the keywords — and its exercises
// escalate from there. This is where a learner goes afterwards, once they can
// pull a few cards and half-read them: the full guidebook entry, what the
// card's symbol actually means, and the reading notes. Nothing here is
// summarised or rewritten; it is the source text, laid out in depth order.
export default function CardPage({ card, nodeIds, lesson }) {
  const progress = useProgress();
  const known = nodeIds.length > 0 && isSectionComplete(progress, nodeIds);
  const seenReversed = progress.reversedCardKeys.includes(card.key);

  if (!known) {
    return (
      <main className="shell">
        <Link className="backlink" href="/deck">
          ← Deck
        </Link>
        <span className="unit-eyebrow">Not yours yet</span>
        <h1 className="unit-title">A card you haven&rsquo;t met</h1>
        <p className="unit-intro">
          Its full entry opens here once you finish the section that teaches it
          — what its symbol means, the guidebook&rsquo;s reading of it, and the
          notes for reading it in a spread. You don&rsquo;t have to wait for the
          path to reach it.
        </p>
        {/* A way in, not just an address. Someone who pulled this card this
            morning should not have to play forty sections to find out what it
            means. The path keeps its order as the recommendation; the deck is
            the other door. The section is named so a jump is a jump you can
            see yourself making. */}
        {lesson ? (
          <Link className="card-lesson" href={lesson.href}>
            Learn this card now
            <span>{lesson.unitName}</span>
          </Link>
        ) : null}
      </main>
    );
  }

  return (
    <main className="shell">
      <Link className="backlink" href="/deck">
        ← Deck
      </Link>

      <div className="complete-card">
        <img src={card.image} alt={card.name} />
      </div>

      <p className="draw-name">{card.name}</p>
      {card.symbol ? <p className="draw-line">{card.symbol.label}</p> : null}

      {card.keywords.length ? (
        <div className="anchor is-centred">
          {card.keywords.map((word) => (
            <span key={word} className="keyword">
              {word}
            </span>
          ))}
        </div>
      ) : null}

      <p className="suit-head">The card</p>
      <p className="unit-intro">{card.guidebook}</p>

      {card.symbol && card.symbol.phrases.length ? (
        <>
          <p className="suit-head">{card.symbol.label}</p>
          <ul className="notes">
            {card.symbol.phrases.map((phrase) => (
              <li key={phrase}>{phrase}</li>
            ))}
          </ul>
        </>
      ) : null}

      {card.points.length ? (
        <>
          <p className="suit-head">Reading it</p>
          <ul className="notes">
            {card.points.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      ) : null}

      {/* Back into the lesson that taught it. Replaying a finished section is
          already possible from the path, so this is a shortcut rather than a
          new power — and it is what the deck was missing: a card that knows
          where it came from. */}
      {lesson ? (
        <Link className="card-lesson" href={lesson.href}>
          Play this card&rsquo;s lesson again
          <span>
            {lesson.unitName} · Section {lesson.section}
          </span>
        </Link>
      ) : null}

      {/* The shadow side arrives only once you've actually pulled it reversed —
          reversed meanings are a later unit in the curriculum, not something to
          hand over with the upright entry. */}
      {seenReversed && card.reversed ? (
        <>
          <p className="suit-head">Reversed</p>
          <p className="unit-intro">{card.reversed}</p>
        </>
      ) : null}
    </main>
  );
}
