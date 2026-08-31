"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/components/use-progress";
import Flame from "@/components/flame";
import { knownCardKeys, setDisplayName } from "@/lib/progress";

// The Social tab.
//
// Scaffolding, and honest about it. There are no accounts and no server, so
// there is no friend graph to draw and nothing another learner could have done
// for this screen to report. What is real is the profile block: the card and
// path numbers are the learner's own, computed the same way the deck and path
// compute them.
//
// Everything else is space kept, with an empty state that says what it is
// waiting for. The alternative — a list of invented friends doing invented
// things — is the disabled "Ask a question" button 0025 inherited, at greater
// scale. See docs/decisions/0034.
export default function SocialScreen({ sections, totalCards, totalNodes, activity = [] }) {
  const progress = useProgress();

  const known = useMemo(
    () => knownCardKeys(progress, sections),
    [progress, sections]
  );
  const completedNodes = progress.completedNodeIds.length;
  const pathPercent = totalNodes ? Math.round((completedNodes / totalNodes) * 100) : 0;

  return (
    <main className="shell starfield">
      <header className="statusbar">
        <div>
          <span className="statusbar-where">Social</span>
        </div>
      </header>

      <div className="statusrule" />

      <h1 className="sr-only">Social</h1>

      <ProfileCard
        name={progress.displayName}
        known={known.size}
        totalCards={totalCards}
        pathPercent={pathPercent}
        streak={progress.streakDays}
      />

      <section className="feed">
        {/* The way into managing friends sits on the section heading rather
            than under the feed. Below it, a learner with a lot of friends
            would have to scroll past all of them to reach the control that
            manages them — the more friends, the harder to find, which is
            backwards. Here it stays put however long the feed grows. */}
        <p className="suit-head feed-head">
          <span>Friends&rsquo; activity</span>
          <Link className="feed-manage" href="/social/friends">
            Manage &rarr;
          </Link>
        </p>

        {activity.length === 0 ? (
          <p className="feed-empty">
            Nothing here yet. When you have friends, what they finish and draw
            will show up here.
          </p>
        ) : (
          <>
            {activity.map((friend) => (
              <ActivityItem key={friend.id} friend={friend} />
            ))}

            {/* The feed is placeholder data and a teammate opening this app
                would otherwise have no way to know. Small enough not to spoil
                the look of the thing, plain enough to be believed. It goes
                when the data is real. */}
            <p className="feed-note">
              Sample activity. There are no accounts yet, so these people are
              not real.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

// One friend's daily draw: who, when, the three cards, and what it came to.
// The takeaway is the thing worth reading, so it sits under the cards at body
// size rather than being crushed into a caption.
//
// No label saying what kind of activity this is, because there is only one
// kind. The daily draw is always three cards, so "drew three" was describing
// the picture directly underneath it.
function ActivityItem({ friend }) {
  return (
    <article className="activity">
      <header className="activity-head">
        <div className="activity-avatar">
          <img src={friend.avatar} alt="" />
        </div>
        <div className="activity-who">
          <span className="activity-name">{friend.name}</span>
          <span className="activity-when">{friend.when}</span>
        </div>
        {/* Their streak, which the friends list already showed and the feed
            did not. Same chip as the path and the profile, so the number means
            the same thing wherever it turns up. */}
        {friend.streak ? (
          <div
            className="streak activity-streak"
            role="img"
            aria-label={`${friend.streak} day streak`}
          >
            <Flame />
            <span className="streak-count">{friend.streak}</span>
          </div>
        ) : null}
      </header>

      <div className="activity-cards">
        {friend.cards.map((card) => (
          <figure key={card.key} className="activity-card">
            <div className="activity-art">
              <img
                src={card.master}
                alt={card.name}
                className={card.reversed ? "is-reversed" : undefined}
              />
            </div>
            <figcaption>{card.name}</figcaption>
          </figure>
        ))}
      </div>

      <p className="activity-takeaway">{friend.takeaway}</p>
    </article>
  );
}

function ProfileCard({ name, known, totalCards, pathPercent, streak }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? "");

  const save = (event) => {
    event.preventDefault();
    setDisplayName(draft);
    setEditing(false);
  };

  return (
    <section className="profile">
      {/* A card avatar rather than a photograph: the crops already exist, it
          suits the app, and it makes no promise of an upload that has nowhere
          to upload to. */}
      <div className="profile-avatar">
        <img src="/assets/cards/avatar/major_00_fool_avatar.png" alt="" />
      </div>

      {editing ? (
        <form className="profile-name-edit" onSubmit={save}>
          <label className="sr-only" htmlFor="display-name">
            Your name
          </label>
          <input
            id="display-name"
            className="ask-field is-inline"
            value={draft}
            maxLength={24}
            autoFocus
            placeholder="Your name"
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="action-quiet" type="submit">
            Save
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="profile-name"
          onClick={() => {
            setDraft(name ?? "");
            setEditing(true);
          }}
        >
          {name ?? "Add your name"}
        </button>
      )}

      {/* The same two numbers the deck and the path already show, computed the
          same way, so a learner never sees this screen disagree with those. */}
      <dl className="profile-stats">
        <div>
          <dt>Cards known</dt>
          <dd>
            {known} <span>/ {totalCards}</span>
          </dd>
        </div>
        <div>
          <dt>Path</dt>
          <dd>
            {pathPercent}
            {/* Its own class because the sibling stat's "/ 78" gets its gap
                from a literal space in the text, and this one had none at all:
                a 12px mono percent sign against a 24px display digit was
                touching it. */}
            <span className="stat-unit">%</span>
          </dd>
        </div>
        {/* The flame comes with it rather than the word "days": it is the same
            mark the path uses for the same number, and a streak read as a bare
            digit next to two other bare digits stops looking like a streak. */}
        <div>
          <dt>Streak</dt>
          <dd className="profile-streak">
            <Flame />
            {streak}
          </dd>
        </div>
      </dl>
    </section>
  );
}
