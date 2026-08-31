"use client";

import { forwardRef, useRef, useState } from "react";

// Same brief-and-undramatic reject timing as drag-chip.jsx — the card
// carries the drama on a wrong drop, this just needs to get out of the way.
const CHIP_REJECT_MS = 180;
const CARD_REJECT_MS = 460;
// How much a chip shrinks while it's being dragged — Simon's call, so the
// card underneath it (and the zone it's headed for) stays visible.
const DRAG_SCALE = 0.5;

function pointInRects(x, y, rects, cardRect) {
  return rects.some((rect) => {
    const left = cardRect.left + rect.x0 * cardRect.width;
    const right = cardRect.left + rect.x1 * cardRect.width;
    const top = cardRect.top + rect.y0 * cardRect.height;
    const bottom = cardRect.top + rect.y1 * cardRect.height;
    return x >= left && x <= right && y >= top && y <= bottom;
  });
}

// A description phrase the learner drags onto the part of the card it
// describes. Pointer capture, same as drag-chip.jsx — the difference is
// what counts as a correct drop: not "anywhere on the card" but "inside this
// element's own zone(s)" (data/v2/fool_section.json, fractional rects
// resolved against the card's live bounding box so they hold at any layout
// size — see docs/decisions/0037's sibling note on measuring rather than
// guessing).
const ZoneChip = forwardRef(function ZoneChip(
  { element, cardRef, disabled, onAccepted, onRejected },
  ref
) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState("idle"); // idle | dragging | rejected
  const drag = useRef(null);

  function onPointerDown(event) {
    if (disabled || status !== "idle") return;
    // See drag-chip.jsx's own onPointerDown — without this a real touch can
    // read the press as "select this text" instead of the start of a drag.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY };
    setStatus("dragging");
  }

  function onPointerMove(event) {
    if (!drag.current) return;
    setOffset({
      x: event.clientX - drag.current.startX,
      y: event.clientY - drag.current.startY,
    });
  }

  function resolve(event) {
    if (!drag.current) return;
    drag.current = null;

    const card = cardRef.current?.getBoundingClientRect();
    const overCard =
      card &&
      event.clientX >= card.left &&
      event.clientX <= card.right &&
      event.clientY >= card.top &&
      event.clientY <= card.bottom;

    if (overCard && pointInRects(event.clientX, event.clientY, element.rects, card)) {
      // No local fade, no flying badge — the reward is the zone itself
      // glowing (zone-highlight.jsx), spawned by the parent the instant this
      // fires. The chip is just gone, same as a correct keyword drop.
      onAccepted(element);
      return;
    }

    if (overCard) {
      onRejected?.(element);
      const cardEl = cardRef.current;
      if (cardEl) {
        cardEl.classList.remove("is-rejecting");
        void cardEl.offsetWidth;
        cardEl.classList.add("is-rejecting");
        window.setTimeout(() => cardEl.classList.remove("is-rejecting"), CARD_REJECT_MS);
      }

      setStatus("rejected");
      window.setTimeout(() => {
        setOffset({ x: 0, y: 0 });
        setStatus("idle");
      }, CHIP_REJECT_MS);
      return;
    }

    // Released without reaching the card — no verdict, just spring back.
    setOffset({ x: 0, y: 0 });
    setStatus("idle");
  }

  const scale = status === "dragging" ? DRAG_SCALE : 1;

  return (
    <button
      ref={ref}
      type="button"
      className={`chip zone-chip is-${status}`}
      style={{ "--dx": `${offset.x}px`, "--dy": `${offset.y}px`, "--scale": scale }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={resolve}
      onPointerCancel={resolve}
      disabled={disabled}
    >
      {element.text}
    </button>
  );
});

export default ZoneChip;
