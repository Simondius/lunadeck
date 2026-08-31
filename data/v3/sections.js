import fool from "./fool_section.json";
import lovers from "./lovers_section.json";
import magician from "./magician_section.json";
import empress from "./empress_section.json";
import emperor from "./emperor_section.json";

// Same card order as v2 (docs/decisions/0035): Fool -> Lovers -> Magician ->
// Empress -> Emperor. v3 only resequences each section's own nodes
// (docs/decisions/0046); it doesn't touch the order of sections themselves.
export const SECTIONS = [
  { slug: "fool", data: fool },
  { slug: "lovers", data: lovers },
  { slug: "magician", data: magician },
  { slug: "empress", data: empress },
  { slug: "emperor", data: emperor },
];

export function getSection(slug) {
  return SECTIONS.find((s) => s.slug === slug) ?? null;
}

// null past the last section — NodeSession falls back to "Back to v3".
export function getNextSection(slug) {
  const i = SECTIONS.findIndex((s) => s.slug === slug);
  if (i === -1 || i + 1 >= SECTIONS.length) return null;
  const next = SECTIONS[i + 1];
  return { slug: next.slug, cardName: next.data.cardName };
}
