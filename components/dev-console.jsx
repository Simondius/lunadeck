"use client";

import { useEffect, useRef, useState } from "react";
import { unlockAll, reset } from "@/lib/progress";
import { subscribeNodeSkip } from "@/lib/dev-console-bridge";
import { CHAPTERS } from "@/data/story/chapters";

// A floating, draggable debug overlay — deliberately styled as tooling, not
// app UI, so it never reads as part of Lunadeck itself. Menu items are
// grouped so more groups can be added later without reshaping this.
//
// Tap opens/closes the menu. Press-and-drag moves the button — the two are
// told apart by movement: a press that never travels past DRAG_THRESHOLD
// resolves as a tap on release; the moment it does travel, it becomes a drag
// and the eventual release does nothing but drop the button in place.
const DRAG_THRESHOLD = 6;
const POSITION_KEY = "lunadeck.devconsole.pos.v1";
// Persisted separately from position (0056: "add an option... to close it
// and reduce it's size... move it to the top right corner") - minimizing
// doesn't forget the FAB's own dragged spot, it just replaces it with a
// small fixed icon until restored.
const MINIMIZED_KEY = "lunadeck.devconsole.minimized.v1";

const MENU = [
  {
    group: "Path",
    subgroups: [
      {
        label: "Progress",
        actions: [
          {
            label: "Unlock all",
            run: (allNodeIds) => unlockAll(allNodeIds),
          },
          {
            label: "Reset",
            run: () => reset(),
          },
        ],
      },
      {
        label: "Content",
        actions: [
          {
            // v3 is the default curriculum now (Simon's call, 31 Aug) — the
            // tab bar's own Path tab already goes there. v1 and v2 both stay
            // reachable here for whoever wants either earlier shape.
            label: "v1 (original curriculum)",
            run: () => {
              window.location.href = "/v1";
            },
          },
          {
            label: "v2 (five cards, original order)",
            run: () => {
              window.location.href = "/v2";
            },
          },
          {
            label: "v3 (resequenced, default)",
            run: () => {
              window.location.href = "/v3";
            },
          },
        ],
      },
    ],
  },
  {
    // A separate top-level group, not a Path subgroup - Story isn't a
    // curriculum variant, it's its own linear narrative mode (0048), so it
    // sits beside Path rather than under it.
    group: "Story",
    subgroups: [
      {
        label: "Chapters",
        // One button per chapter, not one link to the index (0052) - the
        // index is one tap away regardless, and jumping straight into a
        // specific chapter is the actual dev workflow this exists for.
        actions: CHAPTERS.map((c) => ({
          label: `${c.partLabel}: ${c.data.title}`,
          run: () => {
            window.location.href = `/story/play/${c.slug}`;
          },
        })),
      },
    ],
  },
];

// The button is 52px; every position it can be given has to leave that much
// room inside its box.
const FAB_INSET = 56;

// The skip controls hang outside the FAB — 40px wide plus an 8px margin on
// each side, per .dev-console-skip. They are positioned against the console
// rather than carrying their own coordinates, so clamping the console alone
// is not enough: at either edge one wing lands off the frame. Measured at
// left: -48 with the console parked at x: 0.
const SKIP_WING = 48;

// The box a position is measured against — and it is NOT the viewport.
//
// The console is `position: fixed`, but it lives inside `.app-frame`, which
// carries a transform. Any non-`none` transform makes that element the
// containing block for fixed descendants, so `left: 1074px` means 1074px from
// the frame's left edge, not the window's. On a wide desktop window the frame
// is a centred phone about 428px across, so clamping against `innerWidth`
// permits an x of ~1094 that renders ~360px off the right of the screen —
// which is exactly how the console went missing.
//
// The frame placement is deliberate (see app/layout.js): the console pins to
// the device illusion rather than floating in the browser chrome around it.
// So measure the frame, not the window.
function frameBox() {
  const frame = document.querySelector(".app-frame");
  const rect = frame?.getBoundingClientRect();
  // Falls back to the window if the frame is missing or has not been laid out
  // yet. Zero is guarded either way: a window reporting no dimensions — a
  // background tab, a pane mid-init — would otherwise yield a negative
  // default that gets persisted and never recovers.
  return {
    width: rect?.width || window.innerWidth || 0,
    height: rect?.height || window.innerHeight || 0,
  };
}

// `wings` is the room needed either side of the FAB for whatever is attached
// to it. Zero when nothing is.
function clamp({ x, y }, wings = 0) {
  const { width, height } = frameBox();
  const minX = wings;
  const maxX = Math.max(minX, width - FAB_INSET - wings);
  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(0, y), Math.max(0, height - FAB_INSET)),
  };
}

function defaultPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 };
  const { width, height } = frameBox();
  // Bottom-right of the frame, clear of the tab bar.
  return clamp({ x: width - 76, y: height - 170 });
}

// A remembered spot is clamped too, not just trusted. It may have been saved
// against a bigger frame, or at a window width where the frame was the whole
// screen, or before anything had a size at all — either way the console has to
// come back on screen rather than stay lost with no way to reach the one
// control that would move it.
function loadPosition() {
  if (typeof window === "undefined") return defaultPosition();
  try {
    const raw = window.localStorage.getItem(POSITION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
      return clamp(parsed);
    }
  } catch {
    // Blocked or corrupt storage — fall through to the default spot.
  }
  return defaultPosition();
}

