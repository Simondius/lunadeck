import { UNITS } from "@/data/journey/units";
import JourneyHomeScreen from "@/components/journey/journey-home-screen";

// Used to redirect straight into the first unit's beat player - Simon's
// 0906 follow-up replaces that with a stop-first preview screen (two
// overlapping cards + a "Continue Journey" button, see
// journey-home-screen.jsx), so this is where "which unit next" logic will
// eventually pick UNITS[0] vs. the first not-yet-completed one, same as
// the redirect it replaced.
export default function JourneyHome() {
  return <JourneyHomeScreen unit={UNITS[0]} />;
}
