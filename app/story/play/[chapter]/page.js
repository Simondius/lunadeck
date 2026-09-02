import { notFound } from "next/navigation";
import { CHAPTERS, V4_CHAPTERS, getChapter, getNextChapter } from "@/data/story/chapters";
import { getNextPathStep } from "@/data/v4/units";
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

  return (
    <ChapterPlayer
      chapter={chapter.data}
      nextChapter={nextChapter}
      backHref={isV4 ? "/v4" : "/story"}
      backLabel={isV4 ? "Back to Path" : "Back to Story"}
    />
  );
}