export default function DevConsole({ allNodeIds = [] }) {
  // Stays null through the server render and first paint so there is no
  // hydration mismatch — the real, possibly-remembered spot arrives on the
  // first client tick, same pattern as useProgress.
  const [position, setPosition] = useState(null);
  const [open, setOpen] = useState(false);
  // Off (full FAB) until a saved "minimized" is read back, same as
  // `position` - nobody gets switched to the small icon just by this
  // shipping; it only persists once someone actually minimizes it.
  const [minimized, setMinimized] = useState(false);
  // Which top-level group (Path, Story, ...) is expanded, if any - an
  // accordion, not a checklist, since MENU only ever had one group until
  // Story joined it. Two groups both showing every subgroup and action at
  // once was fine at one group; it isn't once there's a second thing to
  // scroll past to reach it.
  const [openGroup, setOpenGroup] = useState(null);
  // Non-null only while a NodeSession is mounted somewhere - see
  // lib/dev-console-bridge.js. The < > buttons only render then; there's
  // nothing to skip through on any other screen.
  const [skip, setSkip] = useState(null);
  const drag = useRef(null);

  // Room the console has to leave for its wings right now.
  const wings = skip ? SKIP_WING : 0;

  useEffect(() => {
    setPosition(loadPosition());
    try {
      setMinimized(window.localStorage.getItem(MINIMIZED_KEY) === "1");
    } catch {
      // Blocked storage - stays the full FAB every load.
    }
  }, []);

  useEffect(() => subscribeNodeSkip(setSkip), []);

  function setMinimizedPersisted(value) {
    setMinimized(value);
    try {
      window.localStorage.setItem(MINIMIZED_KEY, value ? "1" : "0");
    } catch {
      // Blocked storage - just won't remember past this load.
    }
  }

  // The skip controls appear when a node session mounts, which can be long
  // after the console was parked. Re-clamp so neither wing hangs off the
  // frame — and return the same object when nothing moves, so React bails out
  // instead of looping.
  useEffect(() => {
    setPosition((current) => {
      if (!current) return current;
      const next = clamp(current, wings);
      return next.x === current.x && next.y === current.y ? current : next;
    });
  }, [wings]);

  useEffect(() => {
    if (!position) return;
    try {
      window.localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // Quota or blocked storage — it just won't remember where it was.
    }
  }, [position]);

  if (!position) return null;

  // Small and fixed, not draggable - the whole point is to be out of the
  // way (0056: "reduce it's size to a small icon the size of the icons
  // in the menu at the bottom and move it to the top right corner").
  // Tapping it just restores the full console at wherever it was parked.
  if (minimized) {
    return (
      <button
        type="button"
        className="dev-console-mini"
        aria-label="Open dev console"
        onClick={() => setMinimizedPersisted(false)}
      >
        DEV
      </button>
    );
  }

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  const onPointerMove = (event) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;
    if (!drag.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.current.moved = true;
    setPosition(
      clamp({ x: drag.current.originX + dx, y: drag.current.originY + dy }, wings)
    );
  };

  const endDrag = () => {
    if (drag.current && !drag.current.moved) {
      setOpen((v) => !v);
      setOpenGroup(null);
    }
    drag.current = null;
  };

  const runAction = (action) => {
    action.run(allNodeIds);
    setOpen(false);
    setOpenGroup(null);
  };

  return (
    <div
      className="dev-console"
      style={{ "--dc-x": `${position.x}px`, "--dc-y": `${position.y}px` }}
    >
      {open ? (
        <div className="dev-console-menu" role="menu">
          <div className="dev-console-menu-header">
            <span className="dev-console-menu-title">DEV</span>
            <button
              type="button"
              className="dev-console-minimize"
              aria-label="Minimize dev console"
              onClick={() => {
                setOpen(false);
                setOpenGroup(null);
                setMinimizedPersisted(true);
              }}
            >
              ✕
            </button>
          </div>
          {MENU.map((group) => {
            const expanded = openGroup === group.group;
            return (
            <div key={group.group} className="dev-console-group">
              <button
                type="button"
                className="dev-console-group-label"
                aria-expanded={expanded}
                onClick={() => setOpenGroup(expanded ? null : group.group)}
              >
                {group.group}
                <span className="dev-console-group-chevron" aria-hidden="true" />
              </button>
              {expanded
                ? group.subgroups.map((subgroup) => (
                <div key={subgroup.label} className="dev-console-subgroup">
                  <span className="dev-console-subgroup-label">{subgroup.label}</span>
                  {subgroup.actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      role="menuitem"
                      className="dev-console-action"
                      onClick={() => runAction(action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                  ))
                : null}
            </div>
            );
          })}
        </div>
      ) : null}
      {skip ? (
        <button
          type="button"
          className="dev-console-skip is-prev"
          aria-label="Previous segment"
          onClick={() => skip.onPrev()}
        >
          ‹
        </button>
      ) : null}
      <button
        type="button"
        className="dev-console-fab"
        aria-label="Dev console"
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        DEV
      </button>
      {skip ? (
        <button
          type="button"
          className="dev-console-skip is-next"
          aria-label="Next segment"
          onClick={() => skip.onNext()}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
