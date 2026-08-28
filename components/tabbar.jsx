"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Glyphs are CSS shapes rather than icon files — see .tab-glyph in globals.css.
const TABS = [
  { href: "/", label: "PATH", glyph: "" },
  { href: "/deck", label: "DECK", glyph: " is-deck" },
  { href: "/trials", label: "TRIALS", glyph: " is-trials" },
  { href: "/draw", label: "DRAW", glyph: " is-draw" },
];

export default function TabBar() {
  const pathname = usePathname() ?? "/";

  // The lesson screen is full-bleed; the bar would sit over its footer.
  if (pathname.includes("/play")) return null;

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
            <span className={`tab-glyph${tab.glyph}`} aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
