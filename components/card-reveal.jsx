"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The three, one at a time, full screen, before the results page.
//
// Two jobs. The obvious one is that a card 104px wide on a phone is not worth
// looking at and this is the only moment the art gets the screen to itself.
// The quieter one is timing: the reading is a network call that takes about
// 8.5 seconds, and three cards at 2.6s each is roughly that, so the wait
// happens behind something worth watching instead of under a spinner. The
// fetch starts the moment the cards are dealt, not when this finishes.
//
// Interaction follows Spec_Daily_Draw_Tab §2: the card fills the screen, and a
// reversed one renders rotated 180° with its tag pinned upright, so the
// orientation reads before any text does. See docs/decisions/0030.
const PER_CARD_MS = 2600;

export default function CardReveal({ cards, onDone }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);
  const done = useRef(false);

  // Motion is the part that gets reduced, not the sequence. Someone who has
  // asked for less movement still gets their three cards and still taps
  // through them; the card simply appears rather than flying in.
  const [stillness, setStillness] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    setStillness(query.matches);
    const onChange = (event) => setStillness(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  // The overlay is a fixed child of .app-frame, which carries a transform and
  // is the whole scrolling page rather than the viewport. So it is pinned to
  // the frame's top and the page is held at zero while the reveal is up:
  // otherwise a scroll would slide the takeover off the screen it is meant to
  // be taking over. Also stops the results page moving behind it.
  useEffect(() => {
    const scroller = document.scrollingElement ?? document.documentElement;
    const previous = scroller.scrollTop;
    scroller.scrollTop = 0;
    document.body.classList.add("is-revealing");
    return () => {
      document.body.classList.remove("is-revealing");
      // Deliberately not restoring `previous`: the reveal ends at the top of
      // the reading, which is where someone should be when it does.
      void previous;
    };
  }, []);

  const finish = useCallback(() => {
    // Guarded: the last card can be advanced by both its timer and a tap.
    if (done.current) return;
    done.current = true;
    clearTimeout(timer.current);
    onDone();
  }, [onDone]);

  // A tap on the last card leaves, rather than holding there until the
  // reading lands.
  //
  // An earlier cut did hold, because at the time the screen underneath was a
  // row of small cards above a lot of nothing and was worth hiding. Now that
  // it fans and the attention moves across the three, it says "working" better
  // than a frozen card with a pulsing caption does. Tia: "the loading screen
  // moves so it makes it clear that something is happening, but the static
  // card doesn't."
  const advance = useCallback(() => {
    clearTimeout(timer.current);
    setIndex((current) => {
      if (current + 1 >= cards.length) {
        setLeaving(true);
        return current;
      }
      return current + 1;
    });
  }, [cards.length]);

  // Each card gets its own timer, restarted when the index changes so a tap
  // does not leave the previous card's timeout to fire early on the next.
  useEffect(() => {
    if (leaving) return undefined;
    timer.current = setTimeout(advance, PER_CARD_MS);
    return () => clearTimeout(timer.current);
  }, [index, leaving, advance]);

  // The exit is a beat of its own so the last card is not cut off mid-fade.
  useEffect(() => {
    if (!leaving) return undefined;
    const wait = setTimeout(finish, stillness ? 0 : 420);
    return () => clearTimeout(wait);
  }, [leaving, stillness, finish]);

  const card = cards[index];
  if (!card) return null;

  return (
    <div
      className={`reveal${stillness ? " is-still" : ""}${leaving ? " is-leaving" : ""}`}
      // The card's motion and the pip's fill both run for exactly one turn, so
      // the timing lives in one place and CSS cannot drift from the timer.
      style={{ "--per-card": `${PER_CARD_MS}ms` }}
      // The whole surface advances, which is what a deck does. The skip button
      // sits above it and stops the event so it does not also advance.
      onClick={advance}
      role="presentation"
    >
      {/* Still here for anyone who wants out before the third card. */}
      <button
        type="button"
        className="reveal-skip"
        onClick={(event) => {
          event.stopPropagation();
          setLeaving(true);
        }}
      >
        Skip
      </button>

      <div className="reveal-stage">
        {/* Keyed on the slot so React remounts on every advance and the entry
            animation replays. Without the key the image swaps in place and the
            second and third cards simply appear. */}
        <figure key={index} className="reveal-card">
          <div className="reveal-art">
            <img
              src={card.master}
              alt={card.name}
              className={card.reversed ? "is-reversed" : undefined}
            />
            {card.reversed ? <span className="reveal-tag">Reversed</span> : null}
          </div>
          <figcaption>
            <span className="reveal-position">{card.position}</span>
            <span className="reveal-name">{card.name}</span>
          </figcaption>
        </figure>
      </div>

      <div className="reveal-pips" aria-hidden="true">
        {cards.map((entry, i) => (
          <span
            key={entry.key}
            className={
              `reveal-pip${i < index ? " is-done" : ""}${i === index ? " is-current" : ""}`
            }
          />
        ))}
      </div>
    </div>
  );
}
