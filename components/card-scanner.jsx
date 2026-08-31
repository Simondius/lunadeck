"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useScrollLock } from "./use-scroll-lock";

// Pointing a phone at a card and being told what it is.
//
// The camera is real: getUserMedia, the rear lens where there is one, a live
// viewfinder, and a capture that keeps the actual frame. **Recognising the card
// in that frame is not.** There is no vision model wired up here, so the step
// between "captured" and "this is the Eight of Cups" is a placeholder.
//
// That placeholder is deliberately shaped as a *confirmation* rather than an
// assertion. Two reasons. It does not lie: the screen asks whether it got the
// card right instead of announcing that it did. And it is not throwaway work,
// because real card recognition needs exactly this step anyway — a photo of a
// tarot card in a dim room at an angle will be wrong often enough that a
// confirm-and-correct pass is part of the feature, not an apology for it.
//
// The one line of UI that admits the guess is currently random is there so a
// playtester with a real deck knows why it keeps being wrong, and can go
// straight to the picker instead of concluding the whole thing is broken.

const IDENTIFY_MS = 900;

export default function CardScanner({ deck, taken = [], onIdentified, onClose }) {
  // starting | live | identifying | confirm | manual | blocked
  const [stage, setStage] = useState("starting");
  const [error, setError] = useState(null);
  const [shot, setShot] = useState(null);
  const [guess, setGuess] = useState(null);
  const [reversed, setReversed] = useState(false);
  const [query, setQuery] = useState("");

  // Covers the whole frame, so nothing behind it should scroll.
  useScrollLock();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const available = deck.filter((card) => !taken.includes(card.key));

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function open() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setError("This browser will not give the page a camera.");
          setStage("blocked");
        }
        return;
      }
      try {
        // The rear lens on a phone, the only one on a laptop. `ideal` rather
        // than `exact` so a device with one camera still opens it.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Autoplay needs the muted+playsInline pair set on the element; the
          // play() is for browsers that still want it asked for explicitly.
          await videoRef.current.play().catch(() => {});
        }
        setStage("live");
      } catch (cause) {
        if (cancelled) return;
        // Denied is the common one and reads differently from broken, so it
        // gets its own sentence and the manual route is offered either way.
        setError(
          cause?.name === "NotAllowedError"
            ? "Camera access was declined."
            : "The camera would not open."
        );
        setStage("blocked");
      }
    }

    open();
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      stopCamera();
    };
  }, [stopCamera]);

  // Keep the captured frame. A real recogniser would read this; here it is
  // shown next to the guess so the confirm step has something to confirm
  // against, and so the capture visibly did something.
  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    // Downscaled: this only has to be legible on a phone, and a full-res frame
    // as a data URL is megabytes held in React state.
    const width = 640;
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);

    setShot(canvas.toDataURL("image/jpeg", 0.8));
    setStage("identifying");

    // The placeholder. A pause, then a card, because the pause is where the
    // recognition would go and the screen should be honest about the shape of
    // the interaction even while the middle of it is missing.
    timerRef.current = window.setTimeout(() => {
      const pool = available.length ? available : deck;
      setGuess(pool[Math.floor(Math.random() * pool.length)]);
      setReversed(false);
      setStage("confirm");
    }, IDENTIFY_MS);
  }

  function accept(card) {
    stopCamera();
    onIdentified({ ...card, reversed });
  }

  const matches = query.trim()
    ? available.filter((card) => card.name.toLowerCase().includes(query.trim().toLowerCase()))
    : available;

  return (
    <div
      className="scanner"
      role="dialog"
      aria-modal="true"
      aria-label="Scan a card"
    >
      <header className="scanner-bar">
        <span className="scanner-title">
          {stage === "manual" ? "Which card?" : "Scan a card"}
        </span>
        <button className="scanner-close" type="button" onClick={onClose}>
          Cancel
        </button>
      </header>

      {stage === "manual" ? (
        <Picker
          matches={matches}
          query={query}
          setQuery={setQuery}
          reversed={reversed}
          setReversed={setReversed}
          onPick={accept}
        />
      ) : stage === "confirm" && guess ? (
        <div className="scanner-body">
          <div className="scanner-pair">
            {shot ? (
              <figure className="scanner-shot">
                <img src={shot} alt="The card you photographed" />
                <figcaption>Your card</figcaption>
              </figure>
            ) : null}
            <figure className={reversed ? "scanner-guess is-reversed" : "scanner-guess"}>
              <img src={guess.master} alt="" />
              <figcaption>{guess.name}</figcaption>
            </figure>
          </div>

          <p className="scanner-question">Is this the card?</p>
          <p className="scanner-caveat">
            Recognition isn&rsquo;t built yet, so this is a guess. Correcting it
            takes a tap.
          </p>

          <label className="scanner-toggle">
            <input
              type="checkbox"
              checked={reversed}
              onChange={(event) => setReversed(event.target.checked)}
            />
            It came up reversed
          </label>

          <button className="action" type="button" onClick={() => accept(guess)}>
            Yes, that&rsquo;s it
          </button>
          <button
            className="action-quiet"
            type="button"
            onClick={() => {
              setQuery("");
              setStage("manual");
            }}
          >
            Pick the right card
          </button>
        </div>
      ) : stage === "blocked" ? (
        <div className="scanner-body">
          <div className="scanner-blocked">
            <p className="scanner-question">{error}</p>
            <p className="scanner-caveat">
              You can still tell the app which card you pulled.
            </p>
          </div>
          <button
            className="action"
            type="button"
            onClick={() => {
              setQuery("");
              setStage("manual");
            }}
          >
            Choose the card
          </button>
        </div>
      ) : (
        <div className="scanner-body">
          <div className="scanner-frame">
            <video
              ref={videoRef}
              className="scanner-video"
              muted
              playsInline
              autoPlay
            />
            <div className="scanner-reticle" aria-hidden="true" />
            {stage === "identifying" ? (
              <div className="scanner-working">
                <span className="scanner-spinner" aria-hidden="true" />
                Reading the card&hellip;
              </div>
            ) : null}
          </div>

          <p className="scanner-hint">
            {stage === "starting"
              ? "Opening the camera…"
              : "Hold the card inside the frame."}
          </p>

          <button
            className="action"
            type="button"
            onClick={capture}
            disabled={stage !== "live"}
          >
            Capture
          </button>
          <button
            className="action-quiet"
            type="button"
            onClick={() => {
              setQuery("");
              setStage("manual");
            }}
          >
            Enter it by hand
          </button>
        </div>
      )}
    </div>
  );
}

function Picker({ matches, query, setQuery, reversed, setReversed, onPick }) {
  return (
    <div className="scanner-body is-picker">
      <label className="sr-only" htmlFor="scanner-search">
        Search the deck
      </label>
      <input
        id="scanner-search"
        className="scanner-search"
        type="search"
        placeholder="Search the deck"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />

      <label className="scanner-toggle">
        <input
          type="checkbox"
          checked={reversed}
          onChange={(event) => setReversed(event.target.checked)}
        />
        It came up reversed
      </label>

      {matches.length === 0 ? (
        <p className="scanner-hint">No card by that name is left in the deck.</p>
      ) : (
        <ul className="scanner-list">
          {matches.map((card) => (
            <li key={card.key}>
              <button className="scanner-option" type="button" onClick={() => onPick(card)}>
                <span className="scanner-thumb">
                  <img src={card.master} alt="" />
                </span>
                {card.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
