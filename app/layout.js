import "./globals.css";
import TabBar from "@/components/tabbar";
import DevConsole from "@/components/dev-console";
import { getPath } from "@/lib/data";

export const metadata = {
  title: "Lunadeck",
  description: "Learn to read tarot, one card at a time.",
};

export default async function RootLayout({ children }) {
  // Only fetched for the dev console's "unlock all" — every section's node
  // ids, flattened. Cheap: it's the same curriculum read the path screen
  // already does.
  const entries = await getPath();
  const allNodeIds = entries
    .filter((entry) => entry.type === "section")
    .flatMap((entry) => entry.nodeIds);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* On a wide window this becomes the device frame; below 900px it is
            an inert wrapper. See "desktop framing" in globals.css. */}
        <div className="app-frame">
          {/* The scroller sits inside the frame, never is the frame — see
              "desktop framing" in globals.css. */}
          <div className="app-scroll">{children}</div>
          <TabBar />
          {/* Lives inside the frame, alongside TabBar, so it pins to the
              device illusion on a wide window rather than floating loose in
              the browser chrome around it — see "desktop framing" above. */}
          {/* Unconditional, on purpose: this used to gate on NODE_ENV, then
              on a NEXT_PUBLIC_SHOW_DEV_CONSOLE env var — both meant testers,
              who only ever see the production deployment, needed a Vercel
              setting flipped (and a redeploy) before they could see it at
              all. Per Simon: testers are internal and trusted, so it just
              always renders now — no env var, nothing to flip. Revisit if
              this ever ships somewhere untrusted (see "Deferred: access
              control" in claude/tester-feedback-architecture-spec.md). */}
          <DevConsole allNodeIds={allNodeIds} />
        </div>
      </body>
    </html>
  );
}
