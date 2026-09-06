import { fool } from "./fool";

// One unit per path node. Build order follows Simon's "one unit at a time"
// instruction - Fool is the only one that exists so far.
export const UNITS = [fool];

export function getUnit(slug) {
  return UNITS.find((unit) => unit.slug === slug) || null;
}
