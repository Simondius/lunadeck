"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Glyphs are CSS shapes rather than icon files — see .tab-glyph in globals.css.
const TABS = [
  { href: "/", label: "PATH", glyph: "" },
  { href: "/deck", label: "DECK", glyph: " is-deck" },
  // The daily draw lives inside this tab, so there is no separate Draw tab.
  // Trials is gone until the Challenge tab is actually wanted; its spec is
  // still in specs/ when it is.
  //
  // Labelled for the thing you get rather than the character who gives it:
  // the route stays /reader because renaming it would churn every link for a
  // string nobody sees in an app shell.
  { href: "/reader", label: "READING", glyph: " is-draw" },
  { href: "/guide", label: "GUIDE", glyph: " is-guide" },
  { href: "/social", label: "SOCIAL", glyph: " is-social" },
];

export default function TabBar() {
  const pathname = usePathname() ?? "/";

  // The lesson screen is full-bleed; the bar would sit over its footer.
  // v2 is exempted — its drag section has no fixed footer to collide with,
  // and Simon wants the bar reachable while iterating on it.
  if (pathname.includes("/play") && !pathname.startsWith("/v2")) return null;

  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/" || pathname.startsWith("/units")
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            className={active ? "tab is-active" : "tab"}
            href={tab.href}
            aria-current={active ? "page" : undefined}
          >
            {/* The wrapper is a fixed-height box and the glyph is centred in
                it, so the shapes can be whatever size each one needs without
                moving the label under it. See .tab-icon in globals.css. */}
            <span className="tab-icon" aria-hidden="true">
              <span className={`tab-glyph${tab.glyph}`} />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
