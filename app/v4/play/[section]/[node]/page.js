import { notFound } from "next/navigation";
import { SECTIONS, getSection, getNextSection } from "@/data/v4/sections";
import mashupNodes from "@/data/v4/mashup_nodes.json";
import capstoneNodes from "@/data/v4/capstone_nodes.json";
import NodeSession from "@/components/lesson-v2/node-session";

// v4's play screen, one lesson node at a time — /v4/play/<section>/<node>.
// Same NodeSession the v2/v3 lesson content already uses (docs/decisions
// 0035, 0046, 0057) - v4 only supplies its own section data (Fool/Lovers/
// Empress, regrouped into 7 nodes each) and basePath="/v4", exactly the
// same pattern app/v3's own play route already establishes.
//
// <section> also accepts two kinds of pseudo-section, both resolved here
// rather than in a nested route, since NodeSession's own "complete"
// screen always links to `${basePath}/play/${sectionSlug}/${n+1}` and a
// nested route would make that auto-generated link 404:
//   - a review unit's own mashup pair (data/v4/mashup_nodes.json's own
//     "unit7"/"unit8" keys, docs/decisions/0059)
//   - a single-card unit's mid-unit mini capstone (data/v4/
//     capstone_nodes.json's own "fool"/"lovers"/"empress" keys, suffixed
//     "-capstone" so they don't collide with the real card sections of
//     the same name, docs/decisions/0062) - always exactly one node, so
//     <node> is always "1" for these.
export function generateStaticParams() {
  const single = SECTIONS.flatMap((s) => s.data.nodes.map((_, i) => ({ section: s.slug, node: String(i + 1) })));
  const mashup = Object.entries(mashupNodes).flatMap(([unit, nodes]) =>
    nodes.map((_, i) => ({ section: unit, node: String(i + 1) }))
  );
  const capstone = Object.keys(capstoneNodes).map((card) => ({ section: `${card}-capstone`, node: "1" }));
  return [...single, ...mashup, ...capstone];
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

  if (sectionParam.endsWith("-capstone")) {
    const card = sectionParam.slice(0, -"-capstone".length);
    const node = capstoneNodes[card];
    if (!node || nodeNumber !== 1) notFound();
    const firstRound = node.rounds[0];
    return (
      <NodeSession
        key={`${sectionParam}-${node.id}`}
        cardKey={firstRound.cardKey}
        cardName={firstRound.cardName}
        node={node}
        nodeNumber={1}
        totalNodes={1}
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
