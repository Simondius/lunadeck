"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { SECTIONS } from "@/data/v3/sections";
import { masterForKey } from "@/lib/rounds";
import { Inspector } from "@/components/lesson/options";
import { shapeForNode, makeKeywordVariantTracker, V2NodeIcon } from "@/components/lesson-v2/v2-node-icon";

// The trail winds rather than running straight down — same offset table
// path-screen.jsx uses, reused rather than re-derived so the two screens
// move the same way.
const WIND = [0, 40, 62, 40, 0, -40, -62, -40];

// v3 is v2's own five sections, resequenced node-by-node for variety
// (docs/decisions/0046): every section now opens on an easy fill-in-the-blank
// intro, alternates format and climbs difficulty, and closes on multiple
// choice into a fill-in-the-blank capstone — instead of opening each section
// on five or six identical keyword-tap nodes in a row, which is what v2 still
// does. No round content changed; only which node it lives in, and where
// that node sits in each section's array (data/v3/*_section.json).
const LABELS = {
  fool: [
    "Fill in the blank: description",
    "Does it match?",
    "Find the elements",
    "First words",
    "Trickier matches",
    "More new words",
    "Fill in the blank: readings",
    "Closer distractors",
    "Six at once",
    "Hardest matches",
    "Trickier confusables",
    "Spontaneity mastery",
    "Every keyword, once",
    "Pick the true reading",
    "The full picture",
  ],
  lovers: [
    "Fill in the blank: description",
    "Does it match?",
    "Find the elements",
    "First words",
    "Trickier matches",
    "More new words",
    "Fill in the blank: readings",
    "Opposites",
    "Obvious wrong answers",
    "Hardest matches",
    "Real-word confusables",
    "Final mastery",
    "Every keyword, once",
    "Pick the true reading",
    "The full picture",
  ],
  magician: [
    "Fill in the blank: description",
    "Does it match?",
    "Find the elements",
    "First words",
    "Trickier matches",
    "More new words",
    "Fill in the blank: readings",
    "Opposites",
    "Obvious wrong answers",
    "Hardest matches",
    "Real-word confusables",
    "Final mastery",
    "Every keyword, once",
    "Pick the true reading",
    "The full picture",
  ],
  // No zone node — Empress's own cardelements crops were dropped (the
  // guidebook's imagery doesn't match Lunadeck's redesigned art), so this
  // section's shape has no "then elements" step and runs one node shorter
  // than the other four.
  empress: [
    "Fill in the blank: description",
    "Does it match?",
    "First words",
    "Trickier matches",
    "More new words",
    "Fill in the blank: readings",
    "Opposites",
    "Obvious wrong answers",
    "Hardest matches",
    "Real-word confusables",
    "Final mastery",
    "Every keyword, once",
    "Pick the true reading",
    "The full picture",
  ],
  emperor: [
    "Fill in the blank: description",
    "Does it match?",
    "Find the elements",
    "First words",
    "Trickier matches",
    "More new words",
    "Fill in the blank: readings",
    "Opposites",
    "Obvious wrong answers",
    "Hardest matches",
    "Real-word confusables",
    "Final mastery",
    "Every keyword, once",
    "Pick the true reading",
    "The full picture",
  ],
};

// Every node (not just the first) that ties for farthest-from-center in this
// section's own stretch of the winding trail — each is a point where the
// trail leans hardest to one side, opening the most room on the other. The
// WIND cycle's two extremes (+62/-62) both fall inside most 8-plus-node
// sections, so a section curving out on both sides is the common case, not
// an edge case — one companion card renders per tied peak, each in its own
// gap. startIndex is where this section's own nodes begin in the trail's
// shared, continuously-cycling WIND sequence (sections don't restart it at 0).
function peaksForSection(startIndex, nodeCount) {
  let maxAbs = 0;
  for (let i = 0; i < nodeCount; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(WIND[(startIndex + i) % WIND.length]));
  }
  const peaks = [];
  for (let i = 0; i < nodeCount; i++) {
    const w = WIND[(startIndex + i) % WIND.length];
    if (Math.abs(w) === maxAbs) peaks.push({ localIndex: i, side: w > 0 ? "left" : "right" });
  }
  return peaks;
}

// .v2-companion's own fixed width (108px) and CSS aspect-ratio (813/1456,
// the card art's own proportions) — needed here to center it on the peak
// node without a transform: the card's float/glow animation already drives
// `transform` continuously, and an animated property always wins over an
// inline style for that same property, so translateY(-50%) would just get
// overwritten every frame instead of centering anything.
const COMPANION_HEIGHT = 108 * (1456 / 813);

