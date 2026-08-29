import { getDrawDeck, getAllSections } from "@/lib/data";
import ReaderScreen from "@/components/reader-screen";

export default async function ReaderPage() {
  const [cards, sections] = await Promise.all([getDrawDeck(), getAllSections()]);
  return <ReaderScreen deck={{ cards, sections }} />;
}
