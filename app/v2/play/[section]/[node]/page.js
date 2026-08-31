import { notFound } from "next/navigation";
import { SECTIONS, getSection, getNextSection } from "@/data/v2/sections";
import NodeSession from "@/components/lesson-v2/node-session";

// v2's play screen, one node at a time — /v2/play/<section>/<node>. Five
// sections now (docs/decisions/0035): Fool, Lovers, Magician, Empress,
// Emperor, each its own JSON under data/v2/. See
// docs/draft-alt-path-fool-section.md and docs/decisions/0037 for why this
// is a bespoke JSON-driven flow rather than a fork of
// app/units/[unit]/sections/[section]/play.
export function generateStaticParams() {
  return SECTIONS.flatMap((s) => s.data.nodes.map((_, i) => ({ section: s.slug, node: String(i + 1) })));
}

export default async function V2NodePlayPage({ params }) {
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
    />
  );
}
