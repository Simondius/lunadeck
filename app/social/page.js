import { getDeck, getAllSections, getPath, getDrawDeck } from "@/lib/data";
import SocialScreen from "@/components/social-screen";
import { friendActivity } from "@/lib/demo-friends";

// The curriculum shape is read on the server; progress is read in the browser.
// Same split as the path and the deck, and the same totals, so the profile's
// numbers cannot disagree with theirs.
export default async function SocialPage() {
  const [groups, sections, entries, cards] = await Promise.all([
    getDeck(),
    getAllSections(),
    getPath(),
    getDrawDeck(),
  ]);

  const totalCards = groups.reduce((n, g) => n + g.cards.length, 0);
  const totalNodes = entries
    .filter((e) => e.type === "section")
    .reduce((sum, e) => sum + e.nodeIds.length, 0);

  // Placeholder until there are accounts — see lib/demo-friends.js. Resolved
  // here so the card names and art come from the CSVs rather than the fixture.
  const activity = friendActivity(cards);

  return (
    <SocialScreen
      sections={sections}
      totalCards={totalCards}
      totalNodes={totalNodes}
      activity={activity}
    />
  );
}
