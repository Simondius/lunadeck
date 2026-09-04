// Exports the app's UI as PNGs for Figma.
//
// The card art in assets/ is already PNG, so it needs nothing from this
// script. What has never existed as an image is the interface itself — the tab
// bar, the path nodes, the feed card, the round shells — because all of it is
// HTML and CSS. This drives a real browser over the running dev server and
// writes two kinds of file into exports/figma/:
//
//   screen-*.png   a whole phone frame, one per route
//   piece-*.png    one element, cut out with a transparent background
//
// Usage: npm run dev in one terminal, then `npm run export:ui`.
// Add `--only <substring>` to export a subset while iterating.
//
// Three things about this are not obvious, and all three were bugs first.
//
// 1. A fresh browser has empty localStorage, so every screen renders its
//    zero-state: no streak, no known cards, no draw. SEED below is written in
//    before any page script runs, so the export shows a populated app. It also
//    means the reader screen never calls the API — a seeded takeaway is a
//    takeaway already given, so an export run costs nothing.
//
// 2. `omitBackground` alone does not give a transparent cutout. It clears the
//    browser's default white, but the app's own dark background is painted by
//    body/.shell/.session behind whatever you clipped, and an element
//    screenshot captures those pixels too. TRANSPARENCY_CSS strips the
//    ancestors' backgrounds for the duration of the shot.
//
// 3. Several pieces only exist part-way into a lesson. Rather than play the
//    rounds, `prepare` clicks the dev console's own skip control
//    (lib/dev-console-bridge.js), which steps a node's rounds without
//    answering them. That is also the only way to reach the completion
//    celebration.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.EXPORT_BASE ?? "http://localhost:3000";
const OUT = "exports/figma";

// The phone layout. globals.css turns .app-frame into a desktop device frame
// above 900px, which is not what we want to hand to Figma — below it the
// wrapper is inert and the shell is the real 420px phone.
const VIEWPORT = { width: 420, height: 900 };

// 3x so a piece can be scaled up in Figma without going soft. A 420px screen
// lands as a 1260px PNG.
const SCALE = 3;

// Every node id in the curriculum, read from the data rather than guessed.
// knownCardKeys only counts a card once *every* node in its section is
// complete, and that list includes the section's capstone node — whose id is
// not "capstone-1", which is what the first run assumed. The result was a
// populated streak next to "0 / 78 cards learned", which is not a state the
// app can actually be in.
//
// Node ids also collide across sections (every section names its nodes
// node-1..node-7), so there is no way to seed a partial set of known cards
// anyway: completing one section's nodes completes all of them.
function allNodeIds() {
  const ids = new Set();
  for (const file of readdirSync("data/v4")) {
    if (!file.endsWith(".json")) continue;
    const json = JSON.parse(readFileSync(join("data/v4", file), "utf8"));
    // Section files hold a `nodes` array; capstone and mashup files hold
    // node objects keyed by card or unit.
    const nodes = json.nodes ?? Object.values(json).flatMap((v) => (Array.isArray(v) ? v : [v]));
    for (const node of nodes) if (node?.id) ids.add(node.id);
  }
  return [...ids];
}

const SEED = {
  progressKey: "lunadeck.progress.v1",
  progress: {
    version: 1,
    completedNodeIds: allNodeIds(),
    missedNodeIds: ["node-4"],
    streakDays: 12,
    displayName: "Tia",
    lastPlayedDate: null, // filled in at runtime, below
    dailyDraw: null, // filled in at runtime, below
    lastReading: null,
    drawnCardKeys: ["major_00_fool", "major_06_lovers", "minor_cups_03"],
    reversedCardKeys: ["major_06_lovers"],
    xp: 48,
    hintsBySection: {},
  },
};

// The daily draw has to carry today's date or the reader deals a new one, and
// it has to carry a takeaway or the reader calls the API for one.
const DRAW = {
  cards: [
    { cardKey: "major_00_fool", reversed: false },
    { cardKey: "major_11_strength", reversed: true },
    { cardKey: "minor_cups_03", reversed: false },
  ],
  headline: "A beginning you are readier for than you think",
  takeaway:
    "The Fool opens the day and Strength arrives reversed, which reads less as weakness than as force spent in the wrong direction. Three of Cups closes it: whatever you start, start it with the people already beside you.",
  revealed: true,
};

