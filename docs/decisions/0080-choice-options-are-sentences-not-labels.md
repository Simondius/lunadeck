# 0080: A choice round's options are complete sentences, never a bare label

## Context

`choice-round-player.jsx`'s options are deliberately full sentences, not
keywords (`app/globals.css:1470`, `2444`) — the same design choice that
made `zone-chip.jsx` drag a whole sentence rather than a keyword. But
`scripts/build-v4-new-cards.mjs`'s `shortPhrase()` helper, which turns a
`data_card_talking_points.csv` row into a choice option, split on the row's
own " — " and kept only what came before it. Most rows read like a full
clause before the dash ("Trusts a path appears once you take the step —
..."), but a few are a bare label ("Moderation — finding the right balance
rather than swinging to extremes", "Deep listening — she absorbs what
others carry...", "A reckoning — reviewing the past honestly..."). Those
three surfaced as one-word or two-word "sentences" sitting next to three
real sentences in the same round — Temperance, The High Priestess, and
Judgment each hit this at least once, both as their own card's correct
answer and as a distractor pulled into other cards' rounds.

## Decision

**Every choice-round option (and prompt) must be at least three words.**
`shortPhrase()` now falls back to the label plus its own clause whenever
the label alone is under three words, rather than the bare label:

```js
function shortPhrase(note) {
  const dashSplit = note.split(" — ");
  const label = dashSplit[0];
  if (label.split(/\s+/).length >= 3 || dashSplit.length < 2) return label;
  return `${label} — ${dashSplit[1]}`;
}
```

This is a general rule for any future round content in this shape, not
just a one-off fix — a "choice" (or reading-notes "swipe") option that
isn't a real sentence breaks the format's own visual contract. It does
**not** apply to the separate, pre-existing single-keyword swipe rounds on
Fool/Lovers/Empress/Magician/Emperor's own node 6/5 (`0035`-era content) —
those are a genuinely different mechanic, tuned earlier this project for
single words on purpose (the swipe-round font-sizing pass), not
"sentences" that regressed.

## What changed

Reran `scripts/build-v4-new-cards.mjs` after the fix (deterministic, no
`Math.random`, so the diff is exactly the affected phrases) — 9 files
changed, 18 lines each way: `chariot`, `devil`, `hanged_man`, `hermit`,
`hierophant`, `high_priestess`, `judgment`, `moon`, `temperance`
`_section.json`. `capstone_nodes.json` was unaffected (checked directly —
no options under three words there). Confirmed zero remaining violations
across every `data/v2`, `data/v3`, and `data/v4` section file's `choice`
rounds, and `check_data.py`/`npm run build` still pass.
