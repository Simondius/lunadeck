# Major Arcana card elements — content package (18 cards)

Generated for the reading-rotation content: Empress, High Priestess, Hierophant, Chariot,
Strength, Hermit, Wheel of Fortune, Justice, Hanged Man, Death, Temperance, Devil, Tower,
Star, Moon, Sun, Judgment, World. (Magician, Emperor, and Lovers already had this content
in the live app.)

**This is a content package only.** Nothing here is wired into `data/v3` or `data/v4`
section JSON — that data model is under active restructuring, so wiring in new nodes was
deliberately left out of scope for this pass, per your call.

## What's in here

- **`ELEMENTS.md`** — the full table: every element's name, key, one-sentence description,
  icon file, and tap-zone rect(s), one section per card. Read this first.
- **`crops/`** — 54 icon PNGs (3 per card, 120x120px, same convention as the existing
  `public/assets/cards/cardelements/major_00_fool_element_*.png` files). Named
  `{card_key}_element_{key}.png`, e.g. `major_02_high_priestess_element_moon.png`.
- **`tables/`** — the same data as `ELEMENTS.md`, as one JSON file per card
  (`{card_key}.json`), in case it's easier to script against than the markdown. Schema:
  ```json
  {
    "card_key": "major_02_high_priestess",
    "card_name": "The High Priestess",
    "elements": [
      {"key": "moon", "name": "Moon", "text": "...",
       "rects": [{"x0": 0.42, "y0": 0.18, "x1": 0.51, "y1": 0.25}]}
    ]
  }
  ```
  `rects` fractions are of the full card image (matches the `elements[].rects` shape used
  in the live `zone` rounds in `data/v4/fool_section.json` etc.) — a few elements have 2
  rects where the visual detail isn't one contiguous region (two figures, two clusters).

## How each card's 3 elements were chosen

1. **One canonical astrological symbol** — the Planet or Zodiac Sign already assigned to
   that card in `data/data_major_arcana_symbols.csv`, cropped from wherever its glyph
   appears in the card art. The description combines phrases straight from
   `data/data_symbol_significance.csv` (real app data, not invented).
2. **Two card-specific visual details** — distinctive things actually drawn in that card's
   art (a gesture, an object, an animal, a background motif), picked by eye from the master
   card image and grounded in that card's prose in `data/data_card_descriptions.csv` where
   it lines up. These are NOT backed by any existing data table — same situation as the
   Fool/Magician/Emperor/Lovers detail elements already in the app, which were also derived
   by eye rather than pulled from structured data (there isn't any for this tier of detail).

## To wire this in later

Each card's `tables/{card_key}.json` maps directly onto a `zone` round's `elements` array
and a `tilematch` round's `pairs` array in the existing section-JSON format — see
`data/v4/fool_section.json` node-2 for the pattern (a `zone` round using the `rects`, paired
with a `tilematch` round using the icon crop as `image`). Copy the icon PNGs into
`public/assets/cards/cardelements/` (already done if you're reading this from inside the
repo — see below) and reference them the same way the fool/magician/emperor/lovers pairs do.

## Delivery

The icon crops have already been committed to
`public/assets/cards/cardelements/` in the repo (same folder as the existing four cards'
crops) so they're available at `/assets/cards/cardelements/...` the moment they're wired
into any section JSON. `ELEMENTS.md` and `tables/*.json` are kept outside `public/` (under
`docs/card-elements/` — see the commit) since they're reference/content-authoring material,
not served assets.
