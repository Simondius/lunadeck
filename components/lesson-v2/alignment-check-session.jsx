"use client";

import { useState } from "react";
import NodeSession from "./node-session";
import AlignmentCheckIntro from "./alignment-check-intro";
import AlignmentCheckOutro from "./alignment-check-outro";

// Wraps a plain Alignment Check node (still the same words/cloze/choice
// rounds NodeSession always played) with its own opening and closing
// ceremony (0093). The rounds themselves are untouched - this only
// decides what shows before the first one and instead of the generic
// NodeCompleteCelebration after the last one.
export default function AlignmentCheckSession({
  cardKey,
  cardName,
  node,
  sectionSlug,
  nextHref,
  nextLabel,
  basePath,
}) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <AlignmentCheckIntro cardKey={cardKey} cardName={cardName} onContinue={() => setStarted(true)} />
    );
  }

  return (
    <NodeSession
      cardKey={cardKey}
      cardName={cardName}
      node={node}
      nodeNumber={1}
      totalNodes={1}
      sectionSlug={sectionSlug}
      nextHref={nextHref}
      nextLabel={nextLabel}
      basePath={basePath}
      renderComplete={({ nextHref: resolvedHref, nextLabel: resolvedLabel }) => (
        <AlignmentCheckOutro
          cardKey={cardKey}
          cardName={cardName}
          nextHref={resolvedHref}
          nextLabel={resolvedLabel}
        />
      )}
    />
  );
}
