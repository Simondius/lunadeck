"use client";

import SceneImage from "@/components/story/scene-image";

// The card as it appears mid-narrative: breathing gently ("shake slightly
// like it is alive", per Simon's brief) via .journey-card's own keyframe
// animation in app/globals.css. Reuses SceneImage so a not-yet-committed
// card image degrades to the same honest placeholder box as everywhere
// else in the app, rather than a broken-image icon.
//
// .journey-card is the *wrapper* (it owns the breathing animation, the
// max-width, the drop shadow); SceneImage's own <img>/.art-pending element
// is styled as its child via ".journey-card img, .journey-card .art-pending"
// in app/globals.css, so SceneImage itself gets no className here.
export default function JourneyCard({ src, alt, initial }) {
  return (
    <div className="journey-card">
      <SceneImage src={src} alt={alt || ""} initial={initial} />
    </div>
  );
}
