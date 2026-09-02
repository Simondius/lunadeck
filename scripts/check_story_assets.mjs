// Every image Story mode and v4 will ask for, checked against what is on disk.
//
//   node scripts/check_story_assets.mjs
//
// This exists because of what happened on 2 Sep. Story mode and v4 merged
// referencing eleven files under assets/reading-scene-sketch-v2/ — eight
// character portraits, a background, a table and a pair of hands — and none of
// them had been committed. They were on the author's machine, so the feature
// looked finished there. On main, every chapter rendered four broken images and
// v4's path (which is now the default route) showed a blank circle where the
// client's face should be.
//
// scripts/check_rounds.mjs already checks lesson art and reported "108 distinct
// assets referenced, all present" the whole time, because it walks the
// curriculum rounds and narrative art is not in them. So the gap was not that
// nobody checked; it was that the check did not reach this far.
//
// The paths here are derived rather than listed. Story art is composed at
// runtime from a base plus a character, an emotion or a background name, so a
// hardcoded list in this file would rot the first time a chapter used a new
// emotion. Instead: read the same data the app reads, build the same paths the
// app builds, and check those.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

// Kept in step with the ASSETS constant in components/story/chapter-player.jsx
// and app/v4/page.js. Asserted below rather than assumed, so moving the art
// directory fails here instead of silently checking the wrong place.
const ASSETS = "/assets/reading-scene-sketch-v2";

const CONSUMERS = ["components/story/chapter-player.jsx", "app/v4/page.js"];

const failures = [];
const wanted = new Map(); // url -> why

function want(url, why) {
  if (!wanted.has(url)) wanted.set(url, why);
}

// If a consumer stops agreeing with the base above, everything below is
// checking a directory nobody reads.
for (const file of CONSUMERS) {
  const src = readFileSync(path.join(root, file), "utf8");
  if (!src.includes(`"${ASSETS}"`)) {
    failures.push(
      `${file} no longer declares ASSETS = "${ASSETS}" — update this script's base`
    );
  }
}

// ---------------------------------------------------------------------------
// The fixed layers: whatever the player asks for by a literal name.
//
// Scraped out of the source rather than typed here, so a new always-present
// layer is covered the moment it is added.
// ---------------------------------------------------------------------------
for (const file of CONSUMERS) {
  const src = readFileSync(path.join(root, file), "utf8");
  for (const match of src.matchAll(/\$\{ASSETS\}(\/[A-Za-z0-9_/.-]+\.(?:png|webp|jpg|jpeg|svg))/g)) {
    want(ASSETS + match[1], `${file} literal layer`);
  }
}

// ---------------------------------------------------------------------------
// The composed layers: characters in the emotions they are actually played in,
// and the backgrounds the chapters actually name.
//
// Only the combinations the data uses. Demanding the full cross product of
// characters and emotions would invent work — a character who never gets angry
// needs no angry portrait.
// ---------------------------------------------------------------------------
const storyDir = path.join(root, "data/story");
const chapterFiles = readdirSync(storyDir).filter((f) => f.endsWith(".json"));

if (chapterFiles.length === 0) {
  failures.push("data/story has no chapter JSON — this script is checking nothing");
}

for (const file of chapterFiles) {
  let chapter;
  try {
    chapter = JSON.parse(readFileSync(path.join(storyDir, file), "utf8"));
  } catch (error) {
    failures.push(`data/story/${file} is not valid JSON: ${error.message}`);
    continue;
  }

  const background = chapter.location?.background;
  if (background) {
    want(`${ASSETS}/backgrounds/${background}.png`, `data/story/${file} location`);
  } else {
    failures.push(`data/story/${file} has no location.background`);
  }

  for (const [i, beat] of (chapter.beats ?? []).entries()) {
    const { character, emotion } = beat;
    if (!character || !emotion) continue;
    want(
      `${ASSETS}/characters/${character}/${character}_${emotion}.png`,
      `data/story/${file} beat ${i}`
    );
  }
}

// ---------------------------------------------------------------------------
// v4's path shows each unit's character as its node portrait, always neutral.
// ---------------------------------------------------------------------------
const unitsSrc = readFileSync(path.join(root, "data/v4/units.js"), "utf8");
const characters = new Set(
  [...unitsSrc.matchAll(/character:\s*"([a-z0-9_-]+)"/g)].map((m) => m[1])
);

if (characters.size === 0) {
  failures.push("data/v4/units.js declares no characters — the portrait check found nothing");
}

for (const character of characters) {
  want(
    `${ASSETS}/characters/${character}/${character}_neutral.png`,
    "data/v4/units.js unit portrait"
  );
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
const missing = [];
for (const [url, why] of wanted) {
  if (!existsSync(path.join(root, url.replace(/^\//, "")))) missing.push({ url, why });
}

if (failures.length === 0 && missing.length === 0) {
  console.log(`${wanted.size} distinct story assets referenced, all present`);
  process.exit(0);
}

for (const failure of failures) console.error(`  ${failure}`);

if (missing.length > 0) {
  console.error(
    `\n  ${missing.length} of ${wanted.size} story assets are referenced but not in the repo:\n`
  );
  for (const { url, why } of missing) console.error(`    ${url}\n      wanted by ${why}`);
  console.error(
    "\n  These are not gitignored, they were never committed. The feature will\n" +
      "  look complete on the machine that has them locally and render broken\n" +
      "  images everywhere else.\n"
  );
}

process.exit(1);
