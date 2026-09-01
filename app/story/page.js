import Link from "next/link";
import { CHAPTERS } from "@/data/story/chapters";

// Story's own menu - one door in from the dev console (0048), listing
// every chapter. No progress is tracked yet (same call v2/v3 made, 0037),
// so every chapter is reachable regardless of whether an earlier one was
// finished.
export default function StoryIndex() {
  return (
    <main className="shell starfield">
      <div className="trail">
        <ol className="trail-steps">
          {CHAPTERS.map(({ slug, data, partLabel }, i) => (
            <li key={slug}>
              <Link className="trail-step" href={`/story/play/${slug}`}>
                <span className="trail-sub">{partLabel}</span>
                <span className="trail-label">
                  Chapter {i + 1}: {data.title}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
