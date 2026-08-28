"use client";

import { useEffect, useRef } from "react";

const LONG_PRESS_MS = 400;

// Tap selects. Press and hold opens the image full screen; releasing returns
// without changing the selection. A quick tap never triggers inspect.
export function ImageOption({ option, state, onSelect, onInspect }) {
  const timer = useRef(null);
  const longPressed = useRef(false);

  function start() {
    longPressed.current = false;
    timer.current = setTimeout(() => {
      longPressed.current = true;
      onInspect();
    }, LONG_PRESS_MS);
  }

  function end() {
    clearTimeout(timer.current);
    if (!longPressed.current && state !== "eliminated" && state !== "locked") {
      onSelect();
    }
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className={`option option-image is-${state}`}
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
