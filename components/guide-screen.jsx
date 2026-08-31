"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import CardScanner from "./card-scanner";
import { useScrollLock } from "./use-scroll-lock";
import * as session from "@/lib/guide-session";
import { MAX_CARDS, MAX_QUESTION } from "@/lib/live-reading";

// The Guide tab.
//
// The other two reading surfaces deal for you. This one does not: you are
// sitting with a real deck, you pull, and the app tells you what you are
// looking at and what the cards add up to. That makes it the only screen where
// the app is following the session rather than running it, which is why it is
// built as one session with a clear end rather than as a page you can be
// halfway through by accident.
//
// The flow, and the order matters because each step only makes sense once the
// one before it is done:
//
//   idle      start a reading
//   scanning  scan cards one at a time, say when you have finished
//   ready     the spread, an optional question, ask for the interpretation
//   reading   the takeaway, the cards, then ask more / scan more / share / end
//
// Adding a card after an interpretation throws that interpretation away
// (lib/guide-session.js does it, not this screen) because a reading of five
// cards is not a reading of six with a paragraph bolted on.

export default function GuideScreen({ deck = [] }) {
  const live = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot
  );

  // The store returns null on the server and on the first client render, so
  // everything below waits for the mount rather than rendering a session it
  // cannot see yet.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [scanning, setScanning] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState("");
  const [sharing, setSharing] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const cards = live?.cards ?? [];
  const reading = live?.reading ?? null;

  async function interpret() {
    setError(null);
    setAsking(true);
    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "interpret",
          question: question.trim(),
          cards: cards.map(({ key, reversed }) => ({ key, reversed })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "The reading failed.");
      session.recordReading({
        question: question.trim(),
        headline: data.headline,
        takeaway: data.takeaway,
        cards: data.cards,
      });
      setQuestion("");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setAsking(false);
    }
  }

  if (!mounted) {
    return (
      <Shell>
        <div className="guide-hero">
          <p className="reader-intro">Loading&hellip;</p>
        </div>
      </Shell>
    );
  }

  if (!live) {
    return (
      <Shell>
        <Opening onStart={() => session.start()} />
      </Shell>
    );
  }

  return (
    <Shell>
      {reading ? (
        <Interpretation
          live={live}
          onScanMore={() => setScanning(true)}
          onShare={() => setSharing(true)}
          onEnd={() => setConfirmEnd(true)}
        />
      ) : (
        <Gathering
          cards={cards}
          question={question}
          setQuestion={setQuestion}
          asking={asking}
          error={error}
          onScan={() => setScanning(true)}
          onInterpret={interpret}
          onEnd={() => setConfirmEnd(true)}
        />
      )}

      {scanning ? (
        <CardScanner
          deck={deck}
          taken={cards.map((card) => card.key)}
          onClose={() => setScanning(false)}
          onIdentified={(card) => {
            session.addCard(card);
            setScanning(false);
          }}
        />
      ) : null}

      {sharing ? <ShareSheet live={live} onClose={() => setSharing(false)} /> : null}

      {confirmEnd ? (
        <ConfirmEnd
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => {
            session.end();
            setConfirmEnd(false);
            setQuestion("");
            setError(null);
          }}
        />
      ) : null}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="shell starfield">
      <header className="statusbar">
        <div>
          <span className="statusbar-where">Guide</span>
        </div>
      </header>
      <div className="statusrule" />
      <h1 className="sr-only">Guide</h1>
      {children}
    </main>
  );
}

function Opening({ onStart }) {
  return (
    <div className="guide-hero">
      <div className="reader-portrait">
        <img src="/assets/misc/reader.webp" alt="" />
      </div>

      <p className="reader-intro">
        Reading with your own deck? Pull as you normally would, scan each card,
        and I&rsquo;ll tell you what they say together.
      </p>

      <button className="action" type="button" onClick={onStart}>
        Start reading
      </button>
    </div>
  );
}