const TRANSPARENCY_CSS = `
  html, body, .app-frame, .app-scroll, .shell, .session,
  .alignment-ceremony-stage, .starfield {
    background: transparent !important;
    background-image: none !important;
  }
  /* The round backdrops are <img> elements, not CSS backgrounds — the card
     art blurred out behind the exercise. Clearing a background property does
     nothing to an image, so the first run cut the sentence out with the
     Chariot still showing through it. These have to be removed outright, and
     so do the scrims and the starfield's own pseudo-elements. */
  .cloze-bg, .swipe-bg,
  .cloze-bg-scrim, .swipe-bg-scrim,
  .starfield::before, .starfield::after { display: none !important; }
`;

// --- the manifest ------------------------------------------------------
//
// One entry per file. `route` is where it lives, `selector` is what to clip
// (absent = the whole frame), `prepare` is anything that has to happen first.
// Adding a sixteenth piece is one entry.

const SCREENS = [
  { name: "path", route: "/" },
  { name: "deck", route: "/deck" },
  { name: "card-detail", route: "/deck/major_00_fool" },
  { name: "guide", route: "/guide" },
  { name: "reading", route: "/reader" },
  { name: "social", route: "/social" },
  { name: "friends", route: "/social/friends" },
  { name: "story", route: "/story/play/u1-dave-start" },
  { name: "round-cloze", route: "/v4/play/chariot/7" },
  { name: "round-swipe", route: "/v4/play/chariot/5" },
  { name: "round-zone", route: "/v4/play/chariot/2" },
  { name: "round-choice", route: "/v4/play/chariot/6" },
];

const PIECES = [
  { name: "tabbar", route: "/", selector: ".tabbar" },
  { name: "path-node-lesson", route: "/", selector: ".trail-step.v2-step" },
  { name: "path-node-story", route: "/", selector: ".trail-step.v4-character-step" },
  // The feed row is .activity. (.activity-card is one card thumbnail inside
  // it, which is what the first run exported by mistake.)
  { name: "feed-activity", route: "/social", selector: ".activity" },
  { name: "profile-stats", route: "/social", selector: ".profile-stats" },
  { name: "streak-chip", route: "/social", selector: ".profile-streak" },
  { name: "streak-flame", route: "/social", selector: ".streak-flame" },
  // Inline SVG, so this lands in Figma as editable paths rather than pixels.
  { name: "node-icon", route: "/", selector: ".v2-step svg" },
  { name: "guide-hero", route: "/guide", selector: ".guide-hero" },
  { name: "action-primary", route: "/guide", selector: ".action" },
  { name: "cloze-sentence", route: "/v4/play/chariot/7", selector: ".cloze-sentence" },
  { name: "drag-chips", route: "/v4/play/chariot/7", selector: ".chips" },
  { name: "reference-card", route: "/v4/play/chariot/7", selector: ".reference-card" },
  { name: "topbar", route: "/v4/play/chariot/7", selector: ".topbar" },
  {
    // No node anywhere starts with a tilematch round, so this one needs the
    // zone round before it stepped past.
    name: "tile-match-grid",
    route: "/v4/play/chariot/2",
    selector: ".tile-match-grid",
    prepare: (page) => skipRounds(page, 1),
  },
  {
    // chariot/1 holds a single round, so one skip lands on the celebration.
    name: "node-complete",
    route: "/v4/play/chariot/1",
    selector: ".node-complete-celebration",
    prepare: (page) => skipRounds(page, 1),
  },
  {
    name: "alignment-ceremony",
    route: "/v4/play/fool-capstone/1",
    selector: ".alignment-ceremony",
    settle: 2500, // it reveals over a beat or two
  },
  {
    name: "scanner-frame",
    route: "/guide",
    selector: ".scanner",
    prepare: async (page) => {
      await fakeCamera(page, "/assets/cards/master/major_07_chariot_MASTER.png");
      await page.getByRole("button", { name: /start reading/i }).click();
      await page.waitForSelector(".scanner", { timeout: 10000 });
    },
    settle: 1500,
  },
];

// --- driving the app ---------------------------------------------------

