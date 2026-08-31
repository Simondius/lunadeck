"use client";

import { useLayoutEffect, useRef } from "react";

// Resting spots run down the left of the card, not around it — at full
// legible size (see REST_SCALE below) a slot on the card's right or over a
// corner would overlap the art. Up to 6 rows, stacked top to bottom from the
// card's own top edge, each row's right edge held a fixed gap clear of the
// card's left edge regardless of how wide that word's badge is.
const SLOT_GAP_FROM_CARD = 14;
const SLOT_ROW_GAP = 10;

const FLIGHT_MS = 650;
// Rests back at 1x, not smaller — Simon's call: a badge shrunk any further
// than the keyword's own original chip size stopped being legible.
const REST_SCALE = 1;
const TRAIL_FADE_MS = 500;

// A correct word's reward: a gold-and-white sparkle burst, a snap out to 2x,
// then a settle back to its normal size while flying to its resting slot,
// where it stays for the rest of the round as visible proof of what's been
// placed. A light trail traces the flight and lingers briefly after landing.
// Mounted once per collected word (see FoolDragSection), it measures the
// chip's on-screen rect at the moment it was dropped (startRect, passed in
// rather than re-measured — the original chip is already gone by the time
// this mounts) and the card's current rect, so it works at any layout size.
export default function CollectedBadge({ text, startRect, slotIndex, cardRef }) {
  const badgeRef = useRef(null);
  const trailRef = useRef(null);

  useLayoutEffect(() => {
    const badge = badgeRef.current;
    const trail = trailRef.current;
    const cardRect = cardRef.current?.getBoundingClientRect();
    if (!badge || !cardRect || !startRect) return;

    const rowHeight = startRect.height + SLOT_ROW_GAP;
    const targetCenterX = cardRect.left - SLOT_GAP_FROM_CARD - startRect.width / 2;
    const targetCenterY = cardRect.top + startRect.height / 2 + slotIndex * rowHeight;
    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;

    badge.style.position = "fixed";
    badge.style.left = `${startRect.left}px`;
    badge.style.top = `${startRect.top}px`;
    badge.style.width = `${startRect.width}px`;
    badge.style.height = `${startRect.height}px`;

    // transform-origin stays centre (the default), so translating the box's
    // centre onto the anchor keeps the badge centred on it at any scale.
    const dx = targetCenterX - startRect.width / 2 - startRect.left;
    const dy = targetCenterY - startRect.height / 2 - startRect.top;

    badge.animate(
      [
        { transform: "translate(0, 0) scale(1)", offset: 0 },
        { transform: "translate(0, 0) scale(2)", offset: 0.32 },
        { transform: `translate(${dx}px, ${dy}px) scale(${REST_SCALE})`, offset: 1 },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)", fill: "forwards" }
    );

    // The trail traces the actual travel segment only (the pop-in-place
    // phase up to offset 0.32 doesn't move, so tracing from there is the
    // honest path) — a thin glowing bar rotated to match, brightest at the
    // destination end like a comet's head.
    if (trail) {
      const pathDx = targetCenterX - startCenterX;
      const pathDy = targetCenterY - startCenterY;
      const length = Math.hypot(pathDx, pathDy);
      const angle = (Math.atan2(pathDy, pathDx) * 180) / Math.PI;

      trail.style.position = "fixed";
      trail.style.left = `${startCenterX}px`;
      trail.style.top = `${startCenterY}px`;
      trail.style.width = `${length}px`;
      trail.style.transformOrigin = "0 50%";
      trail.style.transform = `rotate(${angle}deg)`;

      const totalMs = FLIGHT_MS + TRAIL_FADE_MS;
      const moveStarts = 0.32; // matches the badge's own pop-then-move keyframe above
      const fadedInBy = moveStarts + 0.08; // quick fade-in once it starts moving
      const flightEndsAt = FLIGHT_MS / totalMs; // stays lit until the badge lands
      trail.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: moveStarts },
          { opacity: 0.85, offset: fadedInBy },
          { opacity: 0.85, offset: flightEndsAt },
          { opacity: 0, offset: 1 },
        ],
        { duration: totalMs, easing: "ease", fill: "forwards" }
      );
    }
    // Runs once at mount — startRect/slotIndex/cardRef describe a single,
    // never-replayed flight for this badge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <span ref={trailRef} className="collected-badge-trail" aria-hidden="true" />
      <span ref={badgeRef} className="collected-badge">
        <span className="collected-badge-sparkle" aria-hidden="true" />
        {text}
      </span>
    </>
  );
}
