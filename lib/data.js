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
// One row per section, in play order — what the unit page lists and what the
// path rings and section bars count against. RECAP and CUMULATIVE are sections
// too; they just hold one node and teach no new card.
export async function getSections(unitNumber) {
  const nodes = await getNodes(unitNumber);
  const order = [];
  const byKey = new Map();

  for (const node of nodes) {
    const key = String(node.section);
    if (!byKey.has(key)) {
      order.push(key);
      byKey.set(key, {
        section: key,
        kind:
          key === "RECAP" ? "recap" : key === "CUMULATIVE" ? "cumulative" : "standard",
        cardKey: node.cardKey || null,
        cardName: node.cardName || null,
        nodeIds: [],
        formats: [],
      });
    }
    const entry = byKey.get(key);
    entry.nodeIds.push(node.nodeId);
    if (!entry.formats.includes(node.formatCode)) entry.formats.push(node.formatCode);
    // A throwback node rides along at the end of a section and carries the
    // section's card_key only as denormalised context — the first node's card
    // is the one the section actually teaches.
    if (!entry.cardKey && node.cardKey) entry.cardKey = node.cardKey;
  }

  return order.map((key) => byKey.get(key));
}

// Every node id in a unit, in play order — the denominator for its ring.
export async function getUnitNodeIds(unitNumber) {
  const nodes = await getNodes(unitNumber);
  return nodes.map((n) => n.nodeId);
}

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
  const [base, descriptions, keywordRows, symbolRows, units] = await Promise.all([
    load("data_tarot_cards_base.csv"),
    load("data_card_descriptions.csv"),
    load("data_card_keywords.csv"),
    load("data_major_arcana_symbols.csv"),
    getUnits(),
  ]);

  const meaning = new Map(descriptions.map((r) => [r.card_key, r]));
  const symbols = new Map(
    symbolRows.map((r) => [r.card_key, `${r.symbol_type}: ${r.symbol}`])
  );

  const keywords = orderedIndex(keywordRows, "card_key", "keyword_order", (r) => r.keyword);

  const unitOf = new Map();
  for (const unit of units) {
    for (const key of unit.cardKeys) unitOf.set(key, unit.number);
  }

  return base.map((r) => {
    const d = meaning.get(r.card_key) ?? {};
    return {
      key: r.card_key,
      name: r.card_name,
      master: `/assets/cards/master/${r.card_key}_MASTER.png`,
      // A minor arcana card teaches no planet or sign, but it always belongs
      // to a suit, and that is the symbol printed on it.
      symbol: symbols.get(r.card_key) ?? (r.suit ? `Suit: ${r.suit}` : null),
      unit: unitOf.get(r.card_key) ?? 99,
      keywords: keywords.get(r.card_key) ?? [],
      meaning: d.description_condensed ?? "",
      reversed: d.reversed_reading_notes ?? "",
    };
  });
}

// The path: every section in the whole curriculum, in play order, with each
// unit's banner sitting inline immediately before its first section.
//
// Spec_MainPath Section 3 — "a single, continuous vertical scroll spanning
// every unit the learner has reached, not a separate screen per unit". The
// units are the chapter headings; the sections are the path.
export async function getPath() {
  const units = await getUnits();
  const names = await getCardNames();
  const perUnit = await Promise.all(units.map((u) => getSections(u.number)));

  const path = [];
  units.forEach((unit, i) => {
    path.push({
      type: "unit",
      unit: unit.number,
      name: unit.name,
      tagline: unit.tagline,
      cardCount: unit.cardCount,
      unlockRequirement: unit.unlockRequirement,
    });
    for (const section of perUnit[i]) {
      path.push({
        type: "section",
        unit: unit.number,
        unitName: unit.name,
        section: section.section,
        kind: section.kind,
        cardKey: section.cardKey,
        cardName: section.cardKey ? names.get(section.cardKey) ?? section.cardName : null,
        image: section.cardKey ? circleForKey(section.cardKey) : null,
        nodeIds: section.nodeIds,
      });
    }
  });
  return path;
}

