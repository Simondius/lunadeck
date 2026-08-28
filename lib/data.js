// Reads data/*.csv from disk. These run on the server at build time, so the
// CSVs never ship to the browser — only the rendered output does.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { toObjects, splitList } from "./csv.js";
import { buildNode } from "./rounds.js";

const DATA_DIR = path.join(process.cwd(), "data");

async function load(name) {
  const text = await readFile(path.join(DATA_DIR, name), "utf8");
  return toObjects(text);
}

export async function getUnits() {
  const rows = await load("data_unit_metadata.csv");
  return rows
    .map((r) => ({
      number: Number(r.unit_number),
      name: r.unit_name,
      tagline: r.unit_tagline,
      intro: r.unit_intro_copy,
      sectionCount: Number(r.section_count),
      nodeCount: Number(r.total_node_count),
      cardCount: Number(r.card_count),
      cardKeys: splitList(r.card_keys_covered),
      majorCount: Number(r.major_count),
      minorCount: Number(r.minor_count),
      dominantSuit: r.dominant_suit,
      minutesTypical: Number(r.est_completion_minutes_typical),
      unlockRequirement: r.unlock_requirement,
      icon: circleFor(r.icon_image_file),
      menuOrder: Number(r.menu_order),
    }))
    .sort((a, b) => a.menuOrder - b.menuOrder);
}

export async function getUnit(unitNumber) {
  const units = await getUnits();
  return units.find((u) => u.number === Number(unitNumber)) ?? null;
}

export async function getNodes(unitNumber) {
  const rows = await load("data_curriculum_nodes.csv");
  return rows
    .filter((r) => Number(r.unit_number) === Number(unitNumber))
    .map((r) => ({
      playOrder: Number(r.global_play_order),
      section: r.section_number_in_unit,
      nodeNumber: Number(r.node_number),
      nodeId: r.node_id,
      nodeType: r.node_type,
      formatCode: r.format_code,
      formatName: r.format_name,
      cardKey: r.card_key,
      cardName: r.card_name,
      arcanaType: r.arcana_type,
      anchorVariant: r.anchor_variant,
      isSymbolIntro: r.is_symbol_intro === "True",
      cardsInvolved: [...new Set(splitList(r.cards_involved))],
      cardsToRecall: Number(r.cards_to_recall_count),
      distractorTier: r.distractor_tier,
      notes: r.notes,
    }))
    .sort((a, b) => a.playOrder - b.playOrder);
}

// cards_involved is de-duplicated above rather than trusted as-is: a repeated
// key would render two identical options in one grid, which is unanswerable.
// scripts/check_data.py fails on duplicates so they get fixed in the data
// rather than quietly absorbed here.
export function groupBySection(nodes) {
  const sections = new Map();
  for (const node of nodes) {
    if (!sections.has(node.section)) sections.set(node.section, []);
    sections.get(node.section).push(node);
  }
  return [...sections.entries()];
}

// The circle crops are the path-node variant of each card's master art.
function circleFor(masterFile) {
  if (!masterFile) return null;
  const key = masterFile.replace(/_MASTER\.png$/, "");
  return `/assets/cards/circle/${key}_circle.png`;
}

export function circleForKey(cardKey) {
  return `/assets/cards/circle/${cardKey}_circle.png`;
}

// --- content indexes ---------------------------------------------------

async function getKeywordIndex() {
  const rows = await load("data_card_keywords.csv");
  return orderedIndex(rows, "card_key", "keyword_order", (r) => r.keyword);
}

