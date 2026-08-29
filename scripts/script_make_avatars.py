import csv
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC_DIR = "/mnt/project"
OUT_DIR = "/home/claude/avatars"
CSV_PATH = "/mnt/project/data_tarot_cards_base.csv"

OUT_SIZE = 512
SUPERSAMPLE = 4
DEFAULT_SIDE = 360      # square crop side (px, in the 840-wide source) before circle-masking
DEFAULT_HEADROOM = 30   # how far above detected subject-top to start the box

# Manual overrides for cards where the generic "top of subject = top of head"
# heuristic doesn't hold (reclining figures, object-only cards with no face,
# headdresses/props that sit above the actual face, group scenes, etc.)
# Format: card_key -> (left, top, right, bottom) in native 840x(1260 or 1456) pixels.
OVERRIDES = {
    "major_09_hermit": (195, 630, 515, 950),           # face hidden in hood shadow; best effort
    "major_10_wheel_of_fortune": (510, 280, 810, 580), # angel face (right side of the wheel)
    "major_12_hanged_man": (250, 900, 550, 1200),      # upside-down, face near the bottom
    "major_13_death": (216, 260, 556, 600),            # zoom down onto the skull itself
    "major_14_temperance": (300, 290, 600, 590),
    "major_17_star": (269, 230, 609, 570),             # zoom down below the star headdress point
    "minor_cups_04": (475, 555, 795, 875),
    "minor_cups_09": (255, 364, 535, 644),
    "minor_cups_10": (260, 590, 600, 930),
    "minor_cups_ace": (299, 220, 639, 560),            # no face on this card; center on hand+cup
    "minor_pentacles_05": (250, 600, 550, 900),
    "minor_pentacles_06": (75, 760, 355, 1040),
    "minor_pentacles_07": (435, 200, 735, 500),
    "minor_pentacles_10": (210, 310, 510, 610),
    "minor_pentacles_queen": (260, 150, 560, 450),
    "minor_swords_02": (245, 330, 545, 630),
    "minor_swords_05": (245, 350, 545, 650),
    "minor_swords_06": (513, 565, 813, 865),  # shifted 2px left: master trimmed to 813 wide
    "minor_swords_09": (450, 505, 750, 805),
    "minor_swords_10": (35, 950, 375, 1290),           # reclining figure, head at bottom-left
    "minor_wands_04": (235, 350, 535, 650),
    "minor_wands_05": (150, 135, 430, 415),
    "minor_wands_06": (110, 360, 390, 640),
    "minor_wands_09": (505, 290, 765, 550),
    "minor_cups_06": (100, 325, 560, 785),
    "minor_pentacles_02": (230, 125, 510, 405),
    "minor_pentacles_03": (255, 540, 535, 820),
    "minor_pentacles_08": (400, 270, 680, 550),
    "minor_pentacles_ace": (260, 310, 640, 690),   # no face on this card; center on hand+coin
    "minor_swords_ace": (290, 140, 610, 460),      # no face on this card; center on crown+blade
    "minor_swords_knight": (95, 330, 375, 610),
    "minor_swords_page": (365, 210, 645, 490),
    "major_15_devil": (275, 250, 555, 530),
}


def subject_top(arr):
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


def head_centroid_x(arr, top, h, w):
    y0 = max(0, top)
    y1 = min(h, top + 240)
    band = arr[y0:y1, :, :]
    maxc = band.max(axis=-1)
    minc = band.min(axis=-1)
    sat = (maxc - minc) / (maxc + 1e-6)
    val = maxc
    mask = (val > 0.15) & (val < 0.90) & (sat > 0.10)
    cols = mask.sum(axis=0).astype(float)
    idx = np.arange(w)
    if cols.sum() == 0:
        return w / 2
    return (cols * idx).sum() / cols.sum()


def avatar_box(im, side=DEFAULT_SIDE, headroom=DEFAULT_HEADROOM):
    arr = np.array(im.convert("RGB")).astype(float) / 255.0
    h, w, _ = arr.shape
    st = subject_top(arr)
    cx = head_centroid_x(arr, st, h, w)
    top = max(0, st - headroom)
    top = min(top, h - side)
    left = cx - side / 2
    left = max(0, min(left, w - side))
    return (int(left), int(top), int(left + side), int(top + side))


def make_avatar(src_path, out_path, card_key):
    im = Image.open(src_path).convert("RGB")
    if card_key in OVERRIDES:
        box = OVERRIDES[card_key]
    else:
        box = avatar_box(im)
    square = im.crop(box)
    hi = square.resize((OUT_SIZE * SUPERSAMPLE, OUT_SIZE * SUPERSAMPLE), Image.LANCZOS)
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
        out = f"{OUT_DIR}/{card_key}_avatar.png"
        make_avatar(src, out, card_key)
    print("Done.")


if __name__ == "__main__":
    main()
