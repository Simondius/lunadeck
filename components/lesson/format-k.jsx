"use client";

import { useEffect, useState } from "react";
import { Inspector, Footer } from "./options";
import { XP_PER_NODE } from "@/lib/progress";

// Format K — pick the keywords that belong to this card.
//
// The only multi-select round in the app. The Style Guide's "only one option
// may be selected at a time" is a single-answer rule; this question has several
// answers, so it takes a set and confirms once. One shot: Check reveals
// everything at once — what you got, what you shouldn't have taken, and what
// you missed — because hunting for an exact combination is tedious and the
// learning is in seeing the whole set laid out.
export default function FormatK({ round, meta, formatLine, onAdvance, onHintReady }) {
  const [picked, setPicked] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [checked, setChecked] = useState(false);
  const [inspecting, setInspecting] = useState(null);

  const live = round.chips.filter((c) => !removed.includes(c.text));
  const perfect =
    live.every((c) => c.correct === picked.includes(c.text)) &&
    round.chips.filter((c) => c.correct).every((c) => picked.includes(c.text));

  function toggle(text) {
    if (checked) return;
    setPicked((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  }

  // The hint takes a wrong keyword out of play, the same as it eliminates a
  // wrong candidate elsewhere. Hinted chips don't count against a clean run.
  function hint() {
    if (checked) return;
    const spare = round.chips.find(
      (c) => !c.correct && !removed.includes(c.text) && !picked.includes(c.text)
    );
    if (spare) setRemoved((prev) => [...prev, spare.text]);
  }

  useEffect(() => {
    onHintReady(checked ? null : hint);
  }, [checked, removed, picked, onHintReady]);

  function stateFor(chip) {
    if (removed.includes(chip.text)) return "removed";
    if (!checked) return picked.includes(chip.text) ? "selected" : "default";
    if (chip.correct && picked.includes(chip.text)) return "correct";
    if (chip.correct) return "missed";
    if (picked.includes(chip.text)) return "wrong";
    return "default";
  }

  const found = round.chips.filter((c) => c.correct && picked.includes(c.text)).length;

  return (
    <>
      <span className="format-line">{formatLine}</span>
      <p className="prompt">{round.prompt}</p>

      <div className="reference-card is-compact">
        <button
          type="button"
          className="reference-art"
          onClick={() => setInspecting(round.reference)}
          aria-label={`Inspect ${round.reference.label}`}
        >
          <img src={round.reference.image} alt={round.reference.label} />
        </button>
        <p className="reference-name">{round.reference.label}</p>
      </div>

      <div className="chips">
        {round.chips.map((chip) => {
          const state = stateFor(chip);
          return (
            <button
              key={chip.text}
              type="button"
              className={`chip is-${state}`}
              onClick={() => toggle(chip.text)}
              disabled={checked || state === "removed"}
              aria-pressed={picked.includes(chip.text)}
            >
              {chip.text}
            </button>
          );
        })}
      </div>

      {!checked ? (
        <p className="gesture-hint">
          Pick every one that fits · {picked.length} chosen
        </p>
      ) : null}

      {checked ? (
        <div className={perfect ? "reveal" : "reveal is-miss"}>
          <div className="reveal-head">
            <strong>
              {perfect
                ? "All of them"
                : `${found} of ${round.correctCount}`}
            </strong>
            {perfect ? <span className="reveal-xp">+{XP_PER_NODE} XP</span> : null}
          </div>
          <span>{round.revealBody}</span>
        </div>
      ) : null}

      {inspecting ? (
        <Inspector item={inspecting} onClose={() => setInspecting(null)} />
      ) : null}

      <Footer
        label={checked ? "Next" : "Check"}
        disabled={!checked && picked.length === 0}
        onClick={checked ? () => onAdvance({ missed: !perfect }) : () => setChecked(true)}
        meta={meta}
      />
    </>
  );
}
