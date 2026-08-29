import { getDrawDeck, getAllSections } from "@/lib/data";
import DrawScreen from "@/components/draw-screen";

export default async function DrawPage() {
  const [cards, sections] = await Promise.all([getDrawDeck(), getAllSections()]);
  return <DrawScreen deck={{ cards, sections }} />;
}
