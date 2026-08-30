"use client";

import { useEffect, useRef, useState } from "react";
import { unlockAll, reset } from "@/lib/progress";

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
];

// The button is 52px; onPointerMove already keeps a drag inside
// [0, innerWidth - FAB_INSET]. Everything else that produces a position has
// to pass through clamp() for the same guarantee.
const FAB_INSET = 56;

// Both of these are read at a moment when the window may report zero
// dimensions — a background tab, a pane that has not been laid out yet. Left
// ungrounded, `innerWidth - 76` is then -76, which is a real position, off
// the top-left of the screen, and it gets persisted. The console is then
// invisible forever, on every later load, at any window size.
function clamp({ x, y }) {
  const maxX = Math.max(0, (window.innerWidth || 0) - FAB_INSET);
  const maxY = Math.max(0, (window.innerHeight || 0) - FAB_INSET);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

function defaultPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 };
  // Bottom-right, clear of the tab bar.
  return clamp({ x: window.innerWidth - 76, y: window.innerHeight - 170 });
}

// A remembered spot is clamped too, not just trusted. It may have been saved
// at a window size this one is smaller than, or saved before the window had a
// size at all — either way the console has to come back on screen rather than
// stay lost with no way to reach the control that would move it.
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
  const drag = useRef(null);

  useEffect(() => {
    setPosition(loadPosition());
  }, []);

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
      clamp({ x: drag.current.originX + dx, y: drag.current.originY + dy })
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
              {group.actions.map((action) => (
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
    </div>
  );
}
