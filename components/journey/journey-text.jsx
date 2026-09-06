"use client";

import { useEffect, useState } from "react";

// One global text component for every line of Journey copy. `variant`
// picks which of the two styles Simon specified:
//   "action"    - sound-effect/event lines ("*Thud*") - straight (not
//                 italic), swipes in left-to-right with a gold+silver dust
//                 band (0.5s), then sparkles once fully revealed (0.3s).
//   "narrative" - spoken/story lines - italic, swipes in from the right.
// All timing/visuals live in .journey-text / .journey-dust / .journey-sparkle
// in app/globals.css - this component only sequences the sparkle state,
// it never owns a duration itself.
export default function JourneyText({ variant = "narrative", children }) {
  const isAction = variant === "action";
  const [sparkling, setSparkling] = useState(false);

  useEffect(() => {
    setSparkling(false);
    if (!isAction) return undefined;
    // Sparkle starts once the 0.5s swipe-reveal has finished.
    const timeout = window.setTimeout(() => setSparkling(true), 500);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAction, children]);

  return (
    <span
      className={`journey-text-wrap${isAction ? " is-action" : ""}${
        sparkling ? " is-sparkling" : ""
      }`}
    >
      <p className={`journey-text${isAction ? " is-action" : " is-narrative"}`}>
        {children}
      </p>
      {isAction ? <span className="journey-dust" aria-hidden="true" /> : null}
      {isAction ? (
        <span className="journey-sparkle" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
      ) : null}
    </span>
  );
}
