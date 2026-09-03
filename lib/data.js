// Reads data/*.csv from disk. These run on the server at build time, so the
// CSVs never ship to the browser — only the rendered output does.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { toObjects } from "./csv.js";
// Relative, not "@/..." - check_rounds.mjs runs this file directly under
// plain Node (no bundler to resolve the alias), same reasoning ./csv.js
// and ./rounds.js's own imports already followed here.
import { firstUnitForCard } from "../data/v4/units.js";
import { SECTIONS } from "../data/v4/sections.js";
import capstoneNodes from "../data/v4/capstone_nodes.json" with { type: "json" };

const DATA_DIR = path.join(process.cwd(), "data");

// card_key -> v4 section slug, for the handful of functions below that are
// handed a card_key (data/*.csv's own join key) but need to reach into
// data/v4/sections.js, which is keyed on slug.
const slugByCardKey = new Map(SECTIONS.map((s) => [s.data.cardKey, s.slug]));

function unitForCardKey(cardKey) {
  const slug = slugByCardKey.get(cardKey);
  return slug ? (firstUnitForCard(slug)?.unit ?? null) : null;
}

// Parsed once per process. These files are read-only at build time and the
// same handful get re-read by every page — a section's play page alone wants
// seven of them, times 92 sections.
const parsed = new Map();

async function load(name) {
  if (!parsed.has(name)) {
    parsed.set(
      name,
      readFile(path.join(DATA_DIR, name), "utf8").then(toObjects)
    );
  }
  return parsed.get(name);
}

export function circleForKey(cardKey) {
  return `/assets/cards/circle/${cardKey}_circle.png`;
}

// --- content indexes ---------------------------------------------------

async function getKeywordIndex() {
  const rows = await load("data_card_keywords.csv");
  return orderedIndex(rows, "card_key", "keyword_order", (r) => r.keyword);
}

// One card's own sourced keyword list, in guidebook order - used by
// unit-complete-celebration.jsx so the words flashing around a freshly
// learned card are the same ones the keyword round-player format
// actually teaches, not invented copy.
export async function getCardKeywords(cardKey) {
  const index = await getKeywordIndex();
  return index.get(cardKey) ?? [];
}

// Groups rows by key and sorts each group by a numeric order column, so
// callers never depend on the CSV's own row order.
function orderedIndex(rows, keyField, orderField, pick) {
  const grouped = new Map();
  for (const r of rows) {
    if (!grouped.has(r[keyField])) grouped.set(r[keyField], []);
    grouped.get(r[keyField]).push({ order: Number(r[orderField]), value: pick(r) });
  }
  const out = new Map();
  for (const [key, list] of grouped) {
    list.sort((a, b) => a.order - b.order);
    out.set(
      key,
      list.map((entry) => entry.value)
    );
  }
  return out;
}

// The whole deck, in the order the Deck tab groups it: majors by number, then
// each suit Ace through King. Carries the condensed meaning so tapping a card
// can show it without another round trip.
const RANK_SHORT = {
  Ace: "A", Two: "2", Three: "3", Four: "4", Five: "5", Six: "6", Seven: "7",
  Eight: "8", Nine: "9", Ten: "10", Page: "P", Knight: "N", Queen: "Q", King: "K",
};
const SUIT_ORDER = ["Cups", "Wands", "Swords", "Pentacles"];

export async function getDeck() {
  const [base, descriptions] = await Promise.all([
    load("data_tarot_cards_base.csv"),
    load("data_card_descriptions.csv"),
  ]);
  const meaning = new Map(
    descriptions.map((r) => [r.card_key, r.description_condensed])
  );

  const cards = base.map((r) => ({
    key: r.card_key,
    name: r.card_name,
    suit: r.suit || null,
    short: r.suit ? RANK_SHORT[r.rank] ?? r.rank : r.rank,
    circle: circleForKey(r.card_key),
    master: `/assets/cards/master/${r.card_key}_MASTER.png`,
    meaning: meaning.get(r.card_key) ?? "",
  }));

  const groups = [
    { id: "majors", label: "Major Arcana", cards: cards.filter((c) => !c.suit) },
    ...SUIT_ORDER.map((suit) => ({
      id: suit.toLowerCase(),
      label: suit,
      cards: cards.filter((c) => c.suit === suit),
    })),
  ];
  return groups;
}

// Everything the Daily Draw needs about all 78 cards. Selection happens in the
// browser because it depends on progress, so the whole table ships — it is
// about 48KB, which is cheaper than a second round trip.
export async function getDrawDeck() {
  const [base, descriptions, keywordRows, symbolRows] = await Promise.all([
    load("data_tarot_cards_base.csv"),
    load("data_card_descriptions.csv"),
    load("data_card_keywords.csv"),
    load("data_major_arcana_symbols.csv"),
  ]);

  const meaning = new Map(descriptions.map((r) => [r.card_key, r]));
  const symbols = new Map(
    symbolRows.map((r) => [r.card_key, `${r.symbol_type}: ${r.symbol}`])
  );

  const keywords = orderedIndex(keywordRows, "card_key", "keyword_order", (r) => r.keyword);

  return base.map((r) => {
    const d = meaning.get(r.card_key) ?? {};
    return {
      key: r.card_key,
      name: r.card_name,
      master: `/assets/cards/master/${r.card_key}_MASTER.png`,
      // A minor arcana card teaches no planet or sign, but it always belongs
      // to a suit, and that is the symbol printed on it.
      symbol: symbols.get(r.card_key) ?? (r.suit ? `Suit: ${r.suit}` : null),
      // v4's own unit numbering (0082, replacing v1's data_unit_metadata.csv-
      // driven version) - 99 for every card v4 doesn't teach yet (all 56
      // minors), same fallback this already used for v1's own uncovered
      // cards.
      unit: unitForCardKey(r.card_key) ?? 99,
      keywords: keywords.get(r.card_key) ?? [],
      meaning: d.description_condensed ?? "",
      reversed: d.reversed_reading_notes ?? "",
    };
  });
}

