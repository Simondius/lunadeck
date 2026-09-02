import { notFound } from "next/navigation";
import { SECTIONS, getSection, getNextSection } from "@/data/v4/sections";
import mashupNodes from "@/data/v4/mashup_nodes.json";
import NodeSession from "@/components/lesson-v2/node-session";

// v4's play screen, one lesson node at a time — /v4/play/<section>/<node>.
// Same NodeSession the v2/v3 lesson content already uses (docs/decisions
// 0035, 0046, 0057) - v4 only supplies its own section data (Fool/Lovers/
// Empress, regrouped into 7 nodes each) and basePath="/v4", exactly the
// same pattern app/v3's own play route already establishes.
//
// <section> also accepts a review unit's own mashup pseudo-section
// (data/v4/mashup_nodes.json's own "unit7"/"unit8" keys, docs/decisions/
// 0059) rather than forking a nested route for it: NodeSession's own
// "complete" screen always links to `${basePath}/play/${sectionSlug}/
// ${n+1}`, so a mashup node's sectionSlug has to resolve here too, or
// that auto-generated "next node" link would 404.
export function generateStaticParams() {
  const single = SECTIONS.flatMap((s) => s.data.nodes.map((_, i) => ({ section: s.slug, node: String(i + 1) })));
  const mashup = Object.entries(mashupNodes).flatMap(([unit, nodes]) =>
    nodes.map((_, i) => ({ section: unit, node: String(i + 1) }))
  );
  return [...single, ...mashup];
}

export default async function V4NodePlayPage({ params }) {
  const { section: sectionParam, node: nodeParam } = await params;
  const nodeNumber = Number(nodeParam);

  const mashupSet = mashupNodes[sectionParam];
  if (mashupSet) {
    const node = mashupSet[nodeNumber - 1];
    if (!node) notFound();
    const firstRound = node.rounds[0];
    return (
      <NodeSession
        key={`${sectionParam}-${node.id}`}
        cardKey={firstRound.cardKey}
        cardName={firstRound.cardName}
        node={node}
        nodeNumber={nodeNumber}
        totalNodes={mashupSet.length}
        sectionSlug={sectionParam}
        nextSection={null}
        basePath="/v4"
      />
    );
  }

  const section = getSection(sectionParam);
  if (!section) notFound();

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
      basePath="/v4"
    />
  );
}
