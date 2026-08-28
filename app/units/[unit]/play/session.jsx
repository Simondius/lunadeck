"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormatA from "./format-a";
import FormatB from "./format-b";
import FormatC from "./format-c";
import { Footer } from "./options";

const FORMATS = { A: FormatA, B: FormatB, C: FormatC };

// A node can expand into several instances of its format — a six-card sort is
// six sorts, an eight-card recap is three boards. The session plays them back
// to back; the node is what the curriculum counts, the instance is what the
// learner sees.
function toSteps(nodes) {
  const steps = [];
  nodes.forEach((node, nodeIndex) => {
    if (!node.playable) {
      steps.push({ node, nodeIndex, round: null, instance: 0, instanceCount: 1 });
      return;
    }
    node.instances.forEach((round, instance) => {
      steps.push({
        node,
        nodeIndex,
        round,
        instance,
        instanceCount: node.instances.length,
      });
    });
  });
  return steps;
}

export default function Session({ unitNumber, unitName, nodes }) {
  const steps = useMemo(() => toSteps(nodes), [nodes]);
  const [index, setIndex] = useState(0);
  const [hintHandler, setHintHandler] = useState(null);
  const router = useRouter();

  const step = steps[index];

  // On the last step, advancing leaves the lesson rather than sticking.
  const advance = useCallback(() => {
    setHintHandler(null);
    if (index >= steps.length - 1) {
      router.push(`/units/${unitNumber}`);
      return;
    }
    setIndex(index + 1);
  }, [index, steps.length, router, unitNumber]);

  // Only Format A supplies a hint; B and C leave the control disabled, which
  // the Format Bible flags as an open question rather than settled behaviour.
  const onHintReady = useCallback((handler) => {
    setHintHandler(() => handler);
  }, []);

  if (!step) return null;

  const { node, round, instance, instanceCount } = step;
  const Format = round ? FORMATS[round.kind] : null;
  const progress = (index / steps.length) * 100;
  const meta = [
    unitName,
    node.nodeId,
    node.formatCode,
    node.distractorTier && node.distractorTier !== "n/a" ? node.distractorTier : null,
    instanceCount > 1 ? `${instance + 1} of ${instanceCount}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="session">
      <div className="topbar">
        <Link className="quit" href={`/units/${unitNumber}`} aria-label="Leave lesson">
          ✕
        </Link>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress)}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <button
          className="hint"
          onClick={() => hintHandler?.()}
          disabled={!hintHandler}
          type="button"
        >
          Hint
        </button>
      </div>

      {Format ? (
        <Format
          key={`${node.nodeId}-${instance}`}
          round={round}
          meta={meta}
          onAdvance={advance}
          onHintReady={onHintReady}
        />
      ) : (
        <>
          <div className="unbuilt">
            <p className="unbuilt-code">{node.formatCode}</p>
            <p className="unbuilt-name">{node.formatName}</p>
            <p className="unbuilt-note">
              This node has no renderable round. Check the curriculum row against
              the format builders in <code>lib/rounds.js</code>.
            </p>
          </div>
          <Footer label="Skip" disabled={false} onClick={advance} meta={meta} />
        </>
      )}
    </main>
  );
}
