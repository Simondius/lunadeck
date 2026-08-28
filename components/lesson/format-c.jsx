"use client";

import { useMemo, useState } from "react";
import { seededShuffle } from "@/lib/rounds";
import { Footer } from "./options";

// Format C — Board Matching. No fixed reference and no Continue button
// anywhere, including at completion. A node listing more than 3 cards is split
// into several boards upstream in lib/rounds.js, so this component only ever
// renders a 2- or 3-row board. Tapping a left tile selects it; tapping a
// right tile evaluates immediately. Wrong tiles flash and return to
// selectable rather than being disabled. Matched pairs are removed, leaving
// the gap — no reflow.
export default function FormatC({ round, meta, formatLine, onAdvance }) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);

  // Seeded per board, not per board size — otherwise every 3-row board in the
  // curriculum would shuffle to the same order.
  const rightOrder = useMemo(
    () => seededShuffle(round.pairs.map((p) => p.key), `${round.seed}-right`),
    [round]
  );

  const complete = matched.length === round.pairs.length;

  function tapRight(key) {
    if (!selectedLeft || matched.includes(key)) return;

    if (selectedLeft === key) {
      setMatched((prev) => [...prev, key]);
      setSelectedLeft(null);
    } else {
      setWrongPair({ left: selectedLeft, right: key });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 500);
    }
  }

  function leftState(key) {
    if (matched.includes(key)) return "matched";
    if (wrongPair?.left === key) return "eliminated";
    if (selectedLeft === key) return "selected";
    return "default";
  }

  function rightState(key) {
    if (matched.includes(key)) return "matched";
    if (wrongPair?.right === key) return "eliminated";
    return "default";
  }

  return (
    <>
      <span className="format-line">{formatLine}</span>
      <p className="prompt">{round.prompt}</p>
      <p className="gesture-hint">
        Tap a card, then tap its meaning · {round.pairs.length - matched.length} left
      </p>

      <div className="board">
        <div className="board-column">
          {round.pairs.map((pair) => (
            <button
              key={pair.key}
              type="button"
              className={`tile tile-image is-${leftState(pair.key)}`}
              onClick={() => leftState(pair.key) !== "matched" && setSelectedLeft(pair.key)}
              disabled={leftState(pair.key) === "matched"}
            >
              <img src={pair.image} alt={pair.name} />
              <span className="tile-name">{pair.name}</span>
            </button>
          ))}
        </div>

        <div className="board-column">
          {rightOrder.map((key) => {
            const pair = round.pairs.find((p) => p.key === key);
            return (
              <button
                key={key}
                type="button"
                className={`tile tile-text is-${rightState(key)}`}
                onClick={() => tapRight(key)}
                disabled={rightState(key) === "matched"}
              >
                <span>{pair.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {complete ? (
        <div className="reveal">
          <strong>Board cleared</strong>
          <span>All pairs matched.</span>
        </div>
      ) : null}

      <Footer
        label={complete ? "Next" : null}
        disabled={!complete}
        onClick={onAdvance}
        meta={meta}
      />
    </>
  );
}
