import { notFound } from "next/navigation";
import { CHAPTERS, V4_CHAPTERS, getChapter, getNextChapter } from "@/data/story/chapters";
import { getNextPathStep, UNITS, firstUnitForCard } from "@/data/v4/units";
import { SECTIONS } from "@/data/v4/sections";
import { getCardKeywords } from "@/lib/data";
import ChapterPlayer from "@/components/story/chapter-player";

// Story's play screen, one chapter at a time — /story/<chapter-slug>
// (0048). Mirrors app/v2 and app/v3's own play routes: a thin server
// component that resolves the slug and hands the whole chapter object to a
// client component that owns the actual sequencing. v4's own narrative
// nodes (0057) reuse this same route rather than forking one for
// themselves, so their slugs need to be enumerated here too.
export function generateStaticParams() {
  return [...CHAPTERS, ...V4_CHAPTERS].map((c) => ({ chapter: c.slug }));
}

export default async function StoryChapterPage({ params }) {
  const { chapter: slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  // A v4 narrative node's own "chapter complete" screen needs the actual
  // next step in the v4 path (a lesson node, or the next unit's own start
  // narrative) rather than the plain Story-mode chain getNextChapter()
  // computes (0064) - and its own fallback, once there's truly nothing
  // left (the very end of unit 8), is "back to the path," not "back to
  // Story."
  const isV4 = V4_CHAPTERS.some((c) => c.slug === slug);
  const nextChapter = isV4 ? getNextPathStep(`/story/play/${slug}`) : getNextChapter(slug);

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
      backHref={isV4 ? "/v4" : "/story"}
      backLabel={isV4 ? "Back to Path" : "Back to Story"}
    />
  );
}