// Everything the "meet the card" screen shows before a section's first
// exercise. All of it already exists in data/ — no new card content is
// authored anywhere, per CLAUDE.md.
export async function getCardIntro(cardKey) {
  if (!cardKey) return null;
  const [base, descriptions, keywordRows, symbolRows] = await Promise.all([
    load("data_tarot_cards_base.csv"),
    load("data_card_descriptions.csv"),
    load("data_card_keywords.csv"),
    load("data_major_arcana_symbols.csv"),
  ]);

  const card = base.find((r) => r.card_key === cardKey);
  if (!card) return null;
  const description = descriptions.find((r) => r.card_key === cardKey) ?? {};
  const symbol = symbolRows.find((r) => r.card_key === cardKey);
  const keywords = orderedIndex(keywordRows, "card_key", "keyword_order", (r) => r.keyword);

  return {
    key: cardKey,
    name: card.card_name,
    image: `/assets/cards/master/${cardKey}_MASTER.png`,
    arcana: card.arcana_type,
    suit: card.suit || null,
    // A major carries a planet or sign; a minor always carries its suit.
    symbol: symbol
      ? `${symbol.symbol_type}: ${symbol.symbol}`
      : card.suit
        ? `Suit: ${card.suit}`
        : null,
    keywords: keywords.get(cardKey) ?? [],
    // First meeting gets one orienting line, not the whole entry. The section
    // itself escalates from here — node 1 tests keywords, node 2 the full
    // condensed description, node 4 the collated talking points — so handing
    // over node 2's content before node 1 has run flattens that ramp.
    opener: opener(card.card_name, description.description_condensed ?? ""),
    meaning: description.description_condensed ?? "",
  };
}

// One orienting line, selected from the guidebook's own condensed entry. This
// picks an existing sentence — it never rewrites or summarises one.
//
// The naive choice, "take the first sentence", is wrong for a good third of
// the deck: many entries open on the card's zodiac sign rather than the card
// ("Virgo is ruled by Mercury in its most grounded form…" for The Hermit), and
// three open by referring back to a neighbouring card ("Card three follows the
// private reflection of the Two…" for The Empress). Neither tells a learner
// meeting the card what it stands for.
//
// So: the first sentence within the opening three that actually talks about
// this card — by naming it, or by referring to itself as "this card". Entries
// that already open well are untouched; 29 of 78 get a better line.
const SELF_REFERENCE =
  /\bthis (card|knight|king|queen|page|suit)\b|\ban embodiment\b|\bthe \w+ (is|works|masters|holds|embodies)\b/i;

function opener(cardName, text) {
  const sentences = (text.trim().match(/[^.!?]+[.!?]/g) ?? [text.trim()]).map((s) => s.trim());
  const own = cardName
    .split(/[^A-Za-z]+/)
    .filter((w) => w && !["the", "of", "a"].includes(w.toLowerCase()));

  for (const sentence of sentences.slice(0, 3)) {
    const namesItself = own.some((w) =>
      new RegExp(`\\b${w}\\b`, "i").test(sentence)
    );
    if (namesItself || SELF_REFERENCE.test(sentence)) return sentence;
  }
  return sentences[0];
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
  const [base, descriptions, keywordRows, symbolRows, sigRows, pointRows] =
    await Promise.all([
      load("data_tarot_cards_base.csv"),
      load("data_card_descriptions.csv"),
      load("data_card_keywords.csv"),
      load("data_major_arcana_symbols.csv"),
      load("data_symbol_significance.csv"),
      load("data_card_talking_points.csv"),
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

  return {
    key: cardKey,
    name: card.card_name,
    image: `/assets/cards/master/${cardKey}_MASTER.png`,
    arcana: card.arcana_type,
    suit: card.suit || null,
    astrological: description.astrological_label || null,
    symbol: symbolType && symbolName ? { label: `${symbolType}: ${symbolName}`, phrases } : null,
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

// Every section across every unit, flattened — the Deck tab needs all of them
// to work out which cards are known.
export async function getAllSections() {
  const units = await getUnits();
  const per = await Promise.all(units.map((u) => getSections(u.number)));
  return units.flatMap((unit, i) =>
    per[i].map((s) => ({ unit: unit.number, cardKey: s.cardKey, nodeIds: s.nodeIds }))
  );
}

export async function getCardNames() {
  const rows = await load("data_tarot_cards_base.csv");
  return new Map(rows.map((r) => [r.card_key, r.card_name]));
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

export async function getSession(unitNumber, section = null) {
  const [allNodes, keywords, talkingPoints, descriptions, cards, similar] =
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

  const nodes =
    section === null
      ? allNodes
      : allNodes.filter((n) => String(n.section) === String(section));

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
