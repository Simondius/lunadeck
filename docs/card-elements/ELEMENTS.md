# Major Arcana card elements — content package

Element crops, descriptions, and tap-zone rects for the 18 Major Arcana cards referenced
in the reading-rotation text (Magician, Emperor, and Lovers already had this content).

This mirrors the existing `zone` / `tilematch` content shape used for the Fool, Magician,
Emperor, and Lovers sections (see `data/v4/fool_section.json` for the live format) — **it is
a standalone content package, not wired into any `data/v3` or `data/v4` section JSON.**
Wiring it in is a separate step, left for whenever the curriculum data-model restructuring
settles.

Each card has exactly 3 elements: 1 canonical astrological symbol (backed by
`data_major_arcana_symbols.csv` / `data_symbol_significance.csv`) plus 2 card-specific
visual details derived by eye from the actual card art, grounded in
`data_card_descriptions.csv` prose where relevant.

- **Icon crops**: 120x120px PNG, `crops/{card_key}_element_{key}.png` — same convention as
  the existing `public/assets/cards/cardelements/` files, for a tilematch-style game.
- **Rects**: fractions (0-1) of the full card image (`public/assets/cards/master/`), for a
  tap/drag zone directly on the displayed card. Some elements have 2 rects (the visual
  detail is non-contiguous, e.g. two figures, two clusters).

---

## The High Priestess  (major_02_high_priestess)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Moon | `moon` | Moon: intuition and reception rather than action, the emotional tides she keeps. | `crops/major_02_high_priestess_element_moon.png` | (0.42, 0.18, 0.51, 0.25) |
| Raised hand | `raised_hand` | Raised hand: reaching toward the small moon, receiving rather than reaching to act. | `crops/major_02_high_priestess_element_raised_hand.png` | (0.58, 0.26, 0.75, 0.43) |
| Water current | `water_current` | Water at her feet: the mutable, emotional element she governs, protection offered from the threshold. | `crops/major_02_high_priestess_element_water_current.png` | (0.0, 0.6, 1.0, 0.92) |

## The Empress  (major_03_empress)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Venus | `venus` | Venus: love, pleasure, beauty and harmony expressed through relationship. | `crops/major_03_empress_element_venus.png` | (0.44, 0.115, 0.56, 0.19) |
| Scepter | `scepter` | Scepter: her authority as Mother Earth, life given shape and grown into the world. | `crops/major_03_empress_element_scepter.png` | (0.26, 0.18, 0.37, 0.83) |
| Pomegranates | `pomegranates` | Pomegranates among the fronds: fertility and abundance, life ripening in every direction. | `crops/major_03_empress_element_pomegranates.png` | (0.0, 0.18, 0.2, 0.85) |

## The Hierophant  (major_05_hierophant)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Taurus | `taurus` | Taurus: grounded sensory pleasure, patiently manifesting ideals into real, lived, material form. | `crops/major_05_hierophant_element_taurus.png` | (0.4, 0.12, 0.6, 0.24) |
| Raised hand | `raised_hand` | His raised hand of blessing: the bridge he forms between what is habitual and manifest and what lies high in the skies. | `crops/major_05_hierophant_element_raised_hand.png` | (0.24, 0.3, 0.46, 0.48) |
| Ringed celestial orb | `celestial_orb` | A ringed planet stitched into his robe: the sky's rarefied, mystical order carried into the folds of an earthly garment. | `crops/major_05_hierophant_element_celestial_orb.png` | (0.32, 0.42, 0.58, 0.58) |

## The Chariot  (major_07_chariot)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Cancer | `cancer` | Cancer: emotional sensitivity and nurturing, the cardinal initiator in matters of intuition and relationship. | `crops/major_07_chariot_element_cancer.png` | (0.38, 0.09, 0.6, 0.23) |
| The two horses | `horses` | Two horses in harness: the forces that move us, aligned only when intuition and rationality pull together. | `crops/major_07_chariot_element_horses.png` | (0.0, 0.35, 0.55, 0.78) |
| Reins | `reins` | Reins held taut in her hands: the determination and ambition that steer great movement toward its goal. | `crops/major_07_chariot_element_reins.png` | (0.36, 0.22, 0.6, 0.42) |

## Strength  (major_08_strength)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Leo | `leo` | Leo: courage and personal radiance, a strength that comes from the heart and connects rather than dominates. | `crops/major_08_strength_element_leo.png` | (0.38, 0.05, 0.62, 0.19) |
| The lion | `lion_face` | The lion's profile, mane ablaze: not a show of supremacy over other creatures, but a fierce heart at rest. | `crops/major_08_strength_element_lion_face.png` | (0.06, 0.22, 0.4, 0.52) |
| Gentle touch | `gentle_touch` | Her hand resting gently on the lion: the gentler energy that comes from within and tames the more aggressive instincts. | `crops/major_08_strength_element_gentle_touch.png` | (0.28, 0.52, 0.5, 0.72) |

