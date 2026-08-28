"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormatA from "./format-a";
import FormatB from "./format-b";
import FormatC from "./format-c";
import { Footer } from "./options";
import { useProgress } from "@/components/use-progress";
import { completeNode, spendHint, hintsLeft, sectionKey } from "@/lib/progress";

const FORMATS = { A: FormatA, B: FormatB, C: FormatC };

// A node can expand into several instances of its format — a six-card sort is
// six sorts, an eight-card recap is three boards. The session plays them back
// to back; the node is what the curriculum counts and what progress records,
// the instance is what the learner sees and what the progress bar ticks.
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

export default function Session({ unitNumber, unitName, section, nodes }) {
  const steps = useMemo(() => toSteps(nodes), [nodes]);
  const [index, setIndex] = useState(0);
  const [hintHandler, setHintHandler] = useState(null);
  const router = useRouter();

  const progress = useProgress();
  const key = sectionKey(unitNumber, section.section);
  const hints = hintsLeft(progress, key);

  const step = steps[index];
  const backHref = `/units/${unitNumber}`;

  const advance = useCallback(() => {
    setHintHandler(null);
    const current = steps[index];
    const next = steps[index + 1];

    // A node is complete once its last instance is answered — not per instance.
    if (current && (!next || next.nodeIndex !== current.nodeIndex)) {
      completeNode(current.node.nodeId);
    }

    if (!next) {
      router.push(backHref);
      return;
    }
    setIndex(index + 1);
  }, [index, steps, router, backHref]);

  // Only Format A supplies a hint; B and C leave the control disabled, which
  // the Format Bible flags as an open question rather than settled behaviour.
  const onHintReady = useCallback((handler) => {
    setHintHandler(() => handler);
  }, []);

  const useHint = useCallback(() => {
    if (!hintHandler || hints <= 0) return;
    spendHint(key);
    hintHandler();
  }, [hintHandler, hints, key]);

  if (!step) return null;

  const { node, round, instance, instanceCount } = step;
  const Format = round ? FORMATS[round.kind] : null;
  const meta = [
    node.nodeId,
    node.distractorTier && node.distractorTier !== "n/a" ? node.distractorTier : null,
    instanceCount > 1 ? `${instance + 1} of ${instanceCount}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const formatLine = `${node.formatCode} · ${node.formatName}`;
  const hintable = Boolean(hintHandler) && hints > 0;

  return (
    <main className="session">
      <div className="topbar">
        <Link className="quit" href={backHref} aria-label="Leave lesson">
          ✕
        </Link>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={index}
          aria-label={`Step ${index + 1} of ${steps.length}`}
        >
          {steps.map((s, i) => (
            <span
              key={`${s.node.nodeId}-${s.instance}`}
              className={i < index ? "is-done" : undefined}
            />
          ))}
        </div>
        <button className="hint" onClick={useHint} disabled={!hintable} type="button">
          HINT · {hints}
        </button>
      </div>

      {Format ? (
        <Format
          key={`${node.nodeId}-${instance}`}
          round={round}
          meta={meta}
          formatLine={formatLine}
          onAdvance={advance}
          onHintReady={onHintReady}
        />
      ) : (
        <>
          <span className="format-line">{formatLine}</span>
          <p className="prompt">Nothing to play here yet.</p>
          <p className="spec-note">
            This node has no renderable round. Check the curriculum row against
            the format builders in lib/rounds.js.
          </p>
          <Footer label="Skip" disabled={false} onClick={advance} meta={meta} />
        </>
      )}
    </main>
  );
}
