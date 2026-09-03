import { Suspense } from "react";
import { getDeck, getAllSections } from "@/lib/data";
import DeckScreen from "@/components/deck-screen";

export default async function DeckPage() {
  const [groups, sections] = await Promise.all([getDeck(), getAllSections()]);
  // DeckScreen reads useSearchParams() (the unit-unlock celebration's own
  // ?unlock=/?next= hand-off) - Next.js requires that behind a Suspense
  // boundary wherever the route could be statically prerendered, or the
  // production build fails outright ("useSearchParams() should be wrapped
  // in a suspense boundary"). No visible fallback UI needed: this page is
  // already client-rendered in practice (useProgress() reads localStorage),
  // so the boundary resolves essentially immediately.
  return (
    <Suspense fallback={null}>
      <DeckScreen groups={groups} sections={sections} />
    </Suspense>
  );
}