## The Hermit  (major_09_hermit)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Virgo | `virgo` | Virgo: attentive discernment and productive solitude, a focus on detail that reveals the bigger picture. | `crops/major_09_hermit_element_virgo.png` | (0.4, 0.11, 0.6, 0.23) |
| Lantern | `lantern` | The lantern he carries: the light that leads him step by step, focusing on detail as he searches for his spiritual center. | `crops/major_09_hermit_element_lantern.png` | (0.5, 0.4, 0.8, 0.66) |
| Owl | `owl` | An owl keeping silent watch from the branches: the calm, searching wisdom found in solitude. | `crops/major_09_hermit_element_owl.png` | (0.76, 0.2, 0.96, 0.38) |

## The Wheel of Fortune  (major_10_wheel_of_fortune)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Jupiter | `jupiter` | Jupiter: expansion, luck, and abundance, the guiding, generous energy that can tip into excess if unchecked. | `crops/major_10_wheel_of_fortune_element_jupiter.png` | (0.44, 0.11, 0.56, 0.21) |
| Falling devil figure | `devil_figure` | The red figure tumbling down the wheel's rim: misfortune as just one passing phase, not a permanent fate. | `crops/major_10_wheel_of_fortune_element_devil_figure.png` | (0.0, 0.28, 0.28, 0.68) |
| Rising angel figure | `angel_figure` | The winged figure ascending on the opposite side: fortune's rise mirroring the fall, the wheel's constant turning. | `crops/major_10_wheel_of_fortune_element_angel_figure.png` | (0.58, 0.24, 0.98, 0.82) |

## Justice  (major_11_justice)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Libra | `libra` | Libra: balance and harmony, an aesthetic, fair-minded sense of justice rooted in relationship. | `crops/major_11_justice_element_libra.png` | (0.43, 0.115, 0.57, 0.21) |
| Scales | `scales` | The scales in her raised hand: an honest weighing, the true and even vision she holds up to the world. | `crops/major_11_justice_element_scales.png` | (0.03, 0.45, 0.42, 0.65) |
| Sword | `sword` | The sword held low: decisive action from the heart, the responsibility that moves when it must. | `crops/major_11_justice_element_sword.png` | (0.38, 0.54, 0.62, 0.75) |

## The Hanged Man  (major_12_hanged_man)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Neptune | `neptune` | Neptune: dreams, mystery, and surrender, the fluid, hidden depth that dissolves rigid boundaries. | `crops/major_12_hanged_man_element_neptune.png` | (0.41, 0.095, 0.59, 0.215) |
| Crossed legs | `crossed_legs` | His legs crossed like a yoga position: even hanging upside down, a body settled into stillness rather than struggle. | `crops/major_12_hanged_man_element_crossed_legs.png` | (0.26, 0.22, 0.72, 0.44) |
| Serene face | `serene_face` | His calm, unbothered expression: not suffering but pausing, a surrender that leads to greater awareness. | `crops/major_12_hanged_man_element_serene_face.png` | (0.26, 0.58, 0.64, 0.78) |

## Death  (major_13_death)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Scorpio | `scorpio` | Scorpio: intensity and transformation, a comfort with what lies beneath the surface as what no longer has life is shed. | `crops/major_13_death_element_scorpio.png` | (0.41, 0.105, 0.58, 0.22) |
| Scythe | `scythe` | The scythe he carries: the clean, necessary cut, clearing what is no longer viable to make room for new blood. | `crops/major_13_death_element_scythe.png` | (0.02, 0.24, 0.32, 0.52) |
| Rising sun | `rising_sun` | A sun rising behind the brush at his feet: the vital, organic process that follows every ending, new life taking root. | `crops/major_13_death_element_rising_sun.png` | (0.0, 0.6, 0.33, 0.82) |

## Temperance  (major_14_temperance)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Sagittarius | `sagittarius` | Sagittarius: the pull of exploration and optimism, valuing the journey itself over any fixed destination. | `crops/major_14_temperance_element_sagittarius.png` | (0.42, 0.08, 0.58, 0.2) |
| Starry sash | `starry_sash` | The starry sash flowing between her hands: the alchemy of Temperance, blending separate elements into something greater than their sum. | `crops/major_14_temperance_element_starry_sash.png` | (0.28, 0.27, 0.64, 0.55) |
| Cup | `cup` | The cup tipped between her fingers: patient testing and mixing, tempering experience before it's swallowed whole. | `crops/major_14_temperance_element_cup.png` | (0.16, 0.45, 0.36, 0.62) |

## The Devil  (major_15_devil)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Capricorn | `capricorn` | Capricorn: disciplined, earthy ambition, limits and responsibility built through hard work. | `crops/major_15_devil_element_capricorn.png` | (0.42, 0.1, 0.58, 0.23) |
| Horns | `horns` | The goat horns crowning him: Pan's wild, chthonic form, the primordial instinct this card doesn't condemn so much as ask us to own. | `crops/major_15_devil_element_horns.png` | (0.34, 0.14, 0.66, 0.32) |
| Loose chains | `chains` | The chain trailing loose from each figure's neck into the flames, never pulled taut: bondage that could be shrugged off at any time, the freedom of choice already in their own hands. | `crops/major_15_devil_element_chains.png` | (0.15, 0.6, 0.32, 0.79); (0.65, 0.6, 0.82, 0.79) |