// v4's own lesson node ids, flattened - the dev console's own "unlock all"
// wants every id that could ever appear in progress, and Social's own "path
// percent" wants the same list's length as its denominator (0082, replacing
// v1's data_curriculum_nodes.csv-driven version of this function). Nothing
// downstream reads a "unit"-shaped entry any more - every caller already
// only ever filtered for `type: "section"` - so this returns just that
// shape directly, sourced from getAllSections() below.
export async function getPath() {
  const sections = await getAllSections();
  return sections.map((s) => ({ type: "section", nodeIds: s.nodeIds }));
}

// Everything the app knows about one card, in depth order — the layer a
// learner goes to *after* the section has taught them the gist.
//
// The teaching screen deliberately shows almost nothing (one line and the
// keywords) and the section's exercises escalate from there. This is the other
// end: the full guidebook entry, what the card's symbol means, and the reading
// notes. description_text is roughly double description_condensed and shares
// almost none of its wording — median similarity 0.03 — so it is a genuinely
// richer treatment rather than a longer one.
export async function getCardPage(cardKey) {
  const [base, descriptions, keywordRows, symbolRows, sigRows, pointRows, imageRows] =
    await Promise.all([
      load("data_tarot_cards_base.csv"),
      load("data_card_descriptions.csv"),
      load("data_card_keywords.csv"),
      load("data_major_arcana_symbols.csv"),
      load("data_symbol_significance.csv"),
      load("data_card_talking_points.csv"),
      load("data_symbol_images.csv"),
    ]);

  const card = base.find((r) => r.card_key === cardKey);
  if (!card) return null;
  const description = descriptions.find((r) => r.card_key === cardKey) ?? {};
  const major = symbolRows.find((r) => r.card_key === cardKey);
  const symbolType = major ? major.symbol_type : card.suit ? "Suit" : null;
  const symbolName = major ? major.symbol : card.suit || null;

  const phrases = sigRows
    .filter((r) => r.symbol_type === symbolType && r.symbol_name === symbolName)
    .sort((a, b) => Number(a.phrase_order) - Number(b.phrase_order))
    .map((r) => r.phrase);

  const keywords = orderedIndex(keywordRows, "card_key", "keyword_order", (r) => r.keyword);
  const points = orderedIndex(pointRows, "card_key", "note_order", (r) => r.reading_note);

  // The icon itself, so a teaching beat can show the same art the symbol
  // rounds use rather than describing it.
  const art = imageRows.find(
    (r) => r.symbol_type === symbolType && r.symbol_name === symbolName
  );

  return {
    key: cardKey,
    name: card.card_name,
    image: `/assets/cards/master/${cardKey}_MASTER.png`,
    arcana: card.arcana_type,
    suit: card.suit || null,
    astrological: description.astrological_label || null,
    symbol:
      symbolType && symbolName
        ? {
            label: `${symbolType}: ${symbolName}`,
            image: art ? `/assets/symbols/${art.image_file}` : null,
            phrases,
          }
        : null,
    keywords: keywords.get(cardKey) ?? [],
    // The deep layer, unused anywhere in the app until now.
    guidebook: description.description_text ?? "",
    points: points.get(cardKey) ?? [],
    // Shown only once the learner has actually pulled this card reversed.
    reversed: description.reversed_reading_notes ?? "",
  };
}

export async function getAllCardKeys() {
  const rows = await load("data_tarot_cards_base.csv");
  return rows.map((r) => r.card_key);
}

// One entry per card v4 actually teaches (the 22 Major Arcana) - the Deck,
// Reader, and Social tabs' own idea of "which lesson teaches this card, and
// where" (0082, replacing v1's data_curriculum_nodes.csv-driven version of
// this function after v1's removal). Every minor arcana card is simply
// absent from this list - v4 doesn't teach any of them yet, same as it
// couldn't before this rewrite either.
export async function getAllSections() {
  return SECTIONS.map((s) => {
    const unit = firstUnitForCard(s.slug);
    const nodeIds = [...s.data.nodes.map((n) => n.id), capstoneNodes[s.slug]?.id].filter(
      Boolean
    );
    return {
      unit: unit?.unit ?? null,
      unitName: unit?.title ?? s.data.cardName,
      cardKey: s.data.cardKey,
      cardName: s.data.cardName,
      nodeIds,
      href: unit ? `/v4/play/${s.slug}/1?unit=${unit.unit}` : null,
    };
  });
}

// The reader argues from the guidebook's own reading notes, not just the
// keywords the draw shows — so it gets data_card_talking_points attached on
// top of everything getDrawDeck already assembles. Same cards, more of each.
export async function getReaderDeck() {
  const [cards, noteRows] = await Promise.all([
    getDrawDeck(),
    load("data_card_talking_points.csv"),
  ]);

  const notes = orderedIndex(noteRows, "card_key", "note_order", (r) => r.reading_note);

  return cards.map((card) => ({
    ...card,
    talkingPoints: notes.get(card.key) ?? [],
  }));
}
