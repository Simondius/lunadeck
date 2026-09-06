"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProgress } from "@/components/use-progress";
import { knownCardKeys } from "@/lib/progress";
import { knownCardKeys as journeyKnownCardKeys } from "@/lib/journey-progress";
import { UNITS as JOURNEY_UNITS } from "@/data/journey/units";
import { FLYER_ID } from "@/lib/unit-unlock-flyer";

// Cards this browser has already watched unlock once - separate from
// `known` (lib/progress.js's own derived "have the lesson nodes been
// completed" state), which only ever grows and never remembers whether
// the *animation* played. A card missing from this set gets the "satisfying
// lock" first-unlock animation below; one already in it gets the
// level-up shimmer instead (Simon's spec for both).
const CELEBRATED_KEY = "lunadeck.deck.celebrated.v1";
const LOCK_MS = 900;
const SPARK_LINGER_MS = 1000;
const SPARK_FADE_MS = 500;
const SPARK_COUNT = 16;
// How long the handed-off card (see lib/unit-unlock-flyer.js) takes to
// fly from wherever the celebration screen left it into the real slot,
// shrinking and rounding into a circle as it goes.
const FLY_MS = 750;
// The "snap into place" once it arrives - quick, since the flight itself
// already did the dramatic work.
const SNAP_MS = 260;

// Sparks lifting off the slot's own edge - same gold/silver dust
// technique swipe-round-player.jsx's own spawnBurst() and zone-chip-
// flight.jsx's own spawnDust() already use elsewhere, spawned once here
// rather than per-frame.
function spawnSlotSparks(slotEl) {
  const rect = slotEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const totalMs = SPARK_LINGER_MS + SPARK_FADE_MS;

  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const originRadius = rect.width / 2;
    const originX = cx + Math.cos(angle) * originRadius;
    const originY = cy + Math.sin(angle) * originRadius;
    const distance = rect.width * 0.4 + Math.random() * rect.width * 0.6;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 20;

    const spark = document.createElement("span");
    spark.className = `deck-slot-spark ${i % 2 === 0 ? "is-gold" : "is-silver"}`;
    spark.style.left = `${originX}px`;
    spark.style.top = `${originY}px`;
    document.body.appendChild(spark);

    const animation = spark.animate(
      [
        { transform: "translate(-50%, -50%) translate(0, 0) scale(0.4)", opacity: 0, offset: 0 },
        {
          transform: `translate(-50%, -50%) translate(${dx * 0.3}px, ${dy * 0.3}px) scale(1.1)`,
          opacity: 1,
          offset: 0.15,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(1)`,
          opacity: 1,
          offset: SPARK_LINGER_MS / totalMs,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy - 12}px) scale(0.5)`,
          opacity: 0,
          offset: 1,
        },
      ],
      { duration: totalMs, delay: Math.random() * 150, easing: "ease-out", fill: "backwards" }
    );
    animation.onfinish = () => spark.remove();
  }
}

