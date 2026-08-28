import csv
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC_DIR = "/mnt/project"
OUT_DIR = "/home/claude/circles"
CSV_PATH = "/mnt/project/data_tarot_cards_base.csv"

OUT_SIZE = 512          # final circular PNG diameter (px), transparent outside circle
SUPERSAMPLE = 4         # antialiasing factor for the circle mask
CROP_SIDE = 840         # square crop side taken from the 840x1456 source (source width)

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
    st = subject_top(arr)
    top = st - 50
    top = max(int(h * 0.055), top)
    top = min(top, h - CROP_SIDE - int(h * 0.145))
    top = int(top)
    return (0, top, w, top + CROP_SIDE)


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
        src = f"{SRC_DIR}/{image_file}"
        out = f"{OUT_DIR}/{card_key}_circle.png"
        make_circle(src, out)
    print("Done.")


if __name__ == "__main__":
    main()
