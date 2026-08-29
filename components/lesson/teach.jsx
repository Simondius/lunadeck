"use client";

// A teaching beat inside a section, placed immediately before the first round
// that assumes something the learner has not been shown.
//
// The section intro teaches the keywords and the keyword round asks for
// exactly those (0016). Everything after that beat used to quiz content that
// had never appeared: the meaning at node 2, the reading notes at node 4, the
// symbol wherever a symbol format lands. Each of those now gets its own beat,
// in front of the round that needs it. See 0017.
//
// Not a node. No XP, nothing to miss, never queued for review — a screen you
// pass through, like the intro.
export default function Teach({ teach, meta, onDone }) {
  const { art } = teach;

  return (
    <>
      <span className="format-line">{teach.eyebrow}</span>
      <p className="prompt">{teach.title}</p>

      <div className="reference-card is-compact">
        {/* A div, not the button the exercises use: there is nothing to open
            here, the art is already the whole point of the screen. */}
        <div className={art.kind === "symbol" ? "reference-symbol" : "reference-art"}>
          <img src={art.image} alt={art.label} />
        </div>
        <p className="reference-name">{art.label}</p>
      </div>

      {teach.body ? <p className="unit-intro">{teach.body}</p> : null}

      {teach.items?.length ? (
        <ul className="teach-list">
          {teach.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <p className="remember">Remember this — you'll be asked next.</p>

      {/* Inline, not the fixed footer: this screen exists to be read, and a
          pinned button sits on top of what it is asking you to read. */}
      <button className="action" type="button" onClick={() => onDone()}>
        Got it
      </button>
      <p className="footer-meta">{meta}</p>
    </>
  );
}
