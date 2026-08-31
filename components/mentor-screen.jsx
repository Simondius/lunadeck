// The Mentor tab.
//
// The character who used to front the Reading tab lives here now. Nothing else
// yet, deliberately: the art is placed and what the mentor actually does is
// still open. Kept honest rather than dressed up — a screen that pretends to
// offer something it cannot do is worse than one that says it is not built,
// which is the lesson from the disabled "Ask a question" button the Reading
// tab used to carry.
export default function MentorScreen() {
  return (
    <main className="shell starfield is-greeting">
      <header className="statusbar">
        <div>
          <span className="statusbar-where">Mentor</span>
        </div>
      </header>

      <div className="statusrule" />

      <div className="reader-greeting">
        <h1 className="sr-only">Mentor</h1>

        <div className="reader-portrait">
          <img src="/assets/misc/reader.webp" alt="" />
        </div>

        <p className="reader-intro">Not built yet.</p>
      </div>
    </main>
  );
}