function Gathering({
  cards,
  question,
  setQuestion,
  asking,
  error,
  onScan,
  onInterpret,
  onEnd,
}) {
  const full = cards.length >= MAX_CARDS;

  if (asking) return <Considering cards={cards} />;

  return (
    <div className="guide-gather">
      <div className="guide-step">
        <span className="guide-step-count">
          {cards.length === 0
            ? "No cards yet"
            : `${cards.length} ${cards.length === 1 ? "card" : "cards"} scanned`}
        </span>
        <p className="guide-step-hint">
          {cards.length === 0
            ? "Scan the first card you pulled."
            : "Scan the rest, then say when you have finished."}
        </p>
      </div>

      {cards.length > 0 ? <ScannedCards cards={cards} /> : null}

      <button className="action" type="button" onClick={onScan} disabled={full}>
        {cards.length === 0 ? "Scan a card" : "Scan another card"}
      </button>
      {full ? (
        <p className="guide-note">
          That is {MAX_CARDS} cards, which is as many as one reading takes here.
        </p>
      ) : null}

      {cards.length > 0 ? (
        <div className="guide-ask">
          <p className="suit-head">Anything you want to ask?</p>
          <label className="sr-only" htmlFor="guide-question">
            Your question, if you have one
          </label>
          <textarea
            id="guide-question"
            className="ask-field"
            rows={3}
            maxLength={MAX_QUESTION}
            placeholder="Optional. Leave it blank and I&rsquo;ll just read the cards."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          {error ? <p className="ask-error">{error}</p> : null}
          <button className="action" type="button" onClick={onInterpret}>
            Done scanning, read them
          </button>
        </div>
      ) : null}

      <button className="action-quiet" type="button" onClick={onEnd}>
        End session
      </button>
    </div>
  );
}

// The scanned cards, each removable and each flippable between upright and
// reversed. Both matter more here than anywhere else in the app: this is the
// one place the data comes from a person reading a physical card, so this is
// the one place a mistake needs undoing without starting over.
function ScannedCards({ cards }) {
  return (
    <ul className="guide-scanned">
      {cards.map((card) => (
        <li key={card.key} className="guide-scanned-row">
          <span className={card.reversed ? "guide-thumb is-reversed" : "guide-thumb"}>
            {card.master ? <img src={card.master} alt="" /> : null}
          </span>
          <span className="guide-scanned-name">
            {card.name}
            <span className="guide-scanned-line">
              {card.reversed ? "Reversed" : "Upright"}
            </span>
          </span>
          <button
            className="guide-flip"
            type="button"
            onClick={() => session.setReversed(card.key, !card.reversed)}
          >
            Flip
          </button>
          <button
            className="guide-remove"
            type="button"
            onClick={() => session.removeCard(card.key)}
            aria-label={`Remove ${card.name}`}
          >
            &times;
          </button>
        </li>
      ))}
    </ul>
  );
}

function Considering({ cards }) {
  return (
    <div className="waiting">
      <div className="waiting-fan">
        {cards.slice(0, 5).map((card, i) => (
          <span
            key={card.key}
            className="waiting-card"
            style={{ "--i": i, "--n": Math.min(cards.length, 5) }}
          >
            {card.master ? <img src={card.master} alt="" /> : null}
          </span>
        ))}
      </div>
      <p className="waiting-line">Reading the cards&hellip;</p>
    </div>
  );
}

function Interpretation({ live, onScanMore, onShare, onEnd }) {
  const { reading, question } = live;

  return (
    <div className="guide-reading">
      {question ? (
        <div className="prompt-card">
          <span className="prompt-card-label">You asked</span>
          <p>{question}</p>
        </div>
      ) : null}

      <div className="takeaway-block">
        <span className="takeaway-label">Your reading</span>
        {reading.headline ? (
          <p className="takeaway-headline">{reading.headline}</p>
        ) : null}
        <p className="takeaway">{reading.takeaway}</p>
      </div>

      <div className="detail">
        {reading.cards.map((card) => (
          <section key={card.key} className="detail-card">
            <div className="detail-art">
              <img
                className={card.reversed ? "is-reversed" : undefined}
                src={card.master}
                alt=""
              />
            </div>
            <h2 className="detail-name">
              {card.name}
              <span className="detail-line">{card.reversed ? "Reversed" : "Upright"}</span>
            </h2>
            {card.note ? <p className="reading-body">{card.note}</p> : null}
          </section>
        ))}
      </div>

      <FollowUps live={live} />

      <div className="guide-actions">
        <button className="action-quiet" type="button" onClick={onScanMore}>
          Pulled another card? Scan it
        </button>
        <button className="action-quiet" type="button" onClick={onShare}>
          Share this reading
        </button>
        <button className="action-quiet is-end" type="button" onClick={onEnd}>
          End session
        </button>
      </div>
    </div>
  );
}

