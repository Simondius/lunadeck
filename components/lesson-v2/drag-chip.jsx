"use client";

import { forwardRef, useRef, useState } from "react";

// The card carries the drama on a wrong drop (flash + shake, see
// RoundPlayer's card ref and the .is-rejecting keyframes in globals.css); the
// chip itself just needs to get out of the way fast, so its own reject state
// is brief. onRejected is purely a tally for RoundPlayer's mistake-tracking —
// it doesn't change anything about how this chip behaves.
const CHIP_REJECT_MS = 180;
// How long the card's flash-and-shake plays.
const CARD_REJECT_MS = 460;

// A word the learner drags onto the card. Pointer capture is used instead of
// HTML5 drag-and-drop — the same pattern as components/dev-console.jsx's FAB
// — because it behaves the same on touch and mouse. Position is tracked as a
// translate offset from the chip's own flex-laid-out slot, not absolute
// coordinates, so removing a resolved sibling reflows the rest for free.
//
// A correct drop has no local animation at all — onAccepted fires
// immediately and RoundPlayer removes this chip on the same render that
// mounts its CollectedBadge replacement (see collected-badge.jsx), so the
// celebration reads as one continuous flight rather than a fade-then-fly.
const DragChip = forwardRef(function DragChip(
  { word, cardRef, disabled, long, onAccepted, onRejected },
  ref
) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState("idle"); // idle | dragging | rejected
  const drag = useRef(null);

  function onPointerDown(event) {
    if (disabled || status !== "idle") return;
    // Without this, a real touchscreen can read the press-and-hold start of
    // a drag as "select this text" instead — the native callout wins the
    // race against our own drag handling often enough to make a drag just
    // silently not happen.
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

    if (overCard && word.correct) {
      onAccepted(word);
      return;
    }

    if (overCard) {
      onRejected?.(word);
      const cardEl = cardRef.current;
      if (cardEl) {
        // Restart the keyframe even if a previous reject hasn't finished
        // fading — none/reflow/empty is the standard trick for that.
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

  return (
    <button
      ref={ref}
      type="button"
      className={`chip drag-chip is-${status}${long ? " is-long" : ""}`}
      style={{ "--dx": `${offset.x}px`, "--dy": `${offset.y}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={resolve}
      onPointerCancel={resolve}
      disabled={disabled}
    >
      {word.text}
    </button>
  );
});

export default DragChip;
