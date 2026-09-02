import { SECTIONS } from "./sections";
import mashupNodes from "./mashup_nodes.json";
import capstoneNodes from "./capstone_nodes.json";

// v4's own unit map (docs/decisions/0057) - each unit pairs one recurring
// Story mode character with the v4 lesson section for the card their
// narrative just introduced. cardSlug indexes into data/v4/sections.js;
// startSlug/endSlug index into data/story/chapters.js's own V4_CHAPTERS.
// `title` is the punny name/card mashup shown on the unit banner
// (docs/decisions/0057) - each one ties back to that unit's own story
// beat (Dave's leap, Riley's tour, the business-not-romance Lovers
// misconception, Riley's old band, Dave's furniture-building, Riley's
// songwriting) rather than being a generic "<Card> Part N."
//
// This lives under data/, not app/v4/page.js, so a server component
// (app/story/play/[chapter]/page.js, docs/decisions/0064) can compute
// "what comes after this narrative node in the actual path" without
// importing a "use client" page component.
export const UNITS = [
  { unit: 1, character: "dave", cardSlug: "fool", startSlug: "u1-dave-start", endSlug: "u1-dave-end", title: "Dave's Leap of Fool" },
  { unit: 2, character: "riley", cardSlug: "fool", startSlug: "u2-riley-start", endSlug: "u2-riley-end", title: "Riley's Fool on Tour" },
  { unit: 3, character: "dave", cardSlug: "lovers", startSlug: "u3-dave-start", endSlug: "u3-dave-end", title: "Dave and the Business of Lovers" },
  { unit: 4, character: "riley", cardSlug: "lovers", startSlug: "u4-riley-start", endSlug: "u4-riley-end", title: "Riley's Band of Lovers" },
  { unit: 5, character: "dave", cardSlug: "empress", startSlug: "u5-dave-start", endSlug: "u5-dave-end", title: "Dave Builds His Empress" },
  { unit: 6, character: "riley", cardSlug: "empress", startSlug: "u6-riley-start", endSlug: "u6-riley-end", title: "Riley Pens Her Empress" },
  // Two cumulative-review units (docs/decisions/0058) built from the two
  // most repetitive nodes CUT_INDICES trims from each of the three cards
  // above (Simon's own call) - a "review" unit's lessons span all three
  // cards instead of one, via reviewCardIndex picking which of each
  // card's two cut nodes it gets (0 here, 1 in unit 8). cardSlug just
  // gives the unit's companion art a representative card to show first.
  {
    unit: 7,
    kind: "review",
    character: "dave",
    cardSlug: "fool",
    reviewCardIndex: 0,
    mashupKey: "unit7",
    startSlug: "u7-dave-start",
    endSlug: "u7-dave-end",
    title: "Dave, Riley, and the Whole Deck",
  },
  {
    unit: 8,
    kind: "review",
    character: "riley",
    cardSlug: "fool",
    reviewCardIndex: 1,
    mashupKey: "unit8",
    startSlug: "u8-riley-start",
    endSlug: "u8-riley-end",
    title: "The Full Deck, No Strings Attached",
  },
];

// The two most repetitive/redundant nodes per card (0-indexed into each
// card's own 7-entry LABELS/section array below) - Simon's own call to
// free up two review units' worth of lessons rather than teach the same
// "harder plain-matching drill" mechanic a third and fourth time in a
// row. Re-derived after 0061 halved every card's own plain-keyword nodes
// and added a new "All the Keywords" swipe node - the two picked here are
// still-plain, no-unique-mechanic blocks that don't contain that new
// node, so cutting them doesn't lose the one place every keyword gets
// cycled through once each.
const CUT_INDICES = {
  fool: [2, 4], // "First Words", "Closer Distractors"
  lovers: [2, 4], // "More New Words", "Closer Distractors"
  empress: [1, 3], // "More New Words", "Opposites"
};

const REVIEW_CARD_ORDER = ["fool", "lovers", "empress"];

// One label per v4 lesson node - v4 collapsed each card's v3 nodes down to
// exactly 7 (docs/decisions/0057), so these are hand-picked from the v3
// labels that fell into each merged group (scripts/build-v4-sections.mjs),
// not a 1:1 carry-over of app/v3/page.js's own 14-15-entry LABELS.
const LABELS = {
  fool: [
    "Meet the Fool",
    "Find the Elements",
    "First Words",
    "Readings, Filled In",
    "Closer Distractors",
    "All the Keywords",
    "The Full Picture",
  ],
  lovers: [
    "Meet the Lovers",
    "First Words",
    "More New Words",
    "Readings, Filled In",
    "Closer Distractors",
    "All the Keywords",
    "The Full Picture",
  ],
  empress: [
    "Meet the Empress",
    "More New Words",
    "Readings, Filled In",
    "Opposites",
    "All the Keywords",
    "Pick the True Reading",
    "The Full Picture",
  ],
};