## The Tower  (major_16_tower)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Mars | `mars` | Mars: direct, assertive action, jolting stagnant energy into motion. | `crops/major_16_tower_element_mars.png` | (0.42, 0.12, 0.6, 0.22) |
| Lightning bolt | `lightning_bolt` | The lightning strike that splits the tower open: the sudden change that forces movement, however unwelcome it arrives. | `crops/major_16_tower_element_lightning_bolt.png` | (0.55, 0.03, 0.92, 0.4) |
| Falling figures | `falling_figures` | The two figures cast from the tower: falling not as ruin but as release, riding the wave of change instead of resisting it. | `crops/major_16_tower_element_falling_figures.png` | (0.0, 0.35, 0.25, 0.58); (0.63, 0.36, 0.9, 0.6) |

## The Star  (major_17_star)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Aquarius | `aquarius` | Aquarius: idealistic, nonconformist vision, moving to its own rhythm toward hope. | `crops/major_17_star_element_aquarius.png` | (0.4, 0.1, 0.62, 0.2) |
| Star halo | `star_halo` | The eight-pointed star crowning her: the light seen at the end of the tunnel, hope made luminous. | `crops/major_17_star_element_star_halo.png` | (0.32, 0.17, 0.66, 0.36) |
| Vessel | `vessel` | The vessel raised in her hand: an open-handed gift poured out into the world, faith offered without needing anything back. | `crops/major_17_star_element_vessel.png` | (0.63, 0.33, 0.83, 0.45) |

## The Moon  (major_18_moon)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Pisces | `pisces` | Pisces: dreams and empathy, a receptive depth that dissolves the boundary between self and other. | `crops/major_18_moon_element_pisces.png` | (0.44, 0.1, 0.58, 0.21) |
| Moon face | `moon_face` | The face in the moon: our hidden, intimate side, watching from stillness as the night deepens. | `crops/major_18_moon_element_moon_face.png` | (0.3, 0.24, 0.65, 0.46) |
| Twin fish riders | `fish_riders` | Twin figures riding mirrored fish: the two equal, opposing halves of Pisces, guided toward our depths. | `crops/major_18_moon_element_fish_riders.png` | (0.0, 0.52, 0.24, 0.77); (0.6, 0.58, 0.87, 0.84) |

## The Sun  (major_19_sun)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Sun | `sun` | Sun: vitality and warmth, true self-expression radiating confidence into the world. | `crops/major_19_sun_element_sun.png` | (0.43, 0.09, 0.58, 0.22) |
| Child among sunflowers | `child` | The bare child reaching for sunflowers: purity and inner strength, the optimism of a self freely expressed. | `crops/major_19_sun_element_child.png` | (0.32, 0.58, 0.62, 0.85) |
| Sunflowers | `sunflowers` | Sunflowers turned to the light: life that grows toward warmth, fortune and success in full bloom. | `crops/major_19_sun_element_sunflowers.png` | (0.0, 0.55, 0.24, 0.88); (0.76, 0.52, 1.0, 0.84) |

## Judgment  (major_20_judgment)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Pluto | `pluto` | Pluto: transformation through death and rebirth, releasing old schemes to reach healing. | `crops/major_20_judgment_element_pluto.png` | (0.44, 0.09, 0.58, 0.19) |
| Angel's trumpet | `trumpet` | The golden trumpet sounding from above: the call to rise, our true vocation and voice being summoned. | `crops/major_20_judgment_element_trumpet.png` | (0.36, 0.33, 0.64, 0.58) |
| Rising figures | `rising_figures` | Bodies rising with arms outstretched from their graves: the dead reborn, healed and called back to life. | `crops/major_20_judgment_element_rising_figures.png` | (0.0, 0.58, 1.0, 0.86) |

## The World  (major_21_world)

| Element | Key | Description | Icon crop | Tap-zone rects (x0, y0, x1, y1) |
|---|---|---|---|---|
| Saturn | `saturn` | Saturn: structure and discipline, the boundary that closes one cycle so another can begin. | `crops/major_21_world_element_saturn.png` | (0.44, 0.1, 0.58, 0.23) |
| Encircling wreath | `wreath` | The wreath of green fronds surrounding her: a whole made complete, the circle closed at journey's end. | `crops/major_21_world_element_wreath.png` | (0.0, 0.14, 0.24, 0.85); (0.76, 0.14, 1.0, 0.85) |
| Star-scarves | `scarves` | The starry cloth draped across her hands: the boundary between worlds, held loosely and ready to be released. | `crops/major_21_world_element_scarves.png` | (0.2, 0.4, 0.68, 0.62); (0.62, 0.55, 0.82, 0.86) |
