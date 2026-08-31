// The streak flame. Lived inside path-screen.jsx until the friends list needed
// it too; shared rather than copied so the two can never drift.
//
// Spec_Meta_Hygiene_Systems 7.2 calls for a flame-and-count chip. Inline rather
// than an icon file so it takes its colour, glow and flicker from the
// stylesheet — see .streak-flame.
//
// Two paths, not one: an outer body with a couple of licks, and a hotter inner
// core. The core is what makes it read as fire rather than a droplet at a
// glance, and it is what runs blue when the flame catches — which is the way
// round a real flame does it.
export default function Flame() {
  return (
    <svg className="streak-flame" viewBox="0 0 24 24" aria-hidden="true">
      <path
        className="flame-body"
        d="M13.4 1.2c1 3.4-1.1 5-2.9 6.9-2 2.1-3.3 4-3.3 6.6a6.8 6.8 0 0 0 13.6 0c0-2.4-.9-4.2-2.2-5.8-.7-.9-1.3-1.7-1.5-2.7-1.3 1.1-1.8 2.6-1.5 4.3-1.9-1.5-2.9-3.7-2.9-6.2-1.3 1.7-1.7 3.5-1.1 5.5-1.9-2.3-2.1-5.4 1.8-8.6Z"
      />
      <path
        className="flame-core"
        d="M13.9 8.6c.4 2.2 2.6 3.4 2.6 5.8a3.3 3.3 0 0 1-6.6 0c0-1.9 1.3-2.9 2-4.4.3 1 .4 1.9.1 2.9 1.1-1 1.8-2.6 1.9-4.3Z"
      />
    </svg>
  );
}
