import { notFound } from "next/navigation";
import Link from "next/link";
import { getUnit, getUnits, getNodes } from "@/lib/data";

// Node-level detail — format code, node id, distractor tier — moved off the
// unit page when it became section rows. It is still the fastest way to see
// what the curriculum actually schedules, so it lives here rather than nowhere.
export async function generateStaticParams() {
  const units = await getUnits();
  return units.map((u) => ({ unit: String(u.number) }));
}

export default async function DebugPage({ params }) {
  const { unit: unitParam } = await params;
  const unit = await getUnit(unitParam);
  if (!unit) notFound();
  const nodes = await getNodes(unit.number);

  return (
    <main className="shell">
      <Link className="backlink" href={`/units/${unit.number}`}>
        ← {unit.name}
      </Link>
      <span className="unit-eyebrow">Debug · {nodes.length} nodes</span>
      <h1 className="unit-title">Curriculum rows</h1>
      <ol className="debug-list">
        {nodes.map((node) => (
          <li key={node.nodeId} className="debug-row">
            <b>{node.nodeId}</b>
            <span>
              <i>{node.cardName || node.nodeType.replace(/_/g, " ")}</i>
              {" — "}
              {node.formatCode} {node.formatName}
            </span>
            <span>{node.distractorTier}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
