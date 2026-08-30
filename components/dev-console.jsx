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

function defaultPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 };
  // Bottom-right, clear of the tab bar.
  return { x: window.innerWidth - 76, y: window.innerHeight - 170 };
}

function loadPosition() {
  if (typeof window === "undefined") return defaultPosition();
  try {
    const raw = window.localStorage.getItem(POSITION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
      return parsed;
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
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;
    setPosition({
      x: Math.min(Math.max(0, drag.current.originX + dx), maxX),
      y: Math.min(Math.max(0, drag.current.originY + dy), maxY),
    });
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
