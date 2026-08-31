"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { masterForKey } from "@/lib/rounds";

const COMMIT_THRESHOLD = 90; // px of horizontal drag needed to resolve a swipe
const MAX_TILT_DEG = 16;
const ENTER_MS = 380;
const BURN_MS = 900;
const SHAKE_MS = 900;
const CONTINUE_FADE_MS = 500;
const SPARK_COUNT = 26;

// Gold-and-silver dust for a correct swipe, spawned from points around the
// chip's own perimeter (not its center) - the card is meant to read as
// crumbling away at its edges, dust lifting off the outside while the
// clip-path burn (see resolve()) eats inward to match. Plain DOM spans
// rather than React state - fire-and-forget, each removing itself on its
// own animation's finish, and there can be several bursts in flight if
// someone swipes fast, which one piece of state couldn't represent anyway.
function spawnBurst(stageEl, chipEl) {
  if (!stageEl || !chipEl) return;
  const chipRect = chipEl.getBoundingClientRect();
  const stageRect = stageEl.getBoundingClientRect();
  const left = chipRect.left - stageRect.left;
  const top = chipRect.top - stageRect.top;
  const { width, height } = chipRect;
  const cx = left + width / 2;
  const cy = top + height / 2;

  for (let i = 0; i < SPARK_COUNT; i++) {
    // A point on the chip's own edge, not its center - one of the four
    // sides, picked in proportion to that side's share of the perimeter so
    // corners don't get over-represented.
    const perimeter = 2 * (width + height);
    let t = Math.random() * perimeter;
    let originX;
    let originY;
    if (t < width) {
      originX = left + t;
      originY = top;
    } else if ((t -= width) < height) {
      originX = left + width;
      originY = top + t;
    } else if ((t -= height) < width) {
      originX = left + width - t;
      originY = top + height;
    } else {
      t -= width;
      originX = left;
      originY = top + height - t;
    }

    const spark = document.createElement("span");
    spark.className = `swipe-spark ${i % 2 === 0 ? "is-gold" : "is-silver"}`;
    spark.style.left = `${originX}px`;
    spark.style.top = `${originY}px`;
    stageEl.appendChild(spark);

    // Drifts further outward, away from the chip's own center, rather than
    // a fixed random direction - that's what keeps every spark reading as
    // "lifting off this edge" instead of a generic firework.
    const outwardAngle = Math.atan2(originY - cy, originX - cx) + (Math.random() * 0.9 - 0.45);
    const distance = 30 + Math.random() * 90;
    const dx = Math.cos(outwardAngle) * distance;
    const dy = Math.sin(outwardAngle) * distance - 16; // a slight rise, embers not falling
    const spin = Math.random() * 220 - 110;
    const delay = Math.random() * 220; // staggered, not one single puff

    const animation = spark.animate(
      [
        { transform: "translate(-50%, -50%) translate(0, 0) scale(0.3) rotate(0deg)", opacity: 0 },
        {
          transform: `translate(-50%, -50%) translate(${dx * 0.25}px, ${dy * 0.25}px) scale(1.1) rotate(${spin * 0.3}deg)`,
          opacity: 1,
          offset: 0.25,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.25) rotate(${spin}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 650 + Math.random() * 400,
        delay,
        easing: "cubic-bezier(0.15, 0.6, 0.3, 1)",
        fill: "backwards",
      }
    );
    animation.onfinish = () => spark.remove();
  }
}

// Every other v2 round shuffles with seededShuffle(round.id) - same round,
// same order, every time, so a missed round replays identically. Simon's
// explicit call for this one is the opposite: the deck has to feel freshly
// dealt on every attempt, including a second-look replay after a miss, not
// just once per round.id. Plain Math.random() Fisher-Yates, not the shared
// deterministic helper.
function shuffleTrueRandom(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// One playing-card-shaped chip. Owns its own drag: tilts and washes toward
// green/red as it crosses the commit threshold, snaps back if released
// short of it, or hands off to the parent's resolve() if released past it.
// Under reduced motion it's static — tick/cross are the only input then, so
// there's nothing for this component to do but render the phrase.
//
// The parent gives this a fresh `key` per card, so it fully mounts and
// unmounts rather than updating in place — which is what makes a plain
// mount-time entrance animation the right tool here, no need to track
// "is this a new card" by hand.
function SwipeChip({ card, reducedMotion, busy, onResolve }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Picked once per mount (this component remounts per card) so the resting
  // tilt is stable for as long as the chip sits still, not rerolled on
  // every render.
  const [entryRotation] = useState(() => Math.random() * 6 - 3);
  const drag = useRef(null);
  const chipRef = useRef(null);

  useLayoutEffect(() => {
    if (reducedMotion || !chipRef.current) return;
    // .swipe-chip's resting transform is centered via translate(-50%,-50%)
    // (see the CSS) - every keyframe here has to carry that same centering
    // term, or the chip jumps to its unpositioned top-left corner for the
    // animation's duration and only recenters once cancel() hands control
    // back to the CSS rule.
    const animation = chipRef.current.animate(
      [
        { transform: "translate(-50%, -50%) translateY(-260px) rotate(0deg)", opacity: 0 },
        {
          transform: `translate(-50%, -50%) translateY(14px) rotate(${entryRotation * 1.4}deg)`,
          opacity: 1,
          offset: 0.82,
        },
        { transform: `translate(-50%, -50%) rotate(${entryRotation}deg)`, opacity: 1 },
      ],
      { duration: ENTER_MS, easing: "ease-out" }
    );
    // Hands control back to the plain CSS transform (driven by --dx/--rot)
    // the moment the drop settles, rather than leaving the Web Animations
    // API's own finished-frame in charge of the property forever — a WAAPI
    // fill would otherwise keep overriding the CSS rule that dragging
    // needs to take over next. cancel() reverts to the CSS-computed value,
    // which is deliberately identical to the animation's own last frame
    // (same rotation, translateY back at its default 0), so nothing jumps.
    animation.onfinish = () => animation.cancel();
    return () => animation.cancel();
    // Mount-only: this instance never plays its entrance twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(event) {
    if (reducedMotion || busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX };
    setDragging(true);
  }

  function onPointerMove(event) {
    if (!drag.current) return;
    setOffset(event.clientX - drag.current.startX);
  }

  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    if (Math.abs(offset) >= COMMIT_THRESHOLD) {
      onResolve(offset < 0, { chipEl: chipRef.current, dragOffset: offset, entryRotation });
    }
    // Reset regardless of outcome: a correct swipe unmounts this chip
    // anyway, and a wrong one stays mounted (see resolve()'s own "not
    // replaced until answered correctly") and has to fall back to its true
    // resting position, not wherever the drag let go of it.
    setOffset(0);
  }

  const ratio = Math.max(-1, Math.min(1, offset / COMMIT_THRESHOLD));
  const rot = dragging ? ratio * MAX_TILT_DEG : entryRotation;
  const washOpacity = dragging ? Math.min(1, Math.abs(ratio)) : 0;
  const washIsMatch = offset < 0;
  const buttonThreshold = COMMIT_THRESHOLD / 3;

  return (
    <>
      <button
        ref={chipRef}
        type="button"
        className={`swipe-chip${dragging ? " is-dragging" : ""}`}
        style={{
          "--dx": `${reducedMotion ? 0 : offset}px`,
          "--rot": `${reducedMotion ? 0 : rot}deg`,
          "--wash-opacity": reducedMotion ? 0 : washOpacity,
          "--wash-color": washIsMatch ? "var(--good)" : "var(--bad)",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {card.text}
      </button>
      {/* Rendered here, not as a prop the parent computes, so the buttons'
          highlight state comes straight off this chip's own live drag,
          without threading offset back up on every pointermove. */}
      <div className="swipe-controls" aria-hidden={reducedMotion ? undefined : "true"}>
        <button
          type="button"
          className={`swipe-control is-tick${offset <= -buttonThreshold ? " is-active" : ""}`}
          disabled={busy}
          onClick={() => {
            onResolve(true, { chipEl: chipRef.current, entryRotation });
            setOffset(0);
          }}
          aria-label="This matches the card"
        >
          ✓
        </button>
        <button
          type="button"
          className={`swipe-control is-cross${offset >= buttonThreshold ? " is-active" : ""}`}
          disabled={busy}
          onClick={() => {
            onResolve(false, { chipEl: chipRef.current, entryRotation });
            setOffset(0);
          }}
          aria-label="This doesn't match the card"
        >
          ✕
        </button>
      </div>
    </>
  );
}

// Plays one "swipe" round: full-bleed greyscale card art behind a stack of
// phrase chips, swiped left (matches the card) or right (doesn't) — or
// tapped via the tick/cross controls for anyone not swiping. A miss doesn't
// stop the deck; it queues for this round's own second-look pass once the
// full deck's been through once, mirroring NodeSession's own per-node
// review (docs/decisions/0038) one level down.
//
// Always reports {missed: false}, unlike every other round type. A card
// stays current until it's answered correctly (see resolve() below), so by
// the time this round can finish, every card has already been confirmed
// right — including any that were wrong the first time, via the internal
// review pass above. Reporting a real miss here would additionally queue
// this *entire* round (every card, not just the ones that were wrong) into
// NodeSession's own node-level second look, on top of the per-card review
// this component already ran. That's not "one more look at what you got
// wrong" - it's the whole deck again for a single miss.
export default function SwipeRoundPlayer({
  cardKey,
  cardName,
  round,
  // roundNumber/totalRounds arrive from NodeSession like every other round
  // type, but go unused here - the topbar's own progress bar below counts
  // cards in the deck instead (see completedCount), since a swipe node is
  // always exactly one round and "round 1 of 1" says nothing.
  onDone,
  basePath = "/v2",
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState("main"); // main | review | ready
  // Starts null through the server render and first client paint, same
  // pattern dev-console.jsx's own position uses for the same reason: a
  // Math.random()-based shuffle computed during that first render would
  // come out differently on the server and the client, and React would
  // flag the mismatch (and did, before this) rather than silently picking
  // one. The real, shuffled deck arrives a tick later, client-only.
  const [queue, setQueue] = useState(null);
  const [resolving, setResolving] = useState(false);
  // How many of the deck's cards have been answered correctly at least
  // once - drives the topbar progress bar the same way a keyword round's
  // does, one segment per item, filled left to right. A plain roundNumber/
  // totalRounds pair (round-player.jsx's own progress source) is useless
  // here: a swipe node is always exactly one round holding the whole deck,
  // so that pair is permanently "1 of 1." origIndex (set when the deck is
  // first shuffled below) is what lets a card correctly-answered during
  // the internal review pass still count only once, since review re-deals
  // the same cards under fresh listKeys.
  const [completedCount, setCompletedCount] = useState(0);
  const completedRef = useRef(new Set());
  const missedRef = useRef([]);
  // Which cards have already been counted as a miss this round, keyed by
  // listKey - a card that's wrong stays current until answered correctly
  // (see resolve() below), so it can be attempted several times in a row;
  // only the first of those goes into missedRef, or one miss would queue
  // the same card for review two or three times over.
  const loggedMissRef = useRef(new Set());
  const skipResolverRef = useRef(null);
  const continueRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    setQueue(
      shuffleTrueRandom(round.cards).map((c, i) => ({
        ...c,
        listKey: `main-${round.id}-${i}-${Math.random()}`,
        origIndex: i,
      }))
    );
    // round.id is stable for the lifetime of one mounted round; this should
    // run once, not re-shuffle on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useLayoutEffect(() => {
    if (stage === "ready") {
      animateSkippable(continueRef.current, [{ opacity: 0 }, { opacity: 1 }], CONTINUE_FADE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function resolve(claimedMatch, { chipEl, dragOffset, entryRotation }) {
    if (resolving || !queue || queue.length === 0) return;
    setResolving(true);
    const card = queue[0];
    const correct = claimedMatch === card.isMatch;
    if (correct && !completedRef.current.has(card.origIndex)) {
      completedRef.current.add(card.origIndex);
      setCompletedCount(completedRef.current.size);
    }
    if (!correct) {
      // Only the first wrong attempt on a given card queues it for this
      // round's own second look - it stays current and can be tried
      // several times in a row (see below), and one initial miss should
      // only earn it one slot in that replay, not one per failed retry.
      if (stage === "main" && !loggedMissRef.current.has(card.listKey)) {
        loggedMissRef.current.add(card.listKey);
        missedRef.current.push(card);
      }
    }

    if (!reducedMotion && chipEl) {
      const startX = dragOffset ?? 0;
      const startTilt = Math.max(-1, Math.min(1, startX / COMMIT_THRESHOLD)) * MAX_TILT_DEG;
      // Wherever the drag actually let go, carried into every animation's
      // own first keyframe (same centering caveat as the entry animation -
      // .swipe-chip's resting transform is translate(-50%,-50%)) so a
      // release mid-drag settles back to center as part of the animation
      // rather than snapping there the instant this takes over `transform`.
      const startTransform = `translate(calc(-50% + ${startX}px), -50%) rotate(${startTilt}deg)`;
      // The chip's own true resting rotation, not a flat 0 - a wrong
      // answer settles back to exactly where it was sitting before the
      // attempt (it's the same chip, still current), so the shake has to
      // end there or it visibly snaps once cancel() hands control back to
      // the CSS rule that reads this same value.
      const restTransform = `translate(-50%, -50%) rotate(${entryRotation ?? 0}deg)`;

      if (correct) {
        // The burn: a bright glimmer first, then the card is eaten away
        // from its own edges inward (the clip-path circle shrinking to
        // nothing), timed alongside a burst of gold/silver dust lifting
        // off those same edges (spawnBurst). It keeps drifting toward
        // whichever side was swiped the whole time rather than snapping
        // back to center first - the disintegration happens *as* it
        // leaves, not in place.
        const dir = claimedMatch ? -1 : 1;
        const driftAt = (t) => startX + dir * 230 * t;
        const tiltAt = (t) => startTilt + dir * 14 * t;
        spawnBurst(stageRef.current, chipEl);
        await animateSkippable(
          chipEl,
          [
            {
              transform: `translate(calc(-50% + ${driftAt(0)}px), -50%) rotate(${tiltAt(0)}deg)`,
              filter: "brightness(1) saturate(1)",
              clipPath: "circle(150% at 50% 50%)",
              opacity: 1,
              offset: 0,
            },
            {
              // The glimmer - full brightness spike while the card is
              // still whole, before anything starts eating away at it.
              transform: `translate(calc(-50% + ${driftAt(0.4)}px), -50%) scale(1.08) rotate(${tiltAt(0.4)}deg)`,
              filter: "brightness(2.6) saturate(0.5)",
              clipPath: "circle(150% at 50% 50%)",
              opacity: 1,
              offset: 0.32,
            },
            {
              transform: `translate(calc(-50% + ${driftAt(0.72)}px), -50%) scale(1.02) rotate(${tiltAt(0.72)}deg)`,
              filter: "brightness(1.5) saturate(0.15)",
              clipPath: "circle(48% at 50% 50%)",
              opacity: 1,
              offset: 0.68,
            },
            {
              transform: `translate(calc(-50% + ${driftAt(1)}px), -50%) scale(0.94) rotate(${tiltAt(1)}deg)`,
              filter: "brightness(1.1) saturate(0)",
              clipPath: "circle(0% at 50% 50%)",
              opacity: 0,
              offset: 1,
            },
          ],
          BURN_MS
        );
      } else {
        // The shake: flashes red, wobbles for longer than the burn does,
        // and settles back at its own resting position rather than
        // exiting - "bounce back," not "fly off," is the whole point of
        // this reading as wrong. The card stays current after this; see
        // below, nothing here advances the queue on a miss.
        chipEl.classList.add("is-wrong");
        await animateSkippable(
          chipEl,
          [
            { transform: startTransform, offset: 0 },
            { transform: restTransform, offset: 0.12 },
            { transform: "translate(-50%, -50%) translateX(-20px) rotate(-8deg)", offset: 0.22 },
            { transform: "translate(-50%, -50%) translateX(18px) rotate(7deg)", offset: 0.34 },
            { transform: "translate(-50%, -50%) translateX(-15px) rotate(-6deg)", offset: 0.46 },
            { transform: "translate(-50%, -50%) translateX(12px) rotate(5deg)", offset: 0.58 },
            { transform: "translate(-50%, -50%) translateX(-8px) rotate(-3deg)", offset: 0.7 },
            { transform: "translate(-50%, -50%) translateX(5px) rotate(2deg)", offset: 0.82 },
            { transform: "translate(-50%, -50%) translateX(-2px) rotate(-1deg)", offset: 0.92 },
            { transform: restTransform, offset: 1 },
          ],
          SHAKE_MS
        );
        chipEl.classList.remove("is-wrong");
      }
    }

    if (!correct) {
      // Not replaced until the user discards it correctly - same card
      // stays current, ready for another attempt.
      setResolving(false);
      return;
    }

    const rest = queue.slice(1);
    if (rest.length > 0) {
      setQueue(rest);
      setResolving(false);
      return;
    }

    // Deck's empty. First pass with misses gets exactly one internal
    // second look at just those - same "asked once more, never a third
    // time" rule NodeSession's own review already follows.
    if (stage === "main" && missedRef.current.length > 0) {
      const toReplay = shuffleTrueRandom(missedRef.current).map((c, i) => ({
        ...c,
        listKey: `review-${round.id}-${i}-${Math.random()}`,
      }));
      missedRef.current = [];
      setQueue(toReplay);
      setStage("review");
      setResolving(false);
      return;
    }

    setStage("ready");
    setResolving(false);
  }

  const current = queue?.[0];

  return (
    <main className="session is-swipe-lesson">
      <div className="topbar">
        <Link className="quit" href={basePath} aria-label="Leave lesson">
          ✕
        </Link>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={round.cards.length}
          aria-valuenow={completedCount}
          aria-label={`${completedCount} of ${round.cards.length} matched`}
        >
          {Array.from({ length: round.cards.length }, (_, i) => (
            <span key={i} className={i < completedCount ? "is-done" : undefined} />
          ))}
        </div>
      </div>

      <div className="swipe-stage" ref={stageRef}>
        <img className="swipe-bg" src={masterForKey(cardKey)} alt="" aria-hidden="true" />
        <div className="swipe-bg-scrim" aria-hidden="true" />

        {current ? (
          <SwipeChip
            key={current.listKey}
            card={current}
            reducedMotion={reducedMotion}
            busy={resolving}
            onResolve={resolve}
          />
        ) : null}

        {stage === "ready" ? (
          <button
            ref={continueRef}
            type="button"
            className="action swipe-continue"
            style={{ opacity: 0 }}
            onClick={() => onDone({ missed: false })}
          >
            Continue
          </button>
        ) : null}
      </div>
    </main>
  );
}
