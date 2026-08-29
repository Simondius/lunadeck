"use client";

import Link from "next/link";

// Spec_MainPath Section 7. Shown once, between the last node of a section and
// its completion screen, only when something was missed on the first attempt.
//
// The copy is deliberately not a correction. "Let's lock that in", not "you
// got these wrong" — this is the step that finishes the learning, and the
// curriculum's own definition of a genuine exposure (Curriculum Design Spec
// 5.1) is why every missed exercise is replayed rather than a sampled one.
export default function Bridge({ count, subject, onReview }) {
  return (
    <main className="complete is-bridge">
      <Link className="bridge-quit" href="/" aria-label="Leave lesson">
        ✕
      </Link>

      <div className="bridge-glyph" aria-hidden="true" />

      <span className="complete-eyebrow">Second look</span>
      <h1 className="complete-title">Let&rsquo;s lock that in</h1>

      <p className="complete-body">
        {count === 1
          ? `You missed one question on ${subject} — let's take another look at it before you finish.`
          : `You missed ${count} questions on ${subject} — let's take another look at each one.`}
      </p>

      <footer className="footer">
        <button className="action" onClick={onReview} type="button">
          {count === 1 ? "Review it" : "Review them"}
        </button>
        <Link className="action-quiet" href="/">
          Leave without finishing
        </Link>
      </footer>
    </main>
  );
}
