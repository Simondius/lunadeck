"use client";

import { useEffect, useRef, useState } from "react";
import { unlockAll, reset } from "@/lib/progress";
import { subscribeNodeSkip } from "@/lib/dev-console-bridge";

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
  // Non-null only while a NodeSession is mounted somewhere - see
  // lib/dev-console-bridge.js. The < > buttons only render then; there's
  // nothing to skip through on any other screen.
  const [skip, setSkip] = useState(null);
  const drag = useRef(null);

  // Room the console has to leave for its wings right now.
  const wings = skip ? SKIP_WING : 0;

  useEffect(() => {
    setPosition(loadPosition());
  }, []);

  useEffect(() => subscribeNodeSkip(setSkip), []);

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
    if (drag.current && !drag.current.moved) setOpen((v) => !v);
    drag.current = null;
  };

  const runAction = (action) => {
    action.run(allNodeIds);
    setOpen(false);
  };

  return (
    <div
      className="dev-console"
      style={{ "--dc-x": `${position.x}px`, "--dc-y": `${position.y}px` }}
    >
      {open ? (
        <div className="dev-console-menu" role="menu">
          {MENU.map((group) => (
            <div key={group.group} className="dev-console-group">
              <span className="dev-console-group-label">{group.group}</span>
              {group.subgroups.map((subgroup) => (
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
              ))}
            </div>
          ))}
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
