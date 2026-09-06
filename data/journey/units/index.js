import { fool } from "./fool";
import { magician } from "./magician";

// One unit per path node, in play order.
export const UNITS = [fool, magician];

export function getUnit(slug) {
  return UNITS.find((unit) => unit.slug === slug) || null;
}
