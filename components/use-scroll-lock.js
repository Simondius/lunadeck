"use client";

import { useEffect } from "react";

// Hold the page still while something covers it.
//
// The class is `is-revealing` and the rule is one line in globals.css; what
// this is really for is making sure the fourth thing that covers the screen
// does not forget. Without it the page keeps scrolling under an open dialog,
// which reads as the app having lost track of where you are.
//
// card-reveal.jsx and friends-screen.jsx set the same class inline, each
// inside an effect that is already doing something else, and are deliberately
// left alone rather than churned. Anything new that covers the screen should
// use this instead of adding a fourth copy.
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    document.body.classList.add("is-revealing");
    return () => document.body.classList.remove("is-revealing");
  }, [active]);
}
