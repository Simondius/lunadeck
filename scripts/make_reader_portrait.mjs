// Derives the Reader tab's portrait from its master.
//
// Same rule as the card circles and avatars: the crop is generated, never
// hand-edited. Change the numbers here and re-run rather than opening the
// output in an editor.
//
//   node scripts/make_reader_portrait.mjs
//
// The master is 1536x2752 (ratio 0.558, which happens to be the deck's own
// card ratio). The greeting screen cannot spend that much height: on a 375px
// phone the column is 331px wide and the name, the invitation and the button
// need about 210px under the image, which leaves roughly 480px for it. So the
// portrait is cropped to 2:3 and the very bottom of the scene — the potions,
// keys and books along the floor — falls outside it. The reader's face and the
// spread they are dealing are what the frame is for.

import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const MASTER_IN = "assets/misc/reader_MASTER.webp";
const OUT = "assets/misc/reader.webp";

// Where the crop sits in the master. TOP is measured from the top edge; the
// window is the full width and whatever height the target ratio implies.
const RATIO = 2 / 3;
const TOP = 180;

// 900px covers the largest the portrait is ever displayed (346 CSS px) at
// better than 2.5x, so it stays sharp on a 3x phone without shipping the
// whole 1536px master to every visitor.
const WIDTH = 900;

const master = sharp(MASTER_IN);
const { width, height } = await master.metadata();

const cropHeight = Math.round(width / RATIO);
if (TOP + cropHeight > height) {
  throw new Error(
    `crop runs past the bottom of the master: ${TOP} + ${cropHeight} > ${height}`
  );
}

await mkdir("assets/misc", { recursive: true });

await master
  .extract({ left: 0, top: TOP, width, height: cropHeight })
  .resize({ width: WIDTH })
  .webp({ quality: 82 })
  .toFile(OUT);

const out = await sharp(OUT).metadata();
console.log(
  `${MASTER_IN} ${width}x${height} -> ${OUT} ${out.width}x${out.height} ` +
    `(crop from y=${TOP}, ratio ${(out.width / out.height).toFixed(3)})`
);
