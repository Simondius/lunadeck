# 0060 — Fill-in-the-blank distractors shouldn't be near-synonyms of the answer

**Date:** 2 Sep 2026
**Status:** Accepted

## Context

Simon flagged two cloze (fill-in-the-blank) distractors as too hard in a
way that isn't really testing card knowledge — "void" vs "unknown," and
"levity" vs "spontaneity" — both real words close enough in meaning to
the correct answer that a learner who understood the sentence perfectly
could still pick the "wrong" one. A wrong answer should read as wrong to
someone who knows the card, not be a coin flip between two words that
mean roughly the same thing in that sentence.

## What else the same audit turned up

Reading every cloze round's own sentence against its own word bank (not
just the word lists in isolation — a distractor only matters if it
actually fits the *same blank*), five more of the same pattern surfaced,
all in Fool's node-9 and Emperor's node-8/9:

| Card | Sentence | Answer | Removed distractor | Why it collided |
|---|---|---|---|---|
| Fool | "a fresh ___ starting right after one just closed" | cycle | journey | fits the sentence just as well |
| Fool | "Travels light, takes chances with ___" | levity | spontaneity | near-synonym (Simon's own example) |
| Fool | "calm rather than afraid of the ___" | void | unknown | near-synonym (Simon's own example) |
| Fool | "Trusts that the path appears once you take the ___" | step | leap | fits the sentence just as well |
| Fool | "Says yes to the ___ instead of playing it safe" | unknown | freedom | half-fits the same sentence |
| Emperor | "the instinct to sprout and push forward before ___" | overthinking | pause | near-synonym (both = hesitating) |

Each removed word was swapped for one that doesn't fit the sentence at
all (`stranger`, `anger`, `crowd`, `coin`, `silence`, `thunder`) — same
distractor *count* per round, so difficulty from having more options
isn't lost, only the specific ambiguity is. `data/v2/*_section.json` and
`data/v3/*_section.json` hold identical round content by convention (v3
only resequences v2's own nodes, per `0046`), so both got the same fix
for Fool and Emperor; Lovers, Magician, and Empress's own cloze rounds
were read through the same way and didn't turn up the same problem.

`data/v4/fool_section.json` is a generated file
(`scripts/build-v4-sections.mjs`, built from v3's own Fool section,
`0057`) and was regenerated from the fixed source rather than hand-edited
separately, so v4's own Fool lessons pick up the fix too.
