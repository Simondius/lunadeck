"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useScrollLock } from "./use-scroll-lock";

// Pointing a phone at a card and being told what it is.
//
// Both halves are real now. The camera is getUserMedia, the rear lens where
// there is one, a live viewfinder and a capture that keeps the frame; and the
// frame goes to /api/scan, which identifies the card against the 78 in the
// deck and says which way up it was. See 0043 for how well that works and how
// it was measured.
//
// The confirm step stays, and is not an apology for a weak guess: a photo of a
// card in a dim room at an angle will sometimes be wrong, and it is cheaper to
// be asked than to find a card you did not pull sitting in your reading. What
// the confirm screen says depends on how sure the answer was:
//
//   high  the card, stated, with a way to correct it
//   low   the card, offered as a question, with the picker one tap away
//
// A low answer means the app could not read the printed name and worked from
// the imagery instead. That is exactly when a person should be asked, so `low`
// is routed to asking rather than buried.

// Below this a frame is not a photograph of a card, it is a placeholder the
// stream has not filled in yet.
const MIN_FRAME_WIDTH = 240;

export default function CardScanner({ deck, taken = [], onIdentified, onClose }) {
  // starting | live | identifying | confirm | manual | blocked | failed
  const [stage, setStage] = useState("starting");
  const [error, setError] = useState(null);
  const [shot, setShot] = useState(null);
  const [guess, setGuess] = useState(null);
  const [sure, setSure] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [query, setQuery] = useState("");
  // A frame has actually arrived and is big enough to read a card off.
  //
  // Not the same thing as the stream being open: play() can resolve before
  // the first frame, so "live" alone would let someone press Capture and
  // have nothing happen at all. Found by testing against a canvas-backed
  // stream, which reports 2x2 until its first paint and produced a capture
  // the server rejected as too small to be a card.
  const [frameReady, setFrameReady] = useState(false);

  // Covers the whole frame, so nothing behind it should scroll.
  useScrollLock();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
      stopCamera();
    };
  }, [stopCamera]);

  // The captured frame is both what gets identified and what the confirm
  // screen shows beside the answer, so you can see what the camera actually
  // got when the answer is wrong.
  async function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth < MIN_FRAME_WIDTH) return;

    const canvas = document.createElement("canvas");
    // 1024 wide. The card's small top numeral has to survive this, since it is
    // the whole difference between the Two and the Ten of a suit, and the
    // server downscales to 768 from here anyway. A full-res frame as a data
    // URL would be megabytes held in React state.
    const width = Math.min(1024, video.videoWidth);
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setShot(dataUrl);
    setStage("identifying");
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "That scan did not go through.");

      setGuess({ key: data.key, name: data.name, master: data.master });
      // The scan's own reading of which way up the card lay, which the toggle
      // can still override.
      setReversed(!!data.reversed);
      setSure(data.confidence === "high");
      setStage("confirm");
    } catch (cause) {
      // A failed scan is not a dead end: the picker is always there, and the
      // reason is worth saying rather than silently falling back.
      setError(cause.message);
      setStage("failed");
    }
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
            {/* Shown the right way up even when the card was pulled reversed.
                The question this screen asks is which card it is, and turning
                the answer upside down to mirror the photo makes the name
                harder to read, which works against the one thing being
                confirmed. Orientation is carried by the checkbox below, which
                arrives already ticked. */}
            <figure className="scanner-guess">
              <img src={guess.master} alt="" />
              <figcaption>
                {guess.name}
                {reversed ? ", reversed" : ""}
              </figcaption>
            </figure>
          </div>

          <p className="scanner-question">
            {sure ? guess.name : `Is this the ${guess.name}?`}
          </p>
          <p className="scanner-caveat">
            {sure
              ? "Read off the card. Change it if that's not right."
              : "I couldn't read the name on it, so this is from the picture. Worth checking."}
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
            {sure ? "Add it" : "Yes, that’s it"}
          </button>
          <button
            className="action-quiet"
            type="button"
            onClick={() => {
              setQuery("");
              setStage("manual");
            }}
          >
            Pick a different card
          </button>
        </div>
      ) : stage === "failed" ? (
        <div className="scanner-body">
          <div className="scanner-blocked">
            <p className="scanner-question">That scan didn&rsquo;t work.</p>
            <p className="scanner-caveat">{error}</p>
          </div>
          <button className="action" type="button" onClick={() => setStage("live")}>
            Try again
          </button>
          <button
            className="action-quiet"
            type="button"
            onClick={() => {
              setQuery("");
              setStage("manual");
            }}
          >
            Choose the card instead
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
              // onResize as well as onLoadedMetadata: a stream can report a
              // placeholder size first and its real one a frame later.
              onLoadedMetadata={(event) =>
                setFrameReady(event.currentTarget.videoWidth >= MIN_FRAME_WIDTH)
              }
              onResize={(event) =>
                setFrameReady(event.currentTarget.videoWidth >= MIN_FRAME_WIDTH)
              }
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
              : frameReady
                ? "Hold the card inside the frame."
                : "Waiting for the first frame…"}
          </p>

          <button
            className="action"
            type="button"
            onClick={capture}
            disabled={stage !== "live" || !frameReady}
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
