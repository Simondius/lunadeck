"use client";

import { useEffect, useRef, useState } from "react";
import { unlockAll, reset } from "@/lib/progress";
import { subscribeNodeSkip } from "@/lib/dev-console-bridge";
import BugReportDialog from "@/components/bug-report-dialog";

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

// Shake-to-open: on a phone the console is otherwise a small "DEV" chip a
// tester has to go hunting for. A shake is deliberately vigorous, so this
// only needs to reject one hard jolt (a bump, sitting down) — three jolts in
// quick succession is a shake, one is an accident.
const SHAKE_ACCEL_THRESHOLD = 18; // m/s^2 delta between two consecutive readings
const SHAKE_HITS_NEEDED = 3;
const SHAKE_WINDOW_MS = 1000;

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
  //
  // Below 900px .app-frame carries no transform (see "desktop framing" in
  // globals.css) - it isn't the fixed-positioning containing block there,
  // it's just a plain wrapper as tall as everything inside it, which on a
  // long single-scroll page (the v4 path) can run tens of thousands of
  // pixels. Clamping to whichever is smaller keeps the desktop case (the
  // frame IS genuinely capped there, per its own min(940px, 94dvh)) intact
  // while stopping the console from defaulting to a Y thousands of pixels
  // down an unrelated page's own content height.
  return {
    width: Math.min(rect?.width || window.innerWidth || 0, window.innerWidth || Infinity),
    height: Math.min(rect?.height || window.innerHeight || 0, window.innerHeight || Infinity),
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
  // Starts minimized (0083: "default the dev console to the circle up top
  // right until opened") - stays that way through the server render and
  // first paint, same reasoning as `position` above, then the effect below
  // reads back an explicit saved preference if one exists.
  const [minimized, setMinimized] = useState(true);
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
  // Full-screen dialog (components/bug-report-dialog.jsx), independent of
  // `open`/`openGroup` above - it can be launched straight from a shake
  // without the accordion menu ever opening, and stays open regardless of
  // what the accordion is doing underneath it.
  const [showBugReport, setShowBugReport] = useState(false);
  const drag = useRef(null);

  // Room the console has to leave for its wings right now.
  const wings = skip ? SKIP_WING : 0;

  useEffect(() => {
    setPosition(loadPosition());
    try {
      // No stored preference yet -> stays minimized (the new default).
      // An explicit "0" (someone previously expanded it and it stuck)
      // still wins, so restoring an already-open console isn't this
      // change's problem to solve.
      const stored = window.localStorage.getItem(MINIMIZED_KEY);
      setMinimized(stored === null ? true : stored === "1");
    } catch {
      // Blocked storage - stays minimized, the new default.
    }
  }, []);

  useEffect(() => subscribeNodeSkip(setSkip), []);

  // Shake-to-open. iOS 13+ only hands out motion data after an explicit,
  // gesture-triggered permission grant — it can't be requested on mount, only
  // in direct response to a tap. So on iOS this waits for the very first tap
  // anywhere on the page, asks then, and starts listening only if granted.
  // Everywhere else (Android, desktop, older iOS) there's no such gate and it
  // just starts listening.
  useEffect(() => {
    if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") {
      return;
    }

    let lastAccel = null;
    let hits = [];

    function onMotion(event) {
      const a = event.accelerationIncludingGravity || event.acceleration;
      if (!a || a.x === null || a.x === undefined) return;
      if (lastAccel) {
        const delta =
          Math.abs(a.x - lastAccel.x) +
          Math.abs(a.y - lastAccel.y) +
          Math.abs(a.z - lastAccel.z);
        if (delta > SHAKE_ACCEL_THRESHOLD) {
          const now = Date.now();
          hits = [...hits.filter((t) => now - t < SHAKE_WINDOW_MS), now];
          if (hits.length >= SHAKE_HITS_NEEDED) {
            hits = [];
            // "Same as tapping the icon" (unminimize) plus going straight
            // into Report Bug, per Simon: shake is the tester's shortcut
            // past hunting for the small DEV chip AND past the menu.
            setMinimizedPersisted(false);
            setShowBugReport(true);
          }
        }
      }
      lastAccel = { x: a.x, y: a.y, z: a.z };
    }

    function startListening() {
      window.addEventListener("devicemotion", onMotion);
    }

    const needsPermission = typeof DeviceMotionEvent.requestPermission === "function";

    if (!needsPermission) {
      startListening();
      return () => window.removeEventListener("devicemotion", onMotion);
    }

    function onFirstTap() {
      DeviceMotionEvent.requestPermission()
        .then((state) => {
          if (state === "granted") startListening();
        })
        .catch(() => {
          // Denied, or the browser lied about supporting it — shake just
          // won't trigger on this device; the mini DEV button still does.
        });
    }
    window.addEventListener("pointerdown", onFirstTap, { once: true });

    return () => {
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("pointerdown", onFirstTap);
    };
  }, []);

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
          <button
            type="button"
            className="dev-console-report-bug"
            onClick={() => {
              setShowBugReport(true);
              setOpen(false);
              setOpenGroup(null);
            }}
          >
            Report a bug
          </button>
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
      {showBugReport ? (
        <BugReportDialog onClose={() => setShowBugReport(false)} />
      ) : null}
    </div>
  );
}