// Points the scanner at a card instead of at Chrome's own fake camera, whose
// feed is a green test pattern — mechanically a working camera, and useless as
// a design asset. A canvas-backed MediaStream painting a real master render
// puts an actual card in the reticle.
//
// Painted on an interval rather than a frame loop: requestAnimationFrame is
// throttled to nothing when the page isn't visible, and a stream that never
// produces a frame never fires loadedmetadata, so the scanner would sit on its
// "waiting for the camera" state forever.
async function fakeCamera(page, cardSrc) {
  await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    // In the document, not detached: a canvas that never composites produces
    // no frames, the video's loadedmetadata never fires, and the scanner sits
    // on "Waiting for the first frame…" forever.
    canvas.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    setInterval(() => {
      ctx.fillStyle = "#171320";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale =
        Math.min(canvas.width / img.width, canvas.height / img.height) * 0.78;
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }, 100);

    // A fresh stream per call, not one shared. React invokes the scanner's
    // effect twice in development, so getUserMedia is called twice — and the
    // first run's cleanup stops the tracks of whatever it was given. Hand both
    // callers the same MediaStream and the second one inherits stopped tracks,
    // which report a 2x2 frame and never satisfy MIN_FRAME_WIDTH.
    navigator.mediaDevices.getUserMedia = async () => canvas.captureStream(10);
  }, cardSrc);
}

async function skipRounds(page, times) {
  // The dev console's own > control, registered by NodeSession while a node is
  // mounted. It steps a round without answering it.
  const next = page.locator(".dev-console-skip.is-next");
  await next.waitFor({ state: "visible", timeout: 10000 });
  for (let i = 0; i < times; i++) {
    await next.click();
    await page.waitForTimeout(400);
  }
}

async function ready(page) {
  // Fonts come from Google, and a shot taken before they land is a shot of the
  // fallback face at the wrong metrics.
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
}

// Every dev-only affordance, by prefix rather than by name. Naming the classes
// individually missed the minimised FAB — which is the state this script puts
// the console in — and left a moon badge in the corner of all 30 files.
async function hideDevChrome(page) {
  await page.addStyleTag({
    content: '[class*="dev-console"], nextjs-portal { display: none !important; }',
  });
}

async function shoot(page, entry, kind) {
  const url = BASE + entry.route;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await ready(page);

  if (entry.prepare) await entry.prepare(page);
  await page.waitForTimeout(entry.settle ?? 600);

  // Hidden after prepare, because prepare is what clicks it.
  await hideDevChrome(page);

  const file = join(OUT, `${kind}-${entry.name}.png`);

  if (!entry.selector) {
    // The viewport, not .app-frame. Below 900px the frame is an inert wrapper
    // with no height of its own, so clipping to it captured the whole scroll
    // length — the path screen came out 33,250px tall, which is a diagram of
    // the trail rather than a picture of a phone.
    await page.screenshot({ path: file });
    return { file, note: "", size: `${VIEWPORT.width}×${VIEWPORT.height}` };
  }

  const target = page.locator(entry.selector).first();
  const count = await page.locator(entry.selector).count();
  if (count === 0) throw new Error(`no element matched ${entry.selector}`);

  const box = await target.boundingBox();
  const size = box ? `${Math.round(box.width)}×${Math.round(box.height)}` : "?";

  const style = await page.addStyleTag({ content: TRANSPARENCY_CSS });
  await target.screenshot({ path: file, omitBackground: true });
  await style.evaluate((el) => el.remove());

  // An inline <svg> is a vector already. Figma imports it as editable paths,
  // which is strictly better than pixels, so write it alongside the PNG.
  //
  // Only when the element IS the svg. Writing out an svg found *inside* a
  // larger element produces a file that claims to be that element and is
  // actually one glyph from it — profile-stats.svg came out as the streak
  // flame alone. Point a manifest entry straight at the svg instead.
  const svg = await target.evaluate((el) => {
    if (el.tagName.toLowerCase() !== "svg") return null;

    // Inline the computed paint before serialising. These icons take their
    // colour from stylesheet rules (.flame-body, .flame-core) and from
    // currentColor, neither of which travels with a standalone file — the
    // first export produced two black silhouettes.
    const clone = el.cloneNode(true);
    const live = [el, ...el.querySelectorAll("*")];
    const copies = [clone, ...clone.querySelectorAll("*")];
    const DEFAULTS = new Set(["none", "normal", "1", "1px", "rgb(0, 0, 0)"]);
    live.forEach((node, i) => {
      const style = getComputedStyle(node);
      const copy = copies[i];
      for (const prop of ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity"]) {
        const value = style.getPropertyValue(prop);
        // Default paint is noise in the output — a stroke-width of 1px on
        // every node, and a black fill on the root that nothing uses.
        if (value && !DEFAULTS.has(value)) {
          copy.setAttribute(prop, value);
        }
      }
      copy.removeAttribute("class");
    });
    return clone.outerHTML;
  });
  if (svg) {
    writeFileSync(join(OUT, `${kind}-${entry.name}.svg`), withSvgNamespace(svg));
    return { file, note: "+ svg", size };
  }

  return { file, note: count > 1 ? `${count} matched, took the first` : "", size };
}

