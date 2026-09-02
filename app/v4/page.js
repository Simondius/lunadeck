"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { SECTIONS } from "@/data/v4/sections";
import mashupNodes from "@/data/v4/mashup_nodes.json";
import { masterForKey } from "@/lib/rounds";
import { shapeForNode, makeKeywordVariantTracker, V2NodeIcon } from "@/components/lesson-v2/v2-node-icon";

const ASSETS = "/assets/reading-scene-sketch-v2";

// Same winding-trail offsets as v1/v2/v3 (path-screen.jsx, app/v3/page.js)
// - the visual system isn't versioned, only the content and its ordering
// are (docs/decisions/0057, following 0046's own precedent).
const WIND = [0, 40, 62, 40, 0, -40, -62, -40];

// v4's own unit map (docs/decisions/0057) - each unit pairs one recurring
// Story mode character with the v4 lesson section for the card their
// narrative just introduced. cardSlug indexes into data/v4/sections.js;
// startSlug/endSlug index into data/story/chapters.js's own V4_CHAPTERS.
// `title` is the punny name/card mashup shown on the unit banner
// (docs/decisions/0057) - each one ties back to that unit's own story
// beat (Dave's leap, Riley's tour, the business-not-romance Lovers
// misconception, Riley's old band, Dave's furniture-building, Riley's
// songwriting) rather than being a generic "<Card> Part N."
const UNITS = [
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

function characterPortrait(character) {
  return `${ASSETS}/characters/${character}/${character}_neutral.png`;
}

// A single-card unit's 7 lesson nodes minus the two CUT_INDICES marks as
// redundant - 5 lessons per unit now, not 7 (docs/decisions/0058).
function singleCardLessonSteps(cardSlug) {
  const section = SECTIONS.find((s) => s.slug === cardSlug);
  const labels = LABELS[cardSlug] ?? [];
  const cut = new Set(CUT_INDICES[cardSlug] ?? []);
  return section.data.nodes
    .map((node, i) => ({ node, i }))
    .filter(({ i }) => !cut.has(i))
    .map(({ node, i }) => ({
      kind: "lesson",
      key: `${cardSlug}-${node.id}`,
      href: `/v4/play/${cardSlug}/${i + 1}`,
      label: labels[i] ?? `Node ${i + 1}`,
      node,
    }));
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
// the existing V2NodeIcon shape system) or a character node (new, see
// .v4-character-shape) and to link to the right play route.
function stepsForUnit(unit) {
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

// Same "farthest-from-center" peak logic as app/v3/page.js's own
// peaksForSection - unchanged, just renamed since a v4 "section" spans a
// whole unit's worth of steps rather than one card's lesson nodes alone.
function peaksForUnit(startIndex, stepCount) {
  let maxAbs = 0;
  for (let i = 0; i < stepCount; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(WIND[(startIndex + i) % WIND.length]));
  }
  const peaks = [];
  for (let i = 0; i < stepCount; i++) {
    const w = WIND[(startIndex + i) % WIND.length];
    if (Math.abs(w) === maxAbs) peaks.push({ localIndex: i, side: w > 0 ? "left" : "right" });
  }
  return peaks;
}

// .v2-companion's own fixed width/ratio (app/v3/page.js's own constant,
// reused verbatim here too).
const COMPANION_HEIGHT = 108 * (1456 / 813);

// v4's own path (docs/decisions/0057) - alternates Story mode's narrative
// chapters with v4's own regrouped lesson content, unit by unit. Reuses
// v3's trail markup/CSS wholesale (.trail, .v2-*) for the lesson nodes and
// companion art, plus a new .v4-character-shape for the narrative nodes -
// "a new icon that is more dramatic," per Simon's own brief, rather than
// forcing a start/end narrative node through the existing circle/hex/
// square/oct lesson shapes, which were never meant to represent a scene.
export default function V4Path() {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [companionTop, setCompanionTop] = useState({});
  const trailRefs = useRef({});
  const peakRefs = useRef({});

  useLayoutEffect(() => {
    function measure() {
      const next = {};
      for (const key of Object.keys(peakRefs.current)) {
        const peakEl = peakRefs.current[key];
        const unitKey = key.split("::")[0];
        const containerEl = trailRefs.current[unitKey];
        if (!peakEl || !containerEl) continue;
        const peakRect = peakEl.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();
        next[key] = Math.max(
          4,
          peakRect.top - containerRect.top + peakRect.height / 2 - COMPANION_HEIGHT / 2
        );
      }
      setCompanionTop(next);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [collapsed]);

  const toggle = (unitKey) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(unitKey) ? next.delete(unitKey) : next.add(unitKey);
      return next;
    });

  let index = -1;

  return (
    <main className="shell starfield">
      <div className="trail">
        {UNITS.map((unit) => {
          const unitKey = `u${unit.unit}`;
          const shut = collapsed.has(unitKey);
          const steps = stepsForUnit(unit);
          const cardKey = SECTIONS.find((s) => s.slug === unit.cardSlug)?.data.cardKey;
          const keywordVariant = makeKeywordVariantTracker();
          const peaks = peaksForUnit(index + 1, steps.length);
          const peaksByLocalIndex = new Map(peaks.map((p) => [p.localIndex, p.side]));

          return (
            <section key={unitKey}>
              <button
                type="button"
                className={shut ? "trail-unit is-shut" : "trail-unit"}
                onClick={() => toggle(unitKey)}
                aria-expanded={!shut}
                aria-controls={`v4-${unitKey}-steps`}
              >
                <span className="trail-unit-index">Unit {unit.unit}</span>
                <span className="trail-unit-name">{unit.title}</span>
                <span className="trail-chevron" aria-hidden="true" />
              </button>

              <div
                className="v2-section-trail"
                hidden={shut}
                ref={(el) => (trailRefs.current[unitKey] = el)}
              >
                {peaks.map((peak, peakIndex) => {
                  const key = `${unitKey}::${peak.localIndex}`;
                  // The first companion art in a unit is the card itself
                  // (Simon's own call) - introduces which card this unit
                  // teaches before the reader even reaches its lesson
                  // nodes. Any later peak in the same unit stays the
                  // character portrait, same as before.
                  const isCard = peakIndex === 0;
                  return (
                    <span
                      key={key}
                      className={`v2-companion${isCard ? "" : " is-character"} is-${peak.side}`}
                      style={companionTop[key] != null ? { top: `${companionTop[key]}px` } : undefined}
                      aria-hidden="true"
                    >
                      <img src={isCard ? masterForKey(cardKey) : characterPortrait(unit.character)} alt="" />
                    </span>
                  );
                })}

                <ol className="trail-steps" id={`v4-${unitKey}-steps`}>
                  {steps.map((step, i) => {
                    index += 1;
                    const style = { "--x": `${WIND[index % WIND.length]}px` };
                    const isCurrent = index === 0;
                    const peakSide = peaksByLocalIndex.get(i);
                    const peakRef = peakSide
                      ? (el) => (peakRefs.current[`${unitKey}::${i}`] = el)
                      : undefined;

                    if (step.kind === "character") {
                      return (
                        <li key={step.key}>
                          <Link
                            className={`trail-step v4-character-step${isCurrent ? " is-current" : ""}`}
                            href={step.href}
                            style={style}
                          >
                            <span ref={peakRef} className="v4-character-shape">
                              <img src={characterPortrait(step.character)} alt="" />
                              {isCurrent ? (
                                <span className="v2-sparkle-field" aria-hidden="true">
                                  <span className="v2-sparkle" />
                                  <span className="v2-sparkle" />
                                  <span className="v2-sparkle" />
                                  <span className="v2-sparkle" />
                                  <span className="v2-sparkle" />
                                </span>
                              ) : null}
                            </span>
                            <span className="trail-label">{step.label}</span>
                          </Link>
                        </li>
                      );
                    }

                    const shape = shapeForNode(step.node);
                    const variant = shape === "circle" ? keywordVariant(step.node) : null;
                    return (
                      <li key={step.key}>
                        <Link
                          className={`trail-step v2-step${isCurrent ? " is-current" : ""}`}
                          href={step.href}
                          style={style}
                        >
                          <span ref={peakRef} className={`v2-shape v2-shape-${shape}`}>
                            <V2NodeIcon shape={shape} variant={variant} />
                            {isCurrent ? (
                              <span className="v2-sparkle-field" aria-hidden="true">
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                              </span>
                            ) : null}
                          </span>
                          <span className="trail-label">{step.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
