import csv
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Repo-relative, so the script runs from a clone rather than from the sandbox
# it was first written in. Run it from the repo root.
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets" / "cards" / "master"
OUT_DIR = ROOT / "assets" / "cards" / "circle"
CSV_PATH = ROOT / "data" / "data_tarot_cards_base.csv"

OUT_SIZE = 512          # final circular PNG diameter (px), transparent outside circle
SUPERSAMPLE = 4         # antialiasing factor for the circle mask

# The crop is a square of the master's own width. It used to be a hardcoded
# 840, then 813 to dodge the white export border; 0019 removed that border at
# the source and left the files at widths from 813 to 924, so a fixed number is
# now wrong in both directions — it would clip the right off the wide ones and
# overrun the narrow ones. Ask each file.

def subject_top(arr):
    """Find the y-pixel where the card's main subject starts, scanning a
    center column band and ignoring the top glyph/number-plate zone and
    the bottom name-plate/ground zone."""
    h, w, _ = arr.shape
    cx0, cx1 = int(w * 0.20), int(w * 0.80)
    y_start = int(h * 0.09)
    y_end = int(h * 0.84)
    band = arr[y_start:y_end, cx0:cx1, :]
    maxc = band.max(axis=-1)
    minc = band.min(axis=-1)
    sat = (maxc - minc) / (maxc + 1e-6)
    val = maxc
    mask = (val > 0.15) & (val < 0.90) & (sat > 0.10)
    rows = mask.sum(axis=1).astype(float)
    k = 9
    kernel = np.ones(k) / k
    smooth = np.convolve(rows, kernel, mode="same")
    thresh = max(smooth.max() * 0.18, (cx1 - cx0) * 0.03)
    idxs = np.where(smooth > thresh)[0]
    top_rel = idxs[0] if len(idxs) else 0
    return y_start + top_rel


def crop_box(im):
    arr = np.array(im.convert("RGB")).astype(float) / 255.0
    h, w, _ = arr.shape
    side = min(w, h)
    st = subject_top(arr)
    top = st - 50
    top = max(int(h * 0.055), top)
    top = min(top, h - side - int(h * 0.145))
    top = max(0, int(top))
    return (0, top, side, top + side)


def make_circle(src_path, out_path):
    im = Image.open(src_path).convert("RGB")
    box = crop_box(im)
    square = im.crop(box)
    # upscale for supersampled antialiasing, then mask to a circle
    hi = square.resize(
        (OUT_SIZE * SUPERSAMPLE, OUT_SIZE * SUPERSAMPLE), Image.LANCZOS
    )
    mask = Image.new("L", hi.size, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((0, 0, hi.size[0], hi.size[1]), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(SUPERSAMPLE))
    rgba = hi.convert("RGBA")
    rgba.putalpha(mask)
    final = rgba.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
    final.save(out_path)


def main():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Processing {len(rows)} cards...")
    for row in rows:
        card_key = row["card_key"]
        image_file = row["image_file"]
        src = SRC_DIR / image_file
        out = OUT_DIR / f"{card_key}_circle.png"
        make_circle(src, out)
    print("Done.")


if __name__ == "__main__":
    main()
