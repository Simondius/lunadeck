"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormatA from "./format-a";
import FormatB from "./format-b";
import FormatC from "./format-c";
import { Footer } from "./options";

const FORMATS = { A: FormatA, B: FormatB, C: FormatC };

export default function Session({ unitNumber, unitName, nodes }) {
  const [index, setIndex] = useState(0);
  const [hintHandler, setHintHandler] = useState(null);
  const router = useRouter();

  const node = nodes[index];

  // On the last node, advancing leaves the lesson rather than sticking.
  const advance = useCallback(() => {
    setHintHandler(null);
    setIndex((i) => {
      if (i >= nodes.length - 1) {
        router.push(`/units/${unitNumber}`);
        return i;
      }
      return i + 1;
    });
  }, [nodes.length, router, unitNumber]);

  // Only Format A supplies a hint; B and C leave the control disabled, which
  // the Format Bible flags as an open question rather than settled behaviour.
  const onHintReady = useCallback((handler) => {
    setHintHandler(() => handler);
  }, []);

  if (!node) return null;

  const Format = node.playable ? FORMATS[node.round.kind] : null;
  const progress = (index / nodes.length) * 100;
  const meta = `${unitName} · ${node.nodeId} · ${node.formatCode}${
    node.distractorTier && node.distractorTier !== "n/a"
      ? ` · ${node.distractorTier}`
      : ""
  }`;

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
          key={node.nodeId}
          round={node.round}
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
              Spec and curriculum data disagree on this format&rsquo;s direction.
              Not built yet.
            </p>
          </div>
          <Footer
            label="Skip"
            disabled={false}
            onClick={advance}
            meta={meta}
          />
        </>
      )}
    </main>
  );
}
