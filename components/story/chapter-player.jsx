"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { masterForKey } from "@/lib/rounds";
import { registerNodeSkip } from "@/lib/dev-console-bridge";

const ASSETS = "/assets/reading-scene-sketch-v2";

const CARD_ENTER_MS = 900;
const CARD_EXIT_MS = 650;
const BUBBLE_DISMISS_MS = 500;

// The pile's own on-screen spot (small, edge-on, at the deck), the
// prominent reveal spot (tall, facing the viewer, on whichever side the
// current character *isn't* sitting), and a small resting spot beside the
// pile it settles into afterward. Expressed as top/left/width/height
// throughout (not bottom/right) because a single WAAPI animation
// interpolates a given property consistently across all of its keyframes
// - mixing top with bottom, or left with right, across keyframes isn't
// something it can resolve into one motion. These are the LEFT-character
// version (card goes top-right); mirrorFrame() flips them for a
// right-side character (Riley) so the card goes top-left instead.
const CARD_PILE = { top: "58%", left: "45%", width: "9%", height: "15%", rotateY: 90, opacity: 0.001 };
const CARD_PROMINENT = { top: "3%", left: "68%", width: "28%", height: "48%", rotateY: 0, opacity: 1 };
const CARD_RESTING = { top: "45%", left: "50%", width: "24%", height: "40%", rotateY: 0, opacity: 1 };

// Which side of the stage each character sits on - Riley mirrors Dave
// (0050: "opposite of Dave"), so the reveal card always animates toward
// whichever side is clear.
const CHARACTER_SIDE = { dave: "left", riley: "right" };

function mirrorFrame(frame) {
  const left = parseFloat(frame.left);
  const width = parseFloat(frame.width);
  return { ...frame, left: `${100 - left - width}%` };
}

function cardFrame({ top, left, width, height, rotateY, opacity }) {
  return {
    top,
    left,
    width,
    height,
    opacity,
    transform: `perspective(600px) rotateY(${rotateY}deg)`,
  };
}

function characterSrc(character, emotion) {
  return `${ASSETS}/characters/${character}/${character}_${emotion}.png`;
}

function backgroundSrc(name) {
  return `${ASSETS}/backgrounds/${name}.png`;
}

