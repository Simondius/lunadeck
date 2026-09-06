// Journey is the default mode now (Simon's call, 6 Sep) - a new
// narrative-driven UX explored alongside the existing Path course, not a
// replacement for it. Path (v4) is paused, not removed: its curriculum and
// code are untouched, and it stays reachable via the dev console's
// "Open Path (legacy)" link (components/dev-console.jsx). See
// docs/decisions/0100-journey-mode-scaffold.md for the full reasoning (same
// repo, new top-level mode, one unit at a time).
// Re-exporting rather than duplicating: this and /journey are the exact
// same page, not two copies that can drift apart.
export { default } from "./journey/page";
