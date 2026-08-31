"use client";

import { useLayoutEffect, useRef } from "react";

// Linger at full size/opacity, then shrink to nothing over the zone's own
// centre — Simon's spec, split evenly.
const HOLD_MS = 500;
const SHRINK_MS = 500;
const TOTAL_MS = HOLD_MS + SHRINK_MS;

// The reward for a correctly-placed phrase: the zone it belongs to (one or
// two rects — night_sky's "the dark background generally" is two) glows
// gold-and-silver right on the card, holds, then collapses into its own
// centre. Mounted once per correct drop by ZoneRoundPlayer and never
// replayed, so a plain one-shot WAAPI animation per rect is enough — no loop,
// no interrupt handling (compare tutorial-ghost.jsx, which needs both).
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

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;

      el.animate(
        [
          { opacity: 0, transform: "scale(0.85)", offset: 0 },
          { opacity: 1, transform: "scale(1)", offset: 0.1 },
          { opacity: 1, transform: "scale(1)", offset: HOLD_MS / TOTAL_MS },
          { opacity: 0, transform: "scale(0)", offset: 1 },
        ],
        { duration: TOTAL_MS, easing: "ease", fill: "forwards" }
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
