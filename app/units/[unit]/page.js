import Link from "next/link";
import { notFound } from "next/navigation";
import { getUnit, getUnits, getNodes, groupBySection, circleForKey } from "@/lib/data";

export async function generateStaticParams() {
  const units = await getUnits();
  return units.map((u) => ({ unit: String(u.number) }));
}

export default async function UnitPage({ params }) {
  const { unit: unitParam } = await params;
  const unit = await getUnit(unitParam);
  if (!unit) notFound();

  const nodes = await getNodes(unit.number);
  const sections = groupBySection(nodes);

  return (
    <main className="shell">
      <Link className="backlink" href="/">
        ← All units
      </Link>

      <h1 className="unit-title">{unit.name}</h1>
      <p className="unit-intro">{unit.intro}</p>

      <div className="meta">
        <span>{unit.sectionCount} sections</span>
        <span>{unit.majorCount} major</span>
        <span>{unit.minorCount} minor</span>
        <span>{unit.dominantSuit}</span>
      </div>

      <Link className="start" href={`/units/${unit.number}/play`}>
        Start lesson
      </Link>

      {sections.map(([sectionNumber, sectionNodes]) => (
        <section key={sectionNumber}>
          <h2 className="section-head">
            Section {sectionNumber} — {sectionNodes.length} nodes
          </h2>
          <ol className="nodes">
            {sectionNodes.map((node) => (
              <li
                key={node.nodeId}
                className={node.nodeType === "standard" ? "node" : "node is-review"}
              >
                <span className="node-art">
                  {node.cardKey ? (
                    <img src={circleForKey(node.cardKey)} alt="" />
                  ) : null}
                </span>
                <span>
                  <span className="node-card" style={{ display: "block" }}>
                    {node.cardName || node.nodeType.replace(/_/g, " ")}
                  </span>
                  <span className="node-format" style={{ display: "block" }}>
                    {node.formatCode} · {node.formatName}
                  </span>
                </span>
                <span className="node-tag">
                  {node.nodeId}
                  <br />
                  {node.distractorTier}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
