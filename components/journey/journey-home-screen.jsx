"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasStartedJourney, markJourneyStarted } from "@/lib/journey-progress";

// The screen the JOURNEY tab (components/tabbar.jsx) actually lands on now
// (Simon, 0906 follow-up) - "/" used to redirect straight into the
// full-bleed beat player (app/journey/page.js's old comment explains why:
// no unit-select screen was needed with only one unit built). Simon's new
// spec adds a stop in between: two overlapping cards - the unit's own art
// (previewBg, "a single visual from the current stage of the story") behind
// the card being taught (cardFace) - and a single "Continue Journey" button
// that's the only way into the full-bleed player from here. The tab bar
// stays visible on this screen (TabBar only hides on "/journey/play/..."
// routes), which is what makes this "the main UI" the in-player X
// (journey-player.jsx's .journey-exit) returns to, rather than the player
// itself.
//
// Simon's follow-up (still 0906): that's true for every visit EXCEPT the
// very first one ever - the first time a reader ever opens the app/taps
// this tab, it should skip this screen and drop straight into the
// full-bleed player, same as the original redirect-only version did. This
// needs client state (localStorage, via lib/journey-progress.js's
// hasStartedJourney), so this component is a client one now: it renders
// nothing (a bare themed shell, no cards/button yet) until that check
// resolves on mount, then either redirects to the player (first-ever
// visit - and marks itself started so it won't redirect again) or reveals
// the normal preview screen. Rendering nothing first (rather than
// flashing the preview then redirecting) is what keeps a first-time
// reader from ever seeing this screen at all; the server-rendered HTML
// has no access to localStorage either, so it matches this same "nothing
// yet" state and hydrates cleanly.
export default function JourneyHomeScreen({ unit }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasStartedJourney()) {
      setReady(true);
      return;
    }
    // journey-player.jsx also marks itself started on its own mount
    // (covers every entry path, not just this redirect) - marking it
    // here too just means the flag is already true by the time the
    // player's own effect runs, which is harmless (markJourneyStarted is
    // itself idempotent).
    markJourneyStarted();
    router.replace(`/journey/play/${unit.slug}`);
  }, [router, unit.slug]);

  if (!ready) {
    return <main className="shell starfield journey-home" aria-hidden="true" />;
  }

  return (
    <main className="shell starfield journey-home">
      <div className="journey-home-stack">
        <div className="journey-home-card journey-home-card-scene" aria-hidden="true">
          <img src={unit.previewBg} alt="" />
        </div>
        <div className="journey-home-card journey-home-card-face">
          <img src={unit.cardFace} alt={unit.cardName} />
        </div>
      </div>

      <p className="journey-home-caption">{unit.cardName}</p>

      <Link href={`/journey/play/${unit.slug}`} className="journey-home-continue">
        Continue Journey
      </Link>
    </main>
  );
}
