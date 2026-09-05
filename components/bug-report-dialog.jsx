"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeNodeSkip } from "@/lib/dev-console-bridge";

// Full-screen tester bug report: opened from DevConsole (tap "Report a bug"
// in the menu, or shake the device straight into this). Captures a
// screenshot and "where they were" automatically, then asks for a
// reporter name and a description — typed or dictated — before filing it.
//
// Filed to app/api/feedback/route.js, which commits it as a file on the
// `bug-reports` branch of the repo rather than posting a GitHub Issue — see
// that route's own comment for why (short version: Claude's sandbox can
// read committed files here without a device link, but can't call the
// Issues API the same way).

const REPORTER_KEY = "lunadeck.reporter.v1";
const REPORTERS = ["Tia", "Simon", "Other"];

function loadRememberedReporter() {
  try {
    const stored = window.localStorage.getItem(REPORTER_KEY);
    return REPORTERS.includes(stored) ? stored : "";
  } catch {
    return "";
  }
}

function rememberReporter(name) {
  try {
    window.localStorage.setItem(REPORTER_KEY, name);
  } catch {
    // Blocked storage - just won't be remembered next time.
  }
}

export default function BugReportDialog({ onClose }) {
  const [reporter, setReporter] = useState("");
  const [text, setText] = useState("");
  const [screenshot, setScreenshot] = useState(null); // data URL, or null while capturing/unavailable
  const [screenshotStatus, setScreenshotStatus] = useState("capturing"); // capturing | ready | failed
  const [where, setWhere] = useState("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const recognitionRef = useRef(null);

  // Reporter default: remembered device, per the internal-testers-only
  // decision in claude/tester-feedback-architecture-spec.md — no login, so
  // "who is this" is just whoever last picked on this phone. IP-based
  // detection was considered and dropped (mobile carrier IPs rotate too
  // often to mean anything).
  useEffect(() => {
    setReporter(loadRememberedReporter());
  }, []);

  // "Where they were": the current node/segment label if a NodeSession is
  // mounted (lib/dev-console-bridge.js), else just the route. Read once at
  // open time — a bug report describes a moment, not a live view.
  useEffect(() => {
    const unsubscribe = subscribeNodeSkip((current) => {
      setWhere(current?.label || window.location.pathname);
    });
    unsubscribe();
  }, []);

  // Screenshot: html2canvas rasterizes the DOM as currently rendered. This
  // is an approximation of what's on screen, not a true pixel capture (it
  // can't see anything outside the page - browser chrome, OS overlays), but
  // it's what a tester was looking at when the report opened, dependency-free
  // otherwise (no getDisplayMedia permission prompt to fight through).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const html2canvas = (await import("html2canvas")).default;
        const target = document.querySelector(".app-frame") || document.body;
        const canvas = await html2canvas(target, {
          backgroundColor: null,
          logging: false,
          // Keep the file small — this rides in a JSON POST body and then a
          // GitHub commit, not a place to spend full device pixel ratio.
          scale: Math.min(window.devicePixelRatio || 1, 1.5),
        });
        if (cancelled) return;
        setScreenshot(canvas.toDataURL("image/png"));
        setScreenshotStatus("ready");
      } catch (err) {
        console.error("[bug-report] screenshot failed", err);
        if (!cancelled) setScreenshotStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  function toggleDictation() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let addition = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) addition += event.results[i][0].transcript;
      }
      if (addition) {
        setText((prev) => (prev ? `${prev.trim()} ${addition.trim()}` : addition.trim()));
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  useEffect(() => {
    // Stop dictation if the dialog unmounts mid-recording rather than leaving
    // a mic hot after the sheet is gone.
    return () => recognitionRef.current?.stop();
  }, []);

  async function submit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter: reporter || "Other",
          text: text.trim(),
          pathname: window.location.pathname,
          label: where,
          screenshotDataUrl: screenshotStatus === "ready" ? screenshot : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `Failed (${res.status}). Try again.`);
        setSubmitting(false);
        return;
      }
      rememberReporter(reporter || "Other");
      setDone(true);
      setTimeout(onClose, 1100);
    } catch (err) {
      console.error("[bug-report] submit failed", err);
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="bug-report-scrim" role="dialog" aria-modal="true" aria-label="Report a bug">
      <div className="bug-report-panel">
        <div className="bug-report-header">
          <span className="bug-report-title">REPORT A BUG</span>
          <button
            type="button"
            className="dev-console-minimize"
            aria-label="Close"
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {done ? (
          <p className="bug-report-done">Filed — thanks.</p>
        ) : (
          <>
            <div className="bug-report-screenshot">
              {screenshotStatus === "capturing" ? (
                <span className="bug-report-meta">Capturing screenshot…</span>
              ) : screenshotStatus === "ready" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={screenshot} alt="Screenshot of the app when this report was opened" />
              ) : (
                <span className="bug-report-meta">
                  Screenshot failed to capture — the report still files without it.
                </span>
              )}
            </div>

            <p className="bug-report-meta">Where: {where || "unknown"}</p>

            <label className="bug-report-label" htmlFor="bug-report-reporter">
              Reporter
            </label>
            <select
              id="bug-report-reporter"
              className="bug-report-select"
              value={reporter}
              onChange={(event) => setReporter(event.target.value)}
              disabled={submitting}
            >
              <option value="" disabled>
                Choose…
              </option>
              {REPORTERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <label className="bug-report-label" htmlFor="bug-report-text">
              What happened
            </label>
            <textarea
              id="bug-report-text"
              className="bug-report-textarea"
              rows={5}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type it, or tap the mic and say it"
              disabled={submitting}
            />

            {speechSupported ? (
              <button
                type="button"
                className={`bug-report-mic${listening ? " is-listening" : ""}`}
                onClick={toggleDictation}
                disabled={submitting}
              >
                {listening ? "● Listening… tap to stop" : "🎤 Dictate"}
              </button>
            ) : null}

            {error ? <p className="bug-report-error">{error}</p> : null}

            <div className="bug-report-actions">
              <button
                type="button"
                className="bug-report-cancel"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bug-report-submit"
                onClick={submit}
                disabled={submitting || !text.trim()}
              >
                {submitting ? "Filing…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
