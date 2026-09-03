import { notFound } from "next/navigation";
import { V4_CHAPTERS, getChapter } from "@/data/story/chapters";
import { getNextPathStep, UNITS, firstUnitForCard } from "@/data/v4/units";
import { SECTIONS } from "@/data/v4/sections";
import { getCardKeywords } from "@/lib/data";
import ChapterPlayer from "@/components/story/chapter-player";

// Story's play screen, one narrative node at a time — /story/play/<slug>
// (0048, repurposed 0083 as v4's own narrative-node engine once the
// standalone Story mode it originally served was removed). A thin server
// component that resolves the slug and hands the whole node object to a
// client component that owns the actual sequencing.
export function generateStaticParams() {
  return V4_CHAPTERS.map((c) => ({ chapter: c.slug }));
}

export default async function StoryChapterPage({ params }) {
  const { chapter: slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const nextChapter = getNextPathStep(`/story/play/${slug}`);

  // The end-narrative of the *first* unit to teach a given card gets the
  // full unlock celebration (docs/decisions/0076) instead of just
  // whatever the next step in the path happens to be called (usually the
  // next unit's own generic "The Reading"). Only the first: a second unit
  // revisiting a card the learner already has isn't adding anything to
  // their deck. `firstUnitForCard` reads UNITS in its own path order,
  // not literal unit number, so this stays correct however the path gets
  // reordered later. unitNumber is this unit's own *position* in UNITS
  // (matching app/v4/page.js's own sequential display), not its stored
  // `unit:` id.
  const endingUnit = UNITS.find((u) => u.endSlug === slug && u.kind !== "review");
  const isFirstUnitEnd = endingUnit && firstUnitForCard(endingUnit.cardSlug)?.unit === endingUnit.unit;
  const endingCardSection = isFirstUnitEnd ? SECTIONS.find((s) => s.slug === endingUnit.cardSlug) : null;
  const unlockUnit =
    isFirstUnitEnd && endingCardSection
      ? {
          cardKey: endingCardSection.data.cardKey,
          cardName: endingCardSection.data.cardName,
          unitNumber: UNITS.findIndex((u) => u.unit === endingUnit.unit) + 1,
          // The card's own sourced keyword list (data_card_keywords.csv,
          // the same one the keyword round-player format teaches from) -
          // what actually flashes around the card on the celebration
          // screen, not invented copy.
          keywords: await getCardKeywords(endingCardSection.data.cardKey),
        }
      : null;

  return (
    <ChapterPlayer
      chapter={chapter.data}
      nextChapter={nextChapter}
      unlockUnit={unlockUnit}
      backHref="/v4"
      backLabel="Back to Path"
    />
  );
}
