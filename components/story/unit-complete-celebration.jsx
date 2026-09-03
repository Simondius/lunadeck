"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { masterForKey } from "@/lib/rounds";
import { FLYER_ID } from "@/lib/unit-unlock-flyer";

// How much the card grows before the fly-to-deck begins (Simon's spec:
// "expand 20%") - applied to the flyer's own real width/height, not a
// transform, so deck-screen.jsx's own fly-in animation (a second
// left/top/width/height tween on the same element) has one property type
// to reason about instead of stacking a transform:scale on top of a
// changing box.
const FLYER_EXPAND_SCALE = 1.2;
const FLYER_EXPAND_MS = 260;

// Simon's spec: the card's own keywords flash into place around it, the
// same words the keyword round-player format teaches from (data_card_
// keywords.csv, threaded down via unlockUnit.keywords - see app/story/
// play/[chapter]/page.js). Each one appears a random 0.2-0.6s after the
// last (MIN/MAX_GAP_MS below), but its own fade-in-and-sparkle plays out
// over a full second regardless (see .unit-celebration-keyword's own
// animation) - the gap is the pacing between words, not how long any one
// of them takes to actually land.
const MIN_GAP_MS = 200;
const MAX_GAP_MS = 600;

function randomGap() {
  return MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
}

// Fixed positions scattered around the card, not randomised - same
// reasoning node-complete-celebration.jsx's own glitter dots give: a
// believable scatter reads as designed, random coordinates just look like
// noise. Seven of them since a card can carry up to seven keywords;
// unused slots (a shorter list) are simply never reached.
const WORD_SPOTS = [
  { top: "6%", left: "4%" },
  { top: "14%", right: "2%" },
  { top: "38%", left: "0%" },
  { top: "46%", right: "-2%" },
  { top: "68%", left: "2%" },
  { top: "78%", right: "4%" },
  { top: "94%", left: "22%" },
];

// The screen between a unit's own end-narrative and the deck's own
// unlock animation (docs/decisions/0076): the unit's card wobbles and
// shimmers under a light scatter of glitter while its own keywords flash
// into place around it one at a time, and tapping through skips whichever
// wait is still pending rather than the whole sequence outright. The
// actual "card lands in the deck" moment plays out on /deck itself
// (this only hands off cardKey/next via the query string - there's no
// shared client store for this one-shot handoff, and the deck screen
// already owns the real card-slot DOM that needs to animate onto).
export default function UnitCompleteCelebration({ cardKey, cardName, unitNumber, keywords, nextHref }) {
  const router = useRouter();
  const words = keywords ?? [];
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(false);
  const skipResolverRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function wait(ms) {
      return new Promise((resolve) => {
        const id = window.setTimeout(resolve, ms);
        skipResolverRef.current = () => {
          window.clearTimeout(id);
          resolve();
        };
      });
    }

    async function run() {
      for (let i = 0; i < words.length; i++) {
        if (cancelled) return;
        await wait(randomGap());
        if (cancelled) return;
        setShown((s) => s + 1);
      }
      skipResolverRef.current = null;
      if (!cancelled) setReady(true);
    }
    run();
    return () => {
      cancelled = true;
    };
    // words is fixed for the lifetime of this screen (a server-supplied
    // prop, never changes underneath it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStageTap() {
    skipResolverRef.current?.();
  }

  function complete() {
    // Clones the live card into a fixed-position <img> appended straight
    // to document.body (see lib/unit-unlock-flyer.js for why that survives
    // the navigation) at its exact current screen rect, then grows it -
    // deck-screen.jsx picks this same element up by id and flies it the
    // rest of the way once it mounts.
    const cardEl = document.querySelector(".unit-celebration-art");
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      const flyer = document.createElement("img");
      flyer.src = cardEl.src;
      flyer.alt = "";
      flyer.id = FLYER_ID;
      const expandedWidth = rect.width * FLYER_EXPAND_SCALE;
      const expandedHeight = rect.height * FLYER_EXPAND_SCALE;
      Object.assign(flyer.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        zIndex: "9999",
        borderRadius: "12px",
        pointerEvents: "none",
        boxShadow: "0 0 0 1px rgba(143, 82, 196, 0.45), 0 20px 50px rgba(0, 0, 0, 0.55)",
      });
      document.body.appendChild(flyer);
      flyer.animate(
        [
          { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` },
          {
            left: `${rect.left - (expandedWidth - rect.width) / 2}px`,
            top: `${rect.top - (expandedHeight - rect.height) / 2}px`,
            width: `${expandedWidth}px`,
            height: `${expandedHeight}px`,
          },
        ],
        { duration: FLYER_EXPAND_MS, easing: "ease-out", fill: "forwards" }
      );
    }

    const params = new URLSearchParams({
      unlock: cardKey,
      next: nextHref,
    });
    router.push(`/deck?${params.toString()}`);
  }

  return (
    <main className="unit-celebration" onClick={handleStageTap}>
      <div className="unit-celebration-stage">
        <div className="unit-celebration-wobble">
          <img src={masterForKey(cardKey)} alt={cardName} className="unit-celebration-art" />
          <span className="unit-celebration-glitter" aria-hidden="true" />
        </div>
        {words.slice(0, shown).map((word, i) => (
          <span key={word} className="unit-celebration-keyword" style={WORD_SPOTS[i % WORD_SPOTS.length]}>
            {word}
          </span>
        ))}
      </div>
      <p className="unit-celebration-caption">{cardName}, learned.</p>
      {ready ? (
        <button
          type="button"
          className="action"
          onClick={(e) => {
            e.stopPropagation();
            complete();
          }}
        >
          Complete Unit {unitNumber}
        </button>
      ) : null}
    </main>
  );
}
