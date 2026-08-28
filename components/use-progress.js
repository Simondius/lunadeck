"use client";

import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, getServerSnapshot } from "@/lib/progress";

// Server render and first paint both use the empty state, so there is no
// hydration mismatch; the real numbers arrive on the first client tick.
export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
