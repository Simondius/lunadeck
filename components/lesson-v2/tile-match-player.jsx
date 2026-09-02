"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { seededShuffle } from "@/lib/rounds";

const REJECT_MS = 460;
const CONTINUE_FADE_MS = 500;

// Tap-to-pair recap appended to a card's zone node (Simon's addition on top
// of the overnight spec — see docs/decisions/0035): the image and
// description columns are shuffled independently, so position alone can't
// give a pair away. A 2-column grid, however many rows the card's element
// count needs — 2×3 for the Fool's six, 2×1 for a two-element card like the
// Magician. Reports {missed}, same contract as every other round type.
export default function TileMatchPlayer({ round, roundNumber, totalRounds, onDone, basePath = "/v2" }) {
  const leftOrder = useMemo(() => seededShuffle(round.pairs, `${round.id}-left`), [round]);
  const rightOrder = useMemo(() => seededShuffle(round.pairs, `${round.id}-right`), [round]);
  const [matched, setMatched] = useState(() => new Set());
  const [selected, setSelected] = useState({ left: null, right: null });
  const [shaking, setShaking] = useState(() => new Set());
  const skipResolverRef = useRef(null);
  const continueRef = useRef(null);
  const missedRef = useRef(false);

  useEffect(() => {
    function onTap() {
      skipResolverRef.current?.();
    }
    window.addEventListener("pointerdown", onTap);
    return () => window.removeEventListener("pointerdown", onTap);
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

  const allMatched = matched.size === round.pairs.length;

  useLayoutEffect(() => {
    if (allMatched) {
      animateSkippable(continueRef.current, [{ opacity: 0 }, { opacity: 1 }], CONTINUE_FADE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatched]);

  function attempt(next) {
    if (next.left == null || next.right == null) {
      setSelected(next);
      return;
    }
    if (next.left === next.right) {
      setMatched((prev) => new Set(prev).add(next.left));
      setSelected({ left: null, right: null });
      return;
    }
    missedRef.current = true;
    setShaking(new Set([next.left, next.right]));
    setSelected(next);
    window.setTimeout(() => {
      setShaking(new Set());
      setSelected({ left: null, right: null });
    }, REJECT_MS);
  }

  function tapLeft(key) {
    if (matched.has(key) || shaking.size) return;
    attempt({ left: key, right: selected.right });
  }

  function tapRight(key) {
    if (matched.has(key) || shaking.size) return;
    attempt({ left: selected.left, right: key });
  }

  function tileClass(key, side) {
    return [
      "tile-match-tile",
      matched.has(key) ? "is-matched" : "",
      selected[side] === key ? "is-selected" : "",
      shaking.has(key) ? "is-shaking" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

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

      <div className="drag-layout">
        {/* A leading spacer, mirroring the trailing ones below - every
            round player was missing this (docs/decisions/0066, "center
            the content vertically... fix for all nodes"): a single
            trailing spacer only pushes the *rest* of the layout down
            from a fixed top, it doesn't center the whole block. */}
        <div className="drag-layout-spacer" aria-hidden="true" />
        {/* One flat grid, not two independent columns - the image and text
            columns used to be separate CSS grids, each sizing its own rows
            from its own content only, so an image tile and the unrelated
            text tile that happened to land beside it (the two columns
            shuffle independently on purpose) could disagree on height and
            the two columns would drift out of alignment row by row. A
            single grid with both tiles as siblings, interleaved image-then-
            text, gives every row one shared height: the grid's default
            row-stretch sizes each row to its tallest cell and stretches the
            shorter one to match. */}
        <div className="tile-match-grid">
          {leftOrder.flatMap((leftPair, i) => {
            const rightPair = rightOrder[i];
            return [
              <button
                key={`img-${leftPair.key}`}
                type="button"
                className={tileClass(leftPair.key, "left")}
                onClick={() => tapLeft(leftPair.key)}
                disabled={matched.has(leftPair.key)}
              >
                <img src={leftPair.image} alt="" />
              </button>,
              <button
                key={`text-${rightPair.key}`}
                type="button"
                className={tileClass(rightPair.key, "right")}
                onClick={() => tapRight(rightPair.key)}
                disabled={matched.has(rightPair.key)}
              >
                {rightPair.text}
              </button>,
            ];
          })}
        </div>

        <div className="drag-layout-spacer" aria-hidden="true" />

        {allMatched ? (
          <button
            ref={continueRef}
            type="button"
            className="action"
            style={{ opacity: 0 }}
            onClick={() => onDone({ missed: missedRef.current })}
          >
            Continue
          </button>
        ) : null}

        <div className="drag-layout-spacer" aria-hidden="true" />
      </div>
    </main>
  );
}
