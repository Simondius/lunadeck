"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoundPlayer from "./round-player";
import ZoneRoundPlayer from "./zone-round-player";
import ClozeRoundPlayer from "./cloze-round-player";
import ChoiceRoundPlayer from "./choice-round-player";
import TileMatchPlayer from "./tile-match-player";
import SwipeRoundPlayer from "./swipe-round-player";
import { registerNodeSkip } from "@/lib/dev-console-bridge";

// One player component per round.type. No "type" at all is the original
// keyword-pair shape (RoundPlayer) — kept untagged since it predates every
// other type and retagging its data for no behavioural reason isn't worth
// the diff.
const PLAYERS = {
  zone: ZoneRoundPlayer,
  cloze: ClozeRoundPlayer,
  choice: ChoiceRoundPlayer,
  tilematch: TileMatchPlayer,
  swipe: SwipeRoundPlayer,
};

// Sequences a node's rounds, then — if any were missed — bridges into a
// second-look replay of just those, once, before the node counts as done.
// Mirrors v1's mistake-review bridge (components/lesson/bridge.jsx,
// docs/decisions/0008) conceptually, but per node rather than per section:
// Simon's spec is "at the end of each node, bring back pairs the user got
// wrong," and v2's nodes are the unit that plays start to finish here, not
// the whole Fool section.
//
// sectionSlug/nextSection make this section-aware for the overnight build
// that added Lovers/Magician/Empress/Emperor alongside the Fool
// (docs/decisions/0035): a node no longer just points at "the next node
// number," it may point at the next *card* once its own section runs out.
export default function NodeSession({
  cardKey,
  cardName,
  node,
  nodeNumber,
  totalNodes,
  sectionSlug,
  nextSection,
}) {
  const [mainIndex, setMainIndex] = useState(0);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [stage, setStage] = useState("main"); // main | bridge | review | complete

  // Dev-only escape hatch (components/dev-console.jsx's < > buttons): step
  // through this node's rounds without playing them, for testing content
  // further into a node without grinding the rounds before it. Mirrors
  // handleRoundDone's own stage transitions exactly, just without recording
  // a miss or requiring a real drag/tap first.
  useEffect(() => {
    return registerNodeSkip({
      onNext() {
        if (stage === "main") {
          if (mainIndex + 1 < node.rounds.length) {
            setMainIndex(mainIndex + 1);
          } else if (reviewQueue.length > 0) {
            setStage("bridge");
          } else {
            setStage("complete");
          }
        } else if (stage === "bridge") {
          setStage("review");
          setReviewIndex(0);
        } else if (stage === "review") {
          if (reviewIndex + 1 < reviewQueue.length) {
            setReviewIndex(reviewIndex + 1);
          } else {
            setStage("complete");
          }
        }
      },
      onPrev() {
        if (stage === "review") {
          if (reviewIndex > 0) {
            setReviewIndex(reviewIndex - 1);
          } else {
            setStage("bridge");
          }
        } else if (stage === "bridge") {
          setStage("main");
          setMainIndex(node.rounds.length - 1);
        } else if (stage === "main" && mainIndex > 0) {
          setMainIndex(mainIndex - 1);
        }
      },
    });
  }, [stage, mainIndex, reviewIndex, reviewQueue, node.rounds.length]);

  function handleRoundDone({ missed }) {
    if (stage === "review") {
      // A second look never requeues again, whatever happens this time —
      // same rule v1's review pass follows (docs/decisions/0008): it can't
      // end on a miss, but it also isn't asked a third time.
      if (reviewIndex + 1 < reviewQueue.length) {
        setReviewIndex(reviewIndex + 1);
      } else {
        setStage("complete");
      }
      return;
    }

    const nextQueue = missed
      ? [...reviewQueue, node.rounds[mainIndex]]
      : reviewQueue;

    if (mainIndex + 1 < node.rounds.length) {
      setReviewQueue(nextQueue);
      setMainIndex(mainIndex + 1);
      return;
    }

    if (nextQueue.length > 0) {
      setReviewQueue(nextQueue);
      setStage("bridge");
    } else {
      setStage("complete");
    }
  }

  if (stage === "bridge") {
    return (
      <main className="session is-drag-lesson">
        <div className="topbar">
          <Link className="quit" href="/v2" aria-label="Leave lesson">
            ✕
          </Link>
        </div>
        <div className="bridge-layout">
          <div className="drag-layout-spacer" aria-hidden="true" />
          <p className="prompt">
            {reviewQueue.length === 1
              ? "One to look at again."
              : `${reviewQueue.length} to look at again.`}
          </p>
          <button
            type="button"
            className="action"
            onClick={() => {
              setStage("review");
              setReviewIndex(0);
            }}
          >
            Review
          </button>
          <div className="drag-layout-spacer" aria-hidden="true" />
        </div>
      </main>
    );
  }

  if (stage === "complete") {
    const hasNextInSection = nodeNumber < totalNodes;
    const nextHref = hasNextInSection
      ? `/v2/play/${sectionSlug}/${nodeNumber + 1}`
      : nextSection
        ? `/v2/play/${nextSection.slug}/1`
        : "/v2";
    const nextLabel = hasNextInSection
      ? `Node ${nodeNumber + 1}`
      : nextSection
        ? nextSection.cardName
        : "Back to v2";

    return (
      <main className="session is-drag-lesson">
        <div className="topbar">
          <Link className="quit" href="/v2" aria-label="Leave lesson">
            ✕
          </Link>
        </div>
        <div className="bridge-layout">
          <div className="drag-layout-spacer" aria-hidden="true" />
          <p className="prompt">Node {nodeNumber} complete.</p>
          <p className="spec-note">
            Placeholder ending — see docs/draft-alt-path-fool-section.md.
          </p>
          <Link className="action" href={nextHref}>
            {nextLabel}
          </Link>
          <div className="drag-layout-spacer" aria-hidden="true" />
        </div>
      </main>
    );
  }

  const round = stage === "review" ? reviewQueue[reviewIndex] : node.rounds[mainIndex];
  const roundNumber = stage === "review" ? reviewIndex + 1 : mainIndex + 1;
  const totalRounds = stage === "review" ? reviewQueue.length : node.rounds.length;
  // node.rounds[originalIndex] is the same object every time it's read, so
  // its own id is a stable, unique React key regardless of which pass (main
  // or review) is currently showing it.
  const roundKey = `${stage === "review" ? "review" : "main"}-${round.id}`;
  const Player = PLAYERS[round.type] ?? RoundPlayer;

  return (
    <Player
      key={roundKey}
      cardKey={cardKey}
      cardName={cardName}
      round={round}
      roundNumber={roundNumber}
      totalRounds={totalRounds}
      secondLook={stage === "review"}
      onDone={handleRoundDone}
    />
  );
}
