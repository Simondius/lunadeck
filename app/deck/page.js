import { getDeck, getAllSections } from "@/lib/data";
import DeckScreen from "@/components/deck-screen";

export default async function DeckPage() {
  const [groups, sections] = await Promise.all([getDeck(), getAllSections()]);
  return <DeckScreen groups={groups} sections={sections} />;
}
