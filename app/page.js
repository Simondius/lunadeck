import { getUnits, getSections, getUnitNodeIds } from "@/lib/data";
import PathScreen from "@/components/path-screen";

// The curriculum shape is read on the server; progress is read in the browser.
// The two meet in PathScreen, which counts one against the other.
export default async function Home() {
  const units = await getUnits();

  const withNodes = await Promise.all(
    units.map(async (unit) => {
      const [nodeIds, sections] = await Promise.all([
        getUnitNodeIds(unit.number),
        getSections(unit.number),
      ]);
      return {
        number: unit.number,
        name: unit.name,
        tagline: unit.tagline,
        icon: unit.icon,
        cardCount: unit.cardCount,
        nodeCount: unit.nodeCount,
        unlockRequirement: unit.unlockRequirement,
        nodeIds,
        sections: sections.map((s) => ({
          section: s.section,
          cardKey: s.cardKey,
          nodeIds: s.nodeIds,
        })),
      };
    })
  );

  const totalNodes = withNodes.reduce((sum, u) => sum + u.nodeIds.length, 0);

  return <PathScreen units={withNodes} totalNodes={totalNodes} />;
}