export default function DeckScreen({ groups, sections }) {
  const progress = useProgress();
  const [filter, setFilter] = useState("all");
  const searchParams = useSearchParams();
  const slotRefs = useRef(new Map());
  const pointerRef = useRef(null);
  const celebrationHandled = useRef(false);
  // { href, label } | null - the "Continue Story" coachmark pointing at
  // the Path tab, shown only once the unlock/level-up animation lands.
  const [arrowTarget, setArrowTarget] = useState(null);

  // Union of the two progress stores: lib/progress.js (the legacy Path/v4
  // course - a card is known once its teaching section is finished) and
  // lib/journey-progress.js (Journey - a card is known once its unit is
  // finished). They're deliberately separate stores (see that file's own
  // comment), so a card the reader just earned via Journey wouldn't
  // otherwise show up here at all - the slot would stay permanently
  // greyed even right after journey-play-screen.jsx's own unlock
  // celebration played on it (Simon's 0906 report: cards not
  // colourising once earned).
  //
  // journeyKnownCardKeys() reads localStorage directly - unlike
  // useProgress() (a useSyncExternalStore hook with its own
  // getServerSnapshot for the legacy store), it has no SSR-safe snapshot,
  // so it can only be read after mount: reading it straight into the
  // `known` memo below ran it during the CLIENT'S OWN FIRST render too
  // (the hydration pass), which does have access to localStorage, while
  // the server render obviously doesn't - two different outputs for the
  // same render, which is exactly what React's hydration mismatch check
  // exists to catch (Simon's 0906 report right after: a hydration error
  // in the console). journeyKnown starts as an empty Set (matching what
  // the server rendered) and only picks up the real value in an effect,
  // i.e. strictly after hydration has already reconciled - the same
  // "server and first client render agree, real data arrives in a
  // follow-up commit" split useProgress() gets for free from
  // useSyncExternalStore.
  const [journeyKnown, setJourneyKnown] = useState(() => new Set());
  useEffect(() => {
    setJourneyKnown(new Set(journeyKnownCardKeys(JOURNEY_UNITS)));
  }, []);

  const known = useMemo(() => {
    const set = knownCardKeys(progress, sections);
    for (const key of journeyKnown) set.add(key);
    return set;
  }, [progress, sections, journeyKnown]);
  const total = groups.reduce((n, g) => n + g.cards.length, 0);
  const shown = filter === "all" ? groups : groups.filter((g) => g.id === filter);

  const filters = [
    { id: "all", label: "All" },
    ...groups.map((g) => ({ id: g.id, label: g.id === "majors" ? "Majors" : g.label })),
  ];

  // The unlock celebration's own hand-off (unit-complete-celebration.jsx):
  // ?unlock=<cardKey>&next=<href> in the URL. A
  // celebrationHandled ref guards this the same way lib/tutorial-gate.js's
  // own callers guard consumeTutorialSlot - a Strict Mode dev double-
  // invoke of this effect would otherwise play the animation twice and
  // wrongly flip a first unlock into "already celebrated" on its own
  // second pass. The query string is cleared immediately (so a refresh
  // doesn't replay any of this) via history.replaceState rather than
  // router.replace() - the router version re-renders the route, which
  // tore down this same effect's own in-flight setTimeout before the
  // 500ms delay below ever got to fire. A plain history update changes
  // the address bar without touching React at all.
  useEffect(() => {
    if (celebrationHandled.current) return;
    const unlockKey = searchParams.get("unlock");
    if (!unlockKey) return;
    celebrationHandled.current = true;

    const nextHref = searchParams.get("next");
    window.history.replaceState(null, "", "/deck");

    const slotEl = slotRefs.current.get(unlockKey);
    if (!slotEl) return;

    let celebrated = new Set();
    try {
      celebrated = new Set(JSON.parse(window.localStorage.getItem(CELEBRATED_KEY) ?? "[]"));
    } catch {
      // Blocked storage - every unlock plays as a first-time lock, the
      // more common case anyway.
    }
    const isFirstUnlock = !celebrated.has(unlockKey);
    if (isFirstUnlock) {
      celebrated.add(unlockKey);
      try {
        window.localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...celebrated]));
      } catch {
        // Nothing to do - it'll just play the lock animation again next visit.
      }
    }

    function landed() {
      spawnSlotSparks(slotEl);
      if (nextHref) setArrowTarget({ href: nextHref });
    }

    // Snaps the real slot into place once the flown-in card (or, with no
    // flyer to hand off from, the slot itself) arrives - a quick overshoot
    // and settle, not the full lock sequence below, since the flight
    // already did the dramatic work of getting the card here.
    function snapIntoPlace() {
      const animation = slotEl.animate(
        [
          { transform: "scale(1)", offset: 0 },
          { transform: "scale(1.18)", offset: 0.45 },
          { transform: "scale(0.95)", offset: 0.75 },
          { transform: "scale(1)", offset: 1 },
        ],
        { duration: SNAP_MS, easing: "ease-out" }
      );
      animation.onfinish = landed;
    }

    const flyer = document.getElementById(FLYER_ID);
    const slotCircle = slotEl.querySelector(".slot") ?? slotEl;

    if (flyer) {
      // Instant, not smooth - the flyer is a fixed-position element that
      // doesn't track scrolling, so its own flight target has to be
      // measured *after* the page settles, not mid-scroll.
      slotEl.scrollIntoView({ behavior: "auto", block: "center" });
      requestAnimationFrame(() => {
        const from = flyer.getBoundingClientRect();
        const to = slotCircle.getBoundingClientRect();
        flyer.getAnimations().forEach((a) => a.cancel());
        const flight = flyer.animate(
          [
            {
              left: `${from.left}px`,
              top: `${from.top}px`,
              width: `${from.width}px`,
              height: `${from.height}px`,
              borderRadius: "12px",
              offset: 0,
            },
            {
              left: `${to.left}px`,
              top: `${to.top}px`,
              width: `${to.width}px`,
              height: `${to.height}px`,
              borderRadius: "50%",
              offset: 1,
            },
          ],
          { duration: FLY_MS, easing: "cubic-bezier(0.4, 0.1, 0.2, 1)", fill: "forwards" }
        );
        flight.onfinish = () => {
          flyer.remove();
          snapIntoPlace();
        };
      });
      return;
    }

    // No flyer to hand off from (a direct/refreshed visit to the ?unlock=
    // link) - fall back to animating the slot in place, the full lock or
    // level-up sequence Simon originally spec'd before the flight existed.
    slotEl.scrollIntoView({ behavior: "smooth", block: "center" });
    const startTimeout = window.setTimeout(() => {
      const animation = isFirstUnlock
        ? slotEl.animate(
            [
              { transform: "scale(1)", offset: 0 },
              { transform: "scale(0.55)", offset: 0.35 },
              // The quick 0.2s expand at the middle of the lock, Simon's
              // own spec, before it shrinks back into the slot for good.
              { transform: "scale(1.2)", offset: 0.55 },
              { transform: "scale(0.9)", offset: 0.75 },
              { transform: "scale(1)", offset: 1 },
            ],
            { duration: LOCK_MS, easing: "ease-in-out" }
          )
        : slotEl.animate(
            [
              { filter: "brightness(1) saturate(1)", transform: "scale(1)", offset: 0 },
              { filter: "brightness(1.9) saturate(1.3)", transform: "scale(1.08)", offset: 0.5 },
              { filter: "brightness(1) saturate(1)", transform: "scale(1)", offset: 1 },
            ],
            { duration: LOCK_MS, easing: "ease-in-out" }
          );
      animation.onfinish = landed;
    }, 500);

    // Deliberately no cleanup here - `celebrationHandled` already stops
    // this whole block from running a second time, and a Strict Mode dev
    // double-invoke calls a real cleanup *between* the two passes, which
    // would clear `startTimeout` after the first pass schedules it and
    // then, since the guard blocks the second pass from scheduling a
    // replacement, leave nothing scheduled at all - this is the bug that
    // shipped first, caught by nothing firing past "scheduling animation."
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Positions the coachmark against the Path tab's own real position
  // (the first tab in components/tabbar.jsx) rather than a guessed
  // percentage - the tabbar's own column widths depend on its padding,
  // which this doesn't need to duplicate if it just measures the DOM.
  useEffect(() => {
    if (!arrowTarget) return;
    const pathTab = document.querySelector(".tabbar .tab");
    const pointer = pointerRef.current;
    if (!pathTab || !pointer) return;
    const rect = pathTab.getBoundingClientRect();
    // The pointer's own "Continue Story" pill is wider than the Path
    // tab it points at, so centering it exactly on the tab can push it
    // past the screen's own left edge (the tab sits close to that edge
    // itself) - clamp so the pill's own half-width always stays on
    // screen, with a small margin, even though that means the arrow
    // glyph above it (still centered on the tab) and the pill below it
    // part ways slightly in that case.
    const halfWidth = pointer.getBoundingClientRect().width / 2;
    const margin = 12;
    const targetCenter = rect.left + rect.width / 2;
    const clampedCenter = Math.min(
      Math.max(targetCenter, halfWidth + margin),
      window.innerWidth - halfWidth - margin
    );
    pointer.style.left = `${clampedCenter}px`;
    pointer.style.top = `${rect.top - 78}px`;
  }, [arrowTarget]);

  function slotRef(key) {
    return (el) => {
      if (el) slotRefs.current.set(key, el);
      else slotRefs.current.delete(key);
    };
  }

  return (
    <main className="shell">
      <div className="masthead">
        <div>
          <h1 className="unit-title">Your deck</h1>
        </div>
        <span className="deck-count">
          <b>{known.size}</b> / {total}
        </span>
      </div>

      <p className="standfirst">
        {known.size === 0
          ? "Tap any card to go and learn it"
          : "Tap any card — read it, or go and learn it"}
      </p>

      <div className="filters">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={filter === f.id ? "filter is-active" : "filter"}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.map((group) => (
        <section key={group.id}>
          <p className="suit-head">
            {group.label} · {group.cards.filter((c) => known.has(c.key)).length} of{" "}
            {group.cards.length}
          </p>
          <div className="collection">
            {/* Every card opens, learned or not. Hiding the art here was
                protecting nothing — the path shows the same circles, greyed,
                for sections nobody has reached — and it left a learner who
                came looking for one particular card facing a grid of numbers.
                Unlearned cards are greyed the way the path greys them, and
                lead to an entry that says where the card is taught. */}
            {group.cards.map((card) => (
              <Link
                key={card.key}
                ref={slotRef(card.key)}
                className={known.has(card.key) ? "card-slot" : "card-slot is-locked"}
                href={`/deck/${card.key}`}
              >
                <span className="slot">
                  <img src={card.circle} alt="" />
                </span>
                <span className="slot-name">{card.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {arrowTarget ? (
        <div className="deck-arrow-overlay" onClick={() => setArrowTarget(null)}>
          <div ref={pointerRef} className="deck-arrow-pointer">
            <Link href={arrowTarget.href} className="deck-arrow-cta" onClick={(e) => e.stopPropagation()}>
              Continue Story
            </Link>
            <span className="deck-arrow-glyph" aria-hidden="true" />
          </div>
        </div>
      ) : null}
    </main>
  );
}
