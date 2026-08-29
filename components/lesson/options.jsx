"use client";

import { useEffect, useRef } from "react";

const LONG_PRESS_MS = 400;

// Tap selects. Press and hold opens the image full screen; releasing returns
// without changing the selection. A quick tap never triggers inspect.
// `variant` picks the tile shape: "card" keeps the deck's portrait ratio,
// "symbol" the squarer icon tile the Format Bible calls for.
export function ImageOption({
  option,
  state,
  onSelect,
  onInspect,
  onRelease,
  variant = "card",
}) {
  const timer = useRef(null);
  const longPressed = useRef(false);

  function start(event) {
    longPressed.current = false;
    // Without capture the inspector opens under the cursor mid-press, and a
    // mouse pointerup hit-tests to the overlay instead of this button — so the
    // overlay closes itself the instant you let go. Touch gets implicit
    // capture; mouse and pen do not.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Not fatal — worst case the old hit-testing behaviour returns.
    }
    timer.current = setTimeout(() => {
      longPressed.current = true;
      onInspect();
    }, LONG_PRESS_MS);
  }

  function end() {
    clearTimeout(timer.current);
    if (longPressed.current) {
      // Releasing the press returns to the board, per the Style Guide.
      onRelease?.();
      return;
    }
    if (state !== "eliminated" && state !== "locked") onSelect();
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={`option option-${variant === "symbol" ? "symbol" : "image"} is-${state}`}
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={() => clearTimeout(timer.current)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (state !== "eliminated" && state !== "locked") onSelect();
        }
      }}
      disabled={state === "eliminated"}
      aria-pressed={state === "selected"}
    >
      <img src={option.image} alt={option.label ?? ""} draggable="false" />
      {option.label ? <span className="option-name">{option.label}</span> : null}
      <Badge state={state} />
    </button>
  );
}

export function TextOption({ option, state, onSelect }) {
  return (
    <button
      type="button"
      className={`option option-text is-${state}`}
      onClick={() => {
        if (state !== "eliminated" && state !== "locked") onSelect();
      }}
      disabled={state === "eliminated"}
      aria-pressed={state === "selected"}
    >
      <span>{option.text}</span>
      <Badge state={state} />
    </button>
  );
}

function Badge({ state }) {
  if (state === "eliminated") return <span className="badge badge-wrong">✕</span>;
  if (state === "correct") return <span className="badge badge-right">✓</span>;
  return null;
}

// 2 -> one row of 2; 3 -> two on top, one centered below; 4 -> 2x2.
export function gridClass(count) {
  if (count <= 2) return "grid grid-2";
  if (count === 3) return "grid grid-3";
  return "grid grid-4";
}

export function Inspector({ item, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="inspector" onPointerUp={onClose} onClick={onClose}>
      <img src={item.image} alt={item.label ?? ""} />
      {item.label ? <p className="inspector-name">{item.label}</p> : null}
      <button className="inspector-close" onClick={onClose}>
        Back
      </button>
    </div>
  );
}

// Each format owns its own footer. Format C has no button at all until the
// board is cleared, and Format B relabels mid-round, so a shared footer
// driven by the parent would render a step behind.
export function Footer({ label, disabled, onClick, meta }) {
  return (
    <footer className="footer">
      {label ? (
        <button className="action" onClick={onClick} disabled={disabled}>
          {label}
        </button>
      ) : (
        <p className="footer-hold">Match all pairs to continue</p>
      )}
      <p className="footer-meta">{meta}</p>
    </footer>
  );
}