function FollowUps({ live }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const trimmed = question.trim();

  // The send is guarded rather than the effect: a double-submit here costs a
  // paid call and returns a second answer nobody asked for. Same lesson as the
  // reader's daily draw, which billed twice under StrictMode (0031).
  const inFlight = useRef(false);

  async function ask(event) {
    event.preventDefault();
    if (!trimmed || inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setAsking(true);
    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "question",
          question: trimmed,
          cards: live.cards.map(({ key, reversed }) => ({ key, reversed })),
          reading: live.reading,
          history: live.history,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "That did not go through.");
      session.recordAnswer({ question: trimmed, answer: data.answer });
      setQuestion("");
    } catch (cause) {
      setError(cause.message);
    } finally {
      inFlight.current = false;
      setAsking(false);
    }
  }

  return (
    <div className="guide-followups">
      {live.history.length > 0 ? (
        <div className="guide-thread">
          {live.history.map((turn, i) => (
            <div key={i} className="guide-turn">
              <p className="guide-turn-q">{turn.question}</p>
              {turn.answer.split(/\n{2,}/).map((para, j) => (
                <p key={j} className="reading-body">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      <form className="guide-followup-form" onSubmit={ask}>
        <p className="suit-head">Ask about these cards</p>
        <label className="sr-only" htmlFor="guide-followup">
          Your question about the reading
        </label>
        <textarea
          id="guide-followup"
          className="ask-field"
          rows={2}
          maxLength={MAX_QUESTION}
          placeholder="Ask about a card, or about the reading"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={asking}
        />
        {error ? <p className="ask-error">{error}</p> : null}
        <button className="action" type="submit" disabled={!trimmed || asking}>
          {asking ? "Thinking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

// Share targets, drawn but not wired. Tia asked for the UI only, so these do
// nothing on purpose rather than half-working: a button that opens the wrong
// app, or silently fails, is worse than one that says what it will be.
const SHARE_TARGETS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "copy", label: "Copy text" },
  { key: "more", label: "More…" },
];

function ShareSheet({ live, onClose }) {
  const count = live.cards.length;
  useScrollLock();

  return (
    <div className="confirm-scrim" role="presentation" onClick={onClose}>
      <div
        className="confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="confirm-title" id="share-title">
          Share this reading
        </h2>
        <p className="confirm-body">
          {count} {count === 1 ? "card" : "cards"}
          {live.reading?.headline ? `, and "${live.reading.headline}"` : ""}
        </p>

        <div className="share-targets">
          {SHARE_TARGETS.map((target) => (
            <button key={target.key} className="share-target" type="button" disabled>
              <span className={`share-glyph is-${target.key}`} aria-hidden="true" />
              {target.label}
            </button>
          ))}
        </div>

        <p className="guide-note">Sharing isn&rsquo;t connected up yet.</p>

        <button className="action-quiet" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// Ending throws away the reading and the cards, and there is no undo, so it
// asks first — same pattern as removing a friend on the Social tab. Cancel is
// the focused control, because the destructive answer should never be the one
// a stray return key picks.
function ConfirmEnd({ onCancel, onConfirm }) {
  useScrollLock();
  const cancelRef = useRef(null);
  useEffect(() => cancelRef.current?.focus(), []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="confirm-scrim" role="presentation" onClick={onCancel}>
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="end-title"
        aria-describedby="end-body"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="confirm-title" id="end-title">
          End this session?
        </h2>
        <p className="confirm-body" id="end-body">
          The cards and the reading go with it. Nothing is kept.
        </p>
        <div className="confirm-actions">
          <button className="action confirm-remove" type="button" onClick={onConfirm}>
            End session
          </button>
          <button className="action-quiet" type="button" ref={cancelRef} onClick={onCancel}>
            Keep reading
          </button>
        </div>
      </div>
    </div>
  );
}
