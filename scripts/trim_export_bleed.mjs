// Trims the solid white strip off the right edge of an export.
//
//   node scripts/trim_export_bleed.mjs assets/misc/deck_box_lid_MASTER.png
//
// 0019 did this to the 78 card masters. assets/misc/deck_box_lid_MASTER.png was
// not in that pass and still carried 26 near-white columns of its 840 — inside
// the 24-to-27 range 0021 measured across the card set, so the same export
// batch and the same fault. Framed by rounded corners it reads as a rendering
// bug rather than as part of the picture, which is the complaint that started
// 0019 in the first place.
//
// Writes in place, and refuses to run on an image that has no strip, so
// re-running it is safe.

import { rename } from "node:fs/promises";
import sharp from "sharp";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/trim_export_bleed.mjs <image>");
  process.exit(1);
}

// Deliberately strict. A picture whose right-hand edge is genuinely a bright
// object should not be silently cropped, so a column only counts when every
// sample down it is near-white.
const NEAR_WHITE = 230;
const SAMPLES = 40;

const image = sharp(file);
const { width, height } = await image.metadata();
const raw = await image.raw().toBuffer();
const channels = raw.length / (width * height);

const isNearWhite = (x, y) => {
  const i = (y * width + x) * channels;
  return raw[i] > NEAR_WHITE && raw[i + 1] > NEAR_WHITE && raw[i + 2] > NEAR_WHITE;
};

let strip = 0;
for (let x = width - 1; x >= 0; x--) {
  let solid = true;
  for (let s = 0; s < SAMPLES; s++) {
    if (!isNearWhite(x, Math.floor((height * s) / SAMPLES))) {
      solid = false;
      break;
    }
  }
  if (!solid) break;
  strip++;
}

if (strip === 0) {
  console.log(`${file}: no bleed found, nothing to do`);
  process.exit(0);
}

// Via a temp file: sharp cannot write to a path it is still reading, and an
// in-place toFile() fails with an unhelpful "unable to open for write".
const temp = `${file}.trimming`;
await sharp(file)
  .extract({ left: 0, top: 0, width: width - strip, height })
  .toFile(temp);
await rename(temp, file);

console.log(
  `${file}: trimmed ${strip}px of bleed, ${width}x${height} -> ${width - strip}x${height} ` +
    `(ratio ${((width - strip) / height).toFixed(3)})`
);
