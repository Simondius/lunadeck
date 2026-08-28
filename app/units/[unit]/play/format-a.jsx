"use client";

import { useEffect, useState } from "react";
import { ImageOption, TextOption, Inspector, Footer, gridClass } from "./options";

// Format A — Match to Grid. One fixed reference, 2-4 candidates, select then
// confirm, retry until correct. A wrong pick never ends the round.
export default function FormatA({ round, meta, onAdvance, onHintReady }) {
  const [selected, setSelected] = useState(null);
  const [eliminated, setEliminated] = useState([]);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [inspecting, setInspecting] = useState(null);

  const items = round.candidates.items;
  const isImages = round.candidates.type === "image";

  function check() {
    if (!selected) return;
    if (selected === round.answerKey) {
      setSolved(true);
    } else {
      setShake(true);
      setEliminated((prev) => [...prev, selected]);
      setSelected(null);
      setTimeout(() => setShake(false), 400);
    }
  }

  function hint() {
    if (solved) return;
    const candidate = items.find(
      (o) => o.key !== round.answerKey && !eliminated.includes(o.key)
    );
    if (!candidate) return;
    setEliminated((prev) => [...prev, candidate.key]);
    if (selected === candidate.key) setSelected(null);
  }

  useEffect(() => {
    onHintReady(solved ? null : () => hint);
  }, [solved, eliminated, selected, onHintReady]);

  function stateFor(option) {
    if (solved && option.key === round.answerKey) return "correct";
    if (eliminated.includes(option.key)) return "eliminated";
    if (solved) return "locked";
    if (selected === option.key) return "selected";
    return "default";
  }

  return (
    <>
      <p className="prompt">{round.prompt}</p>

      <Reference reference={round.reference} onInspect={setInspecting} />

      {isImages ? (
        <p className="gesture-hint">Tap to choose · Hold to inspect</p>
      ) : null}

      <div className={`${gridClass(items.length)}${shake ? " is-shaking" : ""}`}>
        {items.map((option) =>
          isImages ? (
            <ImageOption
              key={option.key}
              option={option}
              state={stateFor(option)}
              onSelect={() => setSelected(option.key)}
              onInspect={() => setInspecting(option)}
            />
          ) : (
            <TextOption
              key={option.key}
              option={option}
              state={stateFor(option)}
              onSelect={() => setSelected(option.key)}
            />
          )
        )}
      </div>

      {solved ? (
        <div className="reveal">
          <strong>{round.revealTitle}</strong>
          <span>{round.revealBody}</span>
        </div>
      ) : null}

      {inspecting ? (
        <Inspector item={inspecting} onClose={() => setInspecting(null)} />
      ) : null}

      <Footer
        label={solved ? "Next" : "Check"}
        disabled={!solved && !selected}
        onClick={solved ? onAdvance : check}
        meta={meta}
      />
    </>
  );
}

// The fixed reference is never selectable. Text panels scroll internally
// rather than truncating; image panels are inspect-only.
function Reference({ reference, onInspect }) {
  if (reference.type === "card") {
    return (
      <div className="reference-card">
        <button
          type="button"
          className="reference-art"
          onClick={() => onInspect(reference)}
          aria-label={`Inspect ${reference.label}`}
        >
          <img src={reference.image} alt={reference.label} />
        </button>
        <p className="reference-name">{reference.label}</p>
      </div>
    );
  }

  if (reference.type === "chips") {
    return (
      <div className="anchor">
        {reference.items.map((word) => (
          <span key={word} className="keyword">
            {word}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="anchor anchor-prose">
      <p>{reference.text}</p>
    </div>
  );
}