// v3's own path index - the app's default landing page now (app/page.js
// re-exports this). v2 and v1 both live on behind the dev console for
// whoever wants the earlier shape. Reuses v2's own trail markup and CSS
// classes (.v2-*) wholesale — the visual system isn't versioned, only the
// content and its ordering are, so there is nothing curriculum-specific to
// rename here.
export default function V3Path() {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [inspecting, setInspecting] = useState(null);
  // Measured, not guessed: a label wrapping to one or two lines shifts every
  // node below it, so each peak node's real on-screen position (keyed by
  // "slug-localIndex", since a section can have more than one peak) comes
  // from getBoundingClientRect, not a row-height formula.
  const [companionTop, setCompanionTop] = useState({});
  const trailRefs = useRef({});
  const peakRefs = useRef({});

  useLayoutEffect(() => {
    function measure() {
      const next = {};
      for (const key of Object.keys(peakRefs.current)) {
        const peakEl = peakRefs.current[key];
        const slug = key.split("::")[0];
        const containerEl = trailRefs.current[slug];
        if (!peakEl || !containerEl) continue;
        const peakRect = peakEl.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();
        // Centers the companion card on the peak node's own icon - clamped to
        // never go negative, since a peak that close to the top of its
        // section would otherwise push the card up past .v2-section-trail's
        // own top edge and over the section's header button above it.
        next[key] = Math.max(
          4,
          peakRect.top - containerRect.top + peakRect.height / 2 - COMPANION_HEIGHT / 2
        );
      }
      setCompanionTop(next);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [collapsed]);

  const toggle = (slug) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

  let index = -1;

  return (
    <main className="shell starfield">
      <div className="trail">
        {SECTIONS.map(({ slug, data }) => {
          const shut = collapsed.has(slug);
          const labels = LABELS[slug] ?? [];
          const keywordVariant = makeKeywordVariantTracker();
          // Every gap this section's trail opens up on either side —
          // usually two (the WIND cycle's +62 and -62 both land inside most
          // sections), sometimes one. Computed from the shared WIND cycle,
          // not measured, since it only needs the offset values themselves.
          const peaks = peaksForSection(index + 1, data.nodes.length);
          const peaksByLocalIndex = new Map(peaks.map((p) => [p.localIndex, p.side]));

          return (
            <section key={slug}>
              <button
                type="button"
                className={shut ? "trail-unit is-shut" : "trail-unit"}
                onClick={() => toggle(slug)}
                aria-expanded={!shut}
                aria-controls={`v3-${slug}-nodes`}
              >
                <span className="trail-unit-index">{data.nodes.length} nodes</span>
                <span className="trail-unit-name">{data.cardName}</span>
                <span className="trail-chevron" aria-hidden="true" />
              </button>

              <div
                className="v2-section-trail"
                hidden={shut}
                ref={(el) => (trailRefs.current[slug] = el)}
              >
                {peaks.map((peak) => {
                  const key = `${slug}::${peak.localIndex}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`v2-companion is-${peak.side}`}
                      style={companionTop[key] != null ? { top: `${companionTop[key]}px` } : undefined}
                      onClick={() =>
                        setInspecting({ image: masterForKey(data.cardKey), label: data.cardName })
                      }
                      aria-label={`View ${data.cardName} full size`}
                    >
                      <img src={masterForKey(data.cardKey)} alt="" />
                    </button>
                  );
                })}

                <ol className="trail-steps" id={`v3-${slug}-nodes`}>
                  {data.nodes.map((node, i) => {
                    index += 1;
                    const style = { "--x": `${WIND[index % WIND.length]}px` };
                    const shape = shapeForNode(node);
                    const variant = shape === "circle" ? keywordVariant(node) : null;
                    // v3 has no persisted progress by design, same as v2
                    // (0037) - every node is reachable, nothing is "done"
                    // yet. The very first node stands in as "current" so the
                    // ring/sparkle treatment has a real spot to land on.
                    const isCurrent = index === 0;
                    const peakSide = peaksByLocalIndex.get(i);
                    return (
                      <li key={node.id}>
                        <Link
                          className={`trail-step v2-step${isCurrent ? " is-current" : ""}`}
                          href={`/v3/play/${slug}/${i + 1}`}
                          style={style}
                        >
                          <span
                            ref={
                              peakSide
                                ? (el) => (peakRefs.current[`${slug}::${i}`] = el)
                                : undefined
                            }
                            className={`v2-shape v2-shape-${shape}`}
                          >
                            <V2NodeIcon shape={shape} variant={variant} />
                            {isCurrent ? (
                              <span className="v2-sparkle-field" aria-hidden="true">
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                                <span className="v2-sparkle" />
                              </span>
                            ) : null}
                          </span>
                          <span className="trail-label">{labels[i] ?? `Node ${i + 1}`}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
          );
        })}
      </div>

      {inspecting ? <Inspector item={inspecting} onClose={() => setInspecting(null)} /> : null}
    </main>
  );
}
