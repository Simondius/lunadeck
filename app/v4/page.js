"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { SECTIONS } from "@/data/v4/sections";
import { UNITS, stepsForUnit } from "@/data/v4/units";
import { masterForKey } from "@/lib/rounds";
import { shapeForNode, makeKeywordVariantTracker, V2NodeIcon } from "@/components/lesson-v2/v2-node-icon";

const ASSETS = "/assets/reading-scene-sketch-v2";

// Same winding-trail offsets as v1/v2/v3 (path-screen.jsx, app/v3/page.js)
// - the visual system isn't versioned, only the content and its ordering
// are (docs/decisions/0057, following 0046's own precedent).
const WIND = [0, 40, 62, 40, 0, -40, -62, -40];

function characterPortrait(character) {
  return `${ASSETS}/characters/${character}/${character}_neutral.png`;
}

// Same "farthest-from-center" peak logic as app/v3/page.js's own
// peaksForSection - unchanged, just renamed since a v4 "section" spans a
// whole unit's worth of steps rather than one card's lesson nodes alone.
function peaksForUnit(startIndex, stepCount) {
  let maxAbs = 0;
  for (let i = 0; i < stepCount; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(WIND[(startIndex + i) % WIND.length]));
  }
  const peaks = [];
  for (let i = 0; i < stepCount; i++) {
    const w = WIND[(startIndex + i) % WIND.length];
    if (Math.abs(w) === maxAbs) peaks.push({ localIndex: i, side: w > 0 ? "left" : "right" });
  }
  return peaks;
}

// .v2-companion's own fixed width/ratio (app/v3/page.js's own constant,
// reused verbatim here too).
const COMPANION_HEIGHT = 108 * (1456 / 813);

// v4's own path (docs/decisions/0057) - alternates Story mode's narrative
// chapters with v4's own regrouped lesson content, unit by unit. Reuses
// v3's trail markup/CSS wholesale (.trail, .v2-*) for the lesson nodes and
// companion art, plus a new .v4-character-shape for the narrative nodes -
// "a new icon that is more dramatic," per Simon's own brief, rather than
// forcing a start/end narrative node through the existing circle/hex/
// square/oct lesson shapes, which were never meant to represent a scene.
export default function V4Path() {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [companionTop, setCompanionTop] = useState({});
  const trailRefs = useRef({});
  const peakRefs = useRef({});

  useLayoutEffect(() => {
    function measure() {
      const next = {};
      for (const key of Object.keys(peakRefs.current)) {
        const peakEl = peakRefs.current[key];
        const unitKey = key.split("::")[0];
        const containerEl = trailRefs.current[unitKey];
        if (!peakEl || !containerEl) continue;
        const peakRect = peakEl.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();
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

  const toggle = (unitKey) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(unitKey) ? next.delete(unitKey) : next.add(unitKey);
      return next;
    });

  let index = -1;

  return (
    <main className="shell starfield">
      <div className="trail">
        {UNITS.map((unit) => {
          const unitKey = `u${unit.unit}`;
          const shut = collapsed.has(unitKey);
          const steps = stepsForUnit(unit);
          const cardKey = SECTIONS.find((s) => s.slug === unit.cardSlug)?.data.cardKey;
          const keywordVariant = makeKeywordVariantTracker();
          const peaks = peaksForUnit(index + 1, steps.length);
          const peaksByLocalIndex = new Map(peaks.map((p) => [p.localIndex, p.side]));

          return (
            <section key={unitKey}>
              <button
                type="button"
                className={shut ? "trail-unit is-shut" : "trail-unit"}
                onClick={() => toggle(unitKey)}
                aria-expanded={!shut}
                aria-controls={`v4-${unitKey}-steps`}
              >
                <span className="trail-unit-index">Unit {unit.unit}</span>
                <span className="trail-unit-name">{unit.title}</span>
                <span className="trail-chevron" aria-hidden="true" />
              </button>

              <div
                className="v2-section-trail"
                hidden={shut}
                ref={(el) => (trailRefs.current[unitKey] = el)}
              >
                {peaks.map((peak, peakIndex) => {
                  const key = `${unitKey}::${peak.localIndex}`;
                  // The first companion art in a unit is the card itself
                  // (Simon's own call) - introduces which card this unit
                  // teaches before the reader even reaches its lesson
                  // nodes. Any later peak in the same unit stays the
                  // character portrait, same as before.
                  const isCard = peakIndex === 0;
                  return (
                    <span
                      key={key}
                      className={`v2-companion${isCard ? "" : " is-character"} is-${peak.side}`}
                      style={companionTop[key] != null ? { top: `${companionTop[key]}px` } : undefined}
                      aria-hidden="true"
                    >
                      <img src={isCard ? masterForKey(cardKey) : characterPortrait(unit.character)} alt="" />
                    </span>
                  );
                })}

                <ol className="trail-steps" id={`v4-${unitKey}-steps`}>
                  {steps.map((step, i) => {
                    index += 1;
                    const style = { "--x": `${WIND[index % WIND.length]}px` };
                    const isCurrent = index === 0;
                    const peakSide = peaksByLocalIndex.get(i);
                    const peakRef = peakSide
                      ? (el) => (peakRefs.current[`${unitKey}::${i}`] = el)
                      : undefined;

                    if (step.kind === "character") {
                      return (
                        <li key={step.key}>
                          <Link
                            className={`trail-step v4-character-step${isCurrent ? " is-current" : ""}`}
                            href={step.href}
                            style={style}
                          >
                            <span ref={peakRef} className="v4-character-shape">
                              <img src={characterPortrait(step.character)} alt="" />
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
                            <span className="trail-label">{step.label}</span>
                          </Link>
                        </li>
                      );
                    }

                    const shape = shapeForNode(step.node);
                    const variant = shape === "circle" ? keywordVariant(step.node) : null;
                    return (
                      <li key={step.key}>
                        <Link
                          className={`trail-step v2-step${isCurrent ? " is-current" : ""}`}
                          href={step.href}
                          style={style}
                        >
                          <span ref={peakRef} className={`v2-shape v2-shape-${shape}`}>
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
                          <span className="trail-label">{step.label}</span>
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
    </main>
  );
}
