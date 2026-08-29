"use client";

// A teaching beat inside a section, placed immediately before the first round
// that asks for something the learner has not been shown.
//
// The section intro (0011, 0015) teaches the keywords, and the keyword round
// asks for exactly those. Node 2 then asked "which meaning belongs to this
// card?" against four sentences the learner had never seen — 0013 and 0016
// both noted the gap and neither closed it. This closes it the same way the
// keywords are handled: show it, say it is coming, then ask.
//
// Not a node. No XP, cannot be missed, never enters the review queue — it is a
// screen you pass through, like the intro.
export default function Teach({ teach, meta, onDone }) {
  return (
    <>
      <span className="format-line">New meaning</span>
      <p className="prompt">What it means</p>

      <div className="reference-card is-compact">
        {/* A div, not the button the exercises use: there is nothing to
            inspect here, the card is already the whole point of the screen. */}
        <div className="reference-art">
          <img src={teach.image} alt={teach.name} />
        </div>
        <p className="reference-name">{teach.name}</p>
      </div>

      <p className="unit-intro">{teach.body}</p>
      <p className="remember">Remember this — you'll be asked next.</p>

      {/* Inline, not the fixed footer: this screen exists to be read, and a
          pinned button sits on top of the sentence it is asking you to read. */}
      <button className="action" type="button" onClick={() => onDone()}>
        Got it
      </button>
      <p className="footer-meta">{meta}</p>
    </>
  );
}