// A single-card unit's 7 lesson nodes minus the two CUT_INDICES marks as
// redundant - 5 lessons per unit now, not 7 (docs/decisions/0058) - plus
// one mid-unit "mini capstone" spliced into the middle of that 5 (0062):
// a small single-card mashup (plain + cloze + choice) testing only what
// this unit has taught so far, shared between the two units that teach
// the same card since there's nothing character-specific about it.
function singleCardLessonSteps(cardSlug) {
  const section = SECTIONS.find((s) => s.slug === cardSlug);
  const labels = LABELS[cardSlug] ?? [];
  const cut = new Set(CUT_INDICES[cardSlug] ?? []);
  const steps = section.data.nodes
    .map((node, i) => ({ node, i }))
    .filter(({ i }) => !cut.has(i))
    .map(({ node, i }) => ({
      kind: "lesson",
      key: `${cardSlug}-${node.id}`,
      href: `/v4/play/${cardSlug}/${i + 1}`,
      label: labels[i] ?? `Node ${i + 1}`,
      node,
    }));

  const capstoneNode = capstoneNodes[cardSlug];
  const capstoneStep = {
    kind: "lesson",
    key: `${cardSlug}-${capstoneNode.id}`,
    href: `/v4/play/${cardSlug}-capstone/1`,
    label: capstoneNode.label,
    node: capstoneNode,
  };
  const middle = Math.floor(steps.length / 2);
  steps.splice(middle, 0, capstoneStep);
  return steps;
}

// A review unit's 5 lesson steps: 3 single-card ones - one of each card's
// two CUT_INDICES nodes, reusing that exact node (and its own real
// `/v4/play/<card>/<n>` route, cardKey/cardName included) rather than a
// new merged data file, since NodeSession's cardKey/cardName are passed
// once per section and used for every round's own reference art, so a
// genuinely mixed-card node would show the wrong card's art for
// two-thirds of its own rounds - plus 2 genuine cross-card "mashup"
// nodes (docs/decisions/0059), where every round instead carries its own
// cardKey/cardName, mixing round formats and all three cards in one node
// on purpose, played via /v4/play/<mashupKey>/<n>.
function reviewLessonSteps(unit) {
  const singleCardSteps = REVIEW_CARD_ORDER.map((cardSlug) => {
    const section = SECTIONS.find((s) => s.slug === cardSlug);
    const labels = LABELS[cardSlug] ?? [];
    const i = CUT_INDICES[cardSlug][unit.reviewCardIndex];
    const node = section.data.nodes[i];
    return {
      kind: "lesson",
      key: `${cardSlug}-${node.id}-review${unit.reviewCardIndex}`,
      href: `/v4/play/${cardSlug}/${i + 1}`,
      label: `${labels[i] ?? `Node ${i + 1}`} (${section.data.cardName})`,
      node,
    };
  });
  const mashupSteps = (mashupNodes[unit.mashupKey] ?? []).map((node, i) => ({
    kind: "lesson",
    key: `${unit.mashupKey}-${node.id}`,
    href: `/v4/play/${unit.mashupKey}/${i + 1}`,
    label: node.label ?? `Mashup ${i + 1}`,
    node,
  }));
  return [...singleCardSteps, ...mashupSteps];
}

// A unit's own step list: the start narrative, then its lesson nodes,
// then the end narrative - the fixed shape every unit follows (Simon's
// own spec: "1 start-narrative node -> lesson nodes -> 1 end-narrative
// node"). Each step carries enough to render either a lesson node (via
// the existing V2NodeIcon shape system) or a character node and to link
// to the right play route.
export function stepsForUnit(unit) {
  const lessonSteps = unit.kind === "review" ? reviewLessonSteps(unit) : singleCardLessonSteps(unit.cardSlug);
  return [
    {
      kind: "character",
      key: `${unit.startSlug}`,
      href: `/story/play/${unit.startSlug}`,
      label: "The Reading",
      character: unit.character,
    },
    ...lessonSteps,
    {
      kind: "character",
      key: `${unit.endSlug}`,
      href: `/story/play/${unit.endSlug}`,
      label: "The Follow-Up",
      character: unit.character,
    },
  ];
}

// The whole path, flattened into one ordered list, unit by unit - what
// "next" and "previous" actually mean across the entire v4 path, not
// just within one unit's own trail.
function getAllSteps() {
  return UNITS.flatMap((unit) => stepsForUnit(unit));
}

// What comes right after a given step's own href, anywhere in the path -
// a lesson node finishing already knows this (NodeSession computes its
// own "next node" from sectionSlug/nodeNumber), but a narrative node
// (docs/decisions/0064) didn't: ChapterPlayer's "chapter complete" screen
// used to fall back to "/story" (the flat Story-mode index) for every v4
// narrative node, since data/story/chapters.js's own getNextChapter()
// deliberately never chains across V4_CHAPTERS (0057). This is that
// missing link, computed from the path's own real sequence instead.
export function getNextPathStep(href) {
  const steps = getAllSteps();
  const i = steps.findIndex((s) => s.href === href);
  if (i === -1 || i + 1 >= steps.length) return null;
  const next = steps[i + 1];
  return { href: next.href, label: next.label };
}
