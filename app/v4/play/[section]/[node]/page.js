import { notFound } from "next/navigation";
import { SECTIONS, getSection } from "@/data/v4/sections";
import { getNextLessonStep } from "@/data/v4/units";
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
// rather than in a nested route (docs/decisions/0059, 0062):
//   - a review unit's own mashup pair (data/v4/mashup_nodes.json's own
//     "unit7"/"unit8" keys)
//   - a single-card unit's mid-unit mini capstone (data/v4/
//     capstone_nodes.json's own "fool"/"lovers"/"empress" keys, suffixed
//     "-capstone" so they don't collide with the real card sections of
//     the same name) - always exactly one node, so <node> is always "1".
//
// Every link into this route carries a `?unit=<N>` query param
// (data/v4/units.js's own stepsForUnit) - v4's lesson content isn't a
// plain card-by-card chain (cut nodes reserved for review units, a
// mid-unit capstone, cross-card mashup nodes), and two sibling units
// teaching the same card (1&2, 3&4, 5&6) share identical section/node
// routes, so "what's actually next" can only be resolved with that unit
// context, via getNextLessonStep() - never NodeSession's own built-in
// nextSection/nodeNumber math, which assumed a flat per-card chain that
// doesn't hold once cut/capstone/mashup nodes exist (docs/decisions/
// 0065). Passing an explicit nextHref/nextLabel to NodeSession for every
// branch below bypasses that built-in math entirely.
export function generateStaticParams() {
  const single = SECTIONS.flatMap((s) => s.data.nodes.map((_, i) => ({ section: s.slug, node: String(i + 1) })));
  const mashup = Object.entries(mashupNodes).flatMap(([unit, nodes]) =>
    nodes.map((_, i) => ({ section: unit, node: String(i + 1) }))
  );
  const capstone = Object.keys(capstoneNodes).map((card) => ({ section: `${card}-capstone`, node: "1" }));
  return [...single, ...mashup, ...capstone];
}

function resolveNext(unitParam, bareHref) {
  const unitNumber = Number(unitParam);
  const next = unitNumber ? getNextLessonStep(unitNumber, bareHref) : null;
  return next ? { nextHref: next.href, nextLabel: next.label } : { nextHref: "/v4", nextLabel: "Back to Path" };
}

export default async function V4NodePlayPage({ params, searchParams }) {
  const { section: sectionParam, node: nodeParam } = await params;
  const { unit: unitParam } = await searchParams;
  const nodeNumber = Number(nodeParam);
  const bareHref = `/v4/play/${sectionParam}/${nodeNumber}`;
  const { nextHref, nextLabel } = resolveNext(unitParam, bareHref);

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
        nextHref={nextHref}
        nextLabel={nextLabel}
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
        nextHref={nextHref}
        nextLabel={nextLabel}
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
      nextHref={nextHref}
      nextLabel={nextLabel}
      basePath="/v4"
    />
  );
}
