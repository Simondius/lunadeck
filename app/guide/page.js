import { getDrawDeck } from "@/lib/data";
import GuideScreen from "@/components/guide-screen";

export default async function GuidePage() {
  // Only what the scanner's picker needs to draw a card and name it. The
  // guidebook rows stay on the server: the interpretation is grounded in them
  // there, and shipping 78 cards' worth of meanings to the client for a search
  // box would be paying for the whole deck to draw a list.
  const cards = await getDrawDeck();
  return (
    <GuideScreen
      deck={cards.map(({ key, name, master }) => ({ key, name, master }))}
    />
  );
}
