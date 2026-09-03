"use client";

import { useLayoutEffect, useRef } from "react";

import { placeFixed } from "@/lib/fixed-position";

// Simon's call after the first pass: this read as a snap into place, not
// an event - slower, and with more gold dust along the way, so it feels
// like the button is pouring its own life force into the card rather than
// just relocating there.
const FLIGHT_MS = 600;
const DUST_COUNT = 10;

function unionBounds(rects) {
  return rects.reduce(
    (acc, r) => ({
      x0: Math.min(acc.x0, r.x0),
      y0: Math.min(acc.y0, r.y0),
      x1: Math.max(acc.x1, r.x1),
      y1: Math.max(acc.y1, r.y1),
    }),
    { x0: 1, y0: 1, x1: 0, y1: 0 }
  );
}

// A trail of gold/silver motes riding along the flight path, each starting
// somewhere along the line between the button's own start and the zone
// it's headed for (not all bunched at one end) and drifting a little off
// the straight line as they go - plain DOM spans, fire-and-forget, same
// technique swipe-round-player.jsx's own spawnBurst() uses for its
// edge-of-the-card dust, just fixed-positioned in viewport coordinates
// (like this component's own flight/trail elements) rather than relative
// to a local stage, since the flight path runs from the chip row to the
// card - two unrelated containers, not one shared one.
function spawnDust(startCenter, endCenter) {
  for (let i = 0; i < DUST_COUNT; i++) {
    const t = Math.random();
    const baseX = startCenter.x + (endCenter.x - startCenter.x) * t;
    const baseY = startCenter.y + (endCenter.y - startCenter.y) * t;
    const drift = 14 + Math.random() * 22;
    const angle = Math.random() * Math.PI * 2;

    const mote = document.createElement("span");
    mote.className = `zone-chip-flight-dust ${i % 2 === 0 ? "is-gold" : "is-silver"}`;
    mote.style.left = `${baseX}px`;
    mote.style.top = `${baseY}px`;
    document.body.appendChild(mote);

    const dx = Math.cos(angle) * drift;
    const dy = Math.sin(angle) * drift - 8;
    const delay = t * FLIGHT_MS * 0.7;
    const animation = mote.animate(
      [
        { transform: "translate(-50%, -50%) translate(0, 0) scale(0.4)", opacity: 0 },
        {
          transform: `translate(-50%, -50%) translate(${dx * 0.4}px, ${dy * 0.4}px) scale(1)`,
          opacity: 1,
          offset: 0.3,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.3)`,
          opacity: 0,
        },
      ],
      { duration: 500 + Math.random() * 300, delay, easing: "ease-out", fill: "backwards" }
    );
    animation.onfinish = () => mote.remove();
  }
}

// The reward for a correct match: the tapped button flies from wherever it
// was sitting in the chip row into the zone it belongs to, shrinking and
// fading as it travels so it reads as being drawn into and absorbed by the
// card rather than just relocating there. Mounted once per correct match
// by ZoneRoundPlayer (a fresh key each time, never replayed), which times
// the zone's own burst-and-colourize (ZoneHighlight, the permanent
// `revealed` crop) to land right as this finishes - see FLIGHT_MS there.
//
// startRect is measured by the parent *before* the real button unmounts
// (getBoundingClientRect() in the same synchronous tap handler that
// removes it from `remaining`) - by the time this component's own effect
// runs, that button is already gone, so it has nothing left to measure
// itself.
export default function ZoneChipFlight({ text, startRect, rects, cardRef }) {
  const flightRef = useRef(null);
  const trailRef = useRef(null);
  // Guards spawnDust specifically - a Strict Mode dev double-invoke of this
  // mount effect is harmless for the two el.animate() calls below (two
  // identical animations on the same node are indistinguishable from one),
  // but spawnDust() appends real DOM nodes, which a second, unguarded call
  // would double for real.
  const dustSpawned = useRef(false);

  useLayoutEffect(() => {
    const el = flightRef.current;
    const cardRect = cardRef.current?.getBoundingClientRect();
    if (!el || !cardRect || !startRect || !rects?.length) return;

    const bounds = unionBounds(rects);
    const targetCenterX = cardRect.left + ((bounds.x0 + bounds.x1) / 2) * cardRect.width;
    const targetCenterY = cardRect.top + ((bounds.y0 + bounds.y1) / 2) * cardRect.height;
    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;

    placeFixed(el, startRect);
    const dx = targetCenterX - startCenterX;
    const dy = targetCenterY - startCenterY;

    if (!dustSpawned.current) {
      dustSpawned.current = true;
      spawnDust(
        { x: startCenterX, y: startCenterY },
        { x: targetCenterX, y: targetCenterY }
      );
    }

    el.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1, offset: 0 },
        {
          transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(1.08)`,
          opacity: 1,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0, offset: 1 },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.3, 0.6, 0.35, 1)", fill: "forwards" }
    );

    const trail = trailRef.current;
    if (trail) {
      const length = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      placeFixed(trail, { left: startCenterX, top: startCenterY, width: length });
      trail.style.transformOrigin = "0 50%";
      trail.style.transform = `rotate(${angle}deg)`;
      trail.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0.8, offset: 0.15 },
          { opacity: 0.8, offset: 0.85 },
          { opacity: 0, offset: 1 },
        ],
        { duration: FLIGHT_MS, easing: "ease", fill: "forwards" }
      );
    }
    // One-shot on mount - startRect/rects/cardRef describe a single,
    // never-replayed flight for this match.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <span ref={trailRef} className="zone-chip-flight-trail" aria-hidden="true" />
      <span ref={flightRef} className="zone-chip-flight" aria-hidden="true">
        {text}
      </span>
    </>
  );
}

export { FLIGHT_MS };