// Plain Math.random() shuffle, not lib/rounds.js's seededShuffle - Simon's
// call: a curriculum round has to replay identically for the mistake-review
// queue, but a story beat has no review pass, and the options should read
// fresh (not always in the same order) on every playthrough.
function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Plays one Story chapter: a fixed sequence of "beats" - dialogue, a
// multiple-choice moment, or a scripted card reveal - with no branching
// (0048, 0050). A persistent scene (background, current character, table,
// hands) fills the stage; dialogue and instructions overlay directly on
// it, and the strip below is reserved for choices alone (0050).
export default function ChapterPlayer({ chapter, nextChapter }) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [reactionEmotion, setReactionEmotion] = useState(null);
  const [wrongKey, setWrongKey] = useState(null);
  const [revealedCard, setRevealedCard] = useState(null);
  // hidden | entering | shown | exiting | settled - a tap only ever acts
  // on "shown" (dismiss) or is ignored (still entering/exiting). Keeping
  // this explicit, rather than deriving "is it safe to dismiss" from
  // whether an animation happens to still be running, is what keeps a
  // stray tap during the entrance from also firing the dismissal: the two
  // used to share one skip listener, and a single tap could resolve the
  // entrance *and* be read as the next tap that starts the exit, racing
  // two Web Animations on the same element.
  const [cardPhase, setCardPhase] = useState("hidden");
  // True for the 0.5s between tapping a speech bubble and actually
  // advancing - the bubble plays its own glimmer-and-fade
  // (.story-bubble.is-dismissing) instead of just vanishing.
  const [bubbleDismissing, setBubbleDismissing] = useState(false);
  // Slots are optional - only chapters that actually deal from a pool
  // (the "draw" beat type) need them at all.
  const [slots, setSlots] = useState(() => (chapter.slotLabels ?? []).map(() => null));
  const [usedCards, setUsedCards] = useState(() => new Set());

  const cardRef = useRef(null);
  const skipResolverRef = useRef(null);

  const beat = chapter.beats[beatIndex];
  const atEnd = beatIndex >= chapter.beats.length;
  // The progress bar tracks decisions, not beats (0052) - a chapter's
  // dialogue and reveals are pacing, not something to measure "how much
  // of the reading is done" against; its choice and draw beats are the
  // only points where the reader actually does something.
  const decisionBeats = chapter.beats.filter((b) => b.type === "choice" || b.type === "draw");
  const decisionsDone = chapter.beats
    .slice(0, beatIndex)
    .filter((b) => b.type === "choice" || b.type === "draw").length;
  const character = beat?.character ?? chapter.beats[chapter.beats.length - 1].character;
  const side = CHARACTER_SIDE[character] ?? "left";
  const pileFrame = side === "right" ? mirrorFrame(CARD_PILE) : CARD_PILE;
  const prominentFrame = side === "right" ? mirrorFrame(CARD_PROMINENT) : CARD_PROMINENT;
  const restingFrame = side === "right" ? mirrorFrame(CARD_RESTING) : CARD_RESTING;

  useEffect(() => {
    function onTap() {
      skipResolverRef.current?.();
    }
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, []);

  // The dev console's ‹ › controls (components/dev-console.jsx, 0052) -
  // the same escape hatch NodeSession gives every curriculum round, so a
  // beat further into a chapter doesn't need everything before it played
  // for real. A blunt jump, not a re-run of whatever gating a tap would
  // normally go through: it clears every transient bit of state a real
  // tap would (a wrong-answer flash, a bubble mid-dismiss) rather than
  // leaving it stranded on whatever beat skip lands on.
  useEffect(() => {
    return registerNodeSkip({
      onNext() {
        setReactionEmotion(null);
        setWrongKey(null);
        setBubbleDismissing(false);
        setBeatIndex((i) => Math.min(i + 1, chapter.beats.length));
      },
      onPrev() {
        setReactionEmotion(null);
        setWrongKey(null);
        setBubbleDismissing(false);
        setBeatIndex((i) => Math.max(i - 1, 0));
      },
    });
  }, [chapter.beats.length]);

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

  // A reveal beat's card lifts off the pile once, the moment it becomes
  // current - not on every re-render, and not again once it's settled.
  useEffect(() => {
    if (beat?.type === "reveal" && cardPhase === "hidden") {
      setRevealedCard(beat.card);
      setCardPhase("entering");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  useEffect(() => {
    if (cardPhase !== "entering") return;
    // Deliberately not animateSkippable/the shared tap listener - the
    // entrance always plays out in full. Only the exit (handleStageTap)
    // is tap-skippable, so there is never a moment where the same tap
    // could resolve both.
    const animation = cardRef.current?.animate(
      [
        { ...cardFrame(pileFrame), offset: 0 },
        { ...cardFrame(prominentFrame), offset: 1 },
      ],
      { duration: CARD_ENTER_MS, easing: "ease", fill: "forwards" }
    );
    if (!animation) {
      setCardPhase("shown");
      return;
    }
    animation.onfinish = () => setCardPhase("shown");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardPhase]);

  // The reading ends with the chapter, not with the card sitting there
  // forever - a fresh WAAPI animation on the same element takes over from
  // whatever fill:forwards animation last held its position (0050), which
  // a plain style/class change wouldn't reliably do.
  useEffect(() => {
    if (atEnd && revealedCard) {
      cardRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 500,
        easing: "ease",
        fill: "forwards",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atEnd]);

  // Reshuffled once per beat, not once per render - a wrong tap re-renders
  // this same beat (to show the reaction), and the options would visibly
  // jump around under the learner's thumb if this ran on every render
  // instead of once when the beat becomes current.
  const shuffledOptions = useMemo(
    () => (beat?.type === "choice" ? shuffle(beat.options) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beatIndex]
  );

  function advance() {
    setReactionEmotion(null);
    setBeatIndex((i) => i + 1);
  }

  async function handleStageTap() {
    if (atEnd) return;
    if (beat.type === "reveal") {
      // Still entering, or already mid-exit - either way this tap isn't
      // the one that dismisses it. (Entering can't reach here at all: the
      // stage isn't even tappable until cardPhase is "shown", see
      // `tappable` below.)
      if (cardPhase !== "shown") return;
      setCardPhase("exiting");
      if (beat.slot != null) {
        // A multi-card reading (0054): this card's spot is a labelled
        // slot, not "beside the pile" - it fades in place instead of
        // travelling there, and the persistent .story-slots row is what
        // actually records it, freeing the stage for the next card's own
        // entrance from the same pile.
        await animateSkippable(
          cardRef.current,
          [
            { ...cardFrame(prominentFrame), offset: 0 },
            { ...cardFrame({ ...prominentFrame, opacity: 0 }), offset: 1 },
          ],
          CARD_EXIT_MS
        );
        setSlots((prev) => {
          const next = [...prev];
          next[beat.slot] = beat.card;
          return next;
        });
        setRevealedCard(null);
        setCardPhase("hidden");
        advance();
        return;
      }
      await animateSkippable(
        cardRef.current,
        [
          { ...cardFrame(prominentFrame), offset: 0 },
          { ...cardFrame(restingFrame), offset: 1 },
        ],
        CARD_EXIT_MS
      );
      setCardPhase("settled");
      advance();
      return;
    }
    if (beat.type !== "dialogue") return;
    if (beat.speaker === "client") {
      if (bubbleDismissing) return;
      setBubbleDismissing(true);
      window.setTimeout(() => {
        setBubbleDismissing(false);
        advance();
      }, BUBBLE_DISMISS_MS);
      return;
    }
    advance();
  }

  function tryChoice(option) {
    if (option.correct) {
      advance();
      return;
    }
    setWrongKey(option.text);
    setReactionEmotion(option.reaction ?? null);
    window.setTimeout(() => {
      setWrongKey(null);
      setReactionEmotion(null);
    }, 900);
  }

  function tryCard(cardKey) {
    if (cardKey === beat.answer) {
      setSlots((prev) => {
        const next = [...prev];
        next[beat.slot] = cardKey;
        return next;
      });
      setUsedCards((prev) => new Set(prev).add(cardKey));
      advance();
      return;
    }
    setWrongKey(cardKey);
    window.setTimeout(() => setWrongKey(null), 460);
  }

  const emotion = reactionEmotion ?? beat?.emotion ?? "neutral";
  // Character ids double as display names (dave, riley) - capitalized,
  // that's the name a client-speaker line is labelled with.
  const speakerName = character ? character[0].toUpperCase() + character.slice(1) : null;
  const tappable =
    !atEnd &&
    !bubbleDismissing &&
    (beat.type === "dialogue" || (beat.type === "reveal" && cardPhase === "shown"));

  return (
    <main
      className={tappable ? "session is-story-lesson is-tappable" : "session is-story-lesson"}
      onClick={tappable ? handleStageTap : undefined}
    >
      <div className="topbar">
        <Link
          className="quit"
          href="/story"
          aria-label="Leave story"
          onClick={(e) => e.stopPropagation()}
        >
          ✕
        </Link>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={decisionBeats.length}
          aria-valuenow={decisionsDone}
          aria-label={`${decisionsDone} of ${decisionBeats.length} decisions made`}
        >
          {decisionBeats.map((_, i) => (
            <span key={i} className={i < decisionsDone ? "is-done" : undefined} />
          ))}
        </div>
      </div>

      <div className="story-stage">
        <img className="story-layer story-bg-art" src={backgroundSrc(chapter.location.background)} alt="" />
        <img
          className={
            side === "right"
              ? "story-layer story-character-art is-side-right"
              : "story-layer story-character-art"
          }
          src={characterSrc(character, emotion)}
          alt=""
        />
        <div className="story-layer story-table-backing" aria-hidden="true" />
        <img className="story-layer story-table-art" src={`${ASSETS}/table/table_gemstones_deck.png`} alt="" />
        {revealedCard ? (
          <img
            ref={cardRef}
            className="story-layer story-revealed-card"
            style={cardFrame(pileFrame)}
            src={masterForKey(revealedCard)}
            alt=""
          />
        ) : null}
        <img className="story-layer story-hands-art" src={`${ASSETS}/hands/hands.png`} alt="" />

        {(chapter.slotLabels ?? []).length > 0 ? (
          <div className="story-slots">
            {chapter.slotLabels.map((label, i) => (
              <div key={label} className={slots[i] ? "story-slot is-filled" : "story-slot"}>
                {slots[i] ? (
                  <img src={masterForKey(slots[i])} alt="" />
                ) : (
                  <span className="story-slot-label">{label}</span>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {!atEnd && beat.speaker === "client" ? (
          <div
            className={
              "story-bubble" +
              (side === "right" ? " is-side-right" : "") +
              (bubbleDismissing ? " is-dismissing" : "")
            }
          >
            <span className="story-bubble-name">{speakerName}</span>
            <span className="story-bubble-line">{beat.text}</span>
          </div>
        ) : null}

        {!atEnd && (beat.speaker === "reader" || beat.speaker === "narration") ? (
          <div className={beat.speaker === "narration" ? "story-caption is-narration" : "story-caption"}>
            {beat.text}
          </div>
        ) : null}

        {tappable ? <span className="story-tap-hint">Tap to continue</span> : null}
      </div>

      <div className="story-content">
        {atEnd ? (
          <div className="story-end">
            <p className="prompt">Chapter complete.</p>
            <Link className="action" href={nextChapter ? `/story/play/${nextChapter.slug}` : "/story"}>
              {nextChapter ? nextChapter.title : "Back to Story"}
            </Link>
          </div>
        ) : beat.type === "choice" ? (
          <div className="story-choice">
            <div className="story-choice-options">
              {shuffledOptions.map((option) => (
                <button
                  key={option.text}
                  type="button"
                  className={
                    wrongKey === option.text
                      ? "story-choice-option is-wrong"
                      : "story-choice-option"
                  }
                  onClick={() => tryChoice(option)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        ) : beat.type === "draw" ? (
          <div className="story-choice">
            <p className="story-prompt">{beat.prompt}</p>
            <div className="story-card-pool">
              {chapter.availableCards
                .filter((cardKey) => !usedCards.has(cardKey))
                .map((cardKey) => (
                  <button
                    key={cardKey}
                    type="button"
                    className={
                      wrongKey === cardKey ? "story-pool-card is-wrong" : "story-pool-card"
                    }
                    onClick={() => tryCard(cardKey)}
                  >
                    <img src={masterForKey(cardKey)} alt="" />
                  </button>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
