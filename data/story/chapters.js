import chapter01 from "./chapter-01.json";
import chapter02 from "./chapter-02.json";
import chapter03 from "./chapter-03.json";
import chapter04 from "./chapter-04.json";

// Story mode's own chapter index (docs/decisions/0048) - mirrors data/v2 and
// data/v3's own sections.js shape (a flat array + two lookup helpers) since
// that pattern already does exactly what a chapter list needs: a stable
// slug per entry, and "what comes after this one."
//
// The engine (chapter-player.jsx) doesn't assume any particular count -
// CHAPTERS is a real array precisely so more can be appended here without
// touching the player at all. Order matters here beyond array position: it's
// also what CHAPTERS's own Part-N counter below reads, so Dave's two
// chapters and Riley's two chapters interleave in the order each character
// should actually be encountered (0054).
const RAW_CHAPTERS = [
  { slug: "chapter-01", data: chapter01 },
  { slug: "chapter-02", data: chapter02 },
  { slug: "chapter-03", data: chapter03 },
  { slug: "chapter-04", data: chapter04 },
];

// "Dave Part 1", "Riley Part 1", "Dave Part 2", ... (0050) - a running
// count per chapter.character, in array order, not stored on the chapter
// data itself so it can never drift out of sync with actual position.
const counts = {};
export const CHAPTERS = RAW_CHAPTERS.map((c) => {
  const character = c.data.character;
  counts[character] = (counts[character] ?? 0) + 1;
  const name = character[0].toUpperCase() + character.slice(1);
  return { ...c, partLabel: `${name} Part ${counts[character]}` };
});

export function getChapter(slug) {
  return CHAPTERS.find((c) => c.slug === slug) ?? null;
}

export function getNextChapter(slug) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  if (i === -1 || i + 1 >= CHAPTERS.length) return null;
  const next = CHAPTERS[i + 1];
  return { slug: next.slug, title: next.data.title };
}
