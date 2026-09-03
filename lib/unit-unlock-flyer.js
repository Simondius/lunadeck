// A raw DOM element (not a React one) that carries the unit-unlock card's
// own art across the /story/play/[chapter] -> /deck navigation, so it
// visually persists through the route change instead of the celebration
// screen's card just vanishing and a new one appearing on the other side
// (docs/decisions/0077). Appended straight to document.body, a sibling of
// Next.js's own root container, not a child of it - the App Router only
// tears down and remounts what it itself rendered, so this survives the
// transition untouched. unit-complete-celebration.jsx creates it and
// starts its own first phase (a 20% expand); deck-screen.jsx picks the
// same element back up by this id once it mounts, flies it into the real
// slot, and removes it. If deck-screen.jsx never finds it - a page
// refresh mid-navigation, or the element never got created - it just
// falls back to animating the slot in place with nothing to hand off.
export const FLYER_ID = "unit-unlock-flyer";
