"use client";

import { useEffect, useState } from "react";
import { ImageOption, TextOption, Inspector, Footer, gridClass } from "./options";
import { XP_PER_NODE } from "@/lib/progress";

// Format A — Match to Grid. One fixed reference, 2-4 candidates, select then
// confirm, retry until correct. A wrong pick never ends the round.
//
// The same component serves the card variants (A1/A2/A3) and the symbol ones
// (A4/A5/A7) — they differ only in what sits on each side of the screen, which
// is exactly the split the Format Bible describes as "layout shapes."
export default function FormatA({ round, meta, formatLine, onAdvance, onHintReady }) {
  const [selected, setSelected] = useState(null);
  const [eliminated, setEliminated] = useState([]);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [inspecting, setInspecting] = useState(null);

  const items = round.candidates.items;
  const candidateType = round.candidates.type;
  const isImages = candidateType === "image" || candidateType === "symbol";

  function check() {
    if (!selected) return;
    if (selected === round.answerKey) {
      setSolved(true);
    } else {
      setShake(true);
      setEliminated((prev) => [...prev, selected]);
      setSelected(null);
      setTimeout(() => setShake(false), 380);
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
      <span className="format-line">{formatLine}</span>
      <p className="prompt">{round.prompt}</p>

      <Reference reference={round.reference} onInspect={setInspecting} />

      <div className={`${gridClass(items.length)}${shake ? " is-shaking" : ""}`}>
        {items.map((option) =>
          isImages ? (
            <ImageOption
              key={option.key}
              option={option}
              variant={candidateType === "symbol" ? "symbol" : "card"}
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

      {/* The gesture hint sits below the grid so the prompt and the candidates
          stay adjacent. */}
      {isImages ? (
        <p className="gesture-hint">TAP TO CHOOSE · HOLD TO INSPECT</p>
      ) : null}

      {solved ? (
        <div className={round.tone === "symbol" ? "reveal is-symbol" : "reveal"}>
          <div className="reveal-head">
            <strong>{round.revealTitle}</strong>
            <span className="reveal-xp">+{XP_PER_NODE} XP</span>
          </div>
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
//
// Neither a symbol reference (A4/A5) nor a symbol candidate (A7) carries its
// own name. The Bible pairs symbol icons with a "Category: Name" label, but
// the Style Guide's Section 4 rule — a candidate never shows the identity
// that would give the answer away — outranks it on both of those screens,
// where naming the icon *is* the question.
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

  if (reference.type === "symbol") {
    return (
      <div className="reference-card">
        <button
          type="button"
          className="reference-symbol"
          onClick={() => onInspect(reference)}
          aria-label="Inspect this symbol"
        >
          <img src={reference.image} alt="" />
        </button>
      </div>
    );
  }

  if (reference.type === "label") {
    return (
      <div className="anchor anchor-label">
        <span className="anchor-type">{reference.category}</span>
        <p>{reference.name}</p>
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
