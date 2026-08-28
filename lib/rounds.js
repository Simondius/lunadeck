// Turns a curriculum row into everything one round needs to render.
// Built on the server so format components receive plain data.
//
// Where the Lesson Format Bible and data_curriculum_nodes.csv disagree, the
// data wins — it's what the curriculum actually plays. Divergences are noted
// inline so they can be reconciled later.

import { splitList } from "./csv.js";

export function masterForKey(cardKey) {
  return `/assets/cards/master/${cardKey}_MASTER.png`;
}

export function symbolImage(file) {
  return `/assets/symbols/${file}`;
}

// Deterministic shuffle so a given node always renders the same way — a round
// that reshuffles on every re-render is untestable.
function seededShuffle(items, seed) {
  const out = [...items];
  let value = 0;
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const j = value % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function joinPhrases(list) {
  return list.join(" · ");
}

// --- Format A: one fixed reference, 2-4 candidates -----------------------

function formatA1(node, ctx) {
  const anchor =
    node.anchorVariant === "description_anonymized"
      ? {
          type: "prose",
          text: ctx.descriptions.get(node.cardKey)?.anonymized ?? "",
        }
      : { type: "chips", items: ctx.keywords.get(node.cardKey) ?? [] };

  return {
    kind: "A",
    prompt:
      anchor.type === "prose"
        ? "Which card does this describe?"
        : "Which card fits these keywords?",
    reference: anchor,
    candidates: {
      type: "image",
      items: seededShuffle(node.cardsInvolved, node.nodeId).map((key) => ({
        key,
        label: ctx.cards.get(key) ?? key,
        image: masterForKey(key),
      })),
    },
    answerKey: node.cardKey,
    revealTitle: node.cardName,
    revealBody: ctx.descriptions.get(node.cardKey)?.condensed ?? "",
  };
}

function formatA2(node, ctx) {
  const useTalkingPoints = node.anchorVariant.startsWith("collated_talking_points");

  const textFor = (key) =>
    useTalkingPoints
      ? joinPhrases((ctx.talkingPoints.get(key) ?? []).slice(0, 3))
      : ctx.descriptions.get(key)?.condensed ?? "";

  return {
    kind: "A",
    prompt: useTalkingPoints
      ? "Which reading notes belong to this card?"
      : "Which meaning belongs to this card?",
    reference: {
      type: "card",
      image: masterForKey(node.cardKey),
      label: node.cardName,
    },
    candidates: {
      type: "text",
      items: seededShuffle(node.cardsInvolved, node.nodeId).map((key) => ({
        key,
        text: textFor(key),
      })),
    },
    answerKey: node.cardKey,
    revealTitle: node.cardName,
    revealBody: ctx.descriptions.get(node.cardKey)?.condensed ?? "",
  };
}

function formatA3(node, ctx) {
  return {
    kind: "A",
    prompt: "Major or Minor Arcana?",
    reference: {
      type: "card",
      image: masterForKey(node.cardKey),
      label: node.cardName,
    },
    candidates: {
      type: "text",
      // The one fixed grid in Format A — never shuffled, never resized.
      items: [
        { key: "major", text: "Major Arcana" },
        { key: "minor", text: "Minor Arcana" },
      ],
    },
    answerKey: node.arcanaType,
    revealTitle: node.cardName,
    revealBody: ctx.descriptions.get(node.cardKey)?.condensed ?? "",
  };
}

// --- Format B: true/false, no retry --------------------------------------

function formatB(node, ctx) {
  const shown = node.cardKey;
  const donors = node.cardsInvolved.filter((key) => key !== shown);

  // Coin flip, but seeded by node so a round is reproducible.
  const seed = [...node.nodeId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const isTrue = donors.length === 0 || seed % 2 === 0;
  const donorKey = isTrue ? null : seededShuffle(donors, node.nodeId)[0];

  const statementFor = (key) => ctx.descriptions.get(key)?.condensed ?? "";

  return {
    kind: "B",
    prompt: "Does this statement belong to this card?",
    image: masterForKey(shown),
    cardName: node.cardName,
    statement: statementFor(isTrue ? shown : donorKey),
    isTrue,
    donor: donorKey
      ? {
          key: donorKey,
          name: ctx.cards.get(donorKey) ?? donorKey,
          image: masterForKey(donorKey),
          statement: statementFor(donorKey),
        }
      : null,
  };
}

// --- Format C: board matching --------------------------------------------

function formatC(node, ctx) {
  // The Bible caps the board at 3 rows to keep card art readable. Several
  // curriculum rows list more cards than that, so the board takes the first
  // three and the rest are dropped — flagged rather than silently resized.
  const keys = node.cardsInvolved.slice(0, 3);

  return {
    kind: "C",
    prompt: "Match each card to its meaning.",
    pairs: keys.map((key) => ({
      key,
      name: ctx.cards.get(key) ?? key,
      image: masterForKey(key),
      text: ctx.descriptions.get(key)?.anonymized ?? "",
    })),
    overflow: node.cardsInvolved.length > 3 ? node.cardsInvolved.length : 0,
  };
}

const BUILDERS = {
  A1: formatA1,
  A2: formatA2,
  A3: formatA3,
  B: formatB,
  C: formatC,
};

export function buildRound(node, ctx) {
  const builder = BUILDERS[node.formatCode];
  if (!builder) return null;
  return builder(node, ctx);
}

export { seededShuffle };
