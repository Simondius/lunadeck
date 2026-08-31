"use client";

import { useLayoutEffect, useRef } from "react";

import { placeFixed } from "@/lib/fixed-position";

// Slowed to roughly a third of the original pace (1400ms) so the drag reads
// as a deliberate demonstration rather than a blur — Simon's call after the
// first pass played too fast to actually teach the gesture.
const DEMO_DURATION_MS = 4200;
// Pause between replays. The demo repeats — a learner who looked away for a
// beat shouldn't have to wait for a whole extra round to see it again.
const LOOP_GAP_MS = 3000;

// Round 1's demo: an animated pill that traces the drag it wants the learner
// to repeat, measured off the real chip and card DOM nodes rather than
// hardcoded — the layout is responsive, so a fixed offset would drift on
// anything but one screen size. A translucent circle rides along on top of
// it, standing in for the finger doing the dragging — the same touch-point
// overlay a phone screen recording draws under a real finger.
//
// It loops — play, pause, play again — until the learner taps or clicks
// anywhere, which is read as "I've got it, let me try." The chip itself is
// disabled for the duration (see RoundPlayer/ZoneRoundPlayer), so a tap can't
// land there; the learner taps elsewhere first, and the same chip becomes
// draggable for real once onDone fires.
//
// targetRect is optional — fractional {x0,y0,x1,y1} of the card, for
// ZoneRoundPlayer's version of this same demo, which drags a phrase onto one
// specific part of the card rather than the card as a whole. Omitted (the
// keyword rounds' case), the target is the card's own full box.
//
// targetRef is the third option, for ClozeRoundPlayer: a ref (or ref-shaped
// object with a live `.current` getter) pointing straight at the DOM node to
// land on — a sentence's blank isn't a fraction of a card, it's just its own
// element. cardRef is only needed for the targetRect case; omit it (and
// targetRect) when passing targetRef.
export default function TutorialGhost({ chipRef, cardRef, targetRect, targetRef, text, onDone }) {
  const ghostRef = useRef(null);
  const fingerRef = useRef(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let currentAnimation = null;
    let loopTimeout = null;

    function playOnce() {
      const chipRect = chipRef.current?.getBoundingClientRect();
      const cardRect = cardRef?.current?.getBoundingClientRect();
      const ghost = ghostRef.current;
      if (cancelled) return;

      const targetBox = targetRef
        ? targetRef.current?.getBoundingClientRect()
        : targetRect && cardRect
          ? {
              left: cardRect.left + targetRect.x0 * cardRect.width,
              top: cardRect.top + targetRect.y0 * cardRect.height,
              width: (targetRect.x1 - targetRect.x0) * cardRect.width,
              height: (targetRect.y1 - targetRect.y0) * cardRect.height,
            }
          : cardRect;

      if (!chipRect || !targetBox || !ghost) {
        interrupt();
        return;
      }

      placeFixed(ghost, chipRect);
      ghost.style.setProperty("--demo-duration", `${DEMO_DURATION_MS}ms`);

      // The finger's press/lift is a plain CSS animation on a DOM node that
      // persists across loops, so it only auto-plays once. Restart it every
      // pass with the none-reflow-empty trick.
      const finger = fingerRef.current;
      if (finger) {
        finger.style.animation = "none";
        void finger.offsetWidth;
        finger.style.animation = "";
      }

      const dx =
        targetBox.left + targetBox.width / 2 - (chipRect.left + chipRect.width / 2);
      const dy =
        targetBox.top + targetBox.height / 2 - (chipRect.top + chipRect.height / 2);

      currentAnimation = ghost.animate(
        [
          { transform: "translate(0, 0) scale(1)", offset: 0 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.92)`, offset: 0.65 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.92)`, offset: 0.85 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.6)`, opacity: 0, offset: 1 },
        ],
        { duration: DEMO_DURATION_MS, easing: "ease-in-out", fill: "forwards" }
      );
      currentAnimation.onfinish = () => {
        if (cancelled) return;
        loopTimeout = window.setTimeout(playOnce, LOOP_GAP_MS);
      };
    }

    function interrupt() {
      if (cancelled) return;
      cancelled = true;
      currentAnimation?.cancel();
      if (loopTimeout) window.clearTimeout(loopTimeout);
      onDone();
    }

    // A reference-card image still loading when this measures bakes a
    // pre-reflow position into the whole first 4200ms loop — the chip (and
    // on ClozeRoundPlayer, the blank) sit wherever the page was before the
    // image claimed its space, not where they end up once it loads. Every
    // later loop re-measures fresh regardless, so this only has to cover
    // the first one.
    const pending = Array.from(document.images).filter((img) => !img.complete);
    let remaining = pending.length;
    const imageListeners = pending.map((img) => {
      const onSettle = () => {
        remaining -= 1;
        if (remaining === 0 && !cancelled) playOnce();
      };
      img.addEventListener("load", onSettle, { once: true });
      img.addEventListener("error", onSettle, { once: true });
      return { img, onSettle };
    });
    if (pending.length === 0) playOnce();

    window.addEventListener("pointerdown", interrupt);
    return () => {
      cancelled = true;
      currentAnimation?.cancel();
      if (loopTimeout) window.clearTimeout(loopTimeout);
      window.removeEventListener("pointerdown", interrupt);
      imageListeners.forEach(({ img, onSettle }) => {
        img.removeEventListener("load", onSettle);
        img.removeEventListener("error", onSettle);
      });
    };
    // Runs once per round mount — chipRef/cardRef/targetRect/onDone are
    // stable for the lifetime of a single demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ghostRef} className="tutorial-ghost" aria-hidden="true">
      {text}
      <span ref={fingerRef} className="tutorial-ghost-finger" />
    </div>
  );
}
