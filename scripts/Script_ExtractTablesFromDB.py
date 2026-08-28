#!/usr/bin/env python3
"""
extract_images.py

Pulls every image embedded in zodiac_tarot.db back out to disk, using the
original filenames (e.g. major_00_fool_MASTER.png, Zodiac_aries_MASTER.png).

This exists because the database stores images as BLOBs for a single
self-contained handoff, but a real app should serve images from static
files (or a CDN), not out of SQL query results. Run this once to get a
plain folder of PNGs to point your app's asset pipeline at.

Usage:
    python3 extract_images.py [db_path] [output_dir]

    db_path     Path to zodiac_tarot.db (default: ./zodiac_tarot.db)
    output_dir  Folder to write images into (default: ./extracted_images)
                Created if it doesn't exist. Existing files are overwritten.

No third-party dependencies - uses only the Python standard library.
"""

import sqlite3
import sys
import os


def extract_images(db_path: str, output_dir: str) -> None:
    if not os.path.exists(db_path):
        print(f"ERROR: database not found at '{db_path}'")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    written = 0
    errors = []

    # --- Card images (78 rows: one per tarot card) ---
    for card_key, image_file, image_data in cur.execute(
        "SELECT card_key, image_file, image_data FROM card_images"
    ):
        try:
            out_path = os.path.join(output_dir, image_file)
            with open(out_path, "wb") as f:
                f.write(image_data)
            written += 1
        except Exception as e:
            errors.append((image_file, str(e)))

    # --- Symbol images (30 rows: planets, zodiac signs, elements, suits) ---
    for symbol_type, symbol_name, image_file, image_data in cur.execute(
        "SELECT symbol_type, symbol_name, image_file, image_data FROM symbol_images "
        "WHERE image_data IS NOT NULL"
    ):
        try:
            out_path = os.path.join(output_dir, image_file)
            with open(out_path, "wb") as f:
                f.write(image_data)
            written += 1
        except Exception as e:
            errors.append((image_file, str(e)))

    conn.close()

    print(f"Extracted {written} images to: {os.path.abspath(output_dir)}")
    if errors:
        print(f"\n{len(errors)} error(s):")
        for fname, msg in errors:
            print(f"  {fname}: {msg}")
    else:
        print("No errors.")


if __name__ == "__main__":
    db_path = sys.argv[1] if len(sys.argv) > 1 else "zodiac_tarot.db"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "extracted_images"
    extract_images(db_path, output_dir)
