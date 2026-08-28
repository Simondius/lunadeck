"use client";

import { useState } from "react";
import { Inspector, Footer } from "./options";
import { XP_PER_NODE } from "@/lib/progress";

// Format B — True/False Statement. A wrong answer ends the round immediately;
// there is no retry. Every False round shows the donor reveal afterwards,
// whether the learner was right or wrong, because that's what completes the
// learning rather than the score.
//
// The card and the statement sit side by side rather than stacked, so the
// statement, both buttons and the reveal all fit above the fold.
export default function FormatB({ round, meta, formatLine, onAdvance }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [showingDonor, setShowingDonor] = useState(false);
  const [inspecting, setInspecting] = useState(null);

  const wasRight = selected === (round.isTrue ? "true" : "false");
  const needsDonorScreen = !round.isTrue && round.donor;

  function confirm() {
    if (!selected) return;
    setAnswered(true);
  }

  if (showingDonor && round.donor) {
    return (
      <>
        <span className="format-line">{formatLine}</span>
        <p className="prompt">That statement belongs to another card.</p>
        <div className="reference-card">
          <img className="donor-art" src={round.donor.image} alt={round.donor.name} />
          <p className="reference-name">{round.donor.name}</p>
        </div>
        <div className="statement statement-donor">{round.donor.statement}</div>
        <Footer label="Next" disabled={false} onClick={onAdvance} meta={meta} />
      </>
    );
  }

  return (
    <>
      <span className="format-line">{formatLine}</span>
      <p className="prompt">{round.prompt}</p>

      <div className="reference-split">
        <div>
          <button
            type="button"
            className="reference-art"
            onClick={() => setInspecting({ image: round.image, label: round.cardName })}
            aria-label={`Inspect ${round.cardName}`}
          >
            <img src={round.image} alt={round.cardName} />
          </button>
          <p className="reference-name">{round.cardName}</p>
        </div>
        <div className="statement">{round.statement}</div>
      </div>

      <div className="binary">
        {["true", "false"].map((value) => {
          let state = "default";
          if (answered) {
            const isAnswer = value === (round.isTrue ? "true" : "false");
            if (isAnswer) state = "correct";
            else if (selected === value) state = "eliminated";
            else state = "locked";
          } else if (selected === value) {
            state = "selected";
          }
          return (
            <button
              key={value}
              type="button"
              className={`option option-binary is-${state}`}
              onClick={() => !answered && setSelected(value)}
              aria-pressed={selected === value}
            >
              {value === "true" ? "True" : "False"}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className={wasRight ? "reveal" : "reveal is-miss"}>
          <div className="reveal-head">
            <strong>{wasRight ? "Correct" : "Not this time"}</strong>
            {wasRight ? <span className="reveal-xp">+{XP_PER_NODE} XP</span> : null}
          </div>
          <span>
            {round.isTrue
              ? "That statement belongs to this card."
              : "That statement was borrowed from a different card."}
          </span>
        </div>
      ) : null}

      {inspecting ? (
        <Inspector item={inspecting} onClose={() => setInspecting(null)} />
      ) : null}

      <Footer
        label={answered ? (needsDonorScreen ? "See the card" : "Next") : "Check"}
        disabled={!answered && !selected}
        onClick={
          answered
            ? needsDonorScreen
              ? () => setShowingDonor(true)
              : onAdvance
            : confirm
        }
        meta={meta}
      />
    </>
  );
}