function withSvgNamespace(svg) {
  // React renders inline SVG without the xmlns attribute, since the HTML
  // parser supplies it. A standalone .svg file has no such parser, and Figma
  // rejects the import without it.
  return svg.includes("xmlns=")
    ? svg
    : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
}

// --- run ---------------------------------------------------------------

const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;

const wanted = (list) => (only ? list.filter((e) => e.name.includes(only)) : list);

// Only a full run clears the directory. `--only` is for iterating on one
// entry, and wiping the other 29 files to rewrite a single one is not what
// anyone means by that.
if (!only) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  // Uses the Chrome already on this machine rather than downloading a private
  // Chromium. The fake-device flags matter for the scanner: without them
  // getUserMedia rejects and the guide renders .scanner-blocked instead of a
  // camera frame.
  channel: "chrome",
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: SCALE,
  permissions: ["camera"],
});

await context.addInitScript(
  ([key, progress, draw]) => {
    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    localStorage.setItem(
      key,
      JSON.stringify({ ...progress, lastPlayedDate: day, dailyDraw: { date: day, ...draw } })
    );
    // Otherwise the console's own panel opens over the first screen exported.
    localStorage.setItem("lunadeck.devconsole.minimized.v1", "true");
  },
  [SEED.progressKey, SEED.progress, DRAW]
);

const page = await context.newPage();
const failures = [];
const manifestRows = [];
let written = 0;

for (const [kind, list] of [
  ["screen", wanted(SCREENS)],
  ["piece", wanted(PIECES)],
]) {
  for (const entry of list) {
    try {
      const { file, note, size } = await shoot(page, entry, kind);
      written += 1;
      manifestRows.push(
        `- \`${kind}-${entry.name}\` — ${size} · ${entry.route}${
          entry.selector ? ` · \`${entry.selector}\`` : ""
        }`
      );
      console.log(`  ${file}  ${size}${note ? `  (${note})` : ""}`);
    } catch (error) {
      failures.push({ name: `${kind}-${entry.name}`, message: error.message.split("\n")[0] });
      console.log(`  MISSED  ${kind}-${entry.name}  ${error.message.split("\n")[0]}`);
    }
  }
}

await browser.close();

// A README next to the files, regenerated on every full run so it cannot go
// stale. Skipped on a filtered run, where it would list one file and claim to
// be the whole export.
// The translucency note is the one thing about these that surprises people:
// a faithful cutout of a translucent pill looks broken on a light canvas,
// because in the app that pill is borrowing the dark ground behind it.
if (!only)
  writeFileSync(
    join(OUT, "README.md"),
    [
      "# Lunadeck UI, exported for Figma",
      "",
      `Generated by \`npm run export:ui\` — ${new Date().toISOString().slice(0, 10)}.`,
      "Do not edit these by hand; rerun the script.",
      "",
      `**screen-\*.png** — a whole phone screen, ${VIEWPORT.width}×${VIEWPORT.height} at ${SCALE}x.`,
      "**piece-\\*.png** — one element, cut out with a transparent background.",
      "**\\*.svg** — the same element as editable vector paths. Import these",
      "rather than the PNG where both exist.",
      "",
      "## Two things to know",
      "",
      "Some pieces are translucent by design — the drag chips, the celebration",
      "line, the round topbar. In the app they borrow the dark background behind",
      "them, so a faithful cutout looks washed out on a light Figma canvas. Put a",
      `dark rectangle (#0b0812) behind them and they will look like the app again.`,
      "",
      "The card art is not here, because it never needed exporting: `assets/cards`",
      "already holds 78 masters, circles, avatars and card elements as PNGs, plus",
      "30 symbols in `assets/symbols`. Drag those folders in directly.",
      "",
      "## Files",
      "",
      ...manifestRows,
    ].join("\n") + "\n"
  );

console.log(`\n  ${written} files in ${OUT}/ at ${SCALE}x`);
if (failures.length) {
  console.log(`  ${failures.length} not exported:`);
  for (const f of failures) console.log(`    ${f.name} — ${f.message}`);
  process.exit(1);
}
