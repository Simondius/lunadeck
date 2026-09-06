"use client";

import { useRouter } from "next/navigation";
import JourneyPlayer from "./journey-player";
import { completeUnit } from "@/lib/journey-progress";
import { FLYER_ID } from "@/lib/unit-unlock-flyer";

// Same flyer spec as unit-complete-celebration.jsx's own hand-off
// (docs/decisions/0077) - Simon asked the unlock beat to reuse that
// "previous functionality where [the card] is added to the deck" rather
// than invent a new animation, so the numbers and DOM shape here are
// copied from there on purpose, not just similar.
const FLYER_EXPAND_SCALE = 1.2;
const FLYER_EXPAND_MS = 260;

// Wires JourneyPlayer to progress + navigation: marks the unit complete in
// lunadeck.journey.v1, then hands off to the deck's own unlock animation
// (the pre-Journey "card flies into the deck" sequence - see
// lib/unit-unlock-flyer.js and deck-screen.jsx's `?unlock=` handling)
// instead of bouncing straight back into /journey. deck-screen.jsx already
// shows a "Continue" coachmark pointing at the Path tab once the card
// lands, using whatever `next` we hand it here - that's the "revert to the
// path" half of the beat, done the same way v4's own chapter-complete flow
// already does it (chapter-player.jsx), not a new redirect invented for
// Journey.
export default function JourneyPlayScreen({ unit }) {
  const router = useRouter();

  function handleComplete() {
    completeUnit(unit.slug);

    // Clone the on-screen card into a fixed-position flyer at its exact
    // current rect and grow it slightly, exactly as unit-complete-
    // celebration.jsx does before its own navigation - deck-screen.jsx
    // picks this same element up by id (FLYER_ID) once /deck mounts and
    // flies it the rest of the way into the real slot. If the card art
    // isn't on screen for some reason, deck-screen.jsx already falls back
    // to animating the slot in place with nothing handed off, so this is
    // safe to skip rather than block the navigation on.
    const cardEl = document.querySelector(".journey-card img");
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
          {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          },
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

    // next=/ - literally the Path tab's own href (tabbar.jsx), so the
    // coachmark deck-screen.jsx shows after landing points at, and leads
    // back to, "the path" per Simon's brief. (With only one unit built,
    // "/" redirects straight back into replaying it - app/journey/page.js's
    // own comment already flags that as the known one-unit limitation to
    // revisit once there's a real path to choose from, not something this
    // beat needs to solve.)
    const params = new URLSearchParams({ unlock: unit.cardKey, next: "/" });
    router.push(`/deck?${params.toString()}`);
  }

  return <JourneyPlayer unit={unit} onComplete={handleComplete} />;
}
