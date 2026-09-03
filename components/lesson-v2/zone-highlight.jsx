"use client";

import { useLayoutEffect, useRef } from "react";

import { placeFixed } from "@/lib/fixed-position";

// A quick impact as the flown-in button lands, then the burst disperses
// outward like the glitter it's made of - Simon's spec: "the card is
// disintegrating into glitter and being absorbed into the card and
// colourizing it." Mounted by ZoneRoundPlayer once the button's own flight
// (zone-chip-flight.jsx) arrives, timed so this burst and the permanent
// colour reveal underneath both land the instant the button would.
// Simon's call after the first pass: slow this down to a full second and
// make it read as more of an event - not just a reward flourish, but the
// button's own life force pouring into the card and colourizing it.
const IMPACT_MS = 280;
const DISPERSE_MS = 720;
const TOTAL_MS = IMPACT_MS + DISPERSE_MS;

// Mounted once per correct match and never replayed, so a plain one-shot
// WAAPI animation per rect is enough — no loop, no interrupt handling
// (compare tutorial-ghost.jsx, which needs both).
export default function ZoneHighlight({ rects, cardRef }) {
  const nodeRefs = useRef([]);

  useLayoutEffect(() => {
    const cardRect = cardRef.current?.getBoundingClientRect();
    if (!cardRect) return;

    nodeRefs.current.forEach((el, i) => {
      const rect = rects[i];
      if (!el || !rect) return;
      const left = cardRect.left + rect.x0 * cardRect.width;
      const top = cardRect.top + rect.y0 * cardRect.height;
      const width = (rect.x1 - rect.x0) * cardRect.width;
      const height = (rect.y1 - rect.y0) * cardRect.height;

      placeFixed(el, { left, top, width, height });

      el.animate(
        [
          { opacity: 0, transform: "scale(0.6)", offset: 0 },
          { opacity: 1, transform: "scale(1.22)", offset: IMPACT_MS / TOTAL_MS },
          { opacity: 1, transform: "scale(1)", offset: (IMPACT_MS + 90) / TOTAL_MS },
          { opacity: 1, transform: "scale(1.05)", offset: (IMPACT_MS + 320) / TOTAL_MS },
          { opacity: 0, transform: "scale(1.6)", offset: 1 },
        ],
        { duration: TOTAL_MS, easing: "ease-out", fill: "forwards" }
      );
    });
    // One-shot on mount — rects/cardRef describe a single, never-replayed
    // flourish for this drop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {rects.map((rect, i) => (
        <div
          key={i}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          className="zone-highlight"
          aria-hidden="true"
        />
      ))}
    </>
  );
}
