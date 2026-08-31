"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import Flame from "@/components/flame";

// Manage friends: the list, and a search for finding people in it.
//
// The friends are placeholder data from lib/demo-friends.js — see the header
// there. What is real is the learner's own row, which reads its progress and
// streak from the store like every other screen does.
//
// Row shape follows Spec_Meta_Hygiene_Systems §5.1 as written: avatar,
// username, a thin progress bar with the percentage, and the streak as a flame
// and a number, sorted by progress descending with the learner's own row in
// its natural position rather than pinned. The departures recorded in 0034 are
// about search and profile screens, not about how a row looks.
export default function FriendsScreen({ friends = [], totalNodes = 0 }) {
  const progress = useProgress();
  const [query, setQuery] = useState("");

  // Removals live in component state, not storage: there is no friend graph to
  // remove anyone from, so persisting a deletion of somebody who does not exist
  // would be inventing a second kind of fiction. They come back on reload, and
  // the note at the foot of the screen says the list is sample data.
  const [removed, setRemoved] = useState(() => new Set());

  // The friend a confirmation is open for, or null. A removal is destructive
  // and a row in a list is an easy mis-tap, so it takes a deliberate second
  // action on a surface of its own.
  //
  // An earlier cut put Remove and Cancel inline in the row. Two touches, but
  // both landed within a few pixels of the first, which is the shape of a
  // mis-tap rather than a guard against one. A dialog moves the decision
  // somewhere the finger is not already resting and names who is about to go.
  const [confirming, setConfirming] = useState(null);

  const rows = useMemo(() => {
    const mine = totalNodes
      ? Math.round((progress.completedNodeIds.length / totalNodes) * 100)
      : 0;

    const you = {
      id: "__you",
      name: progress.displayName ?? "You",
      avatar: "/assets/cards/avatar/major_00_fool_avatar.png",
      progress: mine,
      streak: progress.streakDays,
      isYou: true,
    };

    // §5.1 hides accounts at 0%, which would hide a learner from their own
    // list on day one. The rule reads as being about other people cluttering a
    // global list, so it is applied to friends and not to you.
    return [...friends.filter((f) => !removed.has(f.id)), you].sort(
      (a, b) => b.progress - a.progress
    );
  }, [friends, progress, totalNodes, removed]);

  const term = query.trim().toLowerCase();
  const matches = term
    ? rows.filter((row) => row.name.toLowerCase().includes(term))
    : rows;

  return (
    <main className="shell starfield">
      <Link className="backlink" href="/social">
        &larr; Social
      </Link>

      <div className="masthead">
        <h1 className="unit-title">Friends</h1>
      </div>

      <label className="sr-only" htmlFor="friend-search">
        Search for someone
      </label>
      <input
        id="friend-search"
        className="ask-field is-inline"
        type="search"
        value={query}
        placeholder="Search by name"
        onChange={(event) => setQuery(event.target.value)}
      />

      {matches.length === 0 ? (
        <p className="feed-empty">Nobody matching &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="friend-list">
          {matches.map((row) => (
            <li key={row.id} className="friend-row">
              <div className="friend-avatar">
                <img src={row.avatar} alt="" />
              </div>

              <div className="friend-main">
                <span className="friend-name">
                  {row.name}
                  {row.isYou ? <span className="friend-you">(you)</span> : null}
                </span>
                <div className="friend-bar">
                  <div
                    className="friend-bar-fill"
                    style={{ width: `${row.progress}%` }}
                  />
                </div>
              </div>

              <span className="friend-percent">{row.progress}%</span>

              <span
                className="streak friend-streak"
                role="img"
                aria-label={`${row.streak} day streak`}
              >
                <Flame />
                <span className="streak-count">{row.streak}</span>
              </span>

              {/* No way to remove yourself. */}
              {row.isYou ? null : (
                <button
                  type="button"
                  className="friend-remove"
                  aria-label={`Remove ${row.name}`}
                  onClick={() => setConfirming(row)}
                >
                  &times;
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="feed-note">
        Sample list. There are no accounts yet, so everyone here but you is made
        up, and anyone you remove is back on the next load.
      </p>

      {confirming ? (
        <ConfirmRemove
          friend={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            setRemoved((current) => new Set(current).add(confirming.id));
            setConfirming(null);
          }}
        />
      ) : null}
    </main>
  );
}

// The one screen between a stray tap and losing somebody.
//
// Cancel takes focus on open, not Remove, so a stray Enter or Space closes the
// dialog rather than completing the thing it exists to guard. Escape and the
// backdrop both cancel, for the same reason: every accidental way out is the
// safe one.
function ConfirmRemove({ friend, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);

    // Nothing behind the dialog scrolls while it is open, the same lock the
    // card reveal uses.
    document.body.classList.add("is-revealing");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-revealing");
    };
  }, [onCancel]);

  return (
    <div className="confirm-scrim" onClick={onCancel} role="presentation">
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        // The panel is inside the scrim, so a tap on it would otherwise
        // bubble up and cancel.
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-avatar">
          <img src={friend.avatar} alt="" />
        </div>

        <h2 className="confirm-title" id="confirm-title">
          Remove {friend.name}?
        </h2>

        <p className="confirm-body">
          They will come off your friends list and you will stop seeing their
          daily draw. You can add them again later.
        </p>

        <div className="confirm-actions">
          <button
            type="button"
            className="action confirm-remove"
            onClick={onConfirm}
          >
            Remove
          </button>
          <button
            type="button"
            className="action-quiet"
            ref={cancelRef}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
