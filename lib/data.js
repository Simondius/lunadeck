// Reads data/*.csv from disk. These run on the server at build time, so the
// CSVs never ship to the browser — only the rendered output does.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { toObjects, splitList } from "./csv.js";

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
      cardsInvolved: splitList(r.cards_involved),
      distractorTier: r.distractor_tier,
      notes: r.notes,
    }))
    .sort((a, b) => a.playOrder - b.playOrder);
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

// --- exercise assembly -------------------------------------------------

import { buildRound } from "./rounds.js";

async function getKeywordIndex() {
  const rows = await load("data_card_keywords.csv");
  const index = new Map();
  for (const r of rows) {
    if (!index.has(r.card_key)) index.set(r.card_key, []);
    index.get(r.card_key).push({ order: Number(r.keyword_order), keyword: r.keyword });
  }
  const out = new Map();
  for (const [key, list] of index) {
    list.sort((a, b) => a.order - b.order);
    out.set(key, list.map((k) => k.keyword));
  }
  return out;
}

async function getTalkingPointIndex() {
  const rows = await load("data_card_talking_points.csv");
  const index = new Map();
  for (const r of rows) {
    if (!index.has(r.card_key)) index.set(r.card_key, []);
    index.get(r.card_key).push({ order: Number(r.note_order), note: r.reading_note });
  }
  const out = new Map();
  for (const [key, list] of index) {
    list.sort((a, b) => a.order - b.order);
    out.set(key, list.map((n) => n.note));
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
        astro: r.astrological_label,
      },
    ])
  );
}

async function getCardIndex() {
  const rows = await load("data_tarot_cards_base.csv");
  return new Map(rows.map((r) => [r.card_key, r.card_name]));
}

export async function getSession(unitNumber) {
  const [nodes, keywords, talkingPoints, descriptions, cards] = await Promise.all([
    getNodes(unitNumber),
    getKeywordIndex(),
    getTalkingPointIndex(),
    getDescriptionIndex(),
    getCardIndex(),
  ]);

  const ctx = { keywords, talkingPoints, descriptions, cards };

  return nodes.map((node) => {
    const round = buildRound(node, ctx);
    return {
      nodeId: node.nodeId,
      section: node.section,
      formatCode: node.formatCode,
      formatName: node.formatName,
      nodeType: node.nodeType,
      distractorTier: node.distractorTier,
      playable: Boolean(round),
      round,
    };
  });
}
