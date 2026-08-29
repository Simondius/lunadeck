"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FormatA from "./format-a";
import FormatB from "./format-b";
import FormatC from "./format-c";
import FormatK from "./format-k";
import Intro from "./intro";
import Teach from "./teach";
import Bridge from "./bridge";
import Complete from "./complete";
import { Footer } from "./options";
import { useProgress } from "@/components/use-progress";
import { completeSection, hintsLeft, sectionKey } from "@/lib/progress";

const FORMATS = { A: FormatA, B: FormatB, C: FormatC, K: FormatK };

// Never leave the learner on a screen with no exit.
function Stranded({ href, message }) {
  return (
    <main className="session">
      <div className="topbar">
        <Link className="quit" href={href} aria-label="Leave lesson">
          ✕
        </Link>
      </div>
      <p className="prompt">{message}</p>
      <Link className="action" href={href}>
        Back to the unit
      </Link>
    </main>
  );
}

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
    // A teaching beat sits in front of the node that needs it. It is not a
    // node: no XP, nothing to miss, never queued for review — a screen you
    // pass through, like the section intro.
    if (node.teach) {
      steps.push({
        node,
        nodeIndex,
        teach: node.teach,
        round: null,
        instance: 0,
        instanceCount: 1,
      });
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

export default function Session({
  unitNumber,
  unitName,
  section,
  nodes,
  completion,
  intro,
}) {
  const steps = useMemo(() => toSteps(nodes), [nodes]);

  // intro → play → bridge → review → complete. Nothing is written to the store
  // until the section is finished: Spec_MainPath 7.4 says a section is either
  // fully completed, review queue included, or it didn't happen.
  const [phase, setPhase] = useState(intro ? "intro" : "play");
  const [index, setIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [hintHandler, setHintHandler] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Step indices missed on their first attempt, in the order they were missed.
  const [queue, setQueue] = useState([]);
  const missedNodes = useRef(new Set());

  const progress = useProgress();
  const key = sectionKey(unitNumber, section.section);
  // The ✕ during play goes to the Path per Spec_MainPath 7.4; a stranded
  // screen is a fault, so it points back at the unit the learner came from.
  const backHref = `/units/${unitNumber}`;
  const hintsRemaining = Math.max(0, hintsLeft(progress, key) - hintsUsed);

  const commit = useCallback(() => {
    completeSection({
      nodeIds: nodes.map((n) => n.nodeId),
      missedNodeIds: [...missedNodes.current],
      hintsUsed,
      sectionKey: key,
    });
  }, [nodes, hintsUsed, key]);

  const onHintReady = useCallback((handler) => {
    setHintHandler(() => handler);
  }, []);

  const useHint = useCallback(() => {
    if (!hintHandler || hintsRemaining <= 0) return;
    setHintsUsed((n) => n + 1);
    hintHandler();
  }, [hintHandler, hintsRemaining]);

  const advance = useCallback(
    (result) => {
      setHintHandler(null);

      if (phase === "review") {
        if (reviewIndex >= queue.length - 1) {
          commit();
          setPhase("complete");
        } else {
          setReviewIndex(reviewIndex + 1);
        }
        return;
      }

      const current = steps[index];
      // A node with several instances counts as missed if any one of them was.
      if (current && result?.missed) {
        missedNodes.current.add(current.node.nodeId);
        setQueue((q) => (q.includes(index) ? q : [...q, index]));
      }

      if (index >= steps.length - 1) {
        // The queue is evaluated once, at the end of the run — not per node.
        const missedHere =
          result?.missed && !queue.includes(index) ? queue.length + 1 : queue.length;
        if (missedHere > 0) {
          setPhase("bridge");
        } else {
          commit();
          setPhase("complete");
        }
        return;
      }
      setIndex(index + 1);
    },
    [phase, reviewIndex, queue, steps, index, commit]
  );

  if (phase === "intro") {
    return (
      <Intro
        intro={intro}
        unitNumber={unitNumber}
        unitName={unitName}
        sectionLabel={completion?.sectionLabel ?? `Section ${section.section}`}
        onStart={() => setPhase("play")}
      />
    );
  }

  if (phase === "bridge") {
    return (
      <Bridge
        count={queue.length}
        subject={section.cardName || unitName}
        onReview={() => {
          setReviewIndex(0);
          setPhase("review");
        }}
      />
    );
  }

  if (phase === "complete") {
    // Falling through here would re-render the last played step and loop the
    // learner back around through the bridge forever.
    return completion ? (
      <Complete completion={completion} nodeIds={nodes.map((n) => n.nodeId)} />
    ) : (
      <Stranded href={backHref} message="Lesson finished." />
    );
  }

  const reviewing = phase === "review";
  const step = reviewing ? steps[queue[reviewIndex]] : steps[index];
  if (!step) {
    // The tab bar is suppressed on /play, so a bare `return null` would leave a
    // blank screen with no navigation at all.
    return <Stranded href={backHref} message="There is nothing to play here." />;
  }

  const { node, round, instance, instanceCount } = step;
  const Format = round ? FORMATS[round.kind] : null;

  const ticks = reviewing ? queue.length : steps.length;
  const filled = reviewing ? reviewIndex : index;

  const meta = [
    node.nodeId,
    node.distractorTier && node.distractorTier !== "n/a" ? node.distractorTier : null,
    instanceCount > 1 ? `${instance + 1} of ${instanceCount}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Each replayed exercise is re-served in its own real format, so the line
  // above the prompt says where you are rather than which format this is.
  const formatLine = reviewing
    ? `Second look · Review ${reviewIndex + 1} of ${queue.length}`
    : `${node.formatCode} · ${round?.formatName ?? node.formatName}`;

  // A teaching beat borrows its node's id for the footer but not its format
  // line — the line names what the screen is, and this screen is not A2.

  const hintable = Boolean(hintHandler) && hintsRemaining > 0;

  return (
    <main className="session">
      <div className="topbar">
        <Link className="quit" href="/" aria-label="Leave lesson">
          ✕
        </Link>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={ticks}
          aria-valuenow={filled}
          aria-label={`Step ${filled + 1} of ${ticks}`}
        >
          {Array.from({ length: ticks }, (_, i) => (
            <span key={i} className={i < filled ? "is-done" : undefined} />
          ))}
        </div>
        <button className="hint" onClick={useHint} disabled={!hintable} type="button">
          HINT · {hintsRemaining}
        </button>
      </div>

      {step.teach ? (
        <Teach teach={step.teach} meta={meta} onDone={advance} />
      ) : Format ? (
        <Format
          key={`${reviewing ? "review" : "play"}-${node.nodeId}-${instance}`}
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
