import u1DaveStart from "./u1-dave-start.json";
import u1DaveEnd from "./u1-dave-end.json";
import u2RileyStart from "./u2-riley-start.json";
import u2RileyEnd from "./u2-riley-end.json";
import u3DaveStart from "./u3-dave-start.json";
import u3DaveEnd from "./u3-dave-end.json";
import u4RileyStart from "./u4-riley-start.json";
import u4RileyEnd from "./u4-riley-end.json";
import u5DaveStart from "./u5-dave-start.json";
import u5DaveEnd from "./u5-dave-end.json";
import u6RileyStart from "./u6-riley-start.json";
import u6RileyEnd from "./u6-riley-end.json";
import u7DaveStart from "./u7-dave-start.json";
import u7DaveEnd from "./u7-dave-end.json";
import u8RileyStart from "./u8-riley-start.json";
import u8RileyEnd from "./u8-riley-end.json";
import u9DaveStart from "./u9-dave-start.json";
import u9DaveEnd from "./u9-dave-end.json";
import u10RileyStart from "./u10-riley-start.json";
import u10RileyEnd from "./u10-riley-end.json";
import u11DaveStart from "./u11-dave-start.json";
import u11DaveEnd from "./u11-dave-end.json";
import u12RileyStart from "./u12-riley-start.json";
import u12RileyEnd from "./u12-riley-end.json";
import u13DaveStart from "./u13-dave-start.json";
import u13DaveEnd from "./u13-dave-end.json";
import u14RileyStart from "./u14-riley-start.json";
import u14RileyEnd from "./u14-riley-end.json";
import u15DaveStart from "./u15-dave-start.json";
import u15DaveEnd from "./u15-dave-end.json";
import u16RileyStart from "./u16-riley-start.json";
import u16RileyEnd from "./u16-riley-end.json";
import u17DaveStart from "./u17-dave-start.json";
import u17DaveEnd from "./u17-dave-end.json";
import u18RileyStart from "./u18-riley-start.json";
import u18RileyEnd from "./u18-riley-end.json";
import u19DaveStart from "./u19-dave-start.json";
import u19DaveEnd from "./u19-dave-end.json";
import u20RileyStart from "./u20-riley-start.json";
import u20RileyEnd from "./u20-riley-end.json";
import u21DaveStart from "./u21-dave-start.json";
import u21DaveEnd from "./u21-dave-end.json";
import u22RileyStart from "./u22-riley-start.json";
import u22RileyEnd from "./u22-riley-end.json";
import u23DaveStart from "./u23-dave-start.json";
import u23DaveEnd from "./u23-dave-end.json";
import u24RileyStart from "./u24-riley-start.json";
import u24RileyEnd from "./u24-riley-end.json";
import u25DaveStart from "./u25-dave-start.json";
import u25DaveEnd from "./u25-dave-end.json";
import u26RileyStart from "./u26-riley-start.json";
import u26RileyEnd from "./u26-riley-end.json";
import u27DaveStart from "./u27-dave-start.json";
import u27DaveEnd from "./u27-dave-end.json";

// v4's own narrative nodes (docs/decisions/0057) - a start/end pair per
// unit, each playable through the same ChapterPlayer engine originally
// built for the standalone Story mode this file used to also index
// (0048-0056, removed 0083 once v4 became the app's only path - Story's
// own player and route live on as v4's narrative-node engine). A unit's
// start node is followed by lesson nodes before its end node, so "what
// comes next" for one of these isn't just "the next entry in this array" -
// app/story/play/[chapter]/page.js computes that from data/v4/units.js's
// own real path sequence instead (docs/decisions/0064).
export const V4_CHAPTERS = [
  { slug: "u1-dave-start", data: u1DaveStart },
  { slug: "u1-dave-end", data: u1DaveEnd },
  { slug: "u2-riley-start", data: u2RileyStart },
  { slug: "u2-riley-end", data: u2RileyEnd },
  { slug: "u3-dave-start", data: u3DaveStart },
  { slug: "u3-dave-end", data: u3DaveEnd },
  { slug: "u4-riley-start", data: u4RileyStart },
  { slug: "u4-riley-end", data: u4RileyEnd },
  { slug: "u5-dave-start", data: u5DaveStart },
  { slug: "u5-dave-end", data: u5DaveEnd },
  { slug: "u6-riley-start", data: u6RileyStart },
  { slug: "u6-riley-end", data: u6RileyEnd },
  { slug: "u7-dave-start", data: u7DaveStart },
  { slug: "u7-dave-end", data: u7DaveEnd },
  { slug: "u8-riley-start", data: u8RileyStart },
  { slug: "u8-riley-end", data: u8RileyEnd },
  { slug: "u9-dave-start", data: u9DaveStart },
  { slug: "u9-dave-end", data: u9DaveEnd },
  { slug: "u10-riley-start", data: u10RileyStart },
  { slug: "u10-riley-end", data: u10RileyEnd },
  { slug: "u11-dave-start", data: u11DaveStart },
  { slug: "u11-dave-end", data: u11DaveEnd },
  { slug: "u12-riley-start", data: u12RileyStart },
  { slug: "u12-riley-end", data: u12RileyEnd },
  { slug: "u13-dave-start", data: u13DaveStart },
  { slug: "u13-dave-end", data: u13DaveEnd },
  { slug: "u14-riley-start", data: u14RileyStart },
  { slug: "u14-riley-end", data: u14RileyEnd },
  { slug: "u15-dave-start", data: u15DaveStart },
  { slug: "u15-dave-end", data: u15DaveEnd },
  { slug: "u16-riley-start", data: u16RileyStart },
  { slug: "u16-riley-end", data: u16RileyEnd },
  { slug: "u17-dave-start", data: u17DaveStart },
  { slug: "u17-dave-end", data: u17DaveEnd },
  { slug: "u18-riley-start", data: u18RileyStart },
  { slug: "u18-riley-end", data: u18RileyEnd },
  { slug: "u19-dave-start", data: u19DaveStart },
  { slug: "u19-dave-end", data: u19DaveEnd },
  { slug: "u20-riley-start", data: u20RileyStart },
  { slug: "u20-riley-end", data: u20RileyEnd },
  { slug: "u21-dave-start", data: u21DaveStart },
  { slug: "u21-dave-end", data: u21DaveEnd },
  { slug: "u22-riley-start", data: u22RileyStart },
  { slug: "u22-riley-end", data: u22RileyEnd },
  { slug: "u23-dave-start", data: u23DaveStart },
  { slug: "u23-dave-end", data: u23DaveEnd },
  { slug: "u24-riley-start", data: u24RileyStart },
  { slug: "u24-riley-end", data: u24RileyEnd },
  { slug: "u25-dave-start", data: u25DaveStart },
  { slug: "u25-dave-end", data: u25DaveEnd },
  { slug: "u26-riley-start", data: u26RileyStart },
  { slug: "u26-riley-end", data: u26RileyEnd },
  { slug: "u27-dave-start", data: u27DaveStart },
  { slug: "u27-dave-end", data: u27DaveEnd },
];

export function getChapter(slug) {
  return V4_CHAPTERS.find((c) => c.slug === slug) ?? null;
}
