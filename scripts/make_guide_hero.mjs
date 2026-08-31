// Derives the Guide tab's hero image from its master.
//
// Same rule as the card circles, the avatars and the reader portrait: the crop
// is generated, never hand-edited. Change the numbers here and re-run.
//
//   node scripts/make_guide_hero.mjs
//
// The master is 929x1536 and its subject sits in the middle: hands squaring a
// deck at around y=500 to y=950, and the fan already laid out on the table at
// y=900 to y=1300. Above that is the reader's chest and necklaces, which are
// not what the screen is about, and below is a candle and a crystal ball.
//
// So the crop is landscape, 5:4 from y=520, which frames the hands and the fan
// and drops the chest above and the candle below.
//
// Landscape rather than the 2:3 the reader portrait uses, and measured rather
// than chosen: at 375px wide a square crop is 375px tall, and that put the
// Start reading button 84px below the tab bar on a 375x812 phone. 5:4 is 300px
// tall and leaves room. Same complaint the Reading tab's draw button collected
// on 31 Aug, caught here before it shipped.

import { statSync } from "node:fs";
import sharp from "sharp";

const MASTER_IN = "assets/misc/guide_hands_MASTER.jpg";
const OUT = "assets/misc/guide_hands.webp";

const RATIO = 5 / 4;
const TOP = 520;

// The hero runs the full width of the frame, so 428 CSS px on a desktop frame
// and 375 on a phone. 1100 covers the widest of those at better than 2.5x,
// which keeps it crisp on a 3x screen without shipping the 929x1536 master to
// every visitor.
const WIDTH = 1100;

const master = sharp(MASTER_IN);
const { width, height } = await master.metadata();

const cropHeight = Math.round(width / RATIO);
if (TOP + cropHeight > height) {
  throw new Error(
    `crop runs past the bottom of the master: ${TOP} + ${cropHeight} > ${height}`
  );
}

await master
  .extract({ left: 0, top: TOP, width, height: cropHeight })
  .resize({ width: WIDTH })
  .webp({ quality: 80 })
  .toFile(OUT);

const out = await sharp(OUT).metadata();
console.log(
  `${MASTER_IN} ${width}x${height} -> ${OUT} ${out.width}x${out.height} ` +
    `(crop from y=${TOP}, ratio ${(out.width / out.height).toFixed(3)}, ${Math.round(
      statSync(OUT).size / 1024
    )}KB)`
);
