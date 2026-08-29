import { notFound } from "next/navigation";
import {
  getUnit,
  getUnits,
  getSections,
  getSession,
  getCardNames,
  getCardIntro,
  circleForKey,
} from "@/lib/data";
import { masterForKey } from "@/lib/rounds";
import Session from "@/components/lesson/session";

// A lesson is one section — seven or eight nodes — not a whole unit. That is
// what the segmented progress bar counts and what Spec_MainPath describes.
export async function generateStaticParams() {
  const units = await getUnits();
  const params = [];
  for (const unit of units) {
    for (const section of await getSections(unit.number)) {
      params.push({ unit: String(unit.number), section: section.section });
    }
  }
  return params;
}

export default async function PlayPage({ params }) {
  const { unit: unitParam, section: sectionParam } = await params;
  const unit = await getUnit(unitParam);
  if (!unit) notFound();

  const [sections, names, units] = await Promise.all([
    getSections(unit.number),
    getCardNames(),
    getUnits(),
  ]);

  const wanted = decodeURIComponent(sectionParam);
  const index = sections.findIndex((s) => s.section === wanted);
  if (index === -1) notFound();
  const section = sections[index];

  const nodes = await getSession(unit.number, section.section);
  const nextUnit = units.find((u) => u.number === unit.number + 1) ?? null;

  // The teaching step. A standard section introduces one card, so it shows
  // that card; a recap has no new card and shows what the unit taught instead.
  const card = await getCardIntro(section.kind === "standard" ? section.cardKey : null);

  // The screen says "you'll be quizzed on them next", so it has to show what
  // the quiz actually asks for. The keyword round trims its own set to fit two
  // lines, which can drop one below the intro's default core, so the intro
  // follows the round rather than guessing at it. Order stays the CSV's.
  const keywordRound = nodes
    .flatMap((node) => node.instances)
    .find((round) => round.kind === "K");
  if (card && keywordRound) {
    const asked = new Set(
      keywordRound.chips.filter((chip) => chip.correct).map((chip) => chip.text)
    );
    const shown = card.keywords.filter((word) => asked.has(word));
    if (shown.length) card.keywords = shown;
  }

  // Teaching arrives just before the thing it teaches, not all at once up
  // front. The intro screen covers the keywords and the keyword round asks for
  // exactly those; the meaning is the next thing the section asks for that the
  // learner has not been shown, so it gets its own beat immediately before
  // that round. Only where this really is a first meeting: a review section
  // re-serving a card the learner already met needs no teaching.
  if (card?.opener && section.kind === "standard") {
    // Matched on the round's answerKey, not the node: the node shape that
    // reaches the client carries no card key, only the round does.
    const first = nodes.find((node) =>
      node.instances?.some(
        (round) => round.teaches === "meaning" && round.answerKey === section.cardKey
      )
    );
    if (first) first.teach = { name: card.name, image: card.image, body: card.opener };
  }

  const intro = card
    ? { card }
    : {
        cards: unit.cardKeys.map((key) => ({
          key,
          name: names.get(key) ?? key,
          image: circleForKey(key),
        })),
      };

  // A recap or cumulative review closes the unit; a standard section hands the
  // learner one card and points at the next section.
  const kind = section.kind === "standard" ? "section" : "unit";

  const completion = {
    kind,
    unitNumber: unit.number,
    unitName: unit.name,
    sectionLabel:
      section.kind === "recap"
        ? "Recap"
        : section.kind === "cumulative"
          ? "Review"
          : `Section ${section.section}`,
    card:
      kind === "section" && section.cardKey
        ? {
            key: section.cardKey,
            name: names.get(section.cardKey) ?? section.cardName,
            image: masterForKey(section.cardKey),
          }
        : null,
    unitCards: unit.cardKeys.map((key) => ({
      key,
      name: names.get(key) ?? key,
      image: circleForKey(key),
    })),
    nextUnit: nextUnit
      ? {
          number: nextUnit.number,
          name: nextUnit.name,
          icon: nextUnit.icon,
          cardCount: nextUnit.cardCount,
          nodeCount: nextUnit.nodeCount,
        }
      : null,
    nextSection: sections[index + 1]?.section ?? null,
    sections: sections.map((s) => ({
      section: s.section,
      cardKey: s.cardKey,
      nodeIds: s.nodeIds,
    })),
  };

  return (
    <Session
      // The completion screen links straight to the next section. Keying on
      // the section guarantees a fresh state machine rather than relying on the
      // router to remount a subtree whose only changed segment is a param.
      key={`${unit.number}-${section.section}`}
      unitNumber={unit.number}
      unitName={unit.name}
      section={section}
      nodes={nodes}
      completion={completion}
      intro={intro}
    />
  );
}
