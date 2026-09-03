"use client";

import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import TutorialGhost from "./tutorial-ghost";
import { Inspector } from "@/components/lesson/options";
import { masterForKey, seededShuffle } from "@/lib/rounds";
import { consumeTutorialSlot } from "@/lib/tutorial-gate";

// Same brief chip-reject timing as drag-chip.jsx/zone-chip.jsx; the blank
// carries the drama, the chip just gets out of the way fast.
const CHIP_REJECT_MS = 180;
const BLANK_REJECT_MS = 460;
const CONTINUE_FADE_MS = 500;
const SHIMMER_MS = 700;
const SENTENCE_SHIMMER_MS = 1400;
// A node's closing round can recap every sentence before it into one long
// paragraph (Fool node 8's does, at 12 blanks) - far more than the 1-3 a
// normal round asks for. Past this many blanks, the card comes off screen
// entirely and the sentence drops to a smaller size, so the whole thing -
// paragraph and word bank both - still fits without scrolling.
const RECAP_BLANK_THRESHOLD = 6;
// A blank in running text is a much smaller target than a whole card or a
// card zone — the other two drag targets in v2. Real-finger drops land near
// but not exactly on it more often than a mouse does, so the hit test is
// padded past the blank's own drawn box rather than matching it exactly.
const BLANK_HIT_PADDING = 18;

// "The Fool stands at both the start and end of the {b1}, {b2} becoming..."
// splits into alternating text/blank tokens, in source order, for rendering
// as one running paragraph with inline drop targets.
function parseSentence(text) {
  const parts = text.split(/\{(\w+)\}/g);
  const tokens = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) tokens.push({ type: "text", value: parts[i] });
    } else {
      tokens.push({ type: "blank", key: parts[i] });
    }
  }
  return tokens;
}

function bankWords(round) {
  const real = round.blanks.map((b) => ({ text: b.answer, blankKey: b.key }));
  const wrong = round.distractors.map((d) => ({ text: d, blankKey: null }));
  return seededShuffle([...real, ...wrong], round.id).map((w, i) => ({
    ...w,
    listKey: `${round.id}-${i}`,
  }));
}

// A word from the bank, dragged onto whichever blank it belongs over —
// checked against every blank's own DOM rect (blankRefs), not a single
// shared target the way drag-chip.jsx's keyword rounds work, since a cloze
// round has several distinct drop targets in one sentence. forwardRef so the
// tutorial demo (round 1 only) can grab the real chip it needs to animate.
const BankChip = forwardRef(function BankChip(
  { word, blankRefs, disabled, fadingDelay, onAccepted, onRejected },
  ref
) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState("idle"); // idle | dragging | rejected
  const drag = useRef(null);

  function onPointerDown(event) {
    if (disabled || status !== "idle") return;
    // See drag-chip.jsx's own onPointerDown — without this a real touch can
    // read the press as "select this text" instead of the start of a drag.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY };
    setStatus("dragging");
  }

  function onPointerMove(event) {
    if (!drag.current) return;
    setOffset({
      x: event.clientX - drag.current.startX,
      y: event.clientY - drag.current.startY,
    });
  }

  function resolve(event) {
    if (!drag.current) return;
    drag.current = null;

    let hitKey = null;
    let hitEl = null;
    for (const [key, el] of blankRefs.current.entries()) {
      // A filled blank isn't a valid target at all, not a wrong one - it
      // has to behave exactly like nothing was there, no reject animation,
      // no missed count. Once a blank has an answer, it stays taken.
      if (!el || el.classList.contains("is-filled")) continue;
      const r = el.getBoundingClientRect();
      if (
        event.clientX >= r.left - BLANK_HIT_PADDING &&
        event.clientX <= r.right + BLANK_HIT_PADDING &&
        event.clientY >= r.top - BLANK_HIT_PADDING &&
        event.clientY <= r.bottom + BLANK_HIT_PADDING
      ) {
        hitKey = key;
        hitEl = el;
        break;
      }
    }

    if (hitKey) {
      if (word.blankKey === hitKey) {
        onAccepted(word);
        return;
      }
      onRejected?.(word);
      hitEl.classList.remove("is-rejecting");
      void hitEl.offsetWidth;
      hitEl.classList.add("is-rejecting");
      window.setTimeout(() => hitEl.classList.remove("is-rejecting"), BLANK_REJECT_MS);

      setStatus("rejected");
      window.setTimeout(() => {
        setOffset({ x: 0, y: 0 });
        setStatus("idle");
      }, CHIP_REJECT_MS);
      return;
    }

    setOffset({ x: 0, y: 0 });
    setStatus("idle");
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`chip drag-chip is-${status}${fadingDelay != null ? " is-fading-out" : ""}`}
      style={{
        "--dx": `${offset.x}px`,
        "--dy": `${offset.y}px`,
        transitionDelay: fadingDelay != null ? `${fadingDelay}s` : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={resolve}
      onPointerCancel={resolve}
      disabled={disabled}
    >
      {word.text}
    </button>
  );
});

