"use client";

import { useEffect, useRef, useState } from "react";

// Shared by every passive (non-choice) beat in Journey mode - a small
// "tap to continue" hint that fades in once the beat has sat untouched
// for TAP_HINT_DELAY_MS, and is dismissed the instant the beat advances.
// Mirrors components/story/chapter-player.jsx's own tapHintVisible
// pattern (same shape, tuned to Simon's own numbers for Journey - see
// .journey-tap-hint in app/globals.css for the fade timings themselves,
// which is the only place those should ever need to change).
const TAP_HINT_DELAY_MS = 1000;

export function useTapHint(resetKey) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setVisible(false);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setVisible(true), TAP_HINT_DELAY_MS);
    return () => window.clearTimeout(timeoutRef.current);
  }, [resetKey]);

  const dismiss = () => {
    window.clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return [visible, dismiss];
}
