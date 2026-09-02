import fool from "./fool_section.json";
import lovers from "./lovers_section.json";
import empress from "./empress_section.json";

// v4's own three sections (docs/decisions/0057) - generated once by
// scripts/build-v4-sections.mjs from data/v3's own Fool/Lovers/Empress
// content, collapsed from v3's 13-14 nodes each down to exactly 7 per
// Simon's own call (merge adjacent nodes, drop no rounds, keep order).
// Magician and Emperor aren't part of v4's unit map, so they're not
// included here at all. Same SECTIONS + getSection/getNextSection shape
// as data/v2 and data/v3's own sections.js, since a section list only
// ever needs a stable slug and "what comes after this one."
export const SECTIONS = [
  { slug: "fool", data: fool },
  { slug: "lovers", data: lovers },
  { slug: "empress", data: empress },
];

export function getSection(slug) {
  return SECTIONS.find((s) => s.slug === slug) ?? null;
}

export function getNextSection(slug) {
  const i = SECTIONS.findIndex((s) => s.slug === slug);
  if (i === -1 || i + 1 >= SECTIONS.length) return null;
  const next = SECTIONS[i + 1];
  return { slug: next.slug, cardName: next.data.cardName };
}
