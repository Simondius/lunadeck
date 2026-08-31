import { notFound } from "next/navigation";
import { SECTIONS, getSection, getNextSection } from "@/data/v3/sections";
import NodeSession from "@/components/lesson-v2/node-session";

// v3's play screen, one node at a time — /v3/play/<section>/<node>. Same
// five sections and the same NodeSession/round-player components as v2
// (docs/decisions/0035, 0037), just a resequenced node order per section
// (docs/decisions/0046) and its own data under data/v3/. basePath="/v3"
// is the only thing that tells the shared components which curriculum
// they're inside — see the note above NodeSession's own basePath prop.
export function generateStaticParams() {
  return SECTIONS.flatMap((s) => s.data.nodes.map((_, i) => ({ section: s.slug, node: String(i + 1) })));
}

export default async function V3NodePlayPage({ params }) {
  const { section: sectionParam, node: nodeParam } = await params;
  const section = getSection(sectionParam);
  if (!section) notFound();

  const nodeNumber = Number(nodeParam);
  const node = section.data.nodes[nodeNumber - 1];
  if (!node) notFound();

  return (
    <NodeSession
      key={`${section.slug}-${node.id}`}
      cardKey={section.data.cardKey}
      cardName={section.data.cardName}
      node={node}
      nodeNumber={nodeNumber}
      totalNodes={section.data.nodes.length}
      sectionSlug={section.slug}
      nextSection={getNextSection(section.slug)}
      basePath="/v3"
    />
  );
}
