// Turns a curriculum row into everything its round(s) need to render.
// Built on the server so format components receive plain data.
//
// A node is not always one screen. `cards_to_recall_count` is the
// curriculum's only difficulty axis (Curriculum Design Spec, Section 4) and it
// grows to 6 on nodes 5-7, while every format's own spec describes a
// single-target screen. The two reconcile the way the Global Style Guide's
// curriculum progress indicator (Section 7) already assumes: a node expands
// into one or more *instances* of its format, played back to back. So every
// builder here returns an array.
//
// Where the Lesson Format Bible and data_curriculum_nodes.csv disagree, the
// data wins — it's what the curriculum actually plays. Divergences are noted
// inline so they can be reconciled later.

// Composite key for a symbol. Mirrors data.js's own symbolKey — kept local
// so the round builders don't import back from the module that imports them.
function symbolKey(type, name) {
  return `${type}|${name}`;
}

export function masterForKey(cardKey) {
  return `/assets/cards/master/${cardKey}_MASTER.png`;
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

function hashString(seed) {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

// Deterministic single pick — same seed, same element, every render.
function pickSeeded(list, seed) {
  if (!list || list.length === 0) return null;
  return list[hashString(seed) % list.length];
}

function joinPhrases(list) {
  return list.join(" · ");
}

// UX Style Guide Section 4: a candidate must never carry the identity that
// answers the question. "The" and "of" are shared across the deck; the rest of
// a card's name is not.
function namesCard(text, cardName) {
  if (!cardName || !text) return false;
  return cardName
    .split(/[^A-Za-z]+/)
    .filter((w) => w && !["the", "of", "a", "and"].includes(w.toLowerCase()))
    .some((w) => new RegExp(`\\b${w}\\b`, "i").test(text));
}

function cardOption(key, ctx) {
  return { key, label: ctx.cards.get(key) ?? key, image: masterForKey(key) };
}

// --- Format A: one fixed reference, 2-4 candidates -----------------------

// The keyword variant of node 1 runs the other way round: the card is shown and
// the learner picks which keywords belong to it, from a pool salted with wrong
// ones. Reading a keyword list and choosing one of four cards tested very
// little — the keywords were the question, so the answer was whichever card you
// could already name.
//
// Distractors come from the cards the curriculum already chose as this node's
// confusables, minus anything that is genuinely one of the target's own
// keywords. 31 keywords in the deck belong to more than one card — "exploration"
// is on six — so without that filter the round would mark a correct answer wrong.
function formatKeywords(node, ctx) {
  const correct = ctx.keywords.get(node.cardKey) ?? [];
  if (correct.length === 0) return null;

  const own = new Set(correct.map((k) => k.toLowerCase()));
  const fromNode = node.cardsInvolved
    .filter((key) => key !== node.cardKey)
    .flatMap((key) => ctx.keywords.get(key) ?? []);
  // If this node's own confusables can't supply five, widen to the deck.
  const wider = [...ctx.keywords.values()].flat();

  // Keywords range from one word to short phrases, and a card's own set is
  // usually consistent in shape. Distractors drawn without regard to that give
  // the answer away by length alone — seven single words beside "the discovery
  // of the inner world" is not a question about meaning. So candidates whose
  // length matches the card's own keywords are taken first, and looser ones
  // only fill the gap.
  const words = (text) => text.trim().split(/\s+/).length;
  const lengths = correct.map(words);
  const low = Math.min(...lengths);
  const high = Math.max(...lengths);
  const seen = new Set();
  const fits = [];
  const rest = [];
  for (const word of [
    ...seededShuffle(fromNode, `${node.nodeId}-near`),
    ...seededShuffle(wider, `${node.nodeId}-far`),
  ]) {
    const lower = word.toLowerCase();
    if (own.has(lower) || seen.has(lower)) continue;
    seen.add(lower);
    const n = words(word);
    (n >= low && n <= high ? fits : rest).push(word);
  }
  const wrong = [...fits, ...rest].slice(0, 5);

  const chips = seededShuffle(
    [
      ...correct.map((text) => ({ text, correct: true })),
      ...wrong.map((text) => ({ text, correct: false })),
    ],
    `${node.nodeId}-chips`
  );

  return [
    {
      kind: "K",
      // The Bible names A1 "Choose Card From Keywords". This instance runs the
      // other way round, so it says so rather than leaving a label that
      // describes the screen backwards.
      formatName: "Choose Keywords From Card",
      prompt: "Which keywords belong to this card?",
      reference: {
        type: "card",
        image: masterForKey(node.cardKey),
        label: node.cardName,
      },
      chips,
      correctCount: correct.length,
      revealTitle: node.cardName,
      revealBody:
      ctx.descriptions.get(node.cardKey)?.opener ??
      ctx.descriptions.get(node.cardKey)?.condensed ??
      "",
    },
  ];
}

function formatA1(node, ctx) {
  if (node.anchorVariant !== "description_anonymized") {
    return formatKeywords(node, ctx);
  }

  const anchor = {
    type: "prose",
    text: ctx.descriptions.get(node.cardKey)?.anonymized ?? "",
  };

  return [
    {
      kind: "A",
      prompt: "Which card does this describe?",
      reference: anchor,
      candidates: {
        type: "image",
        items: seededShuffle(node.cardsInvolved, node.nodeId).map((key) =>
          cardOption(key, ctx)
        ),
      },
      answerKey: node.cardKey,
      revealTitle: node.cardName,
      revealBody: ctx.descriptions.get(node.cardKey)?.condensed ?? "",
    },
  ];
}

// A2 — card art, pick the meaning that belongs to it.
//
// The options are one-line openers, not full condensed descriptions. Four
// condensed entries is 262 words a question — about a minute of reading before
// you can even decide, against a 60-180s budget for the whole node — and the
// learner has seen none of them, since the teaching screen shows the opener.
//
// The Lesson Format Bible calls for keyword sets here, which would be shorter
// still, but node 1 already runs keywords -> card and the Curriculum spec asks
// for a meaning at node 2 precisely so the two aren't inverses. The opener
// satisfies both: it is a meaning, and it is short.
//
// The options are anonymised: the reference card is labelled by name above
// them, so an option that names its own card answers the question for you.
// UX Style Guide Section 4.
//
// The full condensed description still arrives, in the reveal after answering.
function formatA2(node, ctx) {
  const useTalkingPoints = node.anchorVariant.startsWith("collated_talking_points");

  const textFor = (key) => {
    const entry = ctx.descriptions.get(key);
    if (!useTalkingPoints) return entry?.anonOpener || entry?.anonymized || "";
    // Reading notes name their card often enough to matter — "Strength" turns
    // up in Strength's own notes — so the quiet ones are preferred here too.
    const name = ctx.cards.get(key) ?? "";
    const points = ctx.talkingPoints.get(key) ?? [];
    const quiet = points.filter((p) => !namesCard(p, name));
    return joinPhrases((quiet.length >= 2 ? quiet : points).slice(0, 3));
  };

  return [
    {
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
    },
  ];
}

// A3 is a standing skill whose difficulty is the *number* of cards sorted,
// not the grid — the grid is permanently two fixed labels. So a node asking
// for six cards is six sorts, one card each.
function formatA3(node, ctx) {
  return seededShuffle(node.cardsInvolved, node.nodeId).map((key) => ({
    kind: "A",
    prompt: "Major or Minor Arcana?",
    reference: {
      type: "card",
      image: masterForKey(key),
      label: ctx.cards.get(key) ?? key,
    },
    candidates: {
      type: "text",
      // The one fixed grid in Format A — never shuffled, never resized.
      items: [
        { key: "major", text: "Major Arcana" },
        { key: "minor", text: "Minor Arcana" },
      ],
    },
    answerKey: ctx.arcana.get(key) ?? node.arcanaType,
    revealTitle: ctx.cards.get(key) ?? key,
    revealBody: ctx.descriptions.get(key)?.condensed ?? "",
  }));
}

// --- Format A, symbol variants (A4 / A5 / A7) ----------------------------
//
// The curriculum names only the section's card for these nodes, never a
// distractor list, so distractors are selected here from symbol_images.
// Every symbol node in the curriculum is distractor_tier "easy", which for
// A4/A7 the Bible defines as "every distractor from a different category
// than the target" — eliminable by shape alone.

function otherCategorySymbols(ctx, target, count, seed) {
  const pool = seededShuffle(
    ctx.symbols.filter((s) => s.type !== target.type),
    seed
  );
  const chosen = [];
  const usedTypes = new Set();
  for (const symbol of pool) {
    if (chosen.length === count) break;
    if (usedTypes.has(symbol.type)) continue;
    usedTypes.add(symbol.type);
    chosen.push(symbol);
  }
  // Three sibling categories exist for any target, so the spread above
  // normally fills a 4-option grid outright. This only tops up if the
  // symbol table ever shrinks.
  for (const symbol of pool) {
    if (chosen.length === count) break;
    if (!chosen.includes(symbol)) chosen.push(symbol);
  }
  return chosen;
}

function sameCategorySymbols(ctx, target, count, seed) {
  const pool = seededShuffle(
    ctx.symbols.filter((s) => s.type === target.type && s.key !== target.key),
    seed
  );
  return pool.slice(0, count);
}

function symbolFor(node, ctx) {
  const symbol = ctx.cardSymbols.get(node.cardKey);
  if (!symbol) return null;
  return ctx.symbolByKey.get(symbolKey(symbol.type, symbol.name)) ?? null;
}

// A4 — Symbol Identification. Icon shown; the learner names it.
// The icon carries no label here: labelling the reference would be the
// answer. The Bible's "always pair an icon with its Category: Name label"
// rule is about candidates, and is outranked for candidates by the Style
// Guide's Section 4 rule that a candidate never shows its own identity.
function formatA4(node, ctx) {
  const target = symbolFor(node, ctx);
  if (!target) return null;

  const distractors = otherCategorySymbols(ctx, target, 3, node.nodeId);
  const items = seededShuffle([target, ...distractors], `${node.nodeId}-a4`).map(
    (s) => ({ key: s.key, text: `${s.type}: ${s.name}` })
  );

  return [
    {
      kind: "A",
      prompt: "Which symbol is this?",
      tone: "symbol",
      reference: { type: "symbol", image: target.image },
      candidates: { type: "text", items },
      answerKey: target.key,
      revealTitle: `${target.type}: ${target.name}`,
      revealBody: joinPhrases(ctx.symbolPhrases.get(target.key) ?? []),
    },
  ];
}

// A5 — Symbol Meaning Match. Same-category pool by design: a miss should be a
// genuine content mix-up, not a category tell.
//
// Divergence: the Bible excludes Suit from A5's pool entirely, but the
// curriculum schedules an A5 node on Ace of Swords (U2-S12-N3), whose symbol
// IS a Suit. Excluding Suit would leave that node with no pool at all, so
// Suit-vs-Suit is used there. Flagged for reconciliation — see
// docs/decisions/0002.
function formatA5(node, ctx) {
  const target = symbolFor(node, ctx);
  if (!target) return null;

  const phrases = ctx.symbolPhrases.get(target.key) ?? [];
  if (phrases.length === 0) return null;

  const distractors = sameCategorySymbols(ctx, target, 2, node.nodeId);
  if (distractors.length === 0) return null;

  const phraseFor = (symbol) =>
    pickSeeded(ctx.symbolPhrases.get(symbol.key) ?? [], `${node.nodeId}-${symbol.key}`);

  const items = seededShuffle([target, ...distractors], `${node.nodeId}-a5`)
    .map((s) => ({ key: s.key, text: phraseFor(s) }))
    .filter((item) => item.text);

  return [
    {
      kind: "A",
      prompt: "Which meaning belongs to this symbol?",
      tone: "symbol",
      reference: { type: "symbol", image: target.image },
      candidates: { type: "text", items },
      answerKey: target.key,
      revealTitle: `${target.type}: ${target.name}`,
      revealBody: joinPhrases(phrases),
    },
  ];
}

// A7 — Symbol Selection From Label. Mirrors A4 in the opposite direction.
// Candidate icons are unlabelled for the same reason A4's reference is.
function formatA7(node, ctx) {
  const target = symbolFor(node, ctx);
  if (!target) return null;

  const distractors = otherCategorySymbols(ctx, target, 3, node.nodeId);
  const items = seededShuffle([target, ...distractors], `${node.nodeId}-a7`).map(
    (s) => ({ key: s.key, image: s.image })
  );

  return [
    {
      kind: "A",
      prompt: "Which icon is this symbol?",
      tone: "symbol",
      reference: { type: "label", category: target.type, name: target.name },
      candidates: { type: "symbol", items },
      answerKey: target.key,
      revealTitle: `${target.type}: ${target.name}`,
      revealBody: joinPhrases(ctx.symbolPhrases.get(target.key) ?? []),
    },
  ];
}

// --- Format B: true/false, no retry --------------------------------------
//
// One instance per card named by the node: the curriculum grows B from one
// statement to five (Curriculum Design Spec, Section 4), and a True/False
// screen holds exactly one statement.
//
// Statements come from card_talking_points — the README names it the
// statement pool for this format, and the Bible lists it as a content tier.
function formatB(node, ctx) {
  // A statement that names the card it is shown beside answers itself — "Even
  // the Sun can burn" against The Sun is trivially true. Cards carry four to
  // seven talking points, so one that stays quiet about the card is usually
  // available; this selects, it never rewrites.
  const statementFor = (key, seed, shownKey) => {
    const points = ctx.talkingPoints.get(key) ?? [];
    const shownName = ctx.cards.get(shownKey) ?? "";
    const quiet = points.filter((p) => !namesCard(p, shownName));
    return pickSeeded(quiet.length ? quiet : points, seed);
  };

  return node.cardsInvolved
    .map((shown, index) => {
      const seed = `${node.nodeId}-b${index}`;

      // Prefer a sibling from this node's own pool: "statements are drawn from
      // the new card plus recently-taught cards" (Curriculum Design Spec,
      // Section 2). A node naming a single card falls back to the similarity
      // table so it isn't forced to be True every time.
      let donors = node.cardsInvolved.filter((key) => key !== shown);
      if (donors.length === 0) {
        donors = (ctx.similar.get(shown) ?? [])
          .filter((entry) => entry.tier === "Easy")
          .slice(0, 8)
          .map((entry) => entry.key);
      }

      const isTrue = donors.length === 0 || hashString(seed) % 2 === 0;
      const donorKey = isTrue ? null : pickSeeded(donors, `${seed}-donor`);

      const statement = isTrue
        ? statementFor(shown, seed, shown)
        : statementFor(donorKey, `${seed}-donorpoint`, shown);
      if (!statement) return null;

      return {
        kind: "B",
        prompt: "Does this statement belong to this card?",
        image: masterForKey(shown),
        cardName: ctx.cards.get(shown) ?? shown,
        statement,
        isTrue,
        donor: donorKey
          ? {
              key: donorKey,
              name: ctx.cards.get(donorKey) ?? donorKey,
              image: masterForKey(donorKey),
              statement,
            }
          : null,
      };
    })
    .filter(Boolean);
}

// --- Format C: board matching --------------------------------------------
//
// The board is capped at 3 rows to keep card art readable (Style Guide,
// Section 9). Nodes listing more cards than that — every unit recap does,
// at 6-8 — become several boards played in sequence rather than having the
// extra cards dropped. No board is ever left with a single row, since one
// row has no wrong pair to choose from.
export function chunkBoards(keys) {
  const boards = [];
  let rest = [...keys];
  while (rest.length > 3) {
    const take = rest.length === 4 ? 2 : 3;
    boards.push(rest.slice(0, take));
    rest = rest.slice(take);
  }
  if (rest.length > 0) boards.push(rest);
  return boards;
}

function formatC(node, ctx) {
  // A one-card board has nothing to match against.
  if (node.cardsInvolved.length < 2) return null;

  return chunkBoards(seededShuffle(node.cardsInvolved, node.nodeId)).map(
    (keys, index) => ({
      kind: "C",
      prompt: "Match each card to its meaning.",
      seed: `${node.nodeId}-c${index}`,
      pairs: keys.map((key) => ({
        key,
        name: ctx.cards.get(key) ?? key,
        image: masterForKey(key),
        // The easiest rung of the Bible's image-to-text ladder. The harder
        // rungs (keyword set, partial keywords, reading notes) need a
        // difficulty signal the curriculum doesn't carry for this format yet.
        text: ctx.descriptions.get(key)?.anonymized ?? "",
      })),
    })
  );
}

const BUILDERS = {
  A1: formatA1,
  A2: formatA2,
  A3: formatA3,
  A4: formatA4,
  A5: formatA5,
  A7: formatA7,
  B: formatB,
  C: formatC,
};

// A Format A round whose answer isn't among its own candidates is a trap: the
// learner eliminates every option, the footer disables with nothing selected,
// and the only way out is quitting the section — which, since a section commits
// atomically, throws the whole attempt away. Better to refuse to build it and
// let the node fall through to the unplayable path.
function isAnswerable(round) {
  if (round.kind === "K") return round.chips.some((c) => c.correct);
  if (round.kind !== "A") return true;
  return round.candidates.items.some((option) => option.key === round.answerKey);
}

// Returns an array of round instances, or null if this node can't be built.
export function buildNode(node, ctx) {
  const builder = BUILDERS[node.formatCode];
  if (!builder) return null;
  const instances = builder(node, ctx);
  if (!instances || instances.length === 0) return null;

  const playable = instances.filter(isAnswerable);
  if (playable.length !== instances.length) {
    console.warn(
      `[lunadeck] ${node.nodeId}: dropped ${instances.length - playable.length} ` +
        `round(s) whose answer was not among the candidates`
    );
  }
  return playable.length > 0 ? playable : null;
}

export { seededShuffle };
