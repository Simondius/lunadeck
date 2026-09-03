"use client";

import { useLayoutEffect, useRef } from "react";

import { placeFixed } from "@/lib/fixed-position";

// Simon's exact spec: "tap the button, 0.5s, then tap the sun for 0.5s,
// and repeat" - a discrete tap-then-tap, not a continuous motion between
// them. An earlier pass had the finger glide smoothly from one to the
// other, which read as demonstrating a *drag* - the wrong gesture
// entirely for a mechanic that's two separate taps in either order. This
// version never animates a translate at all: the finger simply appears at
// one spot, presses, disappears, then appears at the other.
const PRESS_MS = 500;
const GAP_MS = 500;
const LOOP_GAP_MS = 900;

// Zone rounds' own tutorial, tap-select edition. tutorial-ghost.jsx's own
// finger (a translucent touch-point disc) is the same visual language,
// recoloured to the app's own purple accent - the tutorial affordance
// colour used throughout, distinct from the gold/silver reserved for a
// correct-match reward - reused here standing alone rather than riding
// under a dragged pill, since there's nothing being dragged.
//
// Same interrupt rule tutorial-ghost.jsx established (0041): the real chip
// and the real zone stay tappable underneath the whole time - a tap on
// either both ends the demo and (once the parent flips phase to "live")
// answers for real, since both a global pointerdown listener and the
// target's own onClick fire off the one physical event.
export default function TutorialTap({ chipRef, cardRef, targetRect, onDone }) {
  const fingerRef = useRef(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let loopTimeout = null;

    function wait(ms) {
      return new Promise((resolve) => {
        loopTimeout = window.setTimeout(resolve, ms);
      });
    }

    // Plants the finger at `center` and holds a tap-pulse there for
    // PRESS_MS, then clears it - a fresh placeFixed each time, no
    // transform left over from before, since this never slides between
    // spots.
    function tapAt(center) {
      return new Promise((resolve) => {
        const finger = fingerRef.current;
        if (cancelled || !finger) {
          resolve();
          return;
        }
        // .tutorial-tap-finger is a finger shape, not a dot - anchored by
        // its own tip (the bottom edge), which is what actually needs to
        // land on `center`, not the whole shape's own midpoint.
        placeFixed(finger, { left: center.x - 11, top: center.y - 58, width: 22, height: 58 });
        finger.classList.remove("is-tapping");
        void finger.offsetWidth;
        finger.classList.add("is-tapping");
        loopTimeout = window.setTimeout(() => {
          finger.classList.remove("is-tapping");
          resolve();
        }, PRESS_MS);
      });
    }

    async function playOnce() {
      if (cancelled) return;
      const chipRect = chipRef.current?.getBoundingClientRect();
      const cardRect = cardRef?.current?.getBoundingClientRect();
      if (!chipRect || !cardRect || !targetRect) {
        interrupt();
        return;
      }

      const zoneRect = {
        left: cardRect.left + targetRect.x0 * cardRect.width,
        top: cardRect.top + targetRect.y0 * cardRect.height,
        width: (targetRect.x1 - targetRect.x0) * cardRect.width,
        height: (targetRect.y1 - targetRect.y0) * cardRect.height,
      };
      const chipCenter = { x: chipRect.left + chipRect.width / 2, y: chipRect.top + chipRect.height / 2 };
      const zoneCenter = { x: zoneRect.left + zoneRect.width / 2, y: zoneRect.top + zoneRect.height / 2 };

      await tapAt(chipCenter);
      if (cancelled) return;
      await wait(GAP_MS);
      if (cancelled) return;
      await tapAt(zoneCenter);
      if (cancelled) return;
      await wait(LOOP_GAP_MS);
      if (cancelled) return;
      playOnce();
    }

    function interrupt() {
      if (cancelled) return;
      cancelled = true;
      if (loopTimeout) window.clearTimeout(loopTimeout);
      onDone();
    }

    // Same reasoning as tutorial-ghost.jsx: a reference-card image still
    // loading when this first measures bakes a pre-reflow position into
    // the whole first loop - wait for anything pending before the first
    // play, every later loop re-measures fresh regardless.
    const pending = Array.from(document.images).filter((img) => !img.complete);
    let remainingImages = pending.length;
    const imageListeners = pending.map((img) => {
      const onSettle = () => {
        remainingImages -= 1;
        if (remainingImages === 0 && !cancelled) playOnce();
      };
      img.addEventListener("load", onSettle, { once: true });
      img.addEventListener("error", onSettle, { once: true });
      return { img, onSettle };
    });
    if (pending.length === 0) playOnce();

    window.addEventListener("pointerdown", interrupt);
    return () => {
      cancelled = true;
      if (loopTimeout) window.clearTimeout(loopTimeout);
      window.removeEventListener("pointerdown", interrupt);
      imageListeners.forEach(({ img, onSettle }) => {
        img.removeEventListener("load", onSettle);
        img.removeEventListener("error", onSettle);
      });
    };
    // Runs once per round mount - chipRef/cardRef/targetRect/onDone are
    // stable for the lifetime of a single demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <span ref={fingerRef} className="tutorial-tap-finger" aria-hidden="true" />;
}
