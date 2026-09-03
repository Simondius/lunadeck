"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { masterForKey } from "@/lib/rounds";
import { registerNodeSkip } from "@/lib/dev-console-bridge";
import SceneImage from "@/components/story/scene-image";
import UnitCompleteCelebration from "@/components/story/unit-complete-celebration";

const ASSETS = "/assets/reading-scene-sketch-v2";

const CARD_ENTER_MS = 900;
const CARD_SHIMMER_MS = 1000;
const CARD_EXIT_MS = 650;
const BUBBLE_DISMISS_MS = 500;

// How long the stage sits tappable-and-quiet before "Tap to continue"
// fades in - Simon's call: every step that's just waiting on the reader
// (a card sitting revealed with no button, a dialogue line, an
// elaboration bubble), not a one-time onboarding hint that stops showing
// after a few real taps. It fades back out the instant the reader acts,
// whether that's the tap that answers it or the beat moving on some other
// way - see the effect below.
const TAP_HINT_DELAY_MS = 1000;

// The pile's own on-screen spot (small, edge-on, at the deck) and the
// focus spot a revealed card holds - tall, facing the viewer, taking up
// the majority of the free space above the table without reaching into
// the character's own footprint (0056: the character's own art tops out
// around left:13%-47%, so this starts clear of it at 60%). A single card
// reading just stays here once revealed - there's no separate "resting"
// spot to shrink into anymore (0056: "should remain taking up the
// majority of the free space", not shrink away). A multi-card reading
// reuses this same spot as its "currently being discussed" focus - see
// frameFromSlot() for where a card goes when focus moves elsewhere.
// Expressed as top/left/width/height throughout (not bottom/right)
// because a single WAAPI animation interpolates a given property
// consistently across all of its keyframes - mixing top with bottom, or
// left with right, across keyframes isn't something it can resolve into
// one motion. These are the LEFT-character version (card goes top-right);
// mirrorFrame() flips them for a right-side character (Riley) so the
// card goes top-left instead.
const CARD_PILE = { top: "58%", left: "45%", width: "9%", height: "15%", rotateY: 90, opacity: 0.001 };
const CARD_FOCUS = { top: "5%", left: "60%", width: "36%", height: "55%", rotateY: 0, opacity: 1 };

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
// hands) fills the stage; a client's or the reader's own speech bubble
// overlays it directly, plain narration/instruction text sits below in
// the content panel instead (0056), and that panel is otherwise reserved
// for choices alone (0050).
export default function ChapterPlayer({
  chapter,
  nextChapter,
  // Set only for the end-narrative of the first unit to teach a given
  // card (app/story/play/[chapter]/page.js) - `{cardKey, cardName,
  // unitNumber}`. Swaps the plain "chapter complete" screen for the full
  // unlock celebration (docs/decisions/0076) instead of just a "next
  // step" button.
  unlockUnit,
  backHref = "/story",
  backLabel = "Back to Story",
}) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [reactionEmotion, setReactionEmotion] = useState(null);
  // The brief shake/flash on the exact option just tapped wrong, separate
  // from eliminatedKeys below - flashKey clears itself after the flash
  // plays; eliminatedKeys doesn't (0056).
  const [flashKey, setFlashKey] = useState(null);
  // Every option tapped wrong on the CURRENT choice beat, permanently
  // (0056: "after it flashes, then it is deactivated") - reset whenever
  // the beat changes (advance(), or a dev-console skip), never just on a
  // timer, so a wrong guess can't be retried a moment later.
  const [eliminatedKeys, setEliminatedKeys] = useState(() => new Set());
  const [revealedCard, setRevealedCard] = useState(null);
  // hidden | entering | shimmering | shown | exiting | settled - a tap
  // only ever acts on "shown" (dismiss) or is ignored (still entering/
  // shimmering/exiting). Keeping this explicit, rather than deriving "is
  // it safe to dismiss" from whether an animation happens to still be
  // running, is what keeps a stray tap during the entrance from also
  // firing the dismissal: the two used to share one skip listener, and a
  // single tap could resolve the entrance *and* be read as the next tap
  // that starts the exit, racing two Web Animations on the same element.
  // "shimmering" (docs/decisions/0067: "shake and shimmer for 1s before
  // the options appear") is its own phase, not folded into "entering",
  // because it's the one part of the reveal that's tap-skippable - the
  // pile-to-focus entrance itself still always plays out in full.
  const [cardPhase, setCardPhase] = useState("hidden");
  // True for the 0.5s between tapping a speech bubble and actually
  // advancing - the bubble plays its own glimmer-and-fade
  // (.story-bubble.is-dismissing) instead of just vanishing.
  const [bubbleDismissing, setBubbleDismissing] = useState(false);
  // Slots are optional - only chapters doing a multi-card reading
  // (slotLabels) need them at all.
  const [slots, setSlots] = useState(() => (chapter.slotLabels ?? []).map(() => null));
  const [usedCards, setUsedCards] = useState(() => new Set());
  // Which slot's card is currently up in the CARD_FOCUS spot, for a
  // multi-card reading - null before the first card lands, or between a
  // card going back down and the next one coming up (0056).
  const [focusSlot, setFocusSlot] = useState(null);
  // A correct choice can queue up one or more reader-voiced follow-on
  // lines (beat.elaboration) before the beat actually advances (0056) -
  // elaborationQueue is that beat's own array while it's playing out,
  // elaborationStep is which line is showing.
  const [elaborationQueue, setElaborationQueue] = useState(null);
  const [elaborationStep, setElaborationStep] = useState(0);
  // A card the learner tapped to see full-screen (0056) - any revealed or
  // slotted card, not tied to the current beat at all.
  const [zoomedCard, setZoomedCard] = useState(null);

  const cardRef = useRef(null);
  const stageRef = useRef(null);
  const slotRefs = useRef([]);
  const skipResolverRef = useRef(null);
  const characterRef = useRef(null);
  const bubbleRef = useRef(null);
  // "Tap to continue" fades in after TAP_HINT_DELAY_MS of the stage
  // sitting tappable and untouched - see the effect further down, once
  // `tappable` itself exists, for what actually drives this.
  const [tapHintVisible, setTapHintVisible] = useState(false);
  const tapHintTimeoutRef = useRef(null);
  // The tail's horizontal offset from the bubble's own left edge, in
  // pixels (0056: "dynamically position the arrow... so it always points
  // to the character's face") - measured off the actual rendered DOM
  // rather than a fixed percentage, since a percentage-of-the-bubble
  // drifts off the character's fixed position as dialogue length changes
  // the bubble's own width.
  const [tailOffset, setTailOffset] = useState(null);

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
  const focusFrame = side === "right" ? mirrorFrame(CARD_FOCUS) : CARD_FOCUS;

  // A slot's own on-screen position, measured directly off its rendered
  // DOM box rather than re-deriving .story-slots' flex/gap math here -
  // the two would only ever drift apart. Unlike the pile/focus frames,
  // slot position isn't mirrored per character side: Past/Present/Future
  // always read left-to-right regardless of who's sitting where.
  function frameFromSlot(index) {
    const stageEl = stageRef.current;
    const slotEl = slotRefs.current[index];
    if (!stageEl || !slotEl) return null;
    const stageRect = stageEl.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return null;
    return {
      top: `${((slotRect.top - stageRect.top) / stageRect.height) * 100}%`,
      left: `${((slotRect.left - stageRect.left) / stageRect.width) * 100}%`,
      width: `${(slotRect.width / stageRect.width) * 100}%`,
      height: `${(slotRect.height / stageRect.height) * 100}%`,
      rotateY: 0,
      opacity: 1,
    };
  }

  useEffect(() => {
    function onTap() {
      skipResolverRef.current?.();
    }
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
  }, []);

  // Re-measured whenever the client bubble's own text (and so its width)
  // changes, or the character swaps sides - the face itself doesn't move
  // within a chapter, but the bubble's left edge does as its content
  // does, so the OFFSET from that edge has to be recomputed every time.
  useEffect(() => {
    const bubbleEl = bubbleRef.current;
    const charEl = characterRef.current;
    if (!bubbleEl || !charEl) {
      setTailOffset(null);
      return;
    }
    const bubbleRect = bubbleEl.getBoundingClientRect();
    const charRect = charEl.getBoundingClientRect();
    const faceX = charRect.left + charRect.width / 2;
    const raw = faceX - bubbleRect.left;
    setTailOffset(Math.min(Math.max(raw, 16), Math.max(16, bubbleRect.width - 16)));
  }, [beatIndex, side, beat?.text]);

  // The dev console's ‹ › controls (components/dev-console.jsx, 0052) -
  // the same escape hatch NodeSession gives every curriculum round, so a
  // beat further into a chapter doesn't need everything before it played
  // for real. A blunt jump, not a re-run of whatever gating a tap would
  // normally go through: it clears every transient bit of state a real
  // tap would (a wrong-answer flash, a bubble mid-dismiss, an in-progress
  // elaboration) rather than leaving it stranded on whatever beat skip
  // lands on. It doesn't try to reconstruct slots/focusSlot for a skip
  // target deep into a multi-card reading - that's the one thing left for
  // whoever's driving it to keep in mind.
  useEffect(() => {
    return registerNodeSkip({
      onNext() {
        setReactionEmotion(null);
        setFlashKey(null);
        setEliminatedKeys(new Set());
        setBubbleDismissing(false);
        setElaborationQueue(null);
        setElaborationStep(0);
        setBeatIndex((i) => Math.min(i + 1, chapter.beats.length));
      },
      onPrev() {
        setReactionEmotion(null);
        setFlashKey(null);
        setEliminatedKeys(new Set());
        setBubbleDismissing(false);
        setElaborationQueue(null);
        setElaborationStep(0);
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

  // A reveal beat's card lifts off the pile the moment it becomes current
  // - once per distinct card, not on every re-render. In a multi-card
  // reading, the card already up in focus (if any) has to clear out to
  // its own slot first, so there's room for the new one to rise from the
  // pile into the same spot.
  useEffect(() => {
    if (beat?.type !== "reveal" || revealedCard === beat.card) return;
    let cancelled = false;
    (async () => {
      if (focusSlot != null && cardRef.current) {
        const prevFrame = frameFromSlot(focusSlot);
        if (prevFrame) {
          setCardPhase("exiting");
          await animateSkippable(
            cardRef.current,
            [
              { ...cardFrame(focusFrame), offset: 0 },
              { ...cardFrame(prevFrame), offset: 1 },
            ],
            CARD_EXIT_MS
          );
        }
      }
      if (cancelled) return;
      setFocusSlot(null);
      setRevealedCard(beat.card);
      setCardPhase("entering");
    })();
    return () => {
      cancelled = true;
    };
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
        { ...cardFrame(focusFrame), offset: 1 },
      ],
      { duration: CARD_ENTER_MS, easing: "ease", fill: "forwards" }
    );
    if (!animation) {
      setCardPhase("shimmering");
      return;
    }
    animation.onfinish = () => setCardPhase("shimmering");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardPhase]);

  // The reveal's own little flourish once it lands (0067) - a quick
  // shake-and-shimmer before the stage becomes tappable, skippable by tap
  // like the exit is (animateSkippable's shared pointerdown listener
  // already fires regardless of whether `tappable` has main's onClick
  // attached, so this works without needing the stage tappable yet).
  useEffect(() => {
    if (cardPhase !== "shimmering") return;
    const base = cardFrame(focusFrame).transform;
    animateSkippable(
      cardRef.current,
      [
        { ...cardFrame(focusFrame), filter: "brightness(1)", offset: 0 },
        { ...cardFrame(focusFrame), transform: `${base} rotate(-3deg)`, filter: "brightness(1.6)", offset: 0.15 },
        { ...cardFrame(focusFrame), transform: `${base} rotate(3deg)`, filter: "brightness(1.9)", offset: 0.35 },
        { ...cardFrame(focusFrame), transform: `${base} rotate(-2deg)`, filter: "brightness(1.5)", offset: 0.55 },
        { ...cardFrame(focusFrame), transform: `${base} rotate(1deg)`, filter: "brightness(1.2)", offset: 0.8 },
        { ...cardFrame(focusFrame), filter: "brightness(1)", offset: 1 },
      ],
      CARD_SHIMMER_MS
    ).then(() => setCardPhase("shown"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardPhase]);

  // A later beat can ask about a card already sitting on the table
  // (0056: "when the character asks a question about a card that is
  // already on the table then it should animate back into that focus
  // position and the slot should glow again") - beat.slot marks which
  // one. Skipped while a reveal beat is current: that's the effect above
  // bringing a brand-new card up from the pile, not a recall of an
  // existing one.
  useEffect(() => {
    if (!chapter.slotLabels?.length || beat?.type === "reveal") return;
    const desired = beat?.slot;
    if (desired == null || desired === focusSlot || slots[desired] == null) return;
    let cancelled = false;
    (async () => {
      if (focusSlot != null && cardRef.current) {
        const prevFrame = frameFromSlot(focusSlot);
        if (prevFrame) {
          await animateSkippable(
            cardRef.current,
            [
              { ...cardFrame(focusFrame), offset: 0 },
              { ...cardFrame(prevFrame), offset: 1 },
            ],
            CARD_EXIT_MS
          );
        }
      }
      if (cancelled) return;
      const startFrame = frameFromSlot(desired);
      setRevealedCard(slots[desired]);
      setFocusSlot(desired);
      requestAnimationFrame(() => {
        if (cancelled || !cardRef.current || !startFrame) return;
        cardRef.current.animate(
          [
            { ...cardFrame(startFrame), offset: 0 },
            { ...cardFrame(focusFrame), offset: 1 },
          ],
          { duration: CARD_ENTER_MS, easing: "ease", fill: "forwards" }
        );
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

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
    setEliminatedKeys(new Set());
    setBeatIndex((i) => i + 1);
  }

  async function handleStageTap() {
    if (atEnd) return;
    if (elaborationQueue) {
      if (bubbleDismissing) return;
      setBubbleDismissing(true);
      window.setTimeout(() => {
        setBubbleDismissing(false);
        const next = elaborationStep + 1;
        if (next >= elaborationQueue.length) {
          setElaborationQueue(null);
          setElaborationStep(0);
          advance();
        } else {
          setElaborationStep(next);
        }
      }, BUBBLE_DISMISS_MS);
      return;
    }
    if (beat.type === "reveal") {
      // Still entering, or already mid-exit - either way this tap isn't
      // the one that dismisses it. (Entering can't reach here at all: the
      // stage isn't even tappable until cardPhase is "shown", see
      // `tappable` below.)
      if (cardPhase !== "shown") return;
      if (beat.slot != null) {
        setSlots((prev) => {
          const next = [...prev];
          next[beat.slot] = beat.card;
          return next;
        });
        setFocusSlot(beat.slot);
      }
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
      if (beat.elaboration?.length) {
        setElaborationQueue(beat.elaboration);
        setElaborationStep(0);
      } else {
        advance();
      }
      return;
    }
    setFlashKey(option.text);
    setReactionEmotion(option.reaction ?? null);
    setEliminatedKeys((prev) => new Set(prev).add(option.text));
    window.setTimeout(() => {
      setFlashKey(null);
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
    setFlashKey(cardKey);
    window.setTimeout(() => setFlashKey(null), 460);
  }

  function openZoom(e, cardKey) {
    e.stopPropagation();
    setZoomedCard(cardKey);
  }

  const emotion = reactionEmotion ?? beat?.emotion ?? "neutral";
  // A reaction face (a wrong choice's anger/confusion) doesn't snap back
  // to neutral the instant the next beat's own prompt appears (0067: "have
  // it fade away for 1s after the next user prompt appears") - the new
  // beat's own content (a fresh bubble, fresh choices) renders immediately
  // as normal, but the character's *previous* expression lingers as a
  // fading ghost layered underneath, crossfading out over 1s rather than
  // being replaced outright. Keyed on the actual image src, not just the
  // emotion name, so switching characters (Dave -> Riley) doesn't try to
  // cross-fade between two different people's faces.
  const [fadingGhost, setFadingGhost] = useState(null);
  const prevCharacterSrcRef = useRef(null);
  useEffect(() => {
    const nextSrc = characterSrc(character, emotion);
    const prevSrc = prevCharacterSrcRef.current;
    prevCharacterSrcRef.current = nextSrc;
    if (!prevSrc || prevSrc === nextSrc) return;
    const ghost = { src: prevSrc, id: nextSrc + Date.now() };
    setFadingGhost(ghost);
    const timeout = window.setTimeout(() => {
      setFadingGhost((current) => (current?.id === ghost.id ? null : current));
    }, 1000);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, emotion]);
  // Character ids double as display names (dave, riley) - capitalized,
  // that's the name a client-speaker line is labelled with.
  const speakerName = character ? character[0].toUpperCase() + character.slice(1) : null;
  const tappable =
    !atEnd &&
    !bubbleDismissing &&
    (elaborationQueue != null ||
      beat.type === "dialogue" ||
      (beat.type === "reveal" && cardPhase === "shown"));
  const showCaption =
    !atEnd && beat.type === "dialogue" && (beat.speaker === "reader" || beat.speaker === "narration");

  // "Tap to continue" fades in once the stage has sat tappable and
  // untouched for TAP_HINT_DELAY_MS - not the instant it becomes tappable,
  // which would flash a hint at a reader who was already about to tap
  // anyway. Depends on more than `tappable` itself since that stays true
  // across, say, one dialogue line into the next - beatIndex/cardPhase/
  // elaborationStep changing is what actually means "this is a new thing
  // to wait on," and each one restarts the timer. Whatever ends the wait -
  // the tap that answers it, or `tappable` going false outright (a choice
  // beat's own buttons, the chapter ending) - clears the timeout and, via
  // this same effect re-running, drops tapHintVisible back to false, which
  // is what lets the hint fade out via .story-tap-hint's own CSS
  // transition rather than just vanishing.
  useEffect(() => {
    window.clearTimeout(tapHintTimeoutRef.current);
    setTapHintVisible(false);
    if (!tappable) return undefined;
    tapHintTimeoutRef.current = window.setTimeout(() => setTapHintVisible(true), TAP_HINT_DELAY_MS);
    return () => window.clearTimeout(tapHintTimeoutRef.current);
  }, [tappable, beatIndex, cardPhase, elaborationStep]);

  // The unit-unlock celebration takes over the whole screen rather than
  // nesting inside this component's own stage/content layout - it's its
  // own <main>, same pattern node-session.jsx's "complete" stage uses for
  // the same reason (a genuinely different screen, not a variant of this
  // one). Falls back to the plain "chapter complete" screen below if
  // there's no nextChapter to hand off to (shouldn't happen for a real
  // unlock, but a missing next step has nowhere useful to send this on to
  // anyway).
  if (atEnd && unlockUnit && nextChapter) {
    return (
      <UnitCompleteCelebration
        cardKey={unlockUnit.cardKey}
        cardName={unlockUnit.cardName}
        unitNumber={unlockUnit.unitNumber}
        keywords={unlockUnit.keywords}
        nextHref={nextChapter.href}
      />
    );
  }

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

      <div className="story-stage" ref={stageRef}>
        <SceneImage
          className="story-layer story-bg-art"
          src={backgroundSrc(chapter.location.background)}
        />
        <SceneImage
          ref={characterRef}
          className={
            side === "right"
              ? "story-layer story-character-art is-side-right"
              : "story-layer story-character-art"
          }
          src={characterSrc(character, emotion)}
          initial={character ? character[0].toUpperCase() : null}
        />
        {fadingGhost ? (
          <SceneImage
            key={fadingGhost.id}
            className={
              side === "right"
                ? "story-layer story-character-art is-side-right is-fading-ghost"
                : "story-layer story-character-art is-fading-ghost"
            }
            src={fadingGhost.src}
          />
        ) : null}
        <div className="story-layer story-table-backing" aria-hidden="true" />
        <SceneImage
          className="story-layer story-table-art"
          src={`${ASSETS}/table/table_gemstones_deck.png`}
        />
        {revealedCard ? (
          <img
            ref={cardRef}
            className="story-layer story-revealed-card"
            style={cardFrame(pileFrame)}
            src={masterForKey(revealedCard)}
            alt=""
            onClick={(e) => openZoom(e, revealedCard)}
          />
        ) : null}
        <SceneImage
          className="story-layer story-hands-art"
          src={`${ASSETS}/hands/hands.png`}
        />

        {(chapter.slotLabels ?? []).length > 0 ? (
          <div className={revealedCard ? "story-slots has-focus" : "story-slots"}>
            {chapter.slotLabels.map((label, i) => {
              const isFocused = focusSlot === i;
              const isFilled = slots[i] != null;
              return (
                <div
                  key={label}
                  ref={(el) => {
                    slotRefs.current[i] = el;
                  }}
                  className={
                    "story-slot" +
                    (isFilled ? " is-filled" : "") +
                    (isFocused ? " is-focused" : "")
                  }
                >
                  {isFilled && !isFocused ? (
                    <img src={masterForKey(slots[i])} alt="" onClick={(e) => openZoom(e, slots[i])} />
                  ) : !isFilled ? (
                    <span className="story-slot-label">{label}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {!atEnd && beat.speaker === "client" ? (
          <div
            ref={bubbleRef}
            className={
              "story-bubble" +
              (side === "right" ? " is-side-right" : "") +
              (bubbleDismissing ? " is-dismissing" : "")
            }
            style={tailOffset != null ? { "--tail-x": `${tailOffset}px` } : undefined}
          >
            <span className="story-bubble-name">{speakerName}</span>
            <span className="story-bubble-line">{beat.text}</span>
          </div>
        ) : null}

        {elaborationQueue ? (
          <div className={"story-reader-bubble" + (bubbleDismissing ? " is-dismissing" : "")}>
            <span className="story-bubble-name">You</span>
            <span className="story-bubble-line">{elaborationQueue[elaborationStep]}</span>
          </div>
        ) : null}
      </div>

      <div className="story-content">
        {showCaption ? (
          <div className={beat.speaker === "narration" ? "story-caption is-narration" : "story-caption"}>
            {beat.text}
          </div>
        ) : null}
        {/* Below the stage, not overlaid on it (Simon's call) - the old
            position (inside .story-stage, bottom-right) sat wherever a
            speech bubble could also land, and got obscured by one. Every
            beat this can show for already renders nothing else in
            .story-content-main (see `tappable`'s own conditions vs. the
            atEnd/choice/draw branches below), so there's nothing for it
            to compete with here either. */}
        {tappable ? (
          <span className={tapHintVisible ? "story-tap-hint is-visible" : "story-tap-hint"}>
            Tap to continue
          </span>
        ) : null}
        <div className="story-content-main">
          {atEnd ? (
            <div className="story-end">
              <p className="prompt">Chapter complete.</p>
              <Link className="action" href={nextChapter ? nextChapter.href : backHref}>
                {nextChapter ? nextChapter.label : backLabel}
              </Link>
            </div>
          ) : beat.type === "choice" && !elaborationQueue ? (
            <div className="story-choice">
              <div className="story-choice-options">
                {shuffledOptions.map((option) => {
                  const isEliminated = eliminatedKeys.has(option.text);
                  return (
                    <button
                      key={option.text}
                      type="button"
                      disabled={isEliminated}
                      className={
                        "story-choice-option" +
                        (flashKey === option.text ? " is-wrong" : "") +
                        (isEliminated ? " is-eliminated" : "")
                      }
                      onClick={() => tryChoice(option)}
                    >
                      {option.text}
                    </button>
                  );
                })}
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
                        flashKey === cardKey ? "story-pool-card is-wrong" : "story-pool-card"
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
      </div>

      {zoomedCard ? (
        <div className="story-zoom-overlay" onClick={(e) => openZoom(e, null)}>
          <img src={masterForKey(zoomedCard)} alt="" />
        </div>
      ) : null}
    </main>
  );
}