// Plays one "cloze" round: drag every real word into its blank in the
// sentence; wrong drops (a distractor, or a real word on someone else's
// blank) bounce the word back and shake the blank it landed on. Reports
// {missed}, same contract as every other round type — see node-session.jsx
// and docs/decisions/0035.
export default function ClozeRoundPlayer({
  cardKey,
  cardName,
  round,
  roundNumber,
  totalRounds,
  secondLook,
  onDone,
  basePath = "/v2",
}) {
  const tokens = useMemo(() => parseSentence(round.text), [round]);
  const [bank, setBank] = useState(() => bankWords(round));
  const [filled, setFilled] = useState({}); // { [blankKey]: answerText }
  const [stage, setStage] = useState("playing"); // playing | ready
  // Same rule as every other round type: the tutorial only plays when the
  // round is marked for it, never on a second-look replay, and (see
  // lib/tutorial-gate.js) only for the first three times this mechanic
  // shows up anywhere in the path - starts "live" always, flipped to
  // "demo" by the layout effect below if this mount earns a slot.
  const [phase, setPhase] = useState("live");
  const [inspecting, setInspecting] = useState(false);
  const blankRefs = useRef(new Map());
  const cardArtRef = useRef(null);
  const sentenceRef = useRef(null);
  const demoChipRef = useRef(null);
  const skipResolverRef = useRef(null);
  const continueRef = useRef(null);
  const missedRef = useRef(false);
  // Guards consumeTutorialSlot - a Strict Mode dev double-invoke of the
  // layout effect below would otherwise burn two slots (a real
  // localStorage increment, not a harmless re-run) for one actual mount.
  const tutorialSlotConsumed = useRef(false);

  useEffect(() => {
    function onTap() {
      skipResolverRef.current?.();
    }
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, []);

  useLayoutEffect(() => {
    if (tutorialSlotConsumed.current) return;
    tutorialSlotConsumed.current = true;
    if (round.tutorial && !secondLook && consumeTutorialSlot("cloze")) {
      setPhase("demo");
    }
    // Mount-only: round.tutorial/secondLook are stable for the lifetime
    // of a single round instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function animateSkippable(el, keyframes, duration) {
    return new Promise((resolve) => {
      if (!el) {
        resolve();
        return;
      }
      const animation = el.animate(keyframes, { duration, easing: "ease", fill: "forwards" });
      skipResolverRef.current = () => animation.finish();
      animation.onfinish = () => {
        skipResolverRef.current = null;
        resolve();
      };
    });
  }

  useLayoutEffect(() => {
    if (stage === "ready") {
      animateSkippable(continueRef.current, [{ opacity: 0 }, { opacity: 1 }], CONTINUE_FADE_MS);
      // The sentence's own reward, distinct from each word's individual
      // shimmer as it lands - a sweep across the whole completed sentence
      // at the moment the round's actually won, timed to match the 0.5s
      // the leftover words take to fade out alongside it.
      shimmer(sentenceRef.current, SENTENCE_SHIMMER_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function shimmer(el, duration = SHIMMER_MS) {
    if (!el) return;
    el.classList.remove("is-shimmering");
    void el.offsetWidth;
    el.classList.add("is-shimmering");
    el.style.setProperty("--shimmer-duration", `${duration}ms`);
    window.setTimeout(() => el.classList.remove("is-shimmering"), duration);
  }

  function handleAccepted(word) {
    setFilled((prev) => {
      const next = { ...prev, [word.blankKey]: word.text };
      if (Object.keys(next).length === round.blanks.length) setStage("ready");
      return next;
    });
    setBank((prev) => prev.filter((w) => w.listKey !== word.listKey));
    // The reward reads across both halves of the exercise at once — the
    // word that just landed, and the card the sentence is about — not just
    // the blank in isolation.
    shimmer(blankRefs.current.get(word.blankKey));
    shimmer(cardArtRef.current);
  }

  // Demoed word: whichever blank's answer is "journey" if this round has
  // one (Fool node 8 round 1 does — Simon's own example when he asked for
  // this), else just the first blank. Either way it's real round content,
  // not a made-up demo sentence.
  const demoBlank =
    round.tutorial && (round.blanks.find((b) => b.answer === "journey") ?? round.blanks[0]);
  const demoWord = demoBlank ? bank.find((w) => w.blankKey === demoBlank.key) : null;
  // A recap round (the whole card's own description, every blank at
  // once) doesn't get queued for a second-look replay on a miss the way
  // every other round does (docs/decisions/0066: "don't remember failure
  // here... continue without re-doing the level") - node-session.jsx's
  // own mistake-review queue exists to reinforce a single fact just
  // missed, not to re-run an entire recap a learner already sat through
  // once. onDone's noReview flag below carries that through.
  const isRecap = round.blanks.length > RECAP_BLANK_THRESHOLD;

  return (
    <main className="session is-drag-lesson">
      <div className="topbar">
        <Link className="quit" href={basePath} aria-label="Leave lesson">
          ✕
        </Link>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalRounds}
          aria-valuenow={roundNumber - 1}
          aria-label={`Round ${roundNumber} of ${totalRounds}`}
        >
          {Array.from({ length: totalRounds }, (_, i) => (
            <span key={i} className={i < roundNumber - 1 ? "is-done" : undefined} />
          ))}
        </div>
      </div>

      {/* Greyed, full-bleed - atmosphere behind the exercise, distinct from
          the small tappable thumbnail below (which stays full-colour, for
          whoever taps it to actually look at the card). */}
      <img className="cloze-bg" src={masterForKey(cardKey)} alt="" aria-hidden="true" />
      <div className="cloze-bg-scrim" aria-hidden="true" />

      <div className="drag-layout">
        {/* A leading spacer, mirroring the trailing ones below - every
            round player was missing this (docs/decisions/0066, "center
            the content vertically... fix for all nodes"): a single
            trailing spacer only pushes the *rest* of the layout down
            from a fixed top, it doesn't center the whole block. */}
        <div className="drag-layout-spacer" aria-hidden="true" />
        {isRecap ? null : (
          <>
            <button
              type="button"
              className="reference-card is-compact drag-reference-card cloze-reference-card"
              onClick={() => setInspecting(true)}
              aria-label={`View ${cardName} full size`}
            >
              <p className="reference-name">{cardName}</p>
              <div ref={cardArtRef} className="reference-art">
                <img src={masterForKey(cardKey)} alt={cardName} />
              </div>
            </button>

            <div className="drag-layout-spacer" aria-hidden="true" />
          </>
        )}

        <p ref={sentenceRef} className={isRecap ? "cloze-sentence is-recap" : "cloze-sentence"}>
          {tokens.map((token, i) =>
            token.type === "text" ? (
              <span key={i}>{token.value}</span>
            ) : (
              <span
                key={i}
                ref={(el) => {
                  if (el) blankRefs.current.set(token.key, el);
                  else blankRefs.current.delete(token.key);
                }}
                className={filled[token.key] ? "cloze-blank is-filled" : "cloze-blank"}
              >
                {filled[token.key] ?? ""}
              </span>
            )
          )}
        </p>

        <div className="drag-layout-spacer" aria-hidden="true" />

        <div className="chips drag-chips">
          {bank.map((word, i) => (
            <BankChip
              key={word.listKey}
              ref={demoWord?.listKey === word.listKey ? demoChipRef : undefined}
              word={word}
              blankRefs={blankRefs}
              disabled={stage !== "playing"}
              fadingDelay={stage === "ready" ? i * 0.5 : null}
              onAccepted={handleAccepted}
              onRejected={() => {
                missedRef.current = true;
              }}
            />
          ))}
        </div>

        <div className="drag-layout-spacer" aria-hidden="true" />
      </div>

      {stage === "ready" ? (
        <button
          ref={continueRef}
          type="button"
          className="action cloze-continue"
          style={{ opacity: 0 }}
          onClick={() => onDone({ missed: missedRef.current, noReview: isRecap })}
        >
          Continue
        </button>
      ) : null}

      {inspecting ? (
        <Inspector item={{ image: masterForKey(cardKey), label: cardName }} onClose={() => setInspecting(false)} />
      ) : null}

      {phase === "demo" && demoWord && demoBlank ? (
        <TutorialGhost
          chipRef={demoChipRef}
          targetRef={{
            get current() {
              return blankRefs.current.get(demoBlank.key) ?? null;
            },
          }}
          text={demoWord.text}
          onDone={() => setPhase("live")}
        />
      ) : null}
    </main>
  );
}
