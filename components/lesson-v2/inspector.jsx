"use client";

import { useEffect } from "react";

// Full-screen look at one card's art, dismissed by tapping anywhere or by
// Escape. Lifted out of the old components/lesson/options.jsx when the rest
// of that file — the v1 option tiles and footer — died with v1-v3 (0082,
// 0098). It lives here because cloze-round-player.jsx is its only caller.
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
