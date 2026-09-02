import chapter01 from "./chapter-01.json";
import chapter02 from "./chapter-02.json";
import chapter03 from "./chapter-03.json";
import chapter04 from "./chapter-04.json";
import u1DaveStart from "./u1-dave-start.json";
import u1DaveEnd from "./u1-dave-end.json";
import u2RileyStart from "./u2-riley-start.json";
import u2RileyEnd from "./u2-riley-end.json";
import u3DaveStart from "./u3-dave-start.json";
import u3DaveEnd from "./u3-dave-end.json";
import u4RileyStart from "./u4-riley-start.json";
import u4RileyEnd from "./u4-riley-end.json";
import u5DaveStart from "./u5-dave-start.json";
import u5DaveEnd from "./u5-dave-end.json";
import u6RileyStart from "./u6-riley-start.json";
import u6RileyEnd from "./u6-riley-end.json";
import u7DaveStart from "./u7-dave-start.json";
import u7DaveEnd from "./u7-dave-end.json";
import u8RileyStart from "./u8-riley-start.json";
import u8RileyEnd from "./u8-riley-end.json";

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

// v4's own narrative nodes (docs/decisions/0057) - a start/end pair per
// unit, each playable through the same ChapterPlayer as the original four
// chapters above, but NOT chained into CHAPTERS's own next-chapter link:
// a unit's start node is followed by that unit's seven lesson nodes before
// its end node, and only v4's own path page (not ChapterPlayer's built-in
// "next chapter" screen) knows that sequencing. getNextChapter() below
// deliberately only ever searches CHAPTERS, never this list, so every v4
// narrative node's own chapter-complete screen falls back to its default
// "Back to Story" rather than wrongly auto-advancing past the lesson nodes.
export const V4_CHAPTERS = [
  { slug: "u1-dave-start", data: u1DaveStart },
  { slug: "u1-dave-end", data: u1DaveEnd },
  { slug: "u2-riley-start", data: u2RileyStart },
  { slug: "u2-riley-end", data: u2RileyEnd },
  { slug: "u3-dave-start", data: u3DaveStart },
  { slug: "u3-dave-end", data: u3DaveEnd },
  { slug: "u4-riley-start", data: u4RileyStart },
  { slug: "u4-riley-end", data: u4RileyEnd },
  { slug: "u5-dave-start", data: u5DaveStart },
  { slug: "u5-dave-end", data: u5DaveEnd },
  { slug: "u6-riley-start", data: u6RileyStart },
  { slug: "u6-riley-end", data: u6RileyEnd },
  { slug: "u7-dave-start", data: u7DaveStart },
  { slug: "u7-dave-end", data: u7DaveEnd },
  { slug: "u8-riley-start", data: u8RileyStart },
  { slug: "u8-riley-end", data: u8RileyEnd },
];

export function getChapter(slug) {
  return (
    CHAPTERS.find((c) => c.slug === slug) ??
    V4_CHAPTERS.find((c) => c.slug === slug) ??
    null
  );
}

export function getNextChapter(slug) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  if (i === -1 || i + 1 >= CHAPTERS.length) return null;
  const next = CHAPTERS[i + 1];
  return { slug: next.slug, title: next.data.title };
}
