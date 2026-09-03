"use client";

import { forwardRef } from "react";

// A description phrase, tapped rather than dragged onto the part of the
// card it describes (Simon's call: dragging a whole sentence onto a
// specific patch of card art read as unnatural - see zone-round-player.jsx
// for the full tap-then-tap interaction this is one half of). Three looks:
// idle, the current selection (a persistent gold/silver shimmer, held
// until it's matched or deselected - .is-selected), and a wrong cross-tap
// against a different zone (a brief red flash - .is-wrong, cleared by the
// parent after WRONG_FLASH_MS). A correct match doesn't have a look here
// at all - the element is simply removed from the parent's `remaining`
// list, its own flight-and-absorb played by zone-chip-flight.jsx over the
// card instead of anything happening to this button in place.
const ZoneChip = forwardRef(function ZoneChip({ element, status, disabled, onTap }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={
        "chip zone-chip" +
        (status === "selected" ? " is-selected" : "") +
        (status === "wrong" ? " is-wrong" : "")
      }
      disabled={disabled}
      onClick={() => onTap(element)}
    >
      {element.text}
    </button>
  );
});

export default ZoneChip;
