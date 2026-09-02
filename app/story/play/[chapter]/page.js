import { notFound } from "next/navigation";
import { CHAPTERS, V4_CHAPTERS, getChapter, getNextChapter } from "@/data/story/chapters";
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

  return <ChapterPlayer chapter={chapter.data} nextChapter={getNextChapter(slug)} />;
}