async function getTalkingPointIndex() {
  const rows = await load("data_card_talking_points.csv");
  return orderedIndex(rows, "card_key", "note_order", (r) => r.reading_note);
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

async function getDescriptionIndex() {
  const rows = await load("data_card_descriptions.csv");
  return new Map(
    rows.map((r) => [
      r.card_key,
      {
        condensed: r.description_condensed,
        anonymized: r.description_anonymized,
        reversed: r.reversed_reading_notes,
        astro: r.astrological_label,
      },
    ])
  );
}

async function getCardIndex() {
  const rows = await load("data_tarot_cards_base.csv");
  return {
    names: new Map(rows.map((r) => [r.card_key, r.card_name])),
    arcana: new Map(rows.map((r) => [r.card_key, r.arcana_type])),
    suits: new Map(rows.map((r) => [r.card_key, r.suit])),
  };
}

// --- symbol layer ------------------------------------------------------
//
// Modality is excluded everywhere: symbol_significance carries 3 modalities
// but symbol_images has no asset for them, so they can be neither a
// reference nor a candidate. This matches the Lesson Format Bible's own
// blanket "no Modality" rule for formats A4/A5/A7 and C.

export function symbolKey(type, name) {
  return `${type}|${name}`;
}

async function getSymbolIndex() {
  const [images, significance] = await Promise.all([
    load("data_symbol_images.csv"),
    load("data_symbol_significance.csv"),
  ]);

  const symbols = images.map((r) => ({
    key: symbolKey(r.symbol_type, r.symbol_name),
    type: r.symbol_type,
    name: r.symbol_name,
    image: `/assets/symbols/${r.image_file}`,
  }));

  const phrases = orderedIndex(
    significance.filter((r) => r.symbol_type !== "Modality"),
    "symbol_name",
    "phrase_order",
    (r) => r.phrase
  );

  // Re-key the phrase index on type|name: symbol_name alone is unique in the
  // current data, but nothing in the schema guarantees a Planet and a Sign
  // can't share one.
  const byKey = new Map();
  for (const symbol of symbols) {
    byKey.set(symbol.key, phrases.get(symbol.name) ?? []);
  }

  return { symbols, phrases: byKey, byKey: new Map(symbols.map((s) => [s.key, s])) };
}

// Which symbol a section teaches. Majors carry a Planet or Zodiac Sign;
// an Ace introduces its suit's symbol. Every other minor teaches no new
// symbol, which is why the curriculum never gives it a symbol-format node.
async function getCardSymbolIndex(suits) {
  const rows = await load("data_major_arcana_symbols.csv");
  const index = new Map(
    rows.map((r) => [r.card_key, { type: r.symbol_type, name: r.symbol }])
  );
  for (const [cardKey, suit] of suits) {
    if (suit && cardKey.endsWith("_ace")) {
      index.set(cardKey, { type: "Suit", name: suit });
    }
  }
  return index;
}

// --- similarity --------------------------------------------------------
//
// Only used to source a True/False donor for the handful of nodes that
// name a single card and so have no sibling to borrow a statement from.
async function getSimilarityIndex() {
  const rows = await load("data_card_similarity.csv");
  const index = new Map();
  for (const r of rows) {
    if (!index.has(r.card_key_a)) index.set(r.card_key_a, []);
    index.get(r.card_key_a).push({
      key: r.card_key_b,
      tier: r.difficulty_tier,
      score: Number(r.similarity_score),
    });
  }
  for (const list of index.values()) {
    list.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  }
  return index;
}

// --- exercise assembly -------------------------------------------------

export async function getSession(unitNumber) {
  const [nodes, keywords, talkingPoints, descriptions, cards, similar] =
    await Promise.all([
      getNodes(unitNumber),
      getKeywordIndex(),
      getTalkingPointIndex(),
      getDescriptionIndex(),
      getCardIndex(),
      getSimilarityIndex(),
    ]);

  const symbolData = await getSymbolIndex();
  const cardSymbols = await getCardSymbolIndex(cards.suits);

  const ctx = {
    keywords,
    talkingPoints,
    descriptions,
    cards: cards.names,
    arcana: cards.arcana,
    suits: cards.suits,
    similar,
    symbols: symbolData.symbols,
    symbolPhrases: symbolData.phrases,
    symbolByKey: symbolData.byKey,
    cardSymbols,
  };

  return nodes.map((node) => {
    const instances = buildNode(node, ctx);
    return {
      nodeId: node.nodeId,
      section: node.section,
      formatCode: node.formatCode,
      formatName: node.formatName,
      nodeType: node.nodeType,
      distractorTier: node.distractorTier,
      playable: Boolean(instances),
      instances: instances ?? [],
    };
  });
}
