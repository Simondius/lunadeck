"use client";

// Drop this file in as components/lesson-v2/v2-node-icon.jsx and import
// {shapeForNode, makeKeywordVariantTracker, V2NodeIcon} into app/v2/page.js.
// Replaces the per-node <img src={circleForKey(...)} /> icon (and the
// standalone glyph snippets from the earlier icon doc) with one shared
// component. Every path uses currentColor / var(--ink) only — no color is
// baked into the icon itself, so the incomplete/complete swap lives
// entirely in CSS (see the notes file for the two rules that do it).

// Shape by mechanic — derived from the node's own round data, not label
// text, so it holds regardless of how a given section phrases its labels.
export function shapeForNode(node) {
  const r0 = node.rounds?.[0];
  if (r0?.type === "zone") return "hex";      // card element matching
  if (r0?.type === "cloze") return "square";  // missing words
  if (r0?.type === "choice") return "oct";    // reading notes matching
  return "circle";                             // plain keyword rounds
}

// For circle (keyword) nodes only — which of the 3 keyword-round icons
// this node gets. Derived structurally, not from label wording:
//   - 2 words per round     -> "pairs"     (tutorial / simple / antonym)
//   - 6 words, first time   -> "six"       (the easy "obvious wrong" tier)
//   - 6 words, any time after -> "difficult" (real-word confusables / mastery)
// Call makeKeywordVariantTracker() once per SECTION and reuse the function
// it returns across that section's nodes, in order — it remembers whether
// a 6-word node has already been seen so the second and third one both
// come back "difficult".
export function makeKeywordVariantTracker() {
  let seenSix = false;
  return function keywordVariantForNode(node) {
    const count = node.rounds?.[0]?.words?.length ?? 2;
    if (count <= 2) return "pairs";
    if (!seenSix) {
      seenSix = true;
      return "six";
    }
    return "difficult";
  };
}

// shape: "hex" | "square" | "oct" | "circle"
// variant: only read when shape === "circle" — "pairs" | "six" | "difficult"
export function V2NodeIcon({ shape, variant }) {
  if (shape === "hex") {
    // card element matching — a bold target on the art
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="4" />
        <circle cx="12" cy="12" r="5" fill="currentColor" />
      </svg>
    );
  }

  if (shape === "square") {
    // missing words — solid lines of text with one dropped out
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="20" height="4.6" rx="2.3" fill="currentColor" />
        <rect x="2" y="9.7" width="20" height="4.6" rx="2.3" stroke="currentColor" strokeWidth="2.6" strokeDasharray="4 3" />
        <rect x="2" y="16.4" width="13" height="4.6" rx="2.3" fill="currentColor" />
      </svg>
    );
  }

  if (shape === "oct") {
    // reading notes matching — the checked pick
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
        <path
          d="M6.5 12.5 L10.5 16.5 L18 7"
          stroke="var(--ink)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  // shape === "circle" — keyword matching, three difficulty variants
  if (variant === "six") {
    // a batch of six to sort — 2x3 grid
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="1" y="2" width="6.5" height="9" rx="2" fill="currentColor" />
        <rect x="8.75" y="2" width="6.5" height="9" rx="2" fill="currentColor" />
        <rect x="16.5" y="2" width="6.5" height="9" rx="2" fill="currentColor" />
        <rect x="1" y="13" width="6.5" height="9" rx="2" fill="currentColor" />
        <rect x="8.75" y="13" width="6.5" height="9" rx="2" fill="currentColor" />
        <rect x="16.5" y="13" width="6.5" height="9" rx="2" fill="currentColor" />
      </svg>
    );
  }

  if (variant === "difficult") {
    // two blocks overlapping — harder to pull apart
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="13" height="14" rx="4" fill="currentColor" opacity="0.55" />
        <rect x="9" y="5" width="13" height="14" rx="4" fill="currentColor" />
      </svg>
    );
  }

  // "pairs" — two blocks finding each other, the default keyword icon
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="9" height="16" rx="4" fill="currentColor" />
      <rect x="14" y="4" width="9" height="16" rx="4" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
