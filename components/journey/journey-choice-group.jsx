"use client";

import { useRef, useState } from "react";

// Global tap-to-answer keyword selector. One set of options, exactly one
// correct. Sequence per Simon's brief:
//
//  correct tap:
//    1. "correct-punch" - 0.2s expand-10%-then-contract
//    2. "sweeping"      - 0.3s gold dust swipe over the card
//    3. "selected"      - persists, golden hue
//    4. every OTHER (distractor) button disintegrates/fades independently,
//       each with its own random 0.2s-0.6s duration
//    5. only once every distractor has finished does onResolved() fire and
//       the scene advance
//
//  incorrect tap:
//    button turns red + shakes for 0.3s, then reverts to idle
//
// All of the animation names/durations above live in app/globals.css
// (.journey-choice / .is-correct-punch / .is-sweeping / .is-selected /
// .is-wrong / .is-disintegrating) - this component only sequences classes
// and timeouts, so "make the shake stronger" etc. is a CSS-only change.
function randomDuration() {
  return Math.round(200 + Math.random() * 400); // 0.2s-0.6s
}

export default function JourneyChoiceGroup({ options, onResolved }) {
  // status per option key: "idle" | "correct-punch" | "sweeping" | "selected"
  // | "wrong" | { disintegrating: durationMs }
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(options.map((option) => [option.key, "idle"]))
  );
  const [locked, setLocked] = useState(false);
  const pendingRef = useRef(0);
  const resolvedRef = useRef(false);

  function handleTap(option) {
    if (locked) return;

    if (!option.correct) {
      setLocked(true);
      setStatuses((prev) => ({ ...prev, [option.key]: "wrong" }));
      window.setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [option.key]: "idle" }));
        setLocked(false);
      }, 300);
      return;
    }

    setLocked(true);
    resolvedRef.current = false;

    const distractors = options.filter((candidate) => candidate.key !== option.key);
    pendingRef.current = distractors.length;

    setStatuses((prev) => ({ ...prev, [option.key]: "correct-punch" }));

    window.setTimeout(() => {
      setStatuses((prev) => ({ ...prev, [option.key]: "sweeping" }));

      window.setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [option.key]: "selected" }));

        if (distractors.length === 0) {
          resolvedRef.current = true;
          onResolved();
          return;
        }

        distractors.forEach((distractor) => {
          const duration = randomDuration();
          setStatuses((prev) => ({
            ...prev,
            [distractor.key]: { disintegrating: duration },
          }));
          window.setTimeout(() => {
            pendingRef.current -= 1;
            if (pendingRef.current <= 0 && !resolvedRef.current) {
              resolvedRef.current = true;
              onResolved();
            }
          }, duration);
        });
      }, 300); // sweeping duration
    }, 200); // correct-punch duration
  }

  return (
    <div className="journey-choices">
      {options.map((option) => {
        const status = statuses[option.key];
        const disintegrating = typeof status === "object" && status?.disintegrating;
        const classNames = ["journey-choice"];
        if (status === "correct-punch") classNames.push("is-correct-punch");
        if (status === "sweeping") classNames.push("is-sweeping");
        if (status === "selected") classNames.push("is-selected");
        if (status === "wrong") classNames.push("is-wrong");
        if (disintegrating) classNames.push("is-disintegrating");

        return (
          <button
            key={option.key}
            type="button"
            className={classNames.join(" ")}
            style={disintegrating ? { animationDuration: `${disintegrating}ms` } : undefined}
            onClick={() => handleTap(option)}
            disabled={locked && status === "idle"}
          >
            {(status === "sweeping" || status === "correct-punch") ? (
              <span className="journey-choice-sweep" aria-hidden="true" />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
