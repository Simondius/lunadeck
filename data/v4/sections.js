import fool from "./fool_section.json";
import lovers from "./lovers_section.json";
import empress from "./empress_section.json";
import magician from "./magician_section.json";
import emperor from "./emperor_section.json";
import highPriestess from "./high_priestess_section.json";
import hierophant from "./hierophant_section.json";
import chariot from "./chariot_section.json";
import strength from "./strength_section.json";
import hermit from "./hermit_section.json";
import wheelOfFortune from "./wheel_of_fortune_section.json";
import justice from "./justice_section.json";
import hangedMan from "./hanged_man_section.json";
import death from "./death_section.json";
import temperance from "./temperance_section.json";
import devil from "./devil_section.json";
import tower from "./tower_section.json";
import star from "./star_section.json";
import moon from "./moon_section.json";
import sun from "./sun_section.json";
import judgment from "./judgment_section.json";
import world from "./world_section.json";

// v4's own sections (docs/decisions/0057, 0078) - Fool/Lovers/Empress
// were generated once by scripts/build-v4-sections.mjs from data/v3's own
// content (collapsed to 7 nodes each, no rounds dropped), then hand-edited
// per docs/decisions/0066 and are no longer safe to regenerate - rerunning
// that script wipes those edits (0078 caught this the hard way). Magician
// and Emperor came from the same script, untouched since. Everything from
// High Priestess on was built fresh by scripts/build-v4-new-cards.mjs
// directly from the source CSVs, since no v3 section ever existed for
// them - their own "Find the Elements" node is a placeholder pending a
// separate element-extraction pass (0078).
export const SECTIONS = [
  { slug: "fool", data: fool },
  { slug: "lovers", data: lovers },
  { slug: "empress", data: empress },
  { slug: "magician", data: magician },
  { slug: "emperor", data: emperor },
  { slug: "high_priestess", data: highPriestess },
  { slug: "hierophant", data: hierophant },
  { slug: "chariot", data: chariot },
  { slug: "strength", data: strength },
  { slug: "hermit", data: hermit },
  { slug: "wheel_of_fortune", data: wheelOfFortune },
  { slug: "justice", data: justice },
  { slug: "hanged_man", data: hangedMan },
  { slug: "death", data: death },
  { slug: "temperance", data: temperance },
  { slug: "devil", data: devil },
  { slug: "tower", data: tower },
  { slug: "star", data: star },
  { slug: "moon", data: moon },
  { slug: "sun", data: sun },
  { slug: "judgment", data: judgment },
  { slug: "world", data: world },
];

export function getSection(slug) {
  return SECTIONS.find((s) => s.slug === slug) ?? null;
}

export function getNextSection(slug) {
  const i = SECTIONS.findIndex((s) => s.slug === slug);
  if (i === -1 || i + 1 >= SECTIONS.length) return null;
  const next = SECTIONS[i + 1];
  return { slug: next.slug, cardName: next.data.cardName };
}
