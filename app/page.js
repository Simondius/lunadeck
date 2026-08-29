import { getPath } from "@/lib/data";
import PathScreen from "@/components/path-screen";

// The curriculum shape is read on the server; progress is read in the browser.
// The two meet in PathScreen, which counts one against the other.
export default async function Home() {
  const entries = await getPath();
  const totalNodes = entries
    .filter((e) => e.type === "section")
    .reduce((sum, e) => sum + e.nodeIds.length, 0);

  return <PathScreen entries={entries} totalNodes={totalNodes} />;
}
