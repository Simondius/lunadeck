# Spec_Data_Model_Backend
*Converted from `Spec_Data_Model_Backend.pdf`.*

---

## Page 1

Zodiac Tarot App — Card Data Model Reference Page 1
Zodiac Tarot App
Card Data Model — Complete Reference Document
This is the definitive, standalone reference for the structured data underlying the Zodiac Tarot app: the 78-card
deck's identity, symbols, keywords, guidebook text, reversed-card interpretation, birth card lookup, and reading
practices. It's written for a technical reader comfortable with spreadsheets and databases, but who doesn't need
formal schema terminology. Upload this file to the project so its contents persist across future chats.
This document is self-contained. It includes every data table in full, an image gallery of every card and symbol
icon in the deck, plain-language instructions for opening and querying the companion database, and the deck's
actual rules of reading (spreads, birth card calculation, and this app's reversed-card interpretation rule) extracted
from the source guidebook.
Companion files: zodiac_tarot.db (SQLite database, includes all images embedded as BLOBs) and extract_images.py (pulls the images
back out to files). See Section 14.

---

## Page 2

Zodiac Tarot App — Card Data Model Reference Page 2
1. The big picture
The data is organized as eleven separate flat tables (think: eleven spreadsheet tabs), each focused on one kind of
information. Every card has a unique ID, card_key (e.g. major_00_fool), which ties the tables together — look up
the same card_key in different tables to see different aspects of the same card. Planets, zodiac signs, elements, and
suits are tied together the same way, by matching symbol_name.
The eleven tables
Table Rows What it is
1. Card Base List 78 One row per card. The master list, including the filename of that card's image.
2. Major Arcana Symbols 22 The planet or zodiac sign glyph printed on each Major Arcana card.
3. Minor Arcana Attributes 56 The glyphs and banner text printed on each Minor Arcana card.
4. Card Keywords 307 One row per keyword, multiple per card.
5. Card Talking Points 345 One row per reading note, multiple per card.
6. Symbol Significance 137 A standalone glossary of what each Planet / Sign / Element / Modality / Suit means,
independent of any one card.
7. Card Descriptions 78 Each card's guidebook text (verbatim + condensed for mobile), plus this app's
reversed/shadow reading note.
8. Symbol Images 30 Which image file belongs to each Planet, Zodiac Sign, Element, and Suit icon.
9. Birth Card Lookup 21 Maps a reduced birth-date number (1-21) to its Major Arcana card.
10. Card Similarity 6,006 Computed pairwise similarity for every card combination, for tuning lesson difficulty.
See Section 11.
11. Teaching Order 78 The sequence in which cards are taught, easiest to hardest, for curriculum design.
See Section 12.
A twelfth table, Card Images, exists only inside the companion database — it holds the actual image file for every
card, embedded directly as binary data, so the database is a fully self-contained handoff. See Section 14.
An important design boundary, held throughout
Tables 1–3 contain only what's physically printed on a card face. Interpreted meaning (what a card actually means)
lives separately, in Tables 4, 5, 6, and 7. This keeps the structural data independently verifiable against the artwork,
while the interpretive content can be edited without touching it.

---

## Page 3

Zodiac Tarot App — Card Data Model Reference Page 3
2. Card Base List
File: tarot_cards_base.csv | 78 rows | 1 row per card
The master roster of the full 78-card deck.
Column Meaning
card_key Unique ID, e.g. major_04_emperor or minor_wands_02.
arcana_type "major" or "minor".
suit Wands / Cups / Swords / Pentacles for Minor Arcana; blank for Major Arcana.
rank 0-21 for Major Arcana; Ace/2-10/Page/Knight/Queen/King for Minor Arcana.
card_name Full printed name, e.g. "The Fool" or "Five of Cups".
image_file The filename of this card's artwork, e.g. major_00_fool_MASTER.png. Matches a row in the
companion database's Card Images table (Section 14).
Full data: Appendix A.
3. Major Arcana Symbols
File: major_arcana_symbols.csv | 22 rows | 1 row per Major Arcana card
Every Major Arcana card shows exactly one astrological glyph on its face: a planet or a zodiac sign. Confirmed both
from the guidebook and by visually inspecting the artwork.
Column Meaning
card_key Matches Card Base List.
symbol_type "Planet" or "Zodiac Sign".
symbol The specific name, e.g. "Mercury" or "Aries". Matches symbol_name in Symbol Significance
(Section 7) and Symbol Images (Section 9).
10 of the 22 cards are Planet cards; 12 are Zodiac Sign cards. Full data: Appendix B.
4. Minor Arcana Attributes
File: minor_arcana_attributes.csv | 56 rows | 1 row per Minor Arcana card
• Aces (4): three zodiac sign glyphs — the three signs sharing the suit's element.
• Numbered 2-10 (36): a planet glyph and a zodiac sign glyph.
• Court cards (16): two element glyphs — the figure's element and the suit's element.
Column Meaning
card_key Matches Card Base List.
suit Wands / Cups / Swords / Pentacles.
rank_tier "Ace", "Numbered", or "Court".
top_left_glyph What's printed top-left (meaning varies by rank_tier, see above).
top_right_glyph What's printed top-right (meaning varies by rank_tier, see above).
banner_text Suit name (Aces/Numbered) or "[Figure] of [Suit]" (Court).
Verification note: the glyph pattern was confirmed by direct visual inspection of 5 of 56 card images (spanning all three
rank tiers and multiple suits), then applied to the rest via the guidebook's stated planet/sign list, trusting the deck's design

---

## Page 4

Zodiac Tarot App — Card Data Model Reference Page 4
consistency.
Full data: Appendix C.
5. Card Keywords
File: card_keywords.csv | 307 rows | multiple rows per card
Column Meaning
card_key / card_name Identifies the card (card_name repeated here for readability).
keyword_order Position within the card's keyword list.
keyword The keyword or short phrase.
source "guidebook" or "proposed" (authored to fill a gap — see Section 15).
299 rows are guidebook-sourced; 8 are proposed (Queen of Cups, Ace of Swords, and King of Cups). Full data: Appendix D.
6. Card Talking Points
File: card_talking_points.csv | 345 rows | multiple rows per card
Longer-form reading notes for each card. Arrived with full 78-card coverage, no gaps. Full data: Appendix E.
7. Symbol Significance (glossary)
File: symbol_significance.csv | 137 rows | multiple rows per symbol
A standalone glossary of what each recurring symbol means on its own, independent of any card — so "Mars" is
only defined once, not copy-pasted into every card that references it.
Column Meaning
symbol_type Planet, Zodiac Sign, Element, Modality, or Suit.
symbol_name e.g. "Mars", "Aries", "Fire", "Cardinal", "Wands".
phrase_order / phrase One atomic idea per row, in order.
source_card (Planets/Signs only) which Major Arcana passage the meaning was drawn from.
linked_element (Suits only) which Element this suit shares its core meaning with.
Full data: Appendix F.

---

## Page 5

Zodiac Tarot App — Card Data Model Reference Page 5
8. Card Descriptions
File: card_descriptions.csv | 78 rows | 1 row per card
The guidebook's own written description for every card, in three interpretive forms, plus the upright vs. reversed
contrast that most tarot apps need.
Column Meaning
astrological_label The short heading under the card title, e.g. "URANUS" or "MARS IN ARIES, FIRST DECAN".
description_text The full guidebook description, verbatim (line-wraps cleaned up only).
description_condensed A rewritten version sized for a mobile screen without scrolling (54-74 words).
condensed_word_count Word count of description_condensed.
reversed_reading_notes A short phrase (8-15 words) translating the upright meaning into its blocked/shadow form.
See Section 13.7 for the rule behind this.
description_anonymized A rewritten version of description_condensed with every identity "tell" removed - the card's
own name, its own planet/sign glyph names, its rank number, and any comparisons naming
other specific cards. Built for a lesson format that shows a card and asks "is this an accurate
description?" - without this, a learner could just match the name in the text to the name
printed on the card, without needing any real knowledge.
Provenance: description_text and description_condensed trace back to the guidebook (found by discovering the uploaded
PDF was internally a zip of per-page scanned images with clean extracted text — see Section 15).
reversed_reading_notes and description_anonymized are both authored content, not guidebook-sourced.
reversed_reading_notes follows a single explicit rule (Section 13.7) applied consistently across all 78 cards.
description_anonymized was rewritten by hand from description_condensed, card by card, checking each one against that
card's own name, its own symbol glyphs (Section 3/4), and every other card's name, to make sure nothing identifying
leaked through.
Full data: Appendix G.
9. Symbol Images
File: symbol_images.csv | 30 rows | 1 row per symbol icon
Every Planet, Zodiac Sign, and Element already had a dedicated icon image in the project. The four Suits (Wands,
Cups, Swords, Pentacles) did not, so four new icons were generated to match the deck's existing gold line-art style
(thin stroke, no text, white background) — see the gallery in Appendix K.
Column Meaning
symbol_type Planet, Zodiac Sign, Element, or Suit.
symbol_name Matches symbol_name in Symbol Significance (Section 7).
image_file The icon's filename, e.g. Planet_mercury_MASTER.png or Suit_wands_MASTER.png.
Every filename in this table was validated directly against the actual project files — no typos or naming drift. One
flag: the generated Wands icon (a plain rounded rod) is the weakest visual match of the four new suit icons; worth a
redesign if professional art is ever commissioned. Full data: Appendix H.
10. Birth Card Lookup
File: birth_card_lookup.csv | 21 rows

---

## Page 6

Zodiac Tarot App — Card Data Model Reference Page 6
Maps a birth date, reduced to a number between 1 and 21 (see Section 13.3 for the calculation), to its Major Arcana
card. This is the deck's own "birth card" personality feature.
Column Meaning
birth_number 1 through 21.
card_key / card_name The Major Arcana card at that number.
The Fool (0) is intentionally absent — the guidebook's calculation only ever produces 1-21, never 0. A separate
calculation-time override (reduce 10 and 21 one step further) is documented in Section 13.3 rather than encoded as
table rows, since it's a rule applied during calculation, not stored data.
Full data: Appendix I.

---

## Page 7

Zodiac Tarot App — Card Data Model Reference Page 7
11. Card Similarity (for lesson difficulty)
File: card_similarity.csv | 6,006 rows | every ordered pair of the 78 cards
Built to support a specific lesson format: showing a learner two or more cards and asking them to tell them apart.
Some card pairs are thematically close and easy to confuse (harder question); others are obviously distinct (easier
question). This table gives each of the 3,003 unique card pairs a computed similarity score, so lesson difficulty can
be tuned automatically instead of guessed by hand.
Column Meaning
card_key_a / card_key_b The two cards being compared. Both directions are stored (A,B and B,A) so a lookup works
no matter which card you start from.
mean_abs_diff A raw closeness score. Computed by scoring each card on 6 thematic axes
(connection/isolation, action/stillness, control/surrender, security/risk, inner/outer,
ease/struggle, each -3 to +3), then averaging the absolute difference between the two cards
across all 6 axes. Lower = more similar.
similarity_score The same information simplified to 1, 2, or 3: 1 = similar/confusable, 2 = somewhat distinct, 3
= clearly distinct. The cutoffs are set at the actual 33rd/67th percentile of this deck's real score
distribution, not an arbitrary even split of the theoretical range — an earlier attempt using a
fixed range split put 68% of all pairs into "1" and almost none into "3", which was the wrong
calibration.
difficulty_tier The same 1/2/3 spelled out as "Hard"/"Medium"/"Easy", so nothing has to be inverted at read
time. This column exists because the numbers alone are counterintuitive: a LOW
similarity_score (1) means the cards are hard to tell apart, which makes it a HARD lesson
question — the opposite of what "1" tends to suggest by convention. See the gap note below.
Naming history: this column was originally called difficulty_score, using the same 1/2/3 values. That name implied 1 =
easy, 3 = hard, which is backwards from what the number actually measures (it's a similarity score - low means
confusable, which is what makes a pair HARD to distinguish). A design thread hit this confusion directly and had to confirm
the mapping by inference before trusting it in curriculum logic. Renamed to similarity_score, with difficulty_tier added as an
explicit, unambiguous label, specifically so this can't cause the same confusion again.
Provenance and how to treat this table: the 6-axis scoring behind this table was authored in one pass, informed by this
deck's own keywords and descriptions, not computed from an external source. It is a reasonable first draft, not ground
truth. The underlying per-card axis scores are intentionally not included in this database or document — only this final
computed table is. If a specific pair's score looks wrong once you're using it in real lessons, the intended fix is to hand-edit
that row directly in card_similarity, not to regenerate the whole table from axis scores.
Distribution of difficulty_tier across the 3,003 unique pairs:
Tier Pairs % of all pairs
Hard (similarity_score 1) 1,226 40.8%
Medium (similarity_score 2) 834 27.8%
Easy (similarity_score 3) 943 31.4%
Sample: the 10 most confusable and 10 most distinct pairs in the deck
Most confusable (lowest mean_abs_diff):
Card A Card B mean_abs_diff
Temperance Six of Cups 0.17
Ace of Wands Knight of Wands 0.17
Two of Wands Three of Wands 0.17

---

## Page 8

Zodiac Tarot App — Card Data Model Reference Page 8
Card A Card B mean_abs_diff
Two of Wands Knight of Swords 0.17
Three of Wands Page of Swords 0.17
Five of Cups Three of Swords 0.17
Six of Swords Page of Pentacles 0.17
Ten of Pentacles King of Pentacles 0.17
Strength Six of Swords 0.33
Justice Queen of Wands 0.33
Most distinct (highest mean_abs_diff):
Card A Card B mean_abs_diff
The Hanged Man The Sun 4.00
The Moon The Sun 4.00
The Sun Eight of Swords 4.00
The Sun Nine of Swords 4.00
The Hermit The Tower 3.83
The Tower Ten of Cups 3.83
Six of Wands Eight of Swords 3.67
Six of Wands Nine of Swords 3.67
King of Wands Eight of Swords 3.67
King of Wands Nine of Swords 3.67
Full 6,006-row data is not reproduced in this PDF (it would run several hundred pages) — see card_similarity.csv or the card_similarity
table in the database for the complete set.

---

## Page 9

Zodiac Tarot App — Card Data Model Reference Page 9
12. Teaching Order
File: teaching_order.csv | 78 rows | 1 row per card
A force-ranked sequence for all 78 cards, easiest to hardest, produced during curriculum design in a separate
design thread. Determines which order cards are introduced in a learning path.
Column Meaning
teaching_order 1 through 78. Lower numbers are taught earlier/easier; higher numbers later/harder.
card_key / card_name Matches Card Base List. Cross-checked against it with no mismatches.
arcana_type "major" or "minor", included for convenience so this table can be filtered without a join.
Provenance: this ordering is a curriculum design judgment call from outside this data-building thread, not something
derived from card_similarity or the guidebook. It reflects teaching decisions (e.g. teaching all four Aces early, all four Suits'
court cards as a block, then cycling back through each suit's numbered cards) that a similarity or difficulty score alone
wouldn't produce. Treat this as a separate, independent input to curriculum logic, not something to reconcile against
card_similarity's difficulty_tier — the two can legitimately disagree, since "taught early" and "easy to distinguish from other
cards" are different questions.
Full data: Appendix J.

---

## Page 10

Zodiac Tarot App — Card Data Model Reference Page 10
13. Rules of Reading
This section captures how the guidebook itself says to use the deck: its practices, its birth card calculation, and its
three spreads — plus, at the end, this app's own reversed-card rule, clearly marked as an addition since the
guidebook doesn't cover reversed cards at all. This content is documentation, not a queryable table — it's
procedural/instructional rather than tabular data, so it lives here rather than as a CSV.
13.1 Preparing to read
The guidebook suggests a simple, optional ritual before a first reading: a dedicated surface to lay the deck on, a
candle, and a small dish of water with sage to purify the hands before and after. It also suggests consecrating a new
deck once, either by leaving it under a full moon overnight or passing it through incense smoke.
13.2 A Card a Day
A simple daily practice for getting to know the deck: draw one card each morning (or evening, as a recap of the day).
Look at the imagery first and imagine what it's saying before reading its meaning — the guidebook frames this as
building trust in your own instinct before leaning on reference material.
13.3 The Birth Card and the Card of the Year
A numerology-style calculation that maps a birth date to a Major Arcana card, treated as a kind of
personality/element correspondence.
The calculation:
1 Add every digit of the full birth date (day + month + year) together.
2 If the result is greater than 21, add its digits together again.
3 Repeat until the result is between 1 and 21.
4 Look that number up in the Birth Card Lookup table (Section 10) for the matching Major Arcana card.
Worked example from the guidebook (birth date 28/01/1979):
2+8+1+1+9+7+9 = 37 → 37 is over 21, so reduce again: 3+7 = 10 → birth card number 10, The Magician.
Special-case override: if the reduction lands exactly on 10 (Wheel of Fortune) or 21 (World), the guidebook suggests
reducing once more anyway, treating both as "turning-point" cards better passed through than landed on: 10 → 1+0 → 1
(The Magician); 21 → 2+1 → 3 (The Empress). This is exactly what happens in the worked example above — the
calculation doesn't stop at 10, it continues to 1. This override is a calculation-time rule, not a row in Birth Card
Lookup — anything implementing this calculation needs to apply it as logic, not expect the lookup table to encode it.
Card of the Year uses the same reduction method, but only on that year's birthday digits (day + month + current
year) rather than the full birth date. Guidebook example for 2022: 2+8+1+2+0+2+2 = 17 → The Star.
13.4 Meditation on the Elements
A reflective exercise: choose one Element (Air, Water, Earth, or Fire), gather every card in the deck tied to it, and lay
them out to observe. The guidebook prompts questions about what feelings and imagery recur, then invites picking
one Major Arcana card that embodies that element strongly to sit with and journal about over the following days.
13.5 Discovering the Signs

---

## Page 11

Zodiac Tarot App — Card Data Model Reference Page 11
Similar to the Elements meditation, but for a single zodiac sign: gather every card tied to that sign (for Aries, that's
The Emperor plus the Two, Three, and Four of Wands) and look for how the sign's character shows up across all of
them. The guidebook also suggests thinking of real people you know who share that sign, and noticing what the
cards reveal about them.
13.6 The Three Spreads
The guidebook defines two formal card layouts, on top of the single-card daily draw described in 11.2 — together,
these are the deck's three ways of reading.
Single Card — the daily draw
One card, read as a direct message for the day. See 11.2.
Three-Card Spread
Three cards placed left to right, one after another:
Pos. Label Guiding question
1 The current situation Where do I find myself in this moment? What is my starting condition?
2 The obstacle What blocks my energy? What can I work on to free myself?
3 The development What will my next step be?
Elements Spread
Five cards laid out in a cross: one at top (Earth), two on the sides (Air, right; Water, left is actually positioned per the
diagram below), one at bottom (Fire), and one in the center (Intuition). Exact layout from the guidebook:
[1]
[4] [5] [2]
[3]
Pos. Element Guiding question
1 Earth Where can I find nourishment in this situation? What are my starting resources?
2 Air What ideas might inspire me? How can I communicate better?
3 Fire What moves me? What is my passion and my creative engine?
4 Water What are my emotions, and how can I best manage them?
5 Intuition A message from the cards for the situation being analyzed.
13.7 Reading Reversed Cards: Blocked / Shadow Energy
This entire subsection is authored for this app — it is not sourced from the guidebook. The guidebook contains no
reversed-card content whatsoever (confirmed by searching the complete extracted text for any mention of "reversed" —
zero results). A design decision was made to support reversed readings using a single consistent rule, rather than either
skipping reversed readings entirely or authoring 78 entirely independent reversed meanings.
The rule: a reversed card is not a different card with an unrelated meaning. It's the same upright quality, expressed
as blocked, delayed, excessive, or turned inward rather than flowing outward. In practice this takes one of two
shapes:
• The upright quality suppressed or denied — e.g. Ace of Cups upright is emotion flowing into something new;
reversed is that same emotion suppressed or blocked.

---

## Page 12

Zodiac Tarot App — Card Data Model Reference Page 12
• The upright quality curdled into excess — e.g. King of Pentacles upright is generosity born of real abundance;
reversed is that same generosity curdled into greed.
Every reversed_reading_notes entry in Card Descriptions (Section 8) follows this rule and assumes the reader
already knows the card's upright meaning and keywords — the reversed note only explains the translation, without
re-explaining the upright card or restating its keywords as a list.

---

## Page 13

Zodiac Tarot App — Card Data Model Reference Page 13
14. How to Access the Database
Alongside this PDF, a companion file called zodiac_tarot.db holds the same eleven tables described above, as a
real relational SQLite database, plus a twelfth table with every card and symbol image embedded directly as binary
data. This section explains how to open and use it — no prior database experience assumed.
14.1 What SQLite is, and how to open the file
SQLite is a database format that lives entirely in a single file — there's no server to install or run. Three easy ways to
open zodiac_tarot.db:
• DB Browser for SQLite (free, graphical, no coding required) — download from sqlitebrowser.org, then File →
Open Database.
• Command line — if sqlite3 is installed, run sqlite3 zodiac_tarot.db from a terminal in the same folder as
the file.
• Any programming language — Python's built-in sqlite3 module, Node's better-sqlite3, or an ORM like
Prisma/SQLAlchemy can all open this file directly with no setup.
14.2 The tables inside
Table Rows Notes
tarot_cards_base 78 Same as Section 2, plus this is the table every other table's card_key points back
to.
major_arcana_symbols 22 Section 3.
minor_arcana_attributes 56 Section 4.
card_keywords 307 Section 5.
card_talking_points 345 Section 6.
symbol_significance 137 Section 7.
card_descriptions 78 Section 8.
symbol_images 30 Section 9, plus each row's actual icon image embedded as a BLOB.
birth_card_lookup 21 Section 10.
card_similarity 6,006 Section 11.
teaching_order 78 Section 12.
card_images 78 Not a CSV. One row per card with its full artwork image embedded as a BLOB.
Every card_key column has a real foreign key back to tarot_cards_base, enforced by the database itself — it's not
possible to insert a row referencing a card that doesn't exist.
14.3 Example queries
Get everything about one card in a single query:
SELECT b.card_name, s.symbol_type, s.symbol, d.description_condensed, d.reversed_reading_notes
FROM tarot_cards_base b
JOIN major_arcana_symbols s ON s.card_key = b.card_key
JOIN card_descriptions d ON d.card_key = b.card_key
WHERE b.card_key = 'major_04_emperor';
Get all keywords for a card, in order:

---

## Page 14

Zodiac Tarot App — Card Data Model Reference Page 14
SELECT keyword FROM card_keywords
WHERE card_key = 'major_00_fool' ORDER BY keyword_order;
Look up what a symbol means (e.g. for a card's linked planet or sign):
SELECT phrase FROM symbol_significance
WHERE symbol_name = 'Mars' ORDER BY phrase_order;
14.4 Getting the images back out as files
Images are embedded as BLOBs so the database is a single, complete, portable handoff — but a real app should
serve images as static files or from a CDN, not out of SQL query results. A companion script, extract_images.py,
pulls all 108 images back out to a plain folder, using their original filenames (e.g. major_00_fool_MASTER.png). It
has no dependencies beyond the Python standard library. Run it with:
python3 extract_images.py
This creates an extracted_images/ folder next to the database. Every extracted file was verified byte-for-byte
identical to its original source file before this document was finalized.

---

## Page 15

Zodiac Tarot App — Card Data Model Reference Page 15
15. Known gaps, inconsistencies, and judgment calls
Anyone extending this data later should read this list first.
Missing keywords in the source guidebook (resolved)
The guidebook has no keyword line at all for the Queen of Cups or the Ace of Swords (every other card has one).
King of Cups' keywords were missing from the original upload but present in the guidebook and have been added.
For Queen of Cups and Ace of Swords, keywords were authored by paraphrasing each card's own descriptive
paragraph and are flagged source = "proposed" in Card Keywords.
Uranus's governed signs conflict in the source text
The guidebook contradicts itself on whether Uranus governs one sign (Aquarius) or two (Aquarius and Capricorn).
This document uses Aquarius only, matching astrological convention.
Minor Arcana glyphs: spot-checked, not exhaustively verified
5 of 56 Minor Arcana images were visually inspected directly; the rest were filled in from the guidebook's stated
planet/sign list, trusting the deck's design consistency.
Suit icons did not exist originally (now resolved)
Every Planet, Zodiac Sign, and Element had a dedicated icon; the four Suits did not. Four new icons were generated
to match the deck's style and are now embedded in the database. The Wands icon (a plain rounded rod) is the
weakest visual match of the four — worth a redesign if professional art is ever commissioned.
Interpreted meaning is deliberately excluded from Tables 1-3
Tables 1-3 contain only what's physically visible on a card face. Anything requiring outside astrological knowledge —
such as which element a sign belongs to — was deliberately left out, even though it would have been easy to
calculate, to keep that structural layer independently verifiable.
Condensed descriptions are a rewrite, not a summary algorithm
The 78 condensed descriptions were each rewritten by hand against an 80-word budget, not generated
mechanically. The original wording is preserved unchanged alongside it so any condensed version can be checked
against, or rewritten from, the source.
Reversed reading notes are authored, not guidebook-sourced
The guidebook contains zero reversed-card material of any kind. The reversed_reading_notes column is original
content following one explicit rule (blocked/shadow energy — Section 13.7), applied consistently across all 78 cards,
not drawn from any source text.

---

## Page 16

Zodiac Tarot App — Card Data Model Reference Page 16
Anonymized descriptions were hand-verified for leaks, not just hand-written
description_anonymized was checked with an automated scan for each card's own name, its own symbol glyph
names, and its own suit name leaking through — this caught 7 real leaks on the first pass (e.g. the High Priestess's
text originally said "like the moon," naming her own planet symbol) plus one false positive ("Aries" flagged only
because it's a substring of "boundaries"). One conscious exception was kept rather than scrubbed: Death's text still
uses the word "death" thematically ("releasing what no longer has life"), since the card's entire meaning is that
theme and removing the word entirely would make the description uninformative rather than just harder to game.
The birth card special-case override is a rule, not a table row
When the birth-date reduction lands exactly on 10 or 21, the guidebook says to reduce once more rather than stop.
This is documented as calculation logic in Section 13.3 — Birth Card Lookup (Table 9) does not and should not
encode this override as data.
The Elements Spread and daily single-card draw are documentation only
Per a scoping decision partway through building this data, only the Three-Card Spread was considered worth a
queryable table — and ultimately even that was removed, since a spread's positions don't change a card's stored
meaning, only which question that meaning is read against at reading time. All three reading practices are captured
as instructional content in Section 13, not as CSV/database tables.
The database is a derived artifact and can drift out of sync
zodiac_tarot.db is built from the CSV files, not the other way around. Twice during this project's construction,
columns and tables were added to the CSVs without the database being rebuilt to match. Any future change to a
CSV requires re-running the database build script, not just editing the CSV.
Images are embedded for handoff completeness, not for production serving
Storing images as database BLOBs makes this a single, complete, portable file, but most production apps should
serve images as static files or via a CDN rather than through SQL queries. Use extract_images.py (Section 14.4) to
get plain image files before wiring up the app's actual asset pipeline.
Card similarity scores are a single-pass judgment call, not measured data
card_similarity's scores derive from a one-time authored 6-axis scoring pass per card (see Section 11), not from any
external or measured source. Treat the current scores as a working first draft — the intended maintenance path is to
hand-edit specific rows in card_similarity.csv directly once real lesson use reveals a pair that feels miscalibrated,
rather than re-deriving the whole table.
card_similarity's score column was renamed after causing real confusion
The column was originally named difficulty_score using values 1/2/3, which implied 1 = easy and 3 = hard by
common convention. The actual mapping is the opposite: a LOW score means two cards are similar/confusable,
which is what makes them a HARD pair to tell apart in a lesson. A design thread hit this directly and had to infer the
correct mapping before trusting it in curriculum logic. The column is now similarity_score, and a new difficulty_tier
column spells out "Hard"/"Medium"/"Easy" explicitly so this ambiguity can't recur. Any code written against the old
difficulty_score name will need updating.

---

## Page 17

Zodiac Tarot App — Card Data Model Reference Page 17
Teaching order is an independent input, not derived from card_similarity
teaching_order.csv (Section 12) reflects curriculum design decisions made in a separate thread — things like
grouping all four Aces early or teaching court cards as a block — that a similarity score alone wouldn't produce. It is
not guaranteed to agree with card_similarity's difficulty_tier, and shouldn't be reconciled against it; "taught early" and
"easy to distinguish from other cards" are different questions answered by different tables.
Lessons, user progress, and social systems are not part of this data model
This document covers only the tarot content layer (the deck itself). The learning-path/curriculum, gamification, user
progress, and social features referenced in the project's original scope have not been designed yet and are a
separate effort.

---

## Page 18

Zodiac Tarot App — Card Data Model Reference Page 18
16. Companion files
These files should be kept together with this document.
File Size Covered in
zodiac_tarot.db SQLite database All 10 tables plus Card Images — Sections 2-11, 13
extract_images.py Python script Pulls embedded images back out to files — Section 14.4
tarot_cards_base.csv 78 rows Section 2 / Appendix A
major_arcana_symbols.csv 22 rows Section 3 / Appendix B
minor_arcana_attributes.csv 56 rows Section 4 / Appendix C
card_keywords.csv 307 rows Section 5 / Appendix D
card_talking_points.csv 345 rows Section 6 / Appendix E
symbol_significance.csv 137 rows Section 7 / Appendix F
card_descriptions.csv 78 rows Section 8 / Appendix G
symbol_images.csv 30 rows Section 9 / Appendix H
birth_card_lookup.csv 21 rows Section 10 / Appendix I
card_similarity.csv 6,006 rows Section 11
teaching_order.csv 78 rows Section 12 / Appendix J

---

## Page 19

Zodiac Tarot App — Card Data Model Reference Page 19
Appendix A: Card Base List — full data
card_key arcana_
type
suit rank card_name image_file
major_00_fool major 0 The Fool major_00_fool_MASTER.png
major_01_magician major 1 The Magician major_01_magician_MASTER.
png
major_02_high_priestess major 2 The High Priestess major_02_high_priestess_MA
STER.png
major_03_empress major 3 The Empress major_03_empress_MASTER.
png
major_04_emperor major 4 The Emperor major_04_emperor_MASTER.
png
major_05_hierophant major 5 The Hierophant major_05_hierophant_MASTE
R.png
major_06_lovers major 6 The Lovers major_06_lovers_MASTER.pn
g
major_07_chariot major 7 The Chariot major_07_chariot_MASTER.pn
g
major_08_strength major 8 Strength major_08_strength_MASTER.
png
major_09_hermit major 9 The Hermit major_09_hermit_MASTER.pn
g
major_10_wheel_of_fortu
ne
major 10 The Wheel of Fortune major_10_wheel_of_fortune_M
ASTER.png
major_11_justice major 11 Justice major_11_justice_MASTER.pn
g
major_12_hanged_man major 12 The Hanged Man major_12_hanged_man_MAS
TER.png
major_13_death major 13 Death major_13_death_MASTER.pn
g
major_14_temperance major 14 Temperance major_14_temperance_MAST
ER.png
major_15_devil major 15 The Devil major_15_devil_MASTER.png
major_16_tower major 16 The Tower major_16_tower_MASTER.png
major_17_star major 17 The Star major_17_star_MASTER.png
major_18_moon major 18 The Moon major_18_moon_MASTER.pn
g
major_19_sun major 19 The Sun major_19_sun_MASTER.png
major_20_judgment major 20 Judgment major_20_judgment_MASTER.
png
major_21_world major 21 The World major_21_world_MASTER.png
minor_wands_ace minor Wands Ace Ace of Wands minor_wands_ace_MASTER.p
ng
minor_wands_02 minor Wands Two Two of Wands minor_wands_02_MASTER.pn
g
minor_wands_03 minor Wands Three Three of Wands minor_wands_03_MASTER.pn
g

---

## Page 20

Zodiac Tarot App — Card Data Model Reference Page 20
card_key arcana_
type
suit rank card_name image_file
minor_wands_04 minor Wands Four Four of Wands minor_wands_04_MASTER.pn
g
minor_wands_05 minor Wands Five Five of Wands minor_wands_05_MASTER.pn
g
minor_wands_06 minor Wands Six Six of Wands minor_wands_06_MASTER.pn
g
minor_wands_07 minor Wands Seven Seven of Wands minor_wands_07_MASTER.pn
g
minor_wands_08 minor Wands Eight Eight of Wands minor_wands_08_MASTER.pn
g
minor_wands_09 minor Wands Nine Nine of Wands minor_wands_09_MASTER.pn
g
minor_wands_10 minor Wands Ten Ten of Wands minor_wands_10_MASTER.pn
g
minor_wands_page minor Wands Page Page of Wands minor_wands_page_MASTER.
png
minor_wands_knight minor Wands Knight Knight of Wands minor_wands_knight_MASTE
R.png
minor_wands_queen minor Wands Queen Queen of Wands minor_wands_queen_MASTE
R.png
minor_wands_king minor Wands King King of Wands minor_wands_king_MASTER.
png
minor_cups_ace minor Cups Ace Ace of Cups minor_cups_ace_MASTER.pn
g
minor_cups_02 minor Cups Two Two of Cups minor_cups_02_MASTER.png
minor_cups_03 minor Cups Three Three of Cups minor_cups_03_MASTER.png
minor_cups_04 minor Cups Four Four of Cups minor_cups_04_MASTER.png
minor_cups_05 minor Cups Five Five of Cups minor_cups_05_MASTER.png
minor_cups_06 minor Cups Six Six of Cups minor_cups_06_MASTER.png
minor_cups_07 minor Cups Seven Seven of Cups minor_cups_07_MASTER.png
minor_cups_08 minor Cups Eight Eight of Cups minor_cups_08_MASTER.png
minor_cups_09 minor Cups Nine Nine of Cups minor_cups_09_MASTER.png
minor_cups_10 minor Cups Ten Ten of Cups minor_cups_10_MASTER.png
minor_cups_page minor Cups Page Page of Cups minor_cups_page_MASTER.p
ng
minor_cups_knight minor Cups Knight Knight of Cups minor_cups_knight_MASTER.
png
minor_cups_queen minor Cups Queen Queen of Cups minor_cups_queen_MASTER.
png
minor_cups_king minor Cups King King of Cups minor_cups_king_MASTER.pn
g
minor_swords_ace minor Swords Ace Ace of Swords minor_swords_ace_MASTER.
png
minor_swords_02 minor Swords Two Two of Swords minor_swords_02_MASTER.p
ng
minor_swords_03 minor Swords Three Three of Swords minor_swords_03_MASTER.p
ng

---

## Page 21

Zodiac Tarot App — Card Data Model Reference Page 21
card_key arcana_
type
suit rank card_name image_file
minor_swords_04 minor Swords Four Four of Swords minor_swords_04_MASTER.p
ng
minor_swords_05 minor Swords Five Five of Swords minor_swords_05_MASTER.p
ng
minor_swords_06 minor Swords Six Six of Swords minor_swords_06_MASTER.p
ng
minor_swords_07 minor Swords Seven Seven of Swords minor_swords_07_MASTER.p
ng
minor_swords_08 minor Swords Eight Eight of Swords minor_swords_08_MASTER.p
ng
minor_swords_09 minor Swords Nine Nine of Swords minor_swords_09_MASTER.p
ng
minor_swords_10 minor Swords Ten Ten of Swords minor_swords_10_MASTER.p
ng
minor_swords_page minor Swords Page Page of Swords minor_swords_page_MASTER
.png
minor_swords_knight minor Swords Knight Knight of Swords minor_swords_knight_MASTE
R.png
minor_swords_queen minor Swords Queen Queen of Swords minor_swords_queen_MASTE
R.png
minor_swords_king minor Swords King King of Swords minor_swords_king_MASTER.
png
minor_pentacles_ace minor Pentacles Ace Ace of Pentacles minor_pentacles_ace_MASTE
R.png
minor_pentacles_02 minor Pentacles Two Two of Pentacles minor_pentacles_02_MASTER
.png
minor_pentacles_03 minor Pentacles Three Three of Pentacles minor_pentacles_03_MASTER
.png
minor_pentacles_04 minor Pentacles Four Four of Pentacles minor_pentacles_04_MASTER
.png
minor_pentacles_05 minor Pentacles Five Five of Pentacles minor_pentacles_05_MASTER
.png
minor_pentacles_06 minor Pentacles Six Six of Pentacles minor_pentacles_06_MASTER
.png
minor_pentacles_07 minor Pentacles Seven Seven of Pentacles minor_pentacles_07_MASTER
.png
minor_pentacles_08 minor Pentacles Eight Eight of Pentacles minor_pentacles_08_MASTER
.png
minor_pentacles_09 minor Pentacles Nine Nine of Pentacles minor_pentacles_09_MASTER
.png
minor_pentacles_10 minor Pentacles Ten Ten of Pentacles minor_pentacles_10_MASTER
.png
minor_pentacles_page minor Pentacles Page Page of Pentacles minor_pentacles_page_MAST
ER.png
minor_pentacles_knight minor Pentacles Knight Knight of Pentacles minor_pentacles_knight_MAS
TER.png
minor_pentacles_queen minor Pentacles Queen Queen of Pentacles minor_pentacles_queen_MAS
TER.png

---

## Page 22

Zodiac Tarot App — Card Data Model Reference Page 22
card_key arcana_
type
suit rank card_name image_file
minor_pentacles_king minor Pentacles King King of Pentacles minor_pentacles_king_MASTE
R.png

---

## Page 23

Zodiac Tarot App — Card Data Model Reference Page 23
Appendix B: Major Arcana Symbols — full data
card_key symbol_type symbol
major_00_fool Planet Uranus
major_01_magician Planet Mercury
major_02_high_priestess Planet Moon
major_03_empress Planet Venus
major_04_emperor Zodiac Sign Aries
major_05_hierophant Zodiac Sign Taurus
major_06_lovers Zodiac Sign Gemini
major_07_chariot Zodiac Sign Cancer
major_08_strength Zodiac Sign Leo
major_09_hermit Zodiac Sign Virgo
major_10_wheel_of_fortune Planet Jupiter
major_11_justice Zodiac Sign Libra
major_12_hanged_man Planet Neptune
major_13_death Zodiac Sign Scorpio
major_14_temperance Zodiac Sign Sagittarius
major_15_devil Zodiac Sign Capricorn
major_16_tower Planet Mars
major_17_star Zodiac Sign Aquarius
major_18_moon Zodiac Sign Pisces
major_19_sun Planet Sun
major_20_judgment Planet Pluto
major_21_world Planet Saturn

---

## Page 24

Zodiac Tarot App — Card Data Model Reference Page 24
Appendix C: Minor Arcana Attributes — full data
card_key suit rank_tier top_left top_right banner_text
minor_wands_ace Wands Ace Aries · Leo Sagittarius Wands
minor_wands_02 Wands Numbered Mars Aries Wands
minor_wands_03 Wands Numbered Sun Aries Wands
minor_wands_04 Wands Numbered Venus Aries Wands
minor_wands_05 Wands Numbered Saturn Leo Wands
minor_wands_06 Wands Numbered Jupiter Leo Wands
minor_wands_07 Wands Numbered Mars Leo Wands
minor_wands_08 Wands Numbered Mercury Sagittarius Wands
minor_wands_09 Wands Numbered Moon Sagittarius Wands
minor_wands_10 Wands Numbered Saturn Sagittarius Wands
minor_wands_page Wands Court Air Fire Page of Wands
minor_wands_knight Wands Court Fire Fire Knight of Wands
minor_wands_queen Wands Court Water Fire Queen of Wands
minor_wands_king Wands Court Earth Fire King of Wands
minor_cups_ace Cups Ace Cancer · Scorpio Pisces Cups
minor_cups_02 Cups Numbered Venus Cancer Cups
minor_cups_03 Cups Numbered Mercury Cancer Cups
minor_cups_04 Cups Numbered Moon Cancer Cups
minor_cups_05 Cups Numbered Mars Scorpio Cups
minor_cups_06 Cups Numbered Sun Scorpio Cups
minor_cups_07 Cups Numbered Venus Scorpio Cups
minor_cups_08 Cups Numbered Saturn Pisces Cups
minor_cups_09 Cups Numbered Jupiter Pisces Cups
minor_cups_10 Cups Numbered Mars Pisces Cups
minor_cups_page Cups Court Air Water Page of Cups
minor_cups_knight Cups Court Fire Water Knight of Cups
minor_cups_queen Cups Court Water Water Queen of Cups
minor_cups_king Cups Court Earth Water King of Cups
minor_swords_ace Swords Ace Gemini · Libra Aquarius Swords
minor_swords_02 Swords Numbered Moon Libra Swords
minor_swords_03 Swords Numbered Saturn Libra Swords
minor_swords_04 Swords Numbered Jupiter Libra Swords
minor_swords_05 Swords Numbered Venus Aquarius Swords
minor_swords_06 Swords Numbered Mercury Aquarius Swords
minor_swords_07 Swords Numbered Moon Aquarius Swords
minor_swords_08 Swords Numbered Jupiter Gemini Swords
minor_swords_09 Swords Numbered Mars Gemini Swords
minor_swords_10 Swords Numbered Sun Gemini Swords
minor_swords_page Swords Court Air Air Page of Swords

---

## Page 25

Zodiac Tarot App — Card Data Model Reference Page 25
card_key suit rank_tier top_left top_right banner_text
minor_swords_knight Swords Court Fire Air Knight of Swords
minor_swords_queen Swords Court Water Air Queen of Swords
minor_swords_king Swords Court Earth Air King of Swords
minor_pentacles_ace Pentacles Ace Taurus · Virgo Capricorn Pentacles
minor_pentacles_02 Pentacles Numbered Jupiter Capricorn Pentacles
minor_pentacles_03 Pentacles Numbered Mars Capricorn Pentacles
minor_pentacles_04 Pentacles Numbered Sun Capricorn Pentacles
minor_pentacles_05 Pentacles Numbered Mercury Taurus Pentacles
minor_pentacles_06 Pentacles Numbered Moon Taurus Pentacles
minor_pentacles_07 Pentacles Numbered Saturn Taurus Pentacles
minor_pentacles_08 Pentacles Numbered Sun Virgo Pentacles
minor_pentacles_09 Pentacles Numbered Venus Virgo Pentacles
minor_pentacles_10 Pentacles Numbered Mercury Virgo Pentacles
minor_pentacles_page Pentacles Court Air Earth Page of Pentacles
minor_pentacles_knight Pentacles Court Fire Earth Knight of Pentacles
minor_pentacles_queen Pentacles Court Water Earth Queen of Pentacles
minor_pentacles_king Pentacles Court Earth Earth King of Pentacles

---

## Page 26

Zodiac Tarot App — Card Data Model Reference Page 26
Appendix D: Card Keywords — full data
Grouped by card. "(proposed)" marks keywords not found in the original guidebook.
The Fool [major_00_fool]: exploration; levity; nonconformity; intuition; speed; play; spontaneity
The Magician [major_01_magician]: shrewdness; intelligence; personal ability; skill; communication
The High Priestess [major_02_high_priestess]: imagination; reception; sensitivity; listening; magic
The Empress [major_03_empress]: creation; nourishment; life; love; harmony; beauty; in a relationship
The Emperor [major_04_emperor]: action; personal limits; sprouting; life force; leadership
The Hierophant [major_05_hierophant]: faith; search for spirituality; the right distance; the message that comes from the spiritual
world
The Lovers [major_06_lovers]: choice; variety; possibility; choosing with the heart; partnership
The Chariot [major_07_chariot]: emotions; movement; ambition; success; focus
Strength [major_08_strength]: kindness; creative action; balanced strength; awareness
The Hermit [major_09_hermit]: introspection; productive solitude; analysis; the discovery of the inner world; lantern; wisdom
The Wheel of Fortune [major_10_wheel_of_fortune]: synchronicity; opportunity; luck; destiny; everything is connected; cycles
Justice [major_11_justice]: beauty; harmony; sense of justice; responsibility; sense of reality
The Hanged Man [major_12_hanged_man]: pause; abandon; following the flow; sacrificing something to get something better
Death [major_13_death]: mystery; magic; depth; the sickle; cutting dry branches; life
Temperance [major_14_temperance]: exploration; alchemy; finding the right balance in opposites
The Devil [major_15_devil]: break from dependence; visceral force; freedom; codependence
The Tower [major_16_tower]: unexpected transformation; destruction; breaking from old schemes
The Star [major_17_star]: community; nonconformity; hope; nature
The Moon [major_18_moon]: dreams; sensitivity; inner reality; feminine; magic; mystery
The Sun [major_19_sun]: truth; light; success; true self
Judgment [major_20_judgment]: vocation; healing; rebirth
The World [major_21_world]: achieved objective; conclusion of a cycle; exploration
Ace of Wands [minor_wands_ace]: new beginning; saying yes; starting a new project
Two of Wands [minor_wands_02]: choice; focused energy; overall vision; effective action
Three of Wands [minor_wands_03]: discovery; exploration; vision; a project that is fulfilled
Four of Wands [minor_wands_04]: stability; celebration; encounter of opposites
Five of Wands [minor_wands_05]: creation through difficulty; inner conflict; contrasting impulses
Six of Wands [minor_wands_06]: victory; personal pride; fairness; celebration of success
Seven of Wands [minor_wands_07]: courage; showing our nature; valorous action
Eight of Wands [minor_wands_08]: synchronicity; a message arriving; resolution; readiness
Nine of Wands [minor_wands_09]: refuge; recovery; break; regaining strength
Ten of Wands [minor_wands_10]: recognizing limits; being aware of overload; not exaggerating
Page of Wands [minor_wands_page]: exploration; enthusiasm; spontaneity
Knight of Wands [minor_wands_knight]: speed of action; responsiveness; impulsiveness
Queen of Wands [minor_wands_queen]: sensuality; confidence; personal power; artistic creation
King of Wands [minor_wands_king]: leadership; charisma; ability to lead
Ace of Cups [minor_cups_ace]: emotion; joy; new beginning; fertility; abundance
Two of Cups [minor_cups_02]: meeting; relationship; falling in love; emotional exchange
Three of Cups [minor_cups_03]: sharing with a group; affinity; shared ideal; empathic communication
Four of Cups [minor_cups_04]: inner reflection; excessive closure; apathy; loss of interest in the present
Five of Cups [minor_cups_05]: loss; sadness; need to linger on something we no longer have
Six of Cups [minor_cups_06]: nostalgia; childhood; memories of a happy past; return to the past
Seven of Cups [minor_cups_07]: illusion; choice; daydreaming; strength of desire
Eight of Cups [minor_cups_08]: leaving certainty behind; exploration; entering unknown territory
Nine of Cups [minor_cups_09]: fulfilled desire; waiting happily
Ten of Cups [minor_cups_10]: emotional satisfaction; joy; daily happiness
Page of Cups [minor_cups_page]: falling in love; blossoming love; openness of the heart
Knight of Cups [minor_cups_knight]: romantic love; great passion; instability; artistic temperament

---

## Page 27

Zodiac Tarot App — Card Data Model Reference Page 27
Two of Swords [minor_swords_02]: inner search; harmony; individual thought; recollection
Three of Swords [minor_swords_03]: break; separation; difficulty; possibility of integration; awareness
Four of Swords [minor_swords_04]: recovery of energy; rest; awareness; compromise; meditation
Five of Swords [minor_swords_05]: victory and defeat; challenge; break from convention; crisis; maintaining hope
Six of Swords [minor_swords_06]: transition; journey; openness; change of perspective
Seven of Swords [minor_swords_07]: acting in secret; cunning; intelligence; inner communication
Eight of Swords [minor_swords_08]: overthinking; inner obstruction we cause ourselves; need to lighten up
Nine of Swords [minor_swords_09]: nightmare; passion vs. rationality; need to take stock of the situation
Ten of Swords [minor_swords_10]: end; end of a cycle; conclusion
Page of Swords [minor_swords_page]: thought; speed; the mind; arriving message
Knight of Swords [minor_swords_knight]: mental quickness; intelligence; the thinker
Queen of Swords [minor_swords_queen]: irony; clear vision; wisdom; intellectual honesty
King of Swords [minor_swords_king]: overall vision; alternative solutions; strategy
Ace of Pentacles [minor_pentacles_ace]: seed; planning; beginning linked to the world of material goods
Two of Pentacles [minor_pentacles_02]: daily balance; ability to juggle; small chores
Three of Pentacles [minor_pentacles_03]: teamwork; focus; construction; and working toward a common project
Four of Pentacles [minor_pentacles_04]: personal structure; protection; possible rigidity
Five of Pentacles [minor_pentacles_05]: difficulty; misery; need to ask for help
Six of Pentacles [minor_pentacles_06]: generosity; exchange; need; ability to receive
Seven of Pentacles [minor_pentacles_07]: waiting; gestation; pause that brings nourishment
Eight of Pentacles [minor_pentacles_08]: study; attention to detail; ability to concentrate; apprentice
Nine of Pentacles [minor_pentacles_09]: independence; enjoying the fruits of one's labor; abundance; refinement
Ten of Pentacles [minor_pentacles_10]: wealth; abundance; generosity; wonder in everyday life
Page of Pentacles [minor_pentacles_page]: student; apprentice; creative process; curiosity
Knight of Pentacles [minor_pentacles_knight]: determination; dedication; perseverance; willpower
Queen of Pentacles [minor_pentacles_queen]: nurturing; creative capacity; self-care; sensory
King of Pentacles [minor_pentacles_king]: innate generosity; abundance; personal satisfaction; charisma
King of Cups [minor_cups_king]: power of imagination; listening; healing
Queen of Cups [minor_cups_queen]: unconditional love (proposed); sensitivity (proposed); empathy (proposed); emotional healing
(proposed)
Ace of Swords [minor_swords_ace]: clarity (proposed); illumination (proposed); discernment (proposed); truth (proposed)

---

## Page 28

Zodiac Tarot App — Card Data Model Reference Page 28
Appendix E: Card Talking Points — full data
Grouped by card.
The Fool [major_00_fool]
• Beginning and ending in one — a fresh cycle starting right after one just closed
•
Travels light, takes chances with levity
• On the edge of the precipice, but calm rather than afraid of the void
•
Trusts that the path appears once you take the step
• Approaches life with a beginner's mind — curious, unguarded, unjaded
• Nonconformist, revolutionary energy — willing to go against convention
• Says yes to the unknown instead of playing it safe
The Magician [major_01_magician]
• Sees with more than the eyes — perceives both the visible and the invisible
• You already have everything you need; success is about using the resources at hand
• Magic hides in ordinary things — available only to those who know how to look
• Sharp, quick-witted intelligence; can view a situation from multiple angles at once
• A gift for communication — the right words, spoken or written, at the right moment
• Reminds you it's time to act on an idea, not just have it
The High Priestess [major_02_high_priestess]
•
Lives on the threshold — between the seen and unseen worlds
• Her power is in receiving and being, not in acting
• Deep listening — she absorbs what others carry and reflects it back transformed
•
Trust the vision or feeling that comes without explanation
• A quiet, reflected light rather than a blazing one — like the moon catching the sun's rays
• Offers protection and care from a place of stillness
• Signals it's time to turn inward before doing anything outward
The Empress [major_03_empress]
• Mother Earth energy — fertility, abundance, life growing in every direction
• Something is ready to be born — a child, a project, an idea taking shape
• Creation before form — raw, generative chaos that hasn't settled yet
• Nourish, protect, and grow whatever you're tending
• A reminder to love and care for yourself first
• Pleasure, beauty, and the body are not indulgences — they're part of the message
• Abundance that comes from allowing things to flourish, not forcing them
The Emperor [major_04_emperor]
• Ready to act the instant the moment calls for it — no hesitation
• Sets clear boundaries and claims space without apology
• Gives shape and order to what was still raw potential
•
Leadership through decisive, immediate action
• Spring's life force — breaking through and pushing forward
• A spark-first, think-later instinct; leads with action
The Hierophant [major_05_hierophant]
• A bridge between the everyday and the sacred
• When reality feels shaky, lean on faith or tradition to steady it
•
The message arrives through a mentor, teacher, or trusted structure
• Spiritual truth doesn't have to abandon the pleasures of daily life
• Holding something divine within an ordinary, grounded life
The Lovers [major_06_lovers]
• A real choice stands in front of you — has every angle actually been weighed?

---

## Page 29

Zodiac Tarot App — Card Data Model Reference Page 29
•
Two paths, both valid — the challenge is choosing, not lacking options
• Choosing with the heart, not just the head
• Holding the masculine and feminine, or two sides of yourself, in balance
• A partnership or union that asks you to listen to more than one voice — body, mind, and spirit
The Chariot [major_07_chariot]
• Determined forward motion — ambition finally in gear
• Pulled by two forces that need aligning, not fighting, to move you forward
• Success comes from uniting intuition with rational drive
• Emotion is the fuel, not the obstacle, for this journey
• A strong start — this is initiating energy, not sustaining energy
Strength [major_08_strength]
• Real strength is gentle — it comes from the heart, not force
•
Taming the wilder instincts with calm rather than domination
• Courage means acting honestly, not acting fearlessly
• Generosity and warmth are forms of power too
• Connection and relating to others, not standing above them
The Hermit [major_09_hermit]
• Solitude here is productive, not lonely
• A lantern lighting the path one careful step at a time — no need to see the whole road
•
Time to withdraw and look inward before moving again
• Attention to small details reveals the bigger picture
•
The search itself — quiet, patient introspection — is the point
The Wheel of Fortune [major_10_wheel_of_fortune]
• What goes up comes around — nothing here is permanent, high or low
• A turning point; you're at a hinge between one cycle ending and another beginning
•
Fortune and misfortune are both just transitions to learn from
• Stay balanced at the center, even as things spin around you
• Everything is connected — small choices shape what the wheel brings back
Justice [major_11_justice]
• A mirror moment — an honest, unflinching look at yourself
• Acting because it's simply right, not because a rulebook says so
• Responsibility and fairness, driven by the heart rather than obligation
• Seeking balance, harmony, and beauty in how things are resolved
• Cause and effect are catching up — reap what's been sown
The Hanged Man [major_12_hanged_man]
• Suspended, upside down, but calm — not suffering, just paused
• A new perspective comes from surrendering, not struggling
• Pause and let go instead of forcing the next move
• Meditative stillness that deepens awareness
• Sometimes you sacrifice something now to gain something better later
Death [major_13_death]
• Not an ending — a transformation that clears the way for new life
• What no longer has life in it needs to be released, like dead leaves feeding the roots
• Endings free up room for something essential to grow
•
Intense, magnetic, and a little uncomfortable — real change usually is
•
Look beneath the surface for what actually needs to go
Temperance [major_14_temperance]
•
The journey matters more than the destination right now
• Blending different, even opposing, ingredients into something greater than either alone

---

## Page 30

Zodiac Tarot App — Card Data Model Reference Page 30
• Patience and experience refine raw experience into wisdom
• Moderation — finding the right balance rather than swinging to extremes
• Broadening your view by mixing new experiences in
The Devil [major_15_devil]
• Not purely bad — it's misunderstood more than any other card
•
The chains look tight, but they're actually loose enough to remove
•
Freedom is a responsibility you already hold, whether you use it or not
• A visceral, primal pull worth acknowledging rather than denying
• Ask what dependency or habit is really keeping you stuck
The Tower [major_16_tower]
• Sudden, unexpected change — the lightning strike moment
• What falls apart was already unstable; the collapse just makes it visible
•
The point isn't the falling — it's knowing how to fall
• Resisting the change costs more than flowing with it
• Clears the way for a freer view beyond old, rigid thinking
• Sometimes disruption is the only way to break stagnation
The Star [major_17_star]
• Hope returning after the storm — light visible at the end of the tunnel
• An act of giving that seems small but nourishes something larger
• Renewal comes through shared, communal feeling, not isolation
• Staying open and receptive to life, rather than guarded
• A quietly nonconformist light — hope that doesn't need everyone else's approval
The Moon [major_18_moon]
• What's hidden becomes visible in the dark, if you're willing to look
•
Trust intuition and dreams over what's plainly stated
•
Facing the shadow side is part of becoming whole
• A cycle is repeating — notice the pattern before it repeats again
•
The everyday and the spiritual aren't separate; they're two sides of the same coin
The Sun [major_19_sun]
• Pure, uncomplicated joy — like a child's optimism
•
True self-expression; showing your real nature without apology
• Warmth, success, and vitality radiating outward
• Even the Sun can burn — don't let confidence tip into self-centeredness
• Sometimes the wisest move is to step back and simply watch things unfold
Judgment [major_20_judgment]
• A calling being answered — your true vocation coming into focus
• Rebirth requires passing through an ending first
•
Letting go of what no longer belongs to you, to make room for healing
• A reckoning — reviewing the past honestly before moving forward
• Your voice, finally ready to be used
The World [major_21_world]
• A full cycle completed — the circle closes
• Achievement and wholeness; everything has come together
• Don't linger too long in the comfort of "done" — a new journey is already calling
• Completion that clears the way for the next beginning
• Closure that comes from cutting away what's no longer needed
Ace of Wands [minor_wands_ace]
• A new, passionate spark — the "yes" moment for a fresh start
•
The first step of something bigger, not the whole journey yet

---

## Page 31

Zodiac Tarot App — Card Data Model Reference Page 31
• Protect this early spark; it's easy to let it fizzle out
• Say yes to the adventure calling you
• Raw creative energy, ready to be aimed at something
Two of Wands [minor_wands_02]
• A choice between staying close to home or reaching further out
• Survey the whole situation before committing to a direction
• Restless energy looking for the right target
• Planning the next move, not just acting on impulse
Three of Wands [minor_wands_03]
•
The plan is coming into focus — you can finally see where this is going
• Standing at the threshold, glimpsing what's possible if you keep going
• Courage now opens the door to real discovery
• Momentum building after the early uncertainty
Four of Wands [minor_wands_04]
• A moment worth celebrating — plans finally coming into the light
• Stability that comes from opposites meeting in the middle
• A gathering, homecoming, or milestone worth marking
• Warmth and welcome after effort — enjoy this one
Five of Wands [minor_wands_05]
•
Friction and competing voices — the conflict itself can spark creativity
•
Feeling boxed in creatively? Look inward for the way through
•
Tension between standing out and fitting in
•
Turn the conflict into fuel rather than letting it stall you
Six of Wands [minor_wands_06]
• A hard-won victory — enjoy it, but don't get too comfortable
• Recognition and success earned fairly, not at anyone else's expense
• Confidence radiating outward after a win
• Good fortune following genuine effort
Seven of Wands [minor_wands_07]
• Holding your ground — this is not the moment to back down
• Standing up for what you believe, even under pressure
• Courage to show your true position, even if it's the unpopular one
• Defending what matters, one stance at a time
Eight of Wands [minor_wands_08]
• A message or answer is finally on its way
•
Things that were stuck start moving fast now
• Right place, right time — timing is on your side
• Clear, direct communication cutting through delay
Nine of Wands [minor_wands_09]
• Wounded but not out — resting just long enough to go again
• A pause to regroup before the final push
• Resilience built from what's already been survived
•
Finding an unlikely refuge to recover your strength
Ten of Wands [minor_wands_10]
• Carrying more than one person should — time to put some of it down
• Recognizing your limits instead of pushing past all of them
• Delegate; you don't have to do everything yourself
• Success achieved, but at the cost of feeling overloaded

---

## Page 32

Zodiac Tarot App — Card Data Model Reference Page 32
Page of Wands [minor_wands_page]
• Childlike enthusiasm for a brand-new idea
• Curiosity leading the way, fear not invited
• A message or spark of inspiration worth following immediately
• Ready to leap into something unexpected, purely out of excitement
Knight of Wands [minor_wands_knight]
• Acts first, thinks later — impulsive but never boring
• A burst of energy that may burn out fast, so use it while it's hot
• Seeks out risk rather than waiting for it to arrive
• Sudden, unexpected movement or change on the horizon
Queen of Wands [minor_wands_queen]
• Radiant, magnetic confidence — impossible not to notice
• Knows exactly what she wants and isn't shy about pursuing it
• Creative power used openly, not hidden away
• Charisma paired with ambition and follow-through
King of Wands [minor_wands_king]
•
Leadership that makes everyone around them feel more capable
• Passionate fire, but grounded and steady rather than reckless
• Charisma used in service of a shared goal, not just personal glory
• A warm, sustaining presence rather than a flash in the pan
Ace of Cups [minor_cups_ace]
• A new emotional beginning — infatuation, wonder, or an open heart
•
Feelings need to flow, not be bottled up and left still
•
Love and connection arriving in a fresh, uncomplicated way
•
The start of something that touches you emotionally
Two of Cups [minor_cups_02]
• A meeting of hearts — mutual attraction and discovery
• Early-stage connection; still getting to know each other
• Applies to more than romance — falling for a project or place counts too
• An emotional exchange that feels reciprocal
Three of Cups [minor_cups_03]
• Celebrating with your people — friendship and shared joy
• Abundance that comes from community, not solitude
•
Finding others who instantly speak your language
• A good moment to plan and create together
Four of Cups [minor_cups_04]
• Something new is being offered, but you might be too lost in your head to notice
• Nostalgia or daydreaming pulling focus from the present
• Emotional stagnation — restlessness without action
• Check whether you're dwelling on the past instead of receiving what's here now
Five of Cups [minor_cups_05]
• Grieving what's spilled, while missing what's still standing behind you
•
Loss that deserves to be felt, not rushed past
• Not everything is gone — something whole remains if you turn around
•
Turning regret into awareness rather than staying stuck in it
Six of Cups [minor_cups_06]
• Sweet nostalgia — childhood, old friends, simpler times
• Something from the past worth bringing back into the present
•
Innocence and warmth resurfacing

---

## Page 33

Zodiac Tarot App — Card Data Model Reference Page 33
• Reconnecting with what once made you happy
Seven of Cups [minor_cups_07]
•
Tempting options everywhere — but not all of them are what they appear
•
Illusion versus reality; look twice before choosing
•
Too many desires pulling in different directions at once
• Dream freely, but choose with clear eyes
Eight of Cups [minor_cups_08]
• Walking away from something that looks fine but no longer feels right
•
Leaving certainty behind on purpose, even without knowing what's next
• A stagnant chapter that needs closing before a new one opens
• Choosing the unknown over staying stuck
Nine of Cups [minor_cups_09]
• Wishes coming true — contentment and fulfillment
• Something good you've been hoping for is close at hand
• Emotional fullness — a genuinely happy moment
• Savoring anticipation, knowing it's about to pay off
Ten of Cups [minor_cups_10]
•
Lasting happiness — the kind that feels settled, not fleeting
• Everything finally in its place, emotionally speaking
• Peace that radiates outward to the people around you
• A happy family or home moment worth simply enjoying
Page of Cups [minor_cups_page]
•
Falling in love — with a person, an idea, or a new possibility
•
Imagination paired with real feeling, not just fantasy
• An innocent, open-hearted new beginning
• A dreamy message or invitation arriving
Knight of Cups [minor_cups_knight]
• Romantic and artistic — leading with heart and imagination
• Gentle, warm, and genuinely caring, if a little unpredictable
• Pursuing something (or someone) out of love and inspiration
• Passion that can flare bright and fade fast — enjoy it while it lasts
Queen of Cups [minor_cups_queen]
• Unconditional love and deep empathy
• Healing through listening rather than fixing
• Sees past people's surface straight to who they really are
• Unshaken by others' judgment because she trusts her own perception
King of Cups [minor_cups_king]
• Emotional stability — feelings held steady, not suppressed
•
Listening that actually heals the other person
•
Imagination as strength, as long as it stays grounded
• Calm mastery over emotion, used to support others
Ace of Swords [minor_swords_ace]
• Sudden clarity — the fog lifts and the truth is obvious
• Cutting away the unnecessary to get to what actually matters
• Seeing a situation exactly as it is, without emotional static
•
Truth separated cleanly from deception
Two of Swords [minor_swords_02]
• A decision being avoided — the truth is known but not yet faced

---

## Page 34

Zodiac Tarot App — Card Data Model Reference Page 34
• Pausing to find inner balance before choosing
• Blindfolded, but the answer is already inside if you're honest with yourself
• Peace comes first, then the choice becomes clear
Three of Swords [minor_swords_03]
• Heartbreak that's real, but necessary to move through, not around
• Pain acknowledged honestly heals faster than pain denied
• A wound that has to open before it can actually close
•
Facing hurt with compassion instead of avoidance
Four of Swords [minor_swords_04]
• Rest is the actual next step, not another push forward
• Healing time after a hard stretch — take it
• Compromise reached after the storm has passed
• Quiet reflection restoring inner balance
Five of Swords [minor_swords_05]
• Winning at a cost that might not be worth it
• Conflict that leaves both sides bruised — worth asking if it was necessary
• Even in defeat, don't lose hope for something better
• Standing apart from convention, even if it invites pushback
Six of Swords [minor_swords_06]
• Moving from troubled waters toward calmer ground
•
Trust is what makes the journey possible, not just effort
•
Leaving an old way of thinking behind for a new outlook
• Slow, steady transition rather than a sudden leap
Seven of Swords [minor_swords_07]
• Playing it close to the chest — not every card needs to be shown yet
• Clever, resourceful thinking that works quietly rather than loudly
•
Timing matters more than speed here; wait for the right moment
• A bit of strategic secrecy, not necessarily deception
Eight of Swords [minor_swords_08]
•
Trapped by your own thoughts, not by anything actually outside you
• Overthinking has become the obstacle itself
•
The blindfold is self-imposed and can be removed
•
Freedom is closer than it feels — the limitation is mostly mental
Nine of Swords [minor_swords_09]
• Anxiety and worst-case thinking, often worse than reality
• A sleepless night's fears rarely survive the morning light
• Mind and heart in conflict, both talking at once
•
Time to step back and reassess objectively, without the panic
Ten of Swords [minor_swords_10]
• Rock bottom — but also, unmistakably, the end of the cycle
• Nothing left to lose means nothing left holding you back
• A hard ending clears the way for a genuinely new dawn
•
The worst has already happened; what follows is lighter
Page of Swords [minor_swords_page]
• An unexpected message or piece of news is on its way
• Sharp, quick-thinking curiosity — always asking questions
• Passionate about learning, but needs to stay grounded, not just in the head
• Watch for mental overload — even a quick mind needs rest

---

## Page 35

Zodiac Tarot App — Card Data Model Reference Page 35
Knight of Swords [minor_swords_knight]
• Moving fast, driven by both ideas and passion — a combustible combination
• Ask whether this is a clear strategy or just being swept along
•
Focused on the goal, but risking tunnel vision on the way there
• Bold, direct action fueled by conviction
Queen of Swords [minor_swords_queen]
•
Turns raw emotion into clear, honest thought
• Wisdom earned through hard experience, not theory
• Sees through illusion straight to what's actually true
• Direct and unsentimental, but not unkind
• Knows exactly what to cut away and what to protect
King of Swords [minor_swords_king]
• A clear-headed strategist who sees solutions others miss
• Detachment, not coldness, is what makes the judgment sound
• Rising above the situation for a wider view before deciding
• Worth seeking (or being) the calm, rational voice in the room
Ace of Pentacles [minor_pentacles_ace]
• A tangible new opportunity — work, money, or a solid new start
•
Like a seed underground, breaking through takes time and patience
• Self-care and healthy boundaries are part of this new foundation
•
The opportunity is offered; seizing it is up to you
Two of Pentacles [minor_pentacles_02]
•
Juggling multiple responsibilities without dropping any of them
• Balance between work and play, not sacrificing one for the other
•
Flexibility and good timing keep everything moving
•
Finding rhythm in the daily back-and-forth
Three of Pentacles [minor_pentacles_03]
• Steady, focused effort turning a plan into something real
•
Teamwork — different skills combining toward one result
• Discipline and follow-through, not just inspiration
• Building something meant to last
Four of Pentacles [minor_pentacles_04]
• Holding tight to what you've built — sometimes too tight
• Security and boundaries, but watch for rigidity creeping in
• A solid foundation is worth protecting, but not worth hiding behind forever
•
Time to loosen the grip and let a little in
Five of Pentacles [minor_pentacles_05]
• Hard times, but you don't have to face them alone
• Asking for help is the move, not a failure
• Scarcity that feels bigger than it is when faced in isolation
• Unexpected resources often show up once you're honest about the need
Six of Pentacles [minor_pentacles_06]
• Generosity flowing in one direction — check whether it's balanced
• Are you the one giving, or the one who needs to receive right now?
• An exchange of resources, help, or support
• Abundance shared freely, without keeping score
Seven of Pentacles [minor_pentacles_07]
• Patience — the seeds are planted, now it's time to wait
• Reward is coming, but only after the work has had time to mature

---

## Page 36

Zodiac Tarot App — Card Data Model Reference Page 36
• Resisting the urge to rush what needs its own timeline
•
Trust the process, even when growth isn't visible yet
Eight of Pentacles [minor_pentacles_08]
• Mastery built through daily practice, one careful repetition at a time
•
The apprentice mindset — still learning, fully committed
• Attention to detail without losing sight of the bigger goal
• Skill that comes from showing up consistently, not shortcuts
Nine of Pentacles [minor_pentacles_09]
• Enjoying the fruits of your own labor, independently earned
• A quiet, well-deserved moment of rest and refinement
• Self-sufficiency that feels good, not lonely
• Beauty and abundance built from your own consistent care
Ten of Pentacles [minor_pentacles_10]
•
Lasting wealth — the kind built across a family or a lifetime, not overnight
• Gratitude for what's already here, not just what's still wanted
• A sense of belonging and legacy, not just material comfort
• Stability that extends beyond just yourself, to home and family
Page of Pentacles [minor_pentacles_page]
• A student mindset — genuinely curious about something new
• Enjoying the process of learning more than rushing to the result
• Careful, detail-oriented dedication to a new skill
• Patience paired with real intellectual curiosity
Knight of Pentacles [minor_pentacles_knight]
• Slow, steady, and completely dedicated to the task at hand
• Willpower and consistency over flash or speed
• Might be so focused on one thing that everything else falls away
•
The tortoise's pace, but the tortoise usually finishes
Queen of Pentacles [minor_pentacles_queen]
• Practical nurturing — care that shows up as real, useful help
• Grounded, sensory presence; fully in her body and the physical world
• Self-care as a form of strength, not indulgence
• Solving problems with what's actually available, right here and now
King of Pentacles [minor_pentacles_king]
• Success that's been earned through real, sustained effort
• Generosity that flows naturally from genuine abundance
• Stability and rootedness at the core of this achievement
•
Leadership grounded in having actually done the work

---

## Page 37

Zodiac Tarot App — Card Data Model Reference Page 37
Appendix F: Symbol Significance — full data
Grouped by symbol.
Planet: Mercury — source: The Magician
•
communication
•
quick intelligence
•
reason and wit
•
seeing a situation from multiple angles at once
Planet: Moon — source: The High Priestess
•
intuition
•
reception rather than action
•
emotional tides
•
protection and care offered from stillness
Planet: Venus — source: The Empress
•
love
•
pleasure
•
beauty
•
harmony
•
connection and well-being expressed through relationship
Planet: Jupiter — source: The Wheel of Fortune
•
expansion
•
growth
•
luck
•
abundance
•
guiding, generous energy
•
risk of excess if unchecked
Planet: Mars — source: The Tower
•
direct action
•
assertive drive
•
stirring stagnant energy into motion
•
defending against injustice
Planet: Sun — source: The Sun
•
vitality
• warmth
•
true self-expression
•
radiates confidence and success
•
risk of self-centeredness
Planet: Saturn — source: The World
•
structure
•
limits
•
responsibility
•
discipline that closes one cycle so another can begin
Planet: Uranus — source: The Fool
•
innovation
•
sudden insight
•
nonconformist energy
•
revolutionary energy
•
breaking old patterns open

---

## Page 38

Zodiac Tarot App — Card Data Model Reference Page 38
Planet: Pluto — source: Judgment •
transformation through death and rebirth
•
releasing what no longer belongs
•
reaching healing
Planet: Neptune — source: The Hanged Man •
dreams
• mystery •
surrender
•
fluid, hidden depth
•
dissolving rigid boundaries
Zodiac Sign: Aries — source: The Emperor •
initiating instinct
•
courage
•
spark of pure life force
•
acts before it thinks
Zodiac Sign: Taurus — source: The Hierophant •
grounded sensory pleasure
•
patiently manifesting ideals
•
real, lived, material form
Zodiac Sign: Gemini — source: The Lovers •
curiosity
•
duality
•
communicative, investigative mind
• weighing every angle of a choice
Zodiac Sign: Cancer — source: The Chariot •
emotional sensitivity
•
nurturing
•
initiator in matters of intuition
•
initiator in matters of relationship
Zodiac Sign: Leo — source: Strength •
courage
•
personal radiance
•
strength that comes from the heart
•
connects rather than dominates
Zodiac Sign: Virgo — source: The Hermit •
attentive discernment
•
productive solitude
•
focus on detail
•
reveals the bigger picture
Zodiac Sign: Libra — source: Justice •
balance
•
harmony
•
aesthetic, fair-minded sense of justice
•
rooted in relationship
Zodiac Sign: Scorpio — source: Death •
intensity
•
transformation
•
comfort with what lies beneath the surface
•
shedding what no longer has life

---

## Page 39

Zodiac Tarot App — Card Data Model Reference Page 39
Zodiac Sign: Sagittarius — source: Temperance •
exploration
•
optimism
•
valuing the journey over the destination
•
search for broader understanding
Zodiac Sign: Capricorn — source: The Devil •
discipline
•
responsibility
•
practical, earthy ambition
•
built through hard work and clear limits
Zodiac Sign: Aquarius — source: The Star •
nonconformity
•
vision
•
idealistic, community-minded energy
• moves to its own rhythm
Zodiac Sign: Pisces — source: The Moon •
dreams
•
empathy
•
receptive, spiritual depth
•
dissolves the boundary between self and other
Element: Fire •
passion
• will •
active energy
•
vitality
Element: Water •
emotion
•
dreams
•
desire
•
intuition
Element: Air •
thought
•
communication
• words •
speed
• messages
Element: Earth •
growth
• material goods •
nourishment
•
being rooted in the present
Modality: Cardinal •
initiating energy
•
fresh drive
•
leadership
•
starting something new
Modality: Fixed •
persistence
•
stability

---

## Page 40

Zodiac Tarot App — Card Data Model Reference Page 40
•
tenacious, dedicated energy
•
holds steady through the middle of a cycle
Modality: Mutable
•
adaptability
•
variable, flexible energy
•
transition at the end of a cycle
Suit: Wands — source: Ace of Wands / King of Wands / Page of Wands
•
renewing, vital energy
•
bold new adventure
•
daring to say yes
•
creation and transformation
•
exploratory, lively spirit
Suit: Cups — source: Ace of Cups
•
universal love
•
relationships
•
spirituality
•
containing and letting emotion flow, rather than letting it stagnate
Suit: Swords — source: Ace of Swords
•
sudden clarity and illumination
•
discernment, separating the essential from the superfluous
•
separating truth from deceit
Suit: Pentacles — source: Ace of Pentacles
•
stability
•
defining and materializing ideas into form
•
self-care
•
protecting one's boundaries
•
breaking through, like a seed under soil

---

## Page 41

Zodiac Tarot App — Card Data Model Reference Page 41
Appendix G: Card Descriptions — full data
Grouped by card: astrological label, condensed upright version, reversed/shadow note, then full original wording.
The Fool [major_00_fool] — URANUS
Upright, condensed (65w): The Fool stands at both the start and end of the journey, chaos becoming the engine of a new cycle.
He steps to the edge of a precipice unafraid, trusting a path will appear beneath his feet. Associated with Uranus, tied to mystery
and quick, unconventional thinking, his energy resists convention and welcomes the unknown, treating every departure as an
invitation rather than a risk.
Reversed / shadow: Recklessness without awareness, or fear so strong the leap never happens.
Anonymized (no identity tells): This character stands at both the start and end of a journey, chaos becoming the engine of a
new cycle. They step to the edge of a precipice unafraid, trusting a path will appear beneath their feet. Tied to mystery and quick,
unconventional thinking, this energy resists convention and welcomes the unknown, treating every departure as an invitation
rather than a risk.
Original: Card number zero is the first card of the Major Arcana, but it is also the last. It marks a starting point and an end point,
in which chaos becomes the driving force behind exploration and being open to a new cycle. The Fool represents the ability to
take chances with levity, he who departs with a single bag and isn't afraid to delve into the wild and unknown. He is usually
depicted on the edge of a precipice, unperturbed by the void; on the contrary, he seems to dance toward it. He knows that if he
takes a step, a path will appear under his foot. The Fool is associated with Uranus, which in astrology is tied to everything that is
open, a predisposition for exploration and mystery, but also for exploration, intelligence, and technology in terms of quick
communication. His energy is nonconformist, new and revolutionary. The signs he governs are Capricorn and Aquarius. His
element is Air.
The Magician [major_01_magician] — MERCURY
Upright, condensed (72w): The Magician sees beyond the visible, working with the resources already within reach. He knows
magic lives in ordinary things, available only to those who know how to use it. Mercury governs this card, lending sharp wit and
the ability to view a situation from several angles at once. His staff recalls the caduceus, a symbol of healing, and the tools laid
before him show that everything needed is already at hand.
Reversed / shadow: Talent manipulated for personal gain, or a block that keeps real skill from being used.
Anonymized (no identity tells): This character sees beyond the visible, working with the resources already within reach. They
know magic lives in ordinary things, available only to those who know how to use it. A quick, communicative planetary energy
lends sharp wit and the ability to view a situation from several angles at once. Their staff recalls a symbol of healing, and the tools
laid before them show that everything needed is already at hand.
Original: The Magician knows that you can see with more than just your eyes. He knows the visible and invisible and how to
contact both. Card number one is a symbol of innate potential, or rather the personal resources of each of us and our ability to
use them to obtain what we need. The Magician works with intelligence, knows that magic resides in daily things, and that it is
available only to those who know how to see it. He knows it and knows how to use it. The card is associated with Mercury, an
astrological aspect that describes the field of communication and bright, vibrant intelligence. Mercury is reason and irony, gifts of
the Magician, who allows us to see a situation from multiple perspectives. He represents intellect, our skills, and is connected to
written and spoken words. The magic wand of Mercury is the staff, the winged staff that became a symbol of medicine. He
governs the signs of Virgo and Gemini, and his element is Air.
The High Priestess [major_02_high_priestess] — MOON
Upright, condensed (62w): The High Priestess lives on the threshold between worlds, receiving rather than acting. Where the
Magician does, she absorbs, holding the stories of others through a quiet, dreamlike gestation. Her light is borrowed, like the
moon reflecting the sun, delicate and indirect. She embodies the feminine, gestation, and trust in inner vision, offering protection
and care from behind her still, watchful veil.
Reversed / shadow: Intuition ignored or drowned out, or secrets revealed before they're ready to be shared.
Anonymized (no identity tells): This character lives on the threshold between worlds, receiving rather than acting. Where
another figure acts, she absorbs, holding the stories of others through a quiet, dreamlike gestation. Her light is borrowed, like
reflected light, borrowing its glow from elsewhere, delicate and indirect. She embodies the feminine, gestation, and trust in inner
vision, offering protection and care from behind her still, watchful veil.
Original: The High Priestess lives on the threshold. She is a lunar and aquatic creature connected to the world of vision and
reception. The Magician acts, but she receives. Her ability to relate to an inner world allows her to listen to the stories of others

---

## Page 42

Zodiac Tarot App — Card Data Model Reference Page 42
and transform them during the dream gestation that she completes. Water is her element, mutable and connected to the
emotional, just like the moon, which presides over the tides and human emotions, which are enchanted by full moons. The High
Priestess expresses her magic in her ability to be, rather than in action. Her ability to receive makes her beam a rare and unique
light, like the moon, which receives the rays of the sun and transforms them into rarefied and delicate light. It is the bond of
humans with nature, especially with the feminine, the receptive, maternity, and gestation. The moon is intuition and imagination. It
trusts its visions. It speaks of protection and care, the same things the High Priestess offers from her threshold. She governs the
signs of Cancer and Pisces and is connected to the Water element.
The Empress [major_03_empress] — VENUS
Upright, condensed (67w): Card three follows the private reflection of the Two with creation itself. The Empress is Mother Earth
incarnate, giving life to a child, a project, or an idea, and reminding us to nurture ourselves as generously as we nurture others.
Venus, her ruling planet, brings pleasure, bodily wellbeing, and the glow that comes from within, echoed in the crown of stars and
ripened wheat framing her throne.
Reversed / shadow: Nurturing turned smothering, or self-neglect leaving creative energy blocked instead of flowing.
Anonymized (no identity tells): This character follows a private moment of reflection with creation itself. She is Mother Earth
incarnate, giving life to a child, a project, or an idea, and reminding us to nurture ourselves as generously as we nurture others. A
planet of pleasure and beauty brings bodily wellbeing and the glow that comes from within, echoed in the crown of stars and
ripened wheat framing her throne.
Original: The Empress carries the number three of the Major Arcana. Three is creation and follows the intimate reflection of two.
The Empress is love, pleasure, body, harmony, and nourishment. The incarnation of Mother Earth, she represents fertility,
abundance, life that grows and is developed through all its possibilities. She is the one who gives life, be it a new human or a
project, idea, or vision. She is creative chaos, substance before it takes shape, the ability to love, care for, nourish, protect, and
grow. The Empress reminds us of the importance of loving ourselves, and she is deeply connected to the feminine. Venus, the
planet she is tied to, is an expression of beauty, the joy of pleasure, well-being expressed through a relationship; it is our body
and health. It is also the star of the night, the one that shines first, thanks to its inner light. The corresponding signs are Libra and
Taurus, and she belongs to the Earth element.
The Emperor [major_04_emperor] — ARIES
Upright, condensed (66w): The Emperor sits ready to act, giving shape to the creative chaos that came before him. He sets
clear boundaries and claims his own space without hesitation. Paired with Aries, he shares its springtime urgency, the instinct to
sprout and push forward before overthinking. Ruled by Mars's spark, both are combative, reactive, and quick to abandon what no
longer excites them, in pursuit of pure momentum.
Reversed / shadow: Authority curdled into rigidity and control, or an inability to set any boundaries at all.
Anonymized (no identity tells): This character sits ready to act, giving shape to the creative chaos that came before. He sets
clear boundaries and claims his own space without hesitation. He shares a springtime urgency, the instinct to sprout and push
forward before overthinking, ruled by a spark of drive that is combative, reactive, and quick to abandon what no longer excites, in
pursuit of pure momentum.
Original: The Emperor, card number four, sits on his throne but is ready to spring into action. This figure speaks of the energy of
those who can act at the right moment without losing themselves in hesitation. In addition, the Emperor is able to set clear
boundaries and take space for himself. Here, the creative chaos of the previous card takes shape. He rules over life-giving order,
the real manifestation of what we have imagined. The Emperor is associated with the sign Aries. Both react to the life force of
spring, which allows a blade of grass to break through the earth and sprout. Both are action, immediate reaction, and pure life.
Aries loves new things, which it abandons as soon as something new arrives. It is the spark of Mars, the ability to act before
thinking, instinct. Aries and the Emperor are combative, energetic, reactive, and they manifest a great capacity for leadership.
The Hierophant [major_05_hierophant] — TAURUS
Upright, condensed (68w): After the stability of Four, the Hierophant introduces the first real crisis, a deeper search for
meaning. He bridges the everyday and the sacred, teaching that a spiritual perspective can carry us through hard moments.
Pairing him with sensory, present-focused Taurus seems unlikely, until you notice Taurus fully inhabits the here and now. Aries
was divine spark; Taurus is the true birth, holding that flame within earthly form.
Reversed / shadow: Rigid dogma, or rejecting all guidance and structure rather than finding a middle path.
Anonymized (no identity tells): After a period of stability, this character introduces the first real crisis, a deeper search for
meaning. He bridges the everyday and the sacred, teaching that a spiritual perspective can carry us through hard moments. He's
paired with a sensory, present-focused sign that fully inhabits the here and now, holding a flame within earthly form.

---

## Page 43

Zodiac Tarot App — Card Data Model Reference Page 43
Original: Card number five, the Hierophant, is a card in which crisis is experienced for the first time. After the stability of four, five
makes our reality waver and places us in a deeper search for meaning in things. The Hierophant, or pontiff, creates a bridge
between the sky and the earth, between what is habitual, real, manifest, and what lies high in the skies, the rarefied and mystical.
He teaches us that in difficult moments, we must appeal to our more spiritual side. Through this we can overcome those
moments. It seems strange to associate Taurus, a sign connected to the pleasures of life, with such a spiritual card, but Taurus
knows about ephemeral, and therefore fully lives in the present moment, enjoying and satisfying the senses. Taurus has high
values that are manifested in reality. Aries is the divine spark, and Taurus is the true birth, the manifestation of that which is
human on Earth, which holds the flame of the divine within.
The Lovers [major_06_lovers] — GEMINI
Upright, condensed (66w): Gemini's communicative, inquisitive mind, ruled by Mercury and tied to Air, sets the tone for the
Lovers. The card usually shows two figures beneath a watching angel, forming a triangle of body, mind, and spirit. It centers on a
fork in the road: have you weighed every part of the decision? True choice comes from listening to all three voices together, not
from the heart alone.
Reversed / shadow: Indecision, or a choice made from fear and pressure rather than the heart.
Anonymized (no identity tells): A communicative, inquisitive mind sets the tone here. The card usually shows two figures
beneath a watching angel, forming a triangle of body, mind, and spirit. It centers on a fork in the road: have you weighed every
part of the decision? True choice comes from listening to all three voices together, not from the heart alone.
Original: The sign Gemini is characterized by a communicative ability, by the need to investigate and know. Mutable and free, it
is tied to the Air element and governed by the planet Mercury, a symbol of communication and mobility. When we speak of
Gemini, we are in the realm of mind and intellectual reasoning. Likewise, the Lovers card portrays two people, two
complementary elements, often a man and a woman positioned in the form of a triangle with an angel that watches over from
above. This card is tied to the possibilities of choice: What path will you take? Have you assessed all aspects of the matter? It
represents the multiple parts of us, masculine and feminine, and their nuances. Together, the two figures and the angel can share
something about the body, mind, and spirit. Our ability to choose increases and is aware when we listen carefully to these three
voices.
The Chariot [major_07_chariot] — CANCER
Upright, condensed (65w): Cancer is a cardinal sign, an initiator especially in matters of intuition, relationships, and feeling. That
same initiating drive appears in the Chariot, a card of momentum and ambition. Two horses pull it in different directions, symbols
of the forces moving us, and only by aligning intuition with reason can we actually reach the goal. Cancer's emotional current
becomes the fuel for the whole journey.
Reversed / shadow: Momentum stalled, or forcing forward motion without the emotional alignment to sustain it.
Anonymized (no identity tells): A cardinal sign is an initiator especially in matters of intuition, relationships, and feeling, and that
same initiating drive appears in this card of momentum and ambition. Two horses pull it in different directions, symbols of the
forces moving us, and only by aligning intuition with reason can we actually reach the goal. An emotional current becomes the
fuel for the whole journey.
Original: To better understand the relationship between the sign Cancer and card number seven, the Chariot, we must start from
the fact that Cancer is a cardinal sign, and therefore it holds the power to start something. More specifically, Cancer is an initiator
for anything that relates to the world of intuition, relationships and emotions. Those who belong to the sign are generally sensitive
and emotional. The Chariot card, likewise, is a card of beginnings and great movement connected to determination and ambition.
The Chariot is pulled by two horses, which can be a symbol of the forces that move us. Only by aligning our intuition with
rationality can we reach our goal. The driving force of Cancer, its emotional water, will fertilize and feed the journey we must
complete.
Strength [major_08_strength] — LEO
Upright, condensed (62w): Strength depicts a lion, Leo's clear signature: courage, personal power, and a sense of belonging
rather than dominance. This isn't physical force, it's a gentler energy that comes from within and radiates outward. Like Leo, it
means following your heart honestly, acting with generosity, and letting creativity flow in harmony with others, letting that softness
guide and calm our more aggressive instincts.
Reversed / shadow: Self-doubt overpowering courage, or force and control replacing gentle, heart-led strength.
Anonymized (no identity tells): This card depicts a lion: courage, personal power, and a sense of belonging rather than
dominance. This isn't physical force, it's a gentler energy that comes from within and radiates outward. It means following your
heart honestly, acting with generosity, and letting creativity flow in harmony with others, letting that softness guide and calm our

---

## Page 44

Zodiac Tarot App — Card Data Model Reference Page 44
more aggressive instincts.
Original: In card number eight, Strength, a lion is depicted, an obvious reference to the zodiac sign. The characteristics of the
sign Leo are courage, personal power, regality, and the connection with everything, which makes Leo feel fully centered. The
strength of Leo, therefore, is not its supremacy over other creatures, but rather a sense of community and contact, the ability to
relate. The Strength card is not about aggressive strength or physical prowess. Here, it refers to a gentler energy that comes from
within and radiates outward. Strength, like Leo, starts with the heart. It is courage, the ability to follow the heart and act honestly.
It is the act of being generous, having the determination to bring out creativity in harmony with everything else. In this card, our
gentle side can control the more aggressive instincts and change our actions in the world to bring harmony.
The Hermit [major_09_hermit] — VIRGO
Upright, condensed (65w): Virgo is ruled by Mercury in its most grounded form, detail-oriented and quietly organized. The
Hermit masters Virgo's gift for solitude, treating being alone as generative rather than lonely. His lantern lights the path one
careful step at a time, mirroring Virgo's patient attention to detail. As the first card in the deck to carry light, the Hermit's path leads
inward, toward a spiritual center.
Reversed / shadow: Solitude tipping into isolation, or avoiding the reflection this card usually invites.
Anonymized (no identity tells): A grounded, detail-oriented planetary energy quietly organizes here. This character masters a
gift for solitude, treating being alone as generative rather than lonely. Their lantern lights the path one careful step at a time,
mirroring a patient attention to detail. As the first card in the deck to carry light, this path leads inward, toward a spiritual center.
Original: The planet that governs the sign of Virgo is Mercury, here in its earthly appearance. The planet of communication and
speed becomes detail-oriented, able to organize resources and be forward-thinking. Virgo carries its light in the real, material
world, that of daily life. Being the sign Virgo also means knowing how to be independent, seeing solitude as productive and
strength-generating. The Hermit is a master of this art. The solitude of the Hermit is always a state of calm, searching and
introspection. The lantern he carries illuminates the path, step by step, focusing on the details typical of Virgo and its persistence.
The path of the Hermit, the first card that carries light in the Major Arcana, is the path that leads to our spiritual center.
The Wheel of Fortune [major_10_wheel_of_fortune] — JUPITER
Upright, condensed (68w): The Wheel marks a turning point in the journey, the moment personal choice starts shaping destiny.
Fortune and misfortune are simply transitions, each one closing a cycle and opening another. From here, the Major Arcana takes
on a more spiritual tone. Jupiter, its ruling planet, brings expansion, generosity, and guidance, its very name meaning 'guru' in
Hindi. Even abundance needs balance, like standing steady atop a turning wheel.
Reversed / shadow: Resisting the natural turn of events, or feeling stuck in a cycle that won't shift.
Anonymized (no identity tells): This card marks a turning point in the journey, the moment personal choice starts shaping
destiny. Fortune and misfortune are simply transitions, each one closing a cycle and opening another. A planet of expansion,
generosity, and guidance brings its energy here, its very name meaning 'guru' in Hindi. Even abundance needs balance, like
standing steady atop a turning wheel.
Original: Card number ten marks a turning point in the journey from the Fool to the World. The Wheel of Fortune is the card of
destiny, or the personal choices that help form it. The Wheel of Fortune marks the alternating phases of life. Fortune and
misfortune are just transitions, moments to overcome and to learn something from. It is the card of change, highlighting the highs
and lows of life, the end of one cycle and the start of another, something that switches, just like the Major Arcana, which from this
point on assumes more spiritual meanings. Jupiter is the planet of expansion and success. It is generous and abundant, and it
brings prosperity. Jupiter is the guide that leads us through life. In Hindi, the word for Jupiter means guru, or guide. Like in
everything, the abundance of Jupiter can also be too much. It is important to remain balanced, as if we were standing atop the
Wheel of Fortune.
Justice [major_11_justice] — LIBRA
Upright, condensed (62w): After the Wheel's turning point comes real responsibility. Justice holds up a mirror, an honest,
unflinching reflection of what's true. Its rules aren't written in books, they come from an inner sense of care toward the world.
Libra, ruled by Venus just like the Empress, brings its aesthetic, harmony-seeking gaze to this card, so beauty and equanimity
become inseparable from what's fair.
Reversed / shadow: Avoiding responsibility, dishonesty with yourself, or an imbalance left unaddressed.
Anonymized (no identity tells): After a prior turning point comes real responsibility. This card holds up a mirror, an honest,
unflinching reflection of what's true. Its rules aren't written in books, they come from an inner sense of care toward the world. A
sign ruled by a planet of beauty and harmony brings its aesthetic, harmony-seeking gaze here, so equanimity becomes
inseparable from what's fair.

---

## Page 45

Zodiac Tarot App — Card Data Model Reference Page 45
Original: When we encounter the card of Justice, just after the turning point of the Wheel of Fortune, we encounter our true
responsibility. Justice looks us straight in the eyes. It is a mirror, reflecting a real and honest vision. It is our sense of justice that
moves us and moves the actions that come from the heart: that which we do because we can't do otherwise, because we feel
that's how it must be. The rules that govern how Justice acts in the world are not listed in books. They are rules dictated by our
nature, our sense of care and responsibility toward the world around us. Here, Libra, who is governed by Venus as the Empress,
shows the power of the planet in the aesthetic and harmonious gaze it searches for in the world. Beauty, harmony, and
equanimity are characteristics of Libra that fully echo in the card of Justice.
The Hanged Man [major_12_hanged_man] — NEPTUNE
Upright, condensed (63w): Before Neptune's discovery, this card belonged simply to Water: flowing, hanging, embracing, just
like the Hanged Man himself. Suspended upside down, his calm expression gives away the truth, he isn't suffering, he's
meditating, gaining a new perspective through stillness. Crossed legs echo a yoga pose. Neptune, planet of dreams, depth, and
sacrifice, and Water's unstoppable flow, capture the soul of this quiet surrender.
Reversed / shadow: Resisting a needed pause, or stalling without the surrender that makes it meaningful.
Anonymized (no identity tells): Before a certain outer planet's discovery, this card belonged simply to Water: flowing, hanging,
embracing. Suspended upside down, this character's calm expression gives away the truth: they aren't suffering, they're
meditating, gaining a new perspective through stillness. Crossed legs echo a yoga pose. A planet of dreams, depth, and sacrifice,
and Water's unstoppable flow, capture the soul of this quiet surrender.
Original: When the Golden Dawn assigned the Major Arcana zodiac signs, the planet Neptune had not yet been discovered.
Card number twelve, the Hanged Man, corresponded to the Water element. Water is flowing, hanging, embracing, all which the
Hanged Man does, upside down, as he waits and experiences a new perspective. The key to reading the Hanged Man card lies
in his expression. It's true, he hangs upside down from a tree branch; but his expression is calm and serene. He is not suffering.
He is experiencing a moment of pause and abandon that leads him to greater awareness. It's as if he is meditating. He is often
depicted with one leg crossed over the other, like a yoga position. Neptune, the planet of dreams, depth, sacrifice, and its fluid
and unstoppable element of Water, best represents the soul of this card.
Death [major_13_death] — SCORPIO
Upright, condensed (65w): Scorpio belongs to November, when decay feeds new growth just as falling leaves fertilize the roots
beneath them. Sitting between life and death, Scorpio is magnetic and intense, aware that reaching what's essential means
releasing what no longer has life in it. Death carries the same message: not an ending sealed shut, but an organic process that
clears space for fresh blood and new beginnings.
Reversed / shadow: Clinging to what's already over, or fear blocking a transformation that needs to happen.
Anonymized (no identity tells): A fixed water sign belongs to a month when decay feeds new growth, just as falling leaves
fertilize the roots beneath them. Sitting between life and death, this energy is magnetic and intense, aware that reaching what's
essential means releasing what no longer has life in it. This card carries that same message: not an ending sealed shut, but an
organic process that clears space for fresh blood and new beginnings.
Original: Scorpio is the sign of November, the month in which transformation and decay bring new life, like the leaves that fall
from the trees and become fertilizer for roots. Scorpio is a sign that lies between life and death, of the underground world and the
sensuality that leads to life. Scorpio is magnetic, magical, intense, and profound. It knows what lies under the surface and that, to
achieve the essential, we must abandon everything that is superfluous, that has no more lifeblood. Death, card number thirteen,
has a similar message: it does not seal shut the end of something, but rather is an organic and vital process through which we
abandon all that is not viable to make room for new blood, new life.
Temperance [major_14_temperance] — SAGITTARIUS
Upright, condensed (64w): Sagittarius lives by the idea that the journey matters more than the destination, curious and mutable
like its element, Fire, torn between instinct and a wish to belong. Temperance embodies alchemy itself, blending different
ingredients into something greater than their sum. Through experience and study, both Sagittarius and Temperance temper
diverse experiences into deeper understanding, broadening their view of the world along the way.
Reversed / shadow: Impatience with the process, or an imbalance where opposites clash instead of blend.
Anonymized (no identity tells): A mutable fire sign lives by the idea that the journey matters more than the destination, curious
and torn between instinct and a wish to belong. This card embodies alchemy itself, blending different ingredients into something
greater than their sum. Through experience and study, both energies described here temper diverse experiences into deeper
understanding, broadening their view of the world along the way.

---

## Page 46

Zodiac Tarot App — Card Data Model Reference Page 46
Original: The motto of Sagittarius could be that it's not the destination that matters, but the journey. The sign of Sagittarius and
its energy are characterized by the need to know and explore. It is a curious and mutable sign like its element, Fire, often divided
into instinct and the desire to conform to a common feeling. In the card of Temperance, we find the principle of alchemy: mixing
different ingredients to obtain something more than the simple sum of its parts. Through experience and study, it is possible to
reach a new level of depth and understanding. Sagittarius, like Temperance, "tempers" its experiences, which can be very
diverse, in order to discover and know, to broaden its world and vision.
The Devil [major_15_devil] — CAPRICORN
Upright, condensed (69w): Neither wholly good nor evil, the Devil recalls Pan, half-goat like Capricorn, embodying earthy,
instinctual force. Capricorn, a cardinal Earth sign, is practical and control-oriented, especially about material life. Ruled by Saturn,
it understands limits and the hard work required to reach a goal. The Devil speaks to that same responsibility: the chains shown
are loose, not locked, since our freedom is always a choice we're free to make.
Reversed / shadow: Either waking up to a chain you hadn't noticed, or sinking deeper into it.
Anonymized (no identity tells): Neither wholly good nor evil, this card recalls a mythic half-goat figure, embodying earthy,
instinctual force. A cardinal Earth sign is practical and control-oriented, especially about material life. Ruled by a planet of limits, it
understands the hard work required to reach a goal. This card speaks to that same responsibility: the chains shown are loose, not
locked, since our freedom is always a choice we're free to make.
Original: The card of the Devil is perhaps the most misunderstood card in the deck. And yet, like all the other cards, it's not
completely negative or positive. The Devil depicted in the deck recalls Pan, the god of the woods, forests and wild spirits. In his
goat form, like Capricorn—half goat, half fish—he represents the earthly, chthonic, and visceral world that moves our primordial
instinct. The sign Capricorn is a cardinal sign of Earth. This means that it is a practical sign oriented to organization and control,
specifically in the material aspect of life. Governed by Saturn, Capricorn knows limits and responsibility, the hard work it takes to
reach your objectives. The Devil also speaks of responsibility. In fact, the chains around the neck of the people next to him are
loose, not tight, and can easily be removed. The responsibility of our freedom, our free choices, is in our hands.
The Tower [major_16_tower] — MARS
Upright, condensed (67w): Mars is raw energy, the god of war, tied to Fire and unafraid to stir what's grown stagnant. It speaks
up against injustice rather than staying silent. That same activist spirit strikes the Tower: lightning shatters it, but what matters is
how it falls. Rather than resisting the change, it rides the wave, using Mars's fire to survive and see beyond the old, outgrown way
of thinking.
Reversed / shadow: A collapse delayed rather than faced, or clinging to structures already crumbling.
Anonymized (no identity tells): A planet of raw energy, a mythic figure of war, is unafraid to stir what's grown stagnant. It
speaks up against injustice rather than staying silent. That same activist spirit strikes here: lightning shatters the structure, but
what matters is how it falls. Rather than resisting the change, it rides the wave, using that fire to survive and see beyond the old,
outgrown way of thinking.
Original: Mars is pure energy; known as the god of war, it is a symbol of movement, destruction, and transformation. Mars
initiates, pushes and motivates. It knows where to direct vital energy, even if it will create significant changes. It has direct energy
that rouses things that have been stagnant. It's no coincidence that the planet is connected to the Fire element. Mars is the one
that speaks, does not remain silent before injustice, stands up and defends. It has the spirit of an activist. We find this quality also
in the Tower, in which a strike of lightning creates a change. The tower crumbles, but the important thing is that it knows how to
fall. It rides the wave of transformation and does not resist change. It flows. It is the moment to be a warrior, to wear armor, to
protect oneself, to use the fire of Mars to survive and acquire a new and freer vision beyond old ways of thinking.
The Star [major_17_star] — AQUARIUS
Upright, condensed (74w): A woman pours water onto both earth and river, an act that feeds the ground while also serving
something purely ideal, hope, and shared intention. Aquarius carries a double nature: airy and lucid, yet emotionally tied to Water.
Ruled by Uranus, the only planet spinning on its side, Aquarius marches to its own rhythm, valuing collective good over individual
will. In the Star, that uniqueness becomes hope itself, an openness to life and nature.
Reversed / shadow: Hope dimmed, disconnection from community, or faith in the future running dry.
Anonymized (no identity tells): A figure pours water onto both earth and river, an act that feeds the ground while also serving
something purely ideal, hope, and shared intention. A fixed air sign carries a double nature: airy and lucid, yet emotionally tied to
Water. Ruled by an outer planet that spins on its side, this energy marches to its own rhythm, valuing collective good over
individual will. Here, that uniqueness becomes hope itself, an openness to life and nature.

---

## Page 47

Zodiac Tarot App — Card Data Model Reference Page 47
Original: A woman pours water on the earth and into a river. On one side, her action feeds the earth; on the other, she pours
water into water in an apparently useless gesture that is however connected to the ideal, hope and the union of intentions.
Aquarius also has a double meaning. It is tied to Air, being a sign of the element and therefore mental, lucid, full of innovative
solutions. And it is tied to Water through the emotional and spiritual world. Aquarius is "the one who brings water." It reinvigorates
the world through emotions that are not individual but rather shared, with an eye to universal love, the importance of ideals, and
community. Governed by Uranus, the only planet in the solar system that spins on an axis of 98 degrees (basically, the
movement of Uranus is unique, unlike any other planet), it is a nonconformist sign that moves to its own beat, distancing itself
from the majority. In the Star card, the uniqueness of Aquarius becomes hope, the light that can be seen at the end of the tunnel,
fortune, and being open and receptive to life and nature.
The Moon [major_18_moon] — PISCES
Upright, condensed (71w): The Moon asks us to look closely at our hidden, intimate side, where the senses sharpen and
everything takes on a deeper, more magical dimension. It resonates with Pisces, the zodiac's final and most inwardly guided sign,
where daily life and spirit meet, echoed in the two fish swimming in opposite directions. Ruled by Neptune, planet of mystery, this
card invites us into the unknown to face repeating patterns and grow.
Reversed / shadow: Confusion or self-deception overtaking intuition, fear clouding what needs to be seen clearly.
Anonymized (no identity tells): This card asks us to look closely at our hidden, intimate side, where the senses sharpen and
everything takes on a deeper, more magical dimension. It resonates with a mutable water sign, the zodiac's final and most
inwardly guided sign, where daily life and spirit meet, echoed in two fish swimming in opposite directions. Ruled by a planet of
mystery, this card invites us into the unknown to face repeating patterns and grow.
Original: The Moon invites us to observe our more hidden and intimate side from up close. In the darkness, under its light, our
senses become more receptive and every thing we see acquires a new, deeper and magical dimension. Connected to intuition,
profound visions, and to emotion, femininity, dreams, and psychic abilities, the Moon card echoes intensely in Pisces. The Moon
asks us to investigate our darker side because only through the integration of every part can we access a more complete and
spiritually satisfying life. It also asks us to observe the cycles that are completed in our life, to change them, if necessary, to avoid
repeating the same errors. Pisces, the last sign of the zodiac, is a guiding sign, like Aries, the first sign, but Pisces is guided to the
inner world, to our depths. At the end of the zodiac, the daily and the spiritual are united and complementary, just like the symbol
itself of the sign, which depicts two equal and opposing fish. Governed by Neptune, the planet of things that are hidden and
mysterious, it invites us into the unknown, the light of the Moon.
The Sun [major_19_sun] — SUN
Upright, condensed (69w): The Sun and its ruling planet share a name, radiating warmth, life, and true self-expression. Often
shown with a child, symbolizing purity, creativity, and optimism, this card brings fortune and success drawn from authentic identity
rather than performance. As the pulsing heart of the whole system, the Sun offers vital light, but with a caution: get too close and
you can be burned, so avoid centering everything on yourself.
Reversed / shadow: Confidence dimmed, or joy performed rather than genuinely felt.
Anonymized (no identity tells): A card and its ruling planet share a name, radiating warmth, life, and true self-expression. Often
shown with a child, symbolizing purity, creativity, and optimism, this card brings fortune and success drawn from authentic identity
rather than performance. As the pulsing heart of the whole system, it offers vital light, but with a caution: get too close and you
can be burned, so avoid centering everything on yourself.
Original: The Sun, number nineteen, and its planet in this case already correspond in name. In this card, we often find a baby,
which symbolizes purity and inner strength, creativity, the optimism with which to approach the world. The Sun shines and brings
light: it radiates warmth and life, offering fortune and success. This is the card of true self-expression, of our inner nature. The
Sun is the pulsing heart of our system. It emanates light and is a source of life, just like the energy that resides in this card. We
must also remember that if you come too close to the Sun, you can get burned. It's important not to fall into egocentrism, as the
card suggests; and to not always put yourself at the center of things, but rather to sometimes stand back and watch what
happens.
Judgment [major_20_judgment] — PLUTO
Upright, condensed (69w): Pluto, planet of the underworld, governs death, resurrection, and deep transformation, fitting for
Judgment, the second-to-last Major Arcana card yet arguably the true conclusion of the Fool's journey. Here we find our real
calling and true voice, but only by first passing through endings, rebirths, and transformations that reach into our depths. Pluto's
guidance is to release old patterns and anything that no longer belongs, making room for healing.
Reversed / shadow: Avoiding the call to change, or harsh self-judgment blocking real healing.

---

## Page 48

Zodiac Tarot App — Card Data Model Reference Page 48
Anonymized (no identity tells): An outer planet of the underworld governs death, resurrection, and deep transformation, fitting
for this card, second-to-last in its sequence yet arguably the true conclusion of a much longer journey. Here we find our real
calling and true voice, but only by first passing through endings, rebirths, and transformations that reach into our depths. Its
guidance is to release old patterns and anything that no longer belongs, making room for healing.
Original: Pluto is the planet of the Underworld, associated with death, resurrection, and, more specifically, transformation. It is
connected to card number twenty, Judgment. Although it is the second-to-last card of the Major Arcana, I believe it represents the
conclusion of the journey from the Fool to the World. In the Judgment card, we find our true vocation, our mission in the world,
and our voice. In order for this to happen, we must overcome deaths, rebirths, and transformative processes, the same ones that
go through the depths. More specifically, here, Pluto suggests we abandon old schemes and all that no longer belongs to us so
that we can reach healing and rebirth.
The World [major_21_world] — SATURN
Upright, condensed (66w): The journey that began with the Fool completes here. Saturn, the planet that sets boundaries and
cuts away the unnecessary, governs this final card, often shown with a wreath symbolizing wholeness and a closed circle. From
the World, all that's left is to begin again, staying open rather than settling into comfort. Saturn closes this cycle cleanly, clearing
the way for the next one to start.
Reversed / shadow: A cycle left unfinished, or resistance to closing one chapter before starting the next.
Anonymized (no identity tells): A journey that began much earlier completes here. A planet that sets boundaries and cuts away
the unnecessary governs this final card, often shown with a wreath symbolizing wholeness and a closed circle. From here, all
that's left is to begin again, staying open rather than settling into comfort. That same planetary energy closes this cycle cleanly,
clearing the way for the next one to start.
Original: The journey that started with the Fool ends here. The World, card number twenty-one, is the last in the Major Arcana,
and from it a new cycle starts. The World is a card that completes a journey, and Saturn is the planet that severs, sets
boundaries, and separates. Around the central figure of the card, we usually find a wreath, something that represents a whole,
the closing of a circle, the achievement of a goal. From the World card we can only start again. It's important not to close
ourselves off too much, to not stand still in our comfort zone too long, but to be ready to leave our world to explore another one.
Saturn concludes this cycle, severs what's unnecessary, and allows us to embark on this new journey.
Ace of Wands [minor_wands_ace] — ARIES · LEO · SAGITTARIUS
Upright, condensed (63w): This Ace is fire in its rawest form, holding the renewing energy shared by its three signs. It marks a
passionate new adventure, the moment the world says yes and dares you to act. It's the very first step toward a new idea, fragile
like the first spark, needing protection and fuel so it can grow into something lasting rather than fizzling out.
Reversed / shadow: A spark that fizzles before catching, or hesitation instead of a bold yes.
Anonymized (no identity tells): This card is fire in its rawest form, holding the renewing energy shared by its three related signs.
It marks a passionate new adventure, the moment the world says yes and dares you to act. It's the very first step toward a new
idea, fragile like the first spark, needing protection and fuel so it can grow into something lasting rather than fizzling out.
Original: This Ace is the spark of fire, and it contains the renewing and vital energy of the signs that belong to this element. The
Ace of Wands is a new, passionate adventure. When you encounter it, you know that you can dare because the world will say
"yes" to you. It also represents the first action that you take with a new idea or project. It is the first step. This energy needs to be
protected and channeled and must not dissipate like the first sparks of a fire. They need to be fueled so that the fire may burn.
Two of Wands [minor_wands_02] — MARS IN ARIES, FIRST DECAN
Upright, condensed (60w): Every Two divides energy into dialogue and choice, and here Mars and Aries bring pure, active
intensity to that decision. The pull is impulsive and reactive, urging quick movement. This card asks whether your action should
serve your own small world or reach toward the wider community. Before acting, it's worth stepping back to take in the whole
situation clearly.
Reversed / shadow: Indecision, or fear of the unknown keeping you from committing to a direction.
Anonymized (no identity tells): Every card of this number divides energy into dialogue and choice, and here two forces bring
pure, active intensity to that decision. The pull is impulsive and reactive, urging quick movement. This card asks whether your
action should serve your own small world or reach toward the wider community. Before acting, it's worth stepping back to take in
the whole situation clearly.
Original: In the Two of Wands, like with every other Two, we see a division of energy, a dialogue and a choice. In this case, both
Mars and the Aries signs are active, pure energy. They often represent impulsive, vital, and reactive action toward a situation.
This card invites you to choose whether your action will be directed toward your small world or toward the external community.

---

## Page 49

Zodiac Tarot App — Card Data Model Reference Page 49
Where will you choose to act? It's time to observe the general situation so you can decide how to act most effectively.
Three of Wands [minor_wands_03] — SUN IN ARIES, SECOND DECAN
Upright, condensed (59w): The Sun sits at home in Aries here, lending courage and willful clarity to this card. After the Ace's
spark and the Two's decision, the project finally comes into focus, vision replacing uncertainty. We stand at the threshold of a
wider adventure, catching a glimpse of what awaits if we're brave enough to keep moving forward into the unknown.
Reversed / shadow: Vision clouded, or delays stalling progress just as momentum was building.
Anonymized (no identity tells): A warm, confident planetary energy sits comfortably in a bold sign here, lending courage and
willful clarity to this card. After an initial spark and a difficult decision, the project finally comes into focus, vision replacing
uncertainty. We stand at the threshold of a wider adventure, catching a glimpse of what awaits if we're brave enough to keep
moving forward into the unknown.
Original: Here, the Sun is in Aries, a sign that is like its home. The Sun-in-Aries sign is an astrological position where many
aspects of this card recall the courageous and very willful nature of Aries. In the Three of Wands, we find vision; the project
becomes clear. After the initial energy of the Ace and the choice of Two, we can now embark on the wild and unknown adventure
that awaits us out there. We are still on the threshold, in that place that gives us a glimpse of the wonders that await, that we can
encounter if we just have the courage to continue.
Four of Wands [minor_wands_04] — VENUS IN ARIES, THIRD DECAN
Upright, condensed (61w): Two figures celebrate in warm, welcoming light, echoing the Empress and Emperor meeting here as
Venus and Mars. Venus is in exile in Aries, not entirely at ease with its combative energy, yet that friction produces a stability
worth marking. When opposites meet and settle, the result is something to celebrate: gatherings, plans finally taking shape, and
shared warmth after effort.
Reversed / shadow: A celebration postponed, or instability where solid ground was expected.
Anonymized (no identity tells): Two figures celebrate in warm, welcoming light, echoing a nurturing and an assertive energy
meeting here. One of these energies is somewhat out of its natural element, not entirely at ease with the other's combative
nature, yet that friction produces a stability worth marking. When opposites meet and settle, the result is something to celebrate:
gatherings, plans finally taking shape, and shared warmth after effort.
Original: We stand before another solar card. Two figures celebrate in a bright, warm, and welcoming space. In the Four of
Wands, we find grace and celebration. Here, the Empress and Emperor, Venus and Mars, meet. In fact, in this position, Venus is
in exile. She doesn't feel entirely comfortable in the active and warriorlike energy of Mars and the Aries sign. The Four of Wands
evokes this balance. When polar opposites meet, they create a stability worth celebrating. The card is related to celebrations,
meetings, plans that can see the light.
Five of Wands [minor_wands_05] — SATURN IN LEO, FIRST DECAN
Upright, condensed (60w): As with most Fives, this card brings a conflict to work through. Saturn's limits meet Leo's regal,
expressive fire, so self-expression can feel constrained here. Leo's individuality also stands opposite Aquarius's community
focus, adding to the tension. Saturn's invitation is to turn inward, rediscovering strength and security in yourself, letting the friction
itself become raw material for something newly creative.
Reversed / shadow: Conflict avoided entirely, or tension escalating past the point of being useful.
Anonymized (no identity tells): As with most cards of this number, this card brings a conflict to work through. A structured,
limiting energy meets a regal, expressive fire, so self-expression can feel constrained here. This energy's individuality also stands
opposite a more community-focused one, adding to the tension. The invitation is to turn inward, rediscovering strength and
security in yourself, letting the friction itself become raw material for something newly creative.
Original: As often happens with number Five, here, too, we encounter a challenge and a conflict that must be overcome. Saturn,
the master of time, limits, and regulations, meets Leo, a regal, solar, and effusive sign. Therefore, when we find this card, it's
possible that we could experience a moment in which our expressive energy is limited. We must look inward and tap into our
creative resource to find a new path. Leo expresses individuality in opposition to Aquarius, which is on the other hand, connected
to community. Saturn, here, invites us to rediscover security and strength in ourselves by working through the conflict that might
become creative action.
Six of Wands [minor_wands_06] — JUPITER IN LEO, SECOND DECAN
Upright, condensed (66w): After the struggle of the Five, this card holds full self-expression: optimism, joy, and expansion, as
Jupiter meets Leo's warmth. The battle is won and we're heading home to a personal celebration, earned fairly rather than at
anyone else's expense. Still, the card cautions against resting too long on this win. Enjoy it fully, but remember Jupiter's luck is

---

## Page 50

Zodiac Tarot App — Card Data Model Reference Page 50
only ever a season, not a guarantee.
Reversed / shadow: Success going unrecognized, or pride curdling into arrogance.
Anonymized (no identity tells): After a prior struggle, this card holds full self-expression: optimism, joy, and expansion, as a
generous, lucky energy meets a warm one. The battle is won and we're heading home to a personal celebration, earned fairly
rather than at anyone else's expense. Still, the card cautions against resting too long on this win. Enjoy it fully, but remember that
luck is only ever a season, not a guarantee.
Original: After the difficulty of card number Five, the Six of Wands holds full self-expression: optimism, joy, and creative
expansion are all experiences that Jupiter brings together in the sign of Leo. We have won our battle; we are returning home. In
the card we find a personal celebration that carries another piece of advice: be careful not to rest too much on your laurels. This
moment should be celebrated and relished fully, with the understanding, however, that it can change. It is a victory won fairly, in
full agreement with Leo and not at the expense of others. At the same time, Jupiter brings good luck and certain success.
Seven of Wands [minor_wands_07] — MARS IN LEO, THIRD DECAN
Upright, condensed (65w): Mars's raw drive meets Leo's courage and will, pushing us into action. This card says we're ready to
meet whatever comes with valor and readiness, standing firmly behind our own values regardless of the cost. It asks us to show
ourselves fully rather than hide, since our example, like Leo's generous regality, can inspire others even in difficulty. This isn't the
moment to back down.
Reversed / shadow: Feeling overwhelmed and giving ground, rather than standing firm on what matters.
Anonymized (no identity tells): A driving, assertive energy meets courage and will, pushing us into action. This card says we're
ready to meet whatever comes with valor and readiness, standing firmly behind our own values regardless of the cost. It asks us
to show ourselves fully rather than hide, since our example, like a generous kind of regality, can inspire others even in difficulty.
This isn't the moment to back down.
Original: In the Seven of Wands, we proceed toward action. Here, the life force of Mars meets the will and courage of Leo. This
card tells us that we are ready to face everything that will happen with valor, readiness, and energy. It is a card that refers to
personal values, that pushes us to follow our nature, whatever it costs. We must figure out what we are made of and not be afraid
to show ourselves fully. Our value, however, can be inspiration for others, just like Leo shows off its regality with a generous heart
despite difficulties. Let us stand up for our rights, says the Seven of Wands. This is not the time to move back.
Eight of Wands [minor_wands_08] — MERCURY IN SAGITTARIUS, FIRST DECAN
Upright, condensed (64w): Mercury's speed and Sagittarius's directness amplify each other here, the planet of messages
paired with the sign that says things plainly and aims straight at its goal. This card signals an important message about to arrive,
something long stuck suddenly freeing itself, a solution appearing right on time. It's a reminder that you're exactly where you need
to be, at exactly the right moment.
Reversed / shadow: Delays and miscommunication, or frustration as things move slower than expected.
Anonymized (no identity tells): A quick, communicative energy and a direct, straight-talking sign amplify each other here. This
card signals an important message about to arrive, something long stuck suddenly freeing itself, a solution appearing right on
time. It's a reminder that you're exactly where you need to be, at exactly the right moment.
Original: Mercury alongside Sagittarius amplifies its communicative power. In this card, the planet of speed and the
communication of information matches the zodiac sign that can focus on a goal and reach it by clearly expressing its intentions
better than any other sign. Mercury is the messenger; Sagittarius says things as they are. When we encounter this card, we must
wait for the arrival of an important message, something stuck that finally frees itself, the arrival of a solution. We are in the right
place at the right time!
Nine of Wands [minor_wands_09] — MOON IN SAGITTARIUS, SECOND DECAN
Upright, condensed (65w): The Moon's intuitive, reflective pull takes on Sagittarius's restless energy here, giving dreams a
dynamic edge. This card marks a pause for regrouping before the next move toward a goal, intuition sharpened into precision,
like an arrow aimed carefully. There's resilience here too, the strength to return to the fight even while wounded. Under the Moon,
home might be somewhere unconventional, wherever lets you recover.
Reversed / shadow: Exhaustion from refusing to rest, or defensiveness held long after the threat has passed.
Anonymized (no identity tells): An intuitive, reflective energy takes on a restless one here, giving dreams a dynamic edge. This
card marks a pause for regrouping before the next move toward a goal, intuition sharpened into precision, like an arrow aimed
carefully. There's resilience here too, the strength to return to the fight even while wounded. Home, in this case, might be
somewhere unconventional, wherever lets you recover.

---

## Page 51

Zodiac Tarot App — Card Data Model Reference Page 51
Original: The Moon reflects our intuitive and intimate side. When it encounters Sagittarius, like in the Nine of Wands, our dreams
are marked with the dynamic energy of the sign. The Nine of Wands represents a break, during which we can focus on the next
move that will lead us to achieve our goal. Here, intuition is connected to planning and precision, like an arrow shot from a bow. In
the card, there is also a great force, which allows us to firmly go back on the attack even if we are injured. In addition, the Moon
often refers to home. In Sagittarius, our home can be in unusual places, like on the seaside, in the trunk of a tree, or in an
abandoned hut so that you can regain your strength for a new adventure.
Ten of Wands [minor_wands_10] — SATURN IN SAGITTARIUS, THIRD DECAN
Upright, condensed (61w): Saturn's limits meet Sagittarius's love of expansion, an unlikely pairing that can actually teach real
efficiency, if Sagittarius is willing to listen. This card warns against overextending: measure your effort, respect your resources,
and don't try to carry everything at once. It's also a reminder about delegating, since recognizing and accepting our limits is what
actually lets a plan reach completion.
Reversed / shadow: Burnout from refusing to delegate, carrying far more than is sustainable.
Anonymized (no identity tells): A limiting energy meets a love of expansion, an unlikely pairing that can actually teach real
efficiency, if that expansive side is willing to listen. This card warns against overextending: measure your effort, respect your
resources, and don't try to carry everything at once. It's also a reminder about delegating, since recognizing and accepting our
limits is what actually lets a plan reach completion.
Original: In this card, Saturn, master of boundaries and limits, encounters Sagittarius, an expert of expansion and adventure. At
first glance, it might seem like Saturn in this position would be a killjoy; but if Sagittarius cooperates with Saturn's message, it
might learn a lot and be truly efficient. The card itself says so: in the Ten of Wands, we must pay attention and not exaggerate.
Measuring our effort, being aware of our resources, and rationing our energy are necessary if we want to fully reach our objective
and fulfill our plans. The card reminds us also of the importance of delegating. We cannot do everything; we need to recognize,
accept, and respect our limits.
Page of Wands [minor_wands_page] — AIR OF FIRE
Upright, condensed (68w): Fresh, curious, and unafraid, the Page of Wands blends Air's inspiration with Fire's energy, holding
the Ace of Wands as if daring the unknown with a child's open heart. He turns fear into vitality and creative drive, embodying a
new project, journey, or surprise worth embracing rather than avoiding. His spirit trusts the exploratory, lively nature of the whole
Wand suit. It's time to follow what excites you.
Reversed / shadow: Ideas scattered and never acted on, or hesitation where curiosity should lead.
Anonymized (no identity tells): Fresh, curious, and unafraid, this character blends airy inspiration with fiery energy, holding
onto an early spark as if daring the unknown with a child's open heart. They turn fear into vitality and creative drive, embodying a
new project, journey, or surprise worth embracing rather than avoiding. Their spirit trusts the exploratory, lively nature of this
whole suit. It's time to follow what excites you.
Original: The Page of Wands embodies the spirit of Air and energy of Fire. He is fresh and new, like inspiration and curiosity. He
is ready to embark on a new adventure. He holds a wand that is the Ace of Wands. He can dare, say yes to the unknown, stand
before life as a child would, with enthusiasm and purity of heart. The Page of Wands has no fear. He transforms it into vitality and
creative ability. He represents a new project, a journey, something unexpected to be embraced without fear, trusting the
exploratory and lively spirit that characterizes the Wand suit. It's time to follow what inspires us.
Knight of Wands [minor_wands_knight] — FIRE OF FIRE
Upright, condensed (71w): Where the Page merely imagines, the Knight of Wands can't wait to chase the idea down. Pure Fire,
he takes risks eagerly, acting first and thinking later, without the King's steadier awareness. His enthusiasm can burn out quickly
after a strong start, since pacing isn't his strength. He may signal sudden change or the need to move fast without overthinking;
consequences can be sorted out afterward. Nothing about him is boring.
Reversed / shadow: Recklessness without direction, or enthusiasm burning out before anything is finished.
Anonymized (no identity tells): Where a younger figure merely imagines, this character can't wait to chase the idea down. Pure
fire, they take risks eagerly, acting first and thinking later, without a steadier figure's awareness. Their enthusiasm can burn out
quickly after a strong start, since pacing isn't their strength. They may signal sudden change or the need to move fast without
overthinking; consequences can be sorted out afterward. Nothing about them is boring.
Original: Where the Page of Wands visualizes a new idea, the Knight of Wands can't wait to go after it! Governed by the Fire
element, this knight is ready to embark on an adventure. He knows how to take risks; in fact, he often goes in search of them.
First he acts, then he thinks. He doesn't have the awareness of the King of Wands but possesses courage and initiative. Often,
he does not know how to save energy, and it's possible that after an enthusiastic start, his energy quickly dims. He can represent

---

## Page 52

Zodiac Tarot App — Card Data Model Reference Page 52
unexpected change or the need to act quickly without thinking too much. The consequences of our actions can be assessed at a
later time. One thing is certain: with the Knight of Wands, nothing is ever boring!
Queen of Wands [minor_wands_queen] — WATER OF FIRE
Upright, condensed (71w): Radiant and fully herself, the Queen of Wands knows her own power and isn't shy about using it.
Unlike the Queen of Cups's healing energy, hers is creative and magnetic, driven and ambitious toward success. Charismatic
enough to be noticed the moment she enters a room, she's often shown with a black cat, hinting at intuitive, even witchy abilities
she openly embraces rather than hides. She knows exactly what she wants.
Reversed / shadow: Confidence curdling into control, or radiance dimmed by self-doubt.
Anonymized (no identity tells): Radiant and fully herself, this character knows her own power and isn't shy about using it.
Unlike another figure's healing energy, hers is creative and magnetic, driven and ambitious toward success. Charismatic enough
to be noticed the moment she enters a room, she's often shown with a black cat, hinting at intuitive, even witchy abilities she
openly embraces rather than hides. She knows exactly what she wants.
Original: The Queen of Wands is completely herself. Just like the sunflowers that open up on her card, this queen is radiant,
confident and vibrant. She knows she has power and how to use it. Her energy is not that of a healer and listener like the Queen
of Cups, but is creative and magical. Her actions are motivated, ambitious, and focused on success. She is joyous and
charismatic, a person you notice when she enters a room. She is often accompanied by a black cat, which represents her intuitive
abilities, the fact that she is a witch. She does not hide this inclination of hers, but rather shows it off. She knows what she wants
and how to obtain it.
King of Wands [minor_wands_king] — EARTH OF FIRE
Upright, condensed (69w): The true leader of the Wand suit, this King roots Fire's creative, transformative energy in steady
Earth. Honest and capable, he leads others toward shared goals with real charisma, acting more cautiously than the impulsive
Knight but sharing the Queen's gift for putting personal power at the community's service. Near him, people feel stronger and
more capable, warmed by an energy as steady and intense as a well-tended fire.
Reversed / shadow: Leadership turned overbearing, or reluctance to step into the role at all.
Anonymized (no identity tells): The true leader of this suit, this character roots a creative, transformative fire energy in steady
earth. Honest and capable, he leads others toward shared goals with real charisma, acting more cautiously than a more impulsive
figure but sharing another figure's gift for putting personal power at the community's service. Near him, people feel stronger and
more capable, warmed by an energy as steady and intense as a well-tended fire.
Original: Here, we find the true leader of the Wand suit: the King. His Fire energy, that of creation and transformation, is rooted in
the Earth element. He is honest, capable of leading others and reaching common goals, and possesses great charisma. His
courage and actions are more cautious than those of the Knight of Wands. He is more similar to the Queen, since the King also
perfectly manages his great personal power and makes it available to the community, thanks to his inclination for leadership.
When we find ourselves next to a person like this, we feel stronger and more capable. His energy is radiant, intense, like a
constantly stoked fire that warms the long winter nights.
Ace of Cups [minor_cups_ace] — CANCER · SCORPIO · PISCES
Upright, condensed (61w): Cups belong to Water and emotion, tied to universal love, relationship, and spirituality; like water left
still, feelings need to keep flowing rather than stagnate. This card blends Cancer's pure, domestic stream, Scorpio's mysterious
depths of death and rebirth, and Pisces's boundless, healing sea. As an Ace, it marks a true beginning: infatuation, wonder, and
new emotion arriving all at once.
Reversed / shadow: Emotion suppressed or blocked, rather than flowing freely into something new.
Anonymized (no identity tells): This suit belongs to Water and emotion, tied to universal love, relationship, and spirituality; like
water left still, feelings need to keep flowing rather than stagnate. This card blends a pure, domestic stream, a mysterious depth
of death and rebirth, and a boundless, healing sea, drawn from its three related signs. As a first card of its kind, it marks a true
beginning: infatuation, wonder, and new emotion arriving all at once.
Original: The world of Cups is that of the Water element and emotions. This suit is connected to universal love, relationships, and
spirituality. The cup contains things and lets them flow, just like water, which, if left alone, becomes stagnant. In this card we find
the water of the stream, that of Cancer, which is pure, crystalline, and domestic; the water of the swamp, that of Scorpio, which
holds the mystery of death and rebirth, dark and magical depths; and, lastly, the water of Pisces, that of the infinite sea,
boundless, deep and healing. Due to the nature of being an Ace, that of an initiator, the card represents a new beginning, an
infatuation, the discovery of wonder, new emotions that arise.

---

## Page 53

Zodiac Tarot App — Card Data Model Reference Page 53
Two of Cups [minor_cups_02] — VENUS IN CANCER, FIRST DECAN
Upright, condensed (64w): Venus entering Cancer expands our emotional life, especially around love and connection, exactly
what this card shows: two figures crossing cups in a gesture of closeness and discovery. It's the early stage of a relationship,
drawn to someone or something without yet knowing it deeply. This doesn't have to mean romance specifically; it applies just as
well to a new project, place, or experience.
Reversed / shadow: Imbalance or miscommunication where mutual connection should be.
Anonymized (no identity tells): A loving planetary energy entering a nurturing sign expands our emotional life, especially
around love and connection, exactly what this card shows: two figures crossing vessels in a gesture of closeness and discovery.
It's the early stage of a relationship, drawn to someone or something without yet knowing it deeply. This doesn't have to mean
romance specifically; it applies just as well to a new project, place, or experience.
Original: When Venus enters Cancer, we can experience our emotions as an expansion, especially those related to love and
relationships, exactly what we find in the Two of Cups. Two figures meet and cross cups, a symbol of emotional closeness and
discovery. It's the first phase of a relationship in which we don't yet know the other on a deeper level, but we are attracted and
interested. This process does not necessarily refer only to that between two people, but also to a relationship we might have with
a project, a place or an experience.
Three of Cups [minor_cups_03] — MERCURY IN CANCER, SECOND DECAN
Upright, condensed (61w): Where Venus discovers emotion in one relationship, Mercury here communicates feeling across a
whole group. This is the card of friendship, shared intention, and collaborating on something genuinely captivating. It reflects the
ease of being around people who speak your language and understand you instantly. Its abundance comes specifically from
shared experience, the wealth that only community, not solitude, can generate.
Reversed / shadow: Overindulgence, gossip, or feeling like an outsider to the group.
Anonymized (no identity tells): Where one energy discovers emotion in a single relationship, a communicative one here shares
feeling across a whole group. This is the card of friendship, shared intention, and collaborating on something genuinely
captivating. It reflects the ease of being around people who speak your language and understand you instantly. Its abundance
comes specifically from shared experience, the wealth that only community, not solitude, can generate.
Original: Mercury brings the communication of emotions, whereas with Venus we had the discovery of emotions in a relationship
with another. Here, we deeply communicate with many people. It is the card of sisterhood, friendship, sharing intentions, planning
together and working on something that truly captivates us. We share the same language, which is what happens when we are
surrounded by like-minded people, friends like us, with whom we share mutual understanding upon first glance. It is a card
related to abundance, the wealth that comes only from shared experience.
Four of Cups [minor_cups_04] — MOON IN CANCER, THIRD DECAN
Upright, condensed (63w): The Moon is at home in Cancer here, deepening feeling and the need for protection and inner
retreat. Cancer's pull toward memory, nostalgia, and unrealized daydreams can tip into missing what's actually being offered right
now, symbolized by the cup being handed over unnoticed. This card is a signal to check where emotional stagnation might be
causing you to overlook a present opportunity.
Reversed / shadow: Apathy either finally breaking, or deepening into full withdrawal from what's offered.
Anonymized (no identity tells): A reflective, emotional planetary energy is at home in a nurturing sign here, deepening feeling
and the need for protection and inner retreat. That sign's pull toward memory, nostalgia, and unrealized daydreams can tip into
missing what's actually being offered right now, symbolized by a cup being handed over unnoticed. This card is a signal to check
where emotional stagnation might be causing you to overlook a present opportunity.
Original: The Moon in Cancer is in its right position, its home. It represents the emotional world, the depth of feeling, which
encounters home, the need for protection, and one's inner world in Cancer. The Moon is yin energy: feminine, mutable, receptive.
In this card, we find the Moon's tendency in Cancer to remain in touch with the past, memories, nostalgia, or with daydreaming
and desires that haven't yet been realized. This tendency can lead us to lose what we have in the present, whether it's an
opportunity, something new or a new beginning, which is represented on the card by the cup that is handed over to the figure.
When we encounter this card, we must pay attention to things that have become emotionally stagnant in our lives.
Five of Cups [minor_cups_05] — MARS IN SCORPIO, FIRST DECAN
Upright, condensed (67w): Scorpio's fixed water controls emotion to reach the heart of things, meeting Mars's warrior energy of
action and resolution here. A figure stares at three spilled, empty cups, echoing the abundance once shown in the Three of Cups,
while two full cups stand untouched behind them. The card lingers on loss the way Scorpio would, but Mars is present too, quietly
pushing toward transforming pain into awareness.

---

## Page 54

Zodiac Tarot App — Card Data Model Reference Page 54
Reversed / shadow: Starting to move past the loss, or refusing to release it at all.
Anonymized (no identity tells): A fixed water sign controls emotion to reach the heart of things, meeting a warrior-like, resolving
energy here. A figure stares at three spilled, empty vessels, echoing an abundance shown elsewhere in this suit, while two full
vessels stand untouched behind them. The card lingers on loss the way that fixed water sign would, but the warrior energy is
present too, quietly pushing toward transforming pain into awareness.
Original: With the Five of Cups, we enter the world of Scorpio: a fixed water sign that represents the ability to control emotions in
order to go deeper into the heart of a matter. Here, it meets Mars, a warrior planet of action and resolution. Upon first glance, its
message seems hidden in the card, but it's not true. We see a figure who observes three cups that have fallen on the ground and
emptied. As we have seen, the Three of Cups is abundance, sharing, something we have lost in this moment. Behind the figure
there are two other full cups. The card speaks of lingering on a loss, as Scorpio would do. Mars is present in the action we don't
see and is implied by the two full cups; that is, moving from discomfort to awareness, abandoning regret and transforming pain.
Six of Cups [minor_cups_06] — SUN IN SCORPIO, SECOND DECAN
Upright, condensed (63w): With the Sun illuminating Scorpio's tendency to preserve what it values, this card holds innocence,
childhood, and everything worth protecting emotionally. It draws on feelings already known and trusted, encouraging us to
cherish what once felt good and let that memory inspire the present. This is less about dwelling in the past than using it as a
source of comfort and encouragement now.
Reversed / shadow: Nostalgia tipping into being stuck, unable to leave the past behind.
Anonymized (no identity tells): With a bright, illuminating energy meeting a tendency to preserve what it values, this card holds
innocence, childhood, and everything worth protecting emotionally. It draws on feelings already known and trusted, encouraging
us to cherish what once felt good and let that memory inspire the present. This is less about dwelling in the past than using it as a
source of comfort and encouragement now.
Original: The Six of Cups is the card of innocence, childhood, and everything that we understand and know we must preserve at
an emotional level. This is how Scorpio appears when the Sun is in its position. Scorpio tends to preserve what it knows is
valuable. Therefore, the card recalls nostalgia, the memory of the happy past. The sign acts on emotions it already knows and
values. They must be cherished and used as encouragement to find them in the present. It urges us to take care of what has
made us feel good in the past and recognize that in the present to relive the same sensation.
Seven of Cups [minor_cups_07] — VENUS IN SCORPIO, THIRD DECAN
Upright, condensed (67w): Venus is in exile in Scorpio, turning love's goddess greedy for feeling, desire, and fantasy, wanting
to taste everything the seven cups of wealth and success offer. The real theme here is illusion and choice: are we seeing clearly,
or are we the ones creating the deception? Any decision here deserves careful evaluation rather than instinct, though pure,
heartfelt desire can still point toward the right path.
Reversed / shadow: Illusions finally clearing, or choices avoided by staying lost in fantasy.
Anonymized (no identity tells): A loving planetary energy is somewhat out of its natural element in a deep, intense sign, turning
it greedy for feeling, desire, and fantasy, wanting to taste everything the vessels of wealth and success in this scene offer. The
real theme here is illusion and choice: are we seeing clearly, or are we the ones creating the deception? Any decision here
deserves careful evaluation rather than instinct, though pure, heartfelt desire can still point toward the right path.
Original: Venus in Scorpio is in exile. Here, the goddess of love becomes greedy for feelings, desires, and dreams. She wants to
try everything, just like the figure that stands before the seven cups that contain symbols of wealth and success. And yet the key
to this card is illusion and choice, which dismiss Venus in the energy of Scorpio. We are victims of an illusion, and yet are we the
one who is deceiving someone? Are we really observing the situation with clear eyes? This card holds a choice, which must be
carefully evaluated and not instinctively chosen. At the same time, just as Venus would do when in Scorpio, we are reminded to
dream and wish with a pure heart. Our true desire will point us in the right direction.
Eight of Cups [minor_cups_08] — SATURN IN PISCES, FIRST DECAN
Upright, condensed (62w): Pisces's expanding emotion meets Saturn's discipline around time and limits. A figure walks away
from eight familiar cups toward unknown, wild territory, marking a moment when emotions have stagnated and the only real
option is to leave. This card calls for abandoning old patterns and closing a cycle, embracing the number eight's shape as an
infinity of ending folding into new beginning.
Reversed / shadow: Fear keeping you in a stagnant place long after it's stopped serving you.
Anonymized (no identity tells): An expansive, emotional sign meets a disciplined energy around time and limits. A figure walks
away from familiar vessels toward unknown, wild territory, marking a moment when emotions have stagnated and the only real
option is to leave. This card calls for abandoning old patterns and closing a cycle, embracing the shape of its number as an

---

## Page 55

Zodiac Tarot App — Card Data Model Reference Page 55
infinity of ending folding into new beginning.
Original: In this card, Pisces, which is expanding emotion, meets Saturn, the master of time and limits. We see a figure walking
away, leaving eight cups in a familiar place before heading toward another place that is unknown and wild. The card tells us of a
time in which our emotions have reached a stagnant phase from which all we can do is escape. It invites you to abandon old
behaviors and leave your certainties behind, because what was before can no longer be. It is time for transformation, to close a
cycle and begin a new journey, as the number of this card suggests: 8, or the infinity with end and beginning.
Nine of Cups [minor_cups_09] — JUPITER IN PISCES, SECOND DECAN
Upright, condensed (59w): Pisces's emotional depth meets Jupiter's expansion and fulfillment, making this the card of desires
realized. If you want something, this card suggests it's already on its way. Nine, the number just before completion, holds a place
of full, joyful anticipation rather than impatience, a sign that something genuinely good is close at hand and worth savoring in the
meantime.
Reversed / shadow: Dissatisfaction despite having enough, or seeking fulfillment in excess instead.
Anonymized (no identity tells): A deep, emotional sign meets an expansive, fulfilling energy, making this the card of desires
realized. If you want something, this card suggests it's already on its way. Sitting just before completion, it holds a place of full,
joyful anticipation rather than impatience, a sign that something genuinely good is close at hand and worth savoring in the
meantime.
Original: The Nine of Cups is the card of fulfilled desires. It can't be any other way since, here, Pisces, and thus the inner world,
emotions and dreams, meet Jupiter, the planet of success, expansion and fulfillment. Pisces carries emotional depth and fullness
that foretells the arrival of truly happy days. If we want something, here, we know it's about to happen. The cups are almost
complete: Nine, the number before Ten, invites us to a place of full and joyous expectation, because we know that something
beautiful is about to arrive.
Ten of Cups [minor_cups_10] — MARS IN PISCES, THIRD DECAN
Upright, condensed (59w): Mars's usually roaring energy finds calm here, anchored by Pisces's peace and harmony. This card
reflects real satisfaction with what's been achieved, full presence, and everything settled comfortably in its place. The feeling is
magnetic and grounding, elevating everyday life rather than chasing something bigger. It's simply a genuinely happy moment,
worth noticing and enjoying rather than rushing past.
Reversed / shadow: A happy picture that doesn't match how disconnected things actually feel underneath.
Anonymized (no identity tells): A usually roaring, active energy finds calm here, anchored by a peaceful, harmonious sign. This
card reflects real satisfaction with what's been achieved, full presence, and everything settled comfortably in its place. The feeling
is magnetic and grounding, elevating everyday life rather than chasing something bigger. It's simply a genuinely happy moment,
worth noticing and enjoying rather than rushing past.
Original: The emerging and roaring force of Mars, here, finds an anchor of peace and harmony in the sign of Pisces. In this card
there is satisfaction for what we have achieved, awareness and attention to the present, where everything is in its place.
Emotional satisfaction is important when we encounter this card. The person often radiates a magnetic and rooting sense of
peace. Personal vibrations are elevated, and it will be easy to bring joy to your life. It is a truly happy moment. Let us enjoy it.
Page of Cups [minor_cups_page] — AIR OF WATER
Upright, condensed (62w): Air and Water combine here, inspiration mixed with feeling. The Page of Cups works to turn dreams
into reality, marking the beginning of an exciting connection, whether with a person, a project, or an experience. Pure imagination
and lightness rooted in genuine feeling define him. Tied to childhood and innocence, he carries the very first seed of an emerging
love, still unfolding.
Reversed / shadow: Emotional immaturity, or idealizing a connection that isn't what it seems.
Anonymized (no identity tells): Air and Water combine here, inspiration mixed with feeling. This character works to turn dreams
into reality, marking the beginning of an exciting connection, whether with a person, a project, or an experience. Pure imagination
and lightness rooted in genuine feeling define them. Tied to childhood and innocence, they carry the very first seed of an
emerging love, still unfolding.
Original: The Page of Cups represents the elements of Air and Water together. This means inspiration mixed with emotion. The
Page of Cups is someone who works to make our dreams a reality. He is the beginning of an exciting journey, a new encounter,
the first phase of falling in love, and not just with a person but also with a project, place, or experience. He is pure imagination,
levity, beauty rooted in personal feeling. The Page of Cups is connected to childhood and purity and carries the seed of an
emerging love.

---

## Page 56

Zodiac Tarot App — Card Data Model Reference Page 56
Knight of Cups [minor_cups_knight] — FIRE OF WATER
Upright, condensed (60w): Water's romanticism meets Fire's passion in an unstable but powerful mix. This Knight can
accomplish real things through love, often drawn to art, whether painting, photography, theater, or music. He offers genuine
gentleness and warmth, but his fire can flare and fade quickly, making him inspiring yet unpredictable, someone who lives fully in
both the emotional and the creative world.
Reversed / shadow: Charm without follow-through, or moodiness where steady warmth was expected.
Anonymized (no identity tells): Water's romanticism meets Fire's passion in an unstable but powerful mix. This character can
accomplish real things through love, often drawn to art, whether painting, photography, theater, or music. They offer genuine
gentleness and warmth, but their fire can flare and fade quickly, making them inspiring yet unpredictable, someone who lives fully
in both the emotional and the creative world.
Original: The Knight of Cups moves between two opposing elements: the romanticism of the Water element and the passion of
Fire. Although it is unstable, it can complete great missions through love. He is an inspiring person often tied to the world of arts:
painting, photography, theater, music. The Knight of Cups lives in the world of art and love. He is capable of great gentleness and
genuine warmth, even if he can be very unstable and mutable and his fire can quickly extinguish.
Queen of Cups [minor_cups_queen] — WATER OF WATER
Upright, condensed (54w): The Queen of Cups is pure Water, the emotional element in its fullest form. She loves without
condition, listens with real sensitivity, and heals through empathy rather than advice. Pure of heart, she isn't swayed by others'
judgments, because she sees straight through to the soul beneath them, meeting people exactly where they are.
Reversed / shadow: Compassion tipping into self-sacrifice, or overwhelm from absorbing too much feeling.
Anonymized (no identity tells): This character is pure Water, the emotional element in its fullest form. She loves without
condition, listens with real sensitivity, and heals through empathy rather than advice. Pure of heart, she isn't swayed by others'
judgments, because she sees straight through to the soul beneath them, meeting people exactly where they are.
Original: The Queen of Cups is the manifestation of the soul of Water. She can love unconditionally, is very sensitive and
receptive, and knows how to listen and heal through empathy. She is pure of heart and doesn't let herself be influenced by the
judgments of those she encounters, because she can see their soul.
King of Cups [minor_cups_king] — EARTH OF WATER
Upright, condensed (63w): The King of Cups grounds feeling through Earth, giving him real stability with emotion. Like the
Queen of Cups, his listening itself transforms and heals others. Deeply connected to the arts, imagination is his defining power,
but he has to stay alert, careful not to lose himself in daydreaming. His strength lies in staying centered and rooted even while
working through deep feeling.
Reversed / shadow: Calm on the surface hiding real volatility, or feelings used to manipulate.
Anonymized (no identity tells): This character grounds feeling through Earth, giving him real stability with emotion. Like another
figure known for the same suit, his listening itself transforms and heals others. Deeply connected to the arts, imagination is his
defining power, but he has to stay alert, careful not to lose himself in daydreaming. His strength lies in staying centered and
rooted even while working through deep feeling.
Original: The King of Cups offers stability in feeling through the Earth element. He knows how to control his emotions, so that
they can become fertile ground for others as well. Like the Queen of Cups, he can listen, and his listening transforms and heals.
He is connected to the world of the arts and uses imagination as his main power. That's why he must remain aware and not lose
himself in daydreaming or yearning on emotions. He must remain firmly centered and rooted in his power.
Ace of Swords [minor_swords_ace] — GEMINI · LIBRA · AQUARIUS
Upright, condensed (67w): Like every Ace, this card is Air in its rawest form: sudden illumination, when a situation becomes
completely clear. It's the ability to see things exactly as they are, cutting away anything unnecessary to reach what's essential.
This can mean a new way of seeing something, or using reason without being pulled under by emotion. The sword separates
truth from deceit, echoing Air's gift for honest communication.
Reversed / shadow: Clarity clouded, or truth getting tangled in confusion and misunderstanding.
Anonymized (no identity tells): Like every card of its kind, this one is Air in its rawest form: sudden illumination, when a
situation becomes completely clear. It's the ability to see things exactly as they are, cutting away anything unnecessary to reach
what's essential. This can mean a new way of seeing something, or using reason without being pulled under by emotion. A
central symbol in this scene separates truth from deceit, echoing this element's gift for honest communication.
Original: The Ace of Swords, like all Aces, represents the primordial matter related to its element, in this case Air. It is the idea,
illumination, when everything becomes clear suddenly and we have a clear view of the situation. It refers to the ability to see

---

## Page 57

Zodiac Tarot App — Card Data Model Reference Page 57
things as they are, to discern and eliminate the superfluous. The Ace of Swords cuts away the unnecessary to leave the
essential. It can be a new vision of things, or it can refer to the ability to use our rational side without getting bogged down by the
emotional. The Sword separates truth from deceit and often references the art of words and communication, just like Air signs.
Two of Swords [minor_swords_02] — MOON IN LIBRA, FIRST DECAN
Upright, condensed (59w): Hidden information here needs to be found within rather than outside. This secrecy reflects Libra's
careful sensitivity, pausing to think before acting in order to restore inner balance. It's a card about searching and weighing
options, the quiet needed to make a real decision. The Moon adds a sense of change, one that stabilizes through Libra's naturally
harmonious energy.
Reversed / shadow: A decision avoided indefinitely, rather than the pause actually leading anywhere.
Anonymized (no identity tells): Hidden information here needs to be found within rather than outside. This secrecy reflects a
balanced sign's careful sensitivity, pausing to think before acting in order to restore inner balance. It's a card about searching and
weighing options, the quiet needed to make a real decision. A reflective planetary energy adds a sense of change, one that
stabilizes through that sign's naturally harmonious energy.
Original: In the Two of Swords there is hidden information, secrets, which we must seek within ourselves. Secrecy is an
expression of the sensitivity of Libra: pondering, thinking before acting, making a decision in order to restore balance and inner
harmony. This is a card of searching, balancing, of the peace needed to make a choice. The Moon represents change, which
stabilizes and is channeled through the harmonious energy of Libra.
Three of Swords [minor_swords_03] — SATURN IN LIBRA, SECOND DECAN
Upright, condensed (61w): After the careful decision of the Two, this card faces its sometimes painful consequences. Saturn's
discipline meets Libra's emotional, beauty-seeking nature, an unusual but powerful pairing, since being in real relationship with
the world means being willing to feel pain fully. Without that, we stay tied to old hurt. This card breaks something open precisely
so integration and healing can follow.
Reversed / shadow: Old pain either finally releasing, or being reopened again and again.
Anonymized (no identity tells): After a careful decision made earlier, this card faces its sometimes painful consequences. A
disciplined energy meets an emotional, beauty-seeking sign, an unusual but powerful pairing, since being in real relationship with
the world means being willing to feel pain fully. Without that, we stay tied to old hurt. This card breaks something open precisely
so integration and healing can follow.
Original: In the Two of Swords, we have made a careful decision, but in the Three of Swords we must face the consequences of
our choice, which are sometimes painful. In this card, Saturn, the master of limits, regulation, and responsibility, meets Libra,
which presides over emotions and beauty. Although it may seem strange, Saturn is in exaltation in Libra, because being in an
emotional relationship with the world means listening, observing, accepting, and experiencing pain. Without this practice, it's not
possible to overcome what hurts us. If we don't remember what made us suffer and we're not compassionate toward it, we'll
always be tied to it. The Three of Swords therefore breaks in order to then integrate, wounds so that healing can take place.
Four of Swords [minor_swords_04] — JUPITER IN LIBRA, THIRD DECAN
Upright, condensed (62w): Jupiter, planet of expansion and also justice, meets the third decan of Libra, which seeks balance
through relationship. After the difficulty of the Three, this card allows real healing: rest, an expanded view of things, and a fresh
sense of harmony. This is compromise earned through crisis and awareness, and through rest and acceptance a new path opens
under a luckier sky.
Reversed / shadow: Rest refused past the point of need, leading to exhaustion instead of recovery.
Anonymized (no identity tells): An expansive planetary energy, also linked to fairness, meets a balance-seeking sign here.
After a prior difficulty, this card allows real healing: rest, an expanded view of things, and a fresh sense of harmony. This is
compromise earned through crisis and awareness, and through rest and acceptance a new path opens under a luckier sky.
Original: Jupiter, the planet of expansion, growth, and possibilities, but also of justice (the god Jupiter was the protector of the
courts), here meets the third decan of Libra, the one who seeks balance through relationships. In the Four of Swords, after the
difficulty encountered in the Three of Swords, we can finally heal. We can rest, expand our vision of things, as Jupiter teaches us,
and find a new balance, a new inner harmony. It is compromise, which we achieve after a crisis and awareness. Through rest,
being, and acceptance, we can start a new path, under the lucky star of Jupiter.
Five of Swords [minor_swords_05] — VENUS IN AQUARIUS, FIRST DECAN
Upright, condensed (62w): Aquarius's fixed nonconformity meets Venus, planet of love and exchange, here. Someone wins and
someone loses in this card, though which role matters is left open, is it defeat, or victory at too high a cost? It echoes the Star,

---

## Page 58

Zodiac Tarot App — Card Data Model Reference Page 58
Aquarius's own Major Arcana card: even in loss, hope for something better shouldn't be abandoned. Aquarius challenges
convention, whatever the immediate outcome.
Reversed / shadow: Resentment lingering after the fact, or conflict finally resolving into real reconciliation.
Anonymized (no identity tells): A fixed, nonconformist sign meets a loving, exchange-oriented energy here. Someone wins and
someone loses in this card, though which role matters is left open, is it defeat, or victory at too high a cost? It echoes hope found
elsewhere in this deck: even in loss, hope for something better shouldn't be abandoned. This energy challenges convention,
whatever the immediate outcome.
Original: In the Five of Swords, we meet the first decan of the sign of Aquarius: fixed sign, characterized by nonconformity,
vision, the ability to challenge the limits of common belief. Here the sign is accompanied by Venus, the planet of love,
relationship, and exchange. In the Five of Swords, someone wins and someone loses: we do not know which of the two roles is of
interest to whoever is reading the card. Defeat or victory at great cost? This seems to be the question Aquarius poses to society
as a whole through its nonconformist actions. It is a card of passage, which contains an echo of the Star (the Major Arcana card
linked to the sign of Aquarius): if we are defeated, we cannot lose faith or hope in a better world.
Six of Swords [minor_swords_06] — MERCURY IN AQUARIUS, SECOND DECAN
Upright, condensed (58w): Aquarius's intellectual, communicative nature pairs naturally with Mercury, both oriented toward
speed and exchange of ideas. This card traces a journey from an unsettled place toward calmer shores, a movement only
possible through trust. As with the previous card, defeat is just a transition; here, moving forward means shifting from an old, rigid
idea toward something genuinely new.
Reversed / shadow: Stuck mid-transition, resisting the very shift that would bring relief.
Anonymized (no identity tells): An intellectual, communicative sign pairs naturally with a quick, exchange-oriented energy, both
oriented toward speed and exchange of ideas. This card traces a journey from an unsettled place toward calmer shores, a
movement only possible through trust. As with a difficult card before it, defeat is just a transition; here, moving forward means
shifting from an old, rigid idea toward something genuinely new.
Original: The sign of Aquarius, as a fixed Air sign, is very much oriented toward communication and intellectual relationship with
others, and Mercury is also a master of the world of speed, messages, and intellectual exchange. In this card, the communicative
and revolutionary energy of Aquarius and Mercury meet, outlining a journey from an unsafe, or difficult, place to a calm shore.
The journey can only be made through trust. Just like in the previous card (defeat is only a transition, thanks to hope), here too
movement is only possible if we trust. The paradigm shift cannot be only physical, but also moves from an old, preconceived and
conformist idea to a new one, a new vision, a new possibility.
Seven of Swords [minor_swords_07] — MOON IN AQUARIUS, THIRD DECAN
Upright, condensed (61w): Linked to the Moon's connection with the High Priestess, this card turns Aquarius's communication
inward, becoming gentle, hidden, and cunning rather than direct. Thoughts need time to gestate before being revealed, requiring
tact rather than immediate disclosure. Though sometimes read as deception, it's more interesting as a quiet, magical card about
the discipline of waiting for the right moment to act.
Reversed / shadow: A hidden strategy getting exposed, or honesty finally surfacing after too much secrecy.
Anonymized (no identity tells): Linked to a reflective energy's connection with a receptive figure elsewhere in this deck, this
card turns a sign's communication inward, becoming gentle, hidden, and cunning rather than direct. Thoughts need time to
gestate before being revealed, requiring tact rather than immediate disclosure. Though sometimes read as deception, it's more
interesting as a quiet, magical card about the discipline of waiting for the right moment to act.
Original: The Moon, connected to the High Priestess card (and not the Moon card), is related to emotions, to listening, a
gestation period. This is where Aquarius and its communication skills become inner, gentle, hidden. The divergent thinking of
Aquarius is transformed into cunning, intelligence, an ability to think outside the box. With the Moon, communication is not
immediate, but it is necessary to wait before revealing all the cards. You must act carefully, using tact. The card is often
associated with thieves, but it is more interesting to read it as a silent card, full of magic and creative power, the ability to wait for
the right moment.
Eight of Swords [minor_swords_08] — JUPITER IN GEMINI, FIRST DECAN
Upright, condensed (62w): A figure stands stuck and blindfolded here, an odd image for Jupiter, planet of expansion. But
Jupiter is in exile in Gemini, opposite its home sign, so Gemini's quick, curious thinking turns against itself instead of expanding
outward. This card warns that overthinking and over-communicating can become their own trap. The obstruction is self-made,
and so is the freedom to release it.
Reversed / shadow: Either breaking free of a self-made trap, or sinking deeper into feeling powerless.

---

## Page 59

Zodiac Tarot App — Card Data Model Reference Page 59
Anonymized (no identity tells): A figure stands stuck and blindfolded here, an odd image for an energy usually about
expansion. But that energy is somewhat out of its natural element in a quick-thinking sign, so that sign's curious thinking turns
against itself instead of expanding outward. This card warns that overthinking and over-communicating can become their own
trap. The obstruction is self-made, and so is the freedom to release it.
Original: In the Eight of Swords, it seems strange to see a person stuck, blindfolded and unable to move. The card is associated
with Jupiter, which is the planet of expansion, success, and growth. So why do we find this sense of closure? Here, Jupiter, since
he is in Gemini, is in exile (this means that Jupiter is in the opposite sign to the one in which he has his home, Sagittarius).
Therefore, the rapid, passionate, and curious thought of the sign is exalted through its less easy aspects. The Eight of Swords
tells us that thinking too much, talking too much, and communicating too much can sometimes be an obstacle, can limit the full
expression of ourselves. Let's not let our thoughts overwhelm or limit us. If and when it happens, we will be the ones to allow it.
Nine of Swords [minor_swords_09] — MARS IN GEMINI, SECOND DECAN
Upright, condensed (64w): A figure wakes from what looks like a nightmare, nine sharp swords behind her, evoking anxiety and
inner conflict. Mars's passionate intensity meets Gemini's rational, communicative Air here, mind and heart colliding directly. The
card's real comfort is a reminder that things are rarely as dire as they seem in the dark. Morning light dissolves the shadows, if
we're willing to look again objectively.
Reversed / shadow: Anxiety finally easing with perspective, or spiraling further without it.
Anonymized (no identity tells): A figure wakes from what looks like a nightmare, sharp blades behind her, evoking anxiety and
inner conflict. A passionate, intense energy meets a rational, communicative sign here, mind and heart colliding directly. The
card's real comfort is a reminder that things are rarely as dire as they seem in the dark. Morning light dissolves the shadows, if
we're willing to look again objectively.
Original: The figure we find in the Nine of Swords is not reassuring: a person wakes up, seemingly from a nightmare, in the
darkness of the night, and behind her there are nine sharp swords. This is the card of anxiety, paranoia and inner conflict. We
could say that the physical and manifested characteristics of Mars, passionate creator, are found here, as well as the trait of
Gemini, an Air sign, aimed at thinking rationally, communicating clearly and objectively. The mind and heart meet and clash.
However, we just have to remember that things are not as bad as they appear, to open the window in the morning to let in new
light and let the shadows dissolve. It's time to reconsider the situation objectively.
Ten of Swords [minor_swords_10] — SUN IN GEMINI, THIRD DECAN
Upright, condensed (68w): This card falls in Gemini's third decan, ending right at the summer solstice, the Sun's own festival. A
figure lies pierced by ten blades, an image that seems at odds with Gemini's bright energy, until you see the message: a cycle
has fully ended, and clarity is needed to celebrate the dawn that follows. The Sun in Gemini says let go of the old to welcome the
light.
Reversed / shadow: Resisting an ending that's already occurred, delaying the recovery that follows.
Anonymized (no identity tells): This card falls at the very end of a communicative sign's cycle, ending right at a seasonal
turning point tied to a bright, radiant energy's own festival. A figure lies pierced by several blades, an image that seems at odds
with that sign's usual brightness, until you see the message: a cycle has fully ended, and clarity is needed to celebrate the dawn
that follows. Let go of the old to welcome the light.
Original: The Ten of Swords card falls in the third decan of Gemini, the period that ends on June 21, the summer solstice and the
festival of the Sun. Here, in the Ten of Swords, we see a person pierced by ten blades, lying on the ground. This doesn't seem to
have much to do with the sparkling energy of Gemini or the Sun. But the association attributed by the Golden Dawn is perfect for
this card: a cycle has ended, and we must have the ability and clarity to celebrate a new dawn. The Sun in Gemini does just that:
it tells us to let go of the old, to let in the light, the lightness of a new beginning.
Page of Swords [minor_swords_page] — AIR OF AIR
Upright, condensed (64w): Pure Air, the Page of Swords personifies communication itself: processing information quickly and
delivering unexpected news or an important message. Often pictured high on a mountain, close to the sky, he's a natural student
and investigator, drawn to research and mental inquiry. One foot stays on the ground though, a reminder that even a mind this
active still needs to stay rooted in reality.
Reversed / shadow: Scattered thinking or gossip, rather than a message received clearly.
Anonymized (no identity tells): Pure Air, this character personifies communication itself: processing information quickly and
delivering unexpected news or an important message. Often pictured high on a mountain, close to the sky, they're a natural
student and investigator, drawn to research and mental inquiry. One foot stays on the ground though, a reminder that even a
mind this active still needs to stay rooted in reality.

---

## Page 60

Zodiac Tarot App — Card Data Model Reference Page 60
Original: The Page of Swords is the personification of the Air element: it is communication, the power of the mind to assimilate
and process information, the ability to use words and carry quick messages. The Page of Swords is very good at quick
communication. He brings an important message, unexpected news. Often represented on top of a mountain, he is very close to
the sky. His proximity to the Air element tells us that thinking is his natural habitat and that he must be careful not to be
overwhelmed by thoughts, to avoid mental exhaustion. He is a student, an investigator, a person who is passionate about
research and mental inquiry. One of his feet rests on the ground, as if to remind us that to maintain balance, the mind must be
rooted in reality.
Knight of Swords [minor_swords_knight] — FIRE OF AIR
Upright, condensed (66w): Fire meets Air here, a combination that can be explosive or, handled well, can light a warm and
useful fire. This Knight turns ideas into action, so the real question this card raises is whether that combination is balanced: is the
situation constructive or destructive, strategic or purely driven by passion? Focused on his goal, he still needs to stay aware of
what's happening around him.
Reversed / shadow: Sharp thinking turned reckless, acting or speaking before the plan is ready.
Anonymized (no identity tells): Fire meets Air here, a combination that can be explosive or, handled well, can light a warm and
useful fire. This character turns ideas into action, so the real question this card raises is whether that combination is balanced: is
the situation constructive or destructive, strategic or purely driven by passion? Focused on their goal, they still need to stay aware
of what's happening around them.
Original: The Knight of Swords is a variation of Fire, the element of all Knights, with the Air element: we know how explosive the
combination of these two elements can be, but also how effective it is when we want to light a warm and welcoming fire. The
Knight of Swords is therefore the action (Fire) that is processed by the mind, by ideas (Air). This card carries both elements, so
when we encounter it, we must ask ourselves if they are balanced or not: is the situation constructive or destructive? Can we
have a clear strategy, or are we only dragged on by passion? The Knight of Swords seems focused on his goal, but he must also
pay attention to his surroundings, remembering the importance of integrating these two aspects.
Queen of Swords [minor_swords_queen] — WATER OF AIR
Upright, condensed (70w): Water and Air combine in the Queen of Swords, letting her shape ideas through empathy and
compassion rather than cold logic alone. Often linked to the butterfly, a symbol of transformation, she turns emotion into lucid,
direct, and sincere thought. Her wisdom comes from experience, letting her weigh a situation from multiple angles and choose
what's truly real. Like her sword, she cuts, but she also knows what's worth preserving.
Reversed / shadow: Honesty turned cold or cutting, missing the compassion that usually tempers it.
Anonymized (no identity tells): Water and Air combine in this character, letting her shape ideas through empathy and
compassion rather than cold logic alone. Often linked to a symbol of transformation, she turns emotion into lucid, direct, and
sincere thought. Her wisdom comes from experience, letting her weigh a situation from multiple angles and choose what's truly
real. Like the tool she carries, she cuts, but she also knows what's worth preserving.
Original: The Queen of Swords mixes the element of Water, that of all Queens, with the element of Air, which belongs to the
Sword suit. She is able to shape ideas through empathy, listening and compassion. She is often associated with the butterfly, a
symbol of transmutation. The Queen of Swords is able to transform emotions into lucid thought, through which she observes
reality, which is ironic, sharp, direct, sincere, free. She is an expression of wisdom, a person who has made a long journey to get
here. She knows how to analyze situations from various points of view and choose those that adhere most to reality. Like her
sword, she can cut, but can also discern and preserve what is truly essential.
King of Swords [minor_swords_king] — EARTH OF AIR
Upright, condensed (65w): The King of Swords channels sharp intellect through the steadying influence of Earth. A natural
strategist and communicator, he finds unexpected solutions to problems that seem impossible to untangle. His advice is to think
outside familiar patterns and gain distance for a clearer view; from above, the whole situation is easier to read. When this card
appears, it's worth listening to someone lucid and trustworthy.
Reversed / shadow: Strategy turned rigid or manipulative, intellect used to dominate rather than clarify.
Anonymized (no identity tells): This character channels sharp intellect through the steadying influence of Earth. A natural
strategist and communicator, he finds unexpected solutions to problems that seem impossible to untangle. His advice is to think
outside familiar patterns and gain distance for a clearer view; from above, the whole situation is easier to read. When this card
appears, it's worth listening to someone lucid and trustworthy.
Original: The King of Swords uses the energy of the Earth to channel and root his great intellectual capacity. He is a
communicator, a strategist, the one who knows how to find unexpected solutions to problems that seem insurmountable. He

---

## Page 61

Zodiac Tarot App — Card Data Model Reference Page 61
advises us to think in an alternative way and to not be caged by usual mental schemes. Let's find space, fly high, because from
above we have a better view of the situation. From the King of Swords, we can also learn the right amount of detachment, which
is necessary to evaluate a problematic situation and to identify possible solutions. If this card appears in a reading, it is probably
worth listening to the advice of a trusted and lucid person.
Ace of Pentacles [minor_pentacles_ace] — TAURUS · VIRGO · CAPRICORN
Upright, condensed (66w): Pentacles belong to Earth, representing stability, material goods, and everything that nourishes and
takes real form. This card opens the door to new possibility in work, finances, or personal satisfaction, tied to self-care and
protecting your own boundaries. Like a seed breaking through dark soil, the opportunity here needs to be actively seized rather
than left waiting, since an Ace is only ever a starting point.
Reversed / shadow: An opportunity missed or poorly planned, rather than seized while it's fresh.
Anonymized (no identity tells): This suit belongs to Earth, representing stability, material goods, and everything that nourishes
and takes real form. This card opens the door to new possibility in work, finances, or personal satisfaction, tied to self-care and
protecting your own boundaries. Like a seed breaking through dark soil, the opportunity here needs to be actively seized rather
than left waiting, since a card like this one is only ever a starting point.
Original: The Pentacle suit is related to the Earth element and refers to stability, material goods, everything that nourishes,
defines and materializes. To encounter this card means to open up to new possibilities, to fruitful beginnings in the sphere of
work, finances, and even personal satisfaction. It is a card that is associated with self-care, the protection of one's boundaries, the
ability to break through, as a seed does under dark soil. The card shows us an opportunity—as is always the case with Aces; it's
up to us to seize it or not.
Two of Pentacles [minor_pentacles_02] — JUPITER IN CAPRICORN, FIRST DECAN
Upright, condensed (63w): This card is about finding balance across the ordinary demands of daily life, commitments,
relationships, finances, and work all at once. Jupiter, lord of growth and luck, meets Capricorn's discipline and hard work here, an
interesting combination of expansion and restraint. Paying attention to how these two pulls alternate through your days, rather
than favoring one, is what brings genuine satisfaction and wellbeing.
Reversed / shadow: Overwhelm from too many demands at once, balance tipping into chaos.
Anonymized (no identity tells): This card is about finding balance across the ordinary demands of daily life, commitments,
relationships, finances, and work all at once. A lucky, growth-oriented energy meets a disciplined, hardworking sign here, an
interesting combination of expansion and restraint. Paying attention to how these two pulls alternate through your days, rather
than favoring one, is what brings genuine satisfaction and wellbeing.
Original: The Two of Pentacles card refers to each person's ability to find balance in daily life between commitments, private
matters, fun, relationships, finances, and work. Interestingly, this card features Jupiter, lord of growth, expansion, and luck, and
Capricorn, whose energy relates to hard work, commitment, and the ability to set limits. Finding them together here means that
we must pay attention to these different inclinations, which can alternate in our days. The balance between these two poles will
bring satisfaction and well-being.
Three of Pentacles [minor_pentacles_03] — MARS IN CAPRICORN, SECOND DECAN
Upright, condensed (61w): This card carries the energy of building something real, staying focused long enough to actually
finish what's been started. Mars's timely action pairs with Capricorn's orderly, tenacious determination, giving you the tools to
keep developing the idea planted by the Ace of Pentacles without wasting effort. It can also point to teamwork, a group pooling
different skills toward one shared result.
Reversed / shadow: Misaligned effort or poor teamwork, progress stalling instead of building.
Anonymized (no identity tells): This card carries the energy of building something real, staying focused long enough to actually
finish what's been started. A timely, active energy pairs with an orderly, tenacious sign's determination, giving you the tools to
keep developing an idea planted earlier without wasting effort. It can also point to teamwork, a group pooling different skills
toward one shared result.
Original: The Three of Pentacles has within it the energy of construction, the realization of a project, and the ability to maintain
the right focus over time, to accomplish what we have set out to do. Here, Mars, planet of action and timeliness, matches
Capricorn's tendency to work in an orderly, determined, and tenacious manner. In this card, we have all the tools to continue the
project that is proposed to us in the Ace of Pentacles, avoiding wasted energy. The card can also refer to teamwork, a group
effort in which everyone collaborates with their skills to achieve the final result.
Four of Pentacles [minor_pentacles_04] — SUN IN CAPRICORN, THIRD DECAN

---

## Page 62

Zodiac Tarot App — Card Data Model Reference Page 62
Upright, condensed (62w): This card carries two intertwined meanings. As the number four, it represents stability and
foundation, the ability to protect yourself and what you've built. But paired with Capricorn's earthy nature and the Sun's presence
there, it also hints at possible rigidity, a structure held too tightly. The lesson is to build solid ground first, then stay open to what
lies beyond it.
Reversed / shadow: Rigid over-attachment to control, or the opposite: instability from holding onto nothing.
Anonymized (no identity tells): This card carries two intertwined meanings. As a card of its particular number, it represents
stability and foundation, the ability to protect yourself and what you've built. But paired with an earthy sign's nature and a bright
energy's presence there, it also hints at possible rigidity, a structure held too tightly. The lesson is to build solid ground first, then
stay open to what lies beyond it.
Original: The Four of Pentacles contains two different meanings, which combine to best explain the complexity of this card. On
the one hand, it's connected to the number four, which symbolizes stability and foundations. Here we find the ability to take care
of ourselves, our personal boundaries, and what we have. On the other hand, the card indicates a certain rigidity, a structure that
is typical of an Earth sign like Capricorn (and the Sun in this sign). The Four of Pentacles teaches us that it is necessary to have a
good foundation and that, once we have acquired our structure, we should not be afraid to open ourselves to the outside and to
new possibilities.
Five of Pentacles [minor_pentacles_05] — MERCURY IN TAURUS, FIRST DECAN
Upright, condensed (62w): Mercury, all speed and connection, slows down considerably inside earthy, patient Taurus. As with
most Fives, this card marks a recalibration after the stability of Four, here showing up as material loss, hunger, and depleted
energy. Its real message is that isolation isn't necessary: asking for help and showing vulnerability is allowed. Turning inward at
this moment can also reveal unexpected resources.
Reversed / shadow: Recovery finally beginning, or refusing help that's actually within reach.
Anonymized (no identity tells): A fast, connective energy slows down considerably inside an earthy, patient sign. As with most
cards of this number, this card marks a recalibration after a prior stability, here showing up as material loss, hunger, and depleted
energy. Its real message is that isolation isn't necessary: asking for help and showing vulnerability is allowed. Turning inward at
this moment can also reveal unexpected resources.
Original: In the Five of Pentacles card, Mercury, which is communication, interconnection, and speed, is in Taurus, an Earth sign
characterized by longer time frames. Also, in the Minor Arcana, five represents a challenge, an exercise in recalibration after the
stability of four. This card marks a moment of loss, of difficulty even on a material level: we lack the right nourishment, we feel
hungry, tired, without energy. Before the Five of Pentacles, we must remember that we are not alone: we can ask for help, show
our vulnerability, and manifest our needs. Moreover, in this card we can find the suggestion of new contact with our inner world.
We can often find unexpected resources there.
Six of Pentacles [minor_pentacles_06] — MOON IN TAURUS, SECOND DECAN
Upright, condensed (64w): The Moon's emotional, intuitive pull meets Taurus's grounded material stability here, producing a
slower, less reactive response to need than fierier signs would give. This card is fundamentally about generosity, the give and
take of resources. It asks an honest question: right now, are you the one giving too much until you're depleted, or the one who
needs to finally accept what you're owed?
Reversed / shadow: Generosity with strings attached, or an imbalance between giving and receiving.
Anonymized (no identity tells): A reflective, intuitive energy meets a grounded, material sign here, producing a slower, less
reactive response to need than fierier signs would give. This card is fundamentally about generosity, the give and take of
resources. It asks an honest question: right now, are you the one giving too much until you're depleted, or the one who needs to
finally accept what you're owed?
Original: The Six of Pentacles is related to the Moon in Taurus. The Moon is connected to emotions, intuition, to the most internal
and sensitive part of the individual, whereas Taurus is the expression of material security, stability, rooted in the here-and-now.
Taurus and the Moon speak of generosity: the ability to give and to share resources. In fact, the response of Taurus to their
needs is slower, less reactive than that of Aries, the sign that precedes it: it is linked to listening to their emotional side, intuition.
This card also speaks of the possibility of receiving: how many times have we had a need, but we have not taken what we
deserved? And how many times have we given too much, to the point of draining our resources? The Six of Pentacles asks us to
understand whether, in this moment, we are takers or givers.
Seven of Pentacles [minor_pentacles_07] — SATURN IN TAURUS, THIRD DECAN
Upright, condensed (67w): A figure often appears here tending seeds already sown, simply waiting for them to bear fruit. Saturn
brings hard work and reflection that only pays off after patience, while Taurus knows how to wait for the right moment before

---

## Page 63

Zodiac Tarot App — Card Data Model Reference Page 63
enjoying what's been cultivated. This card asks whether you're truly willing to be patient for the reward, since now is the time to let
things run their course.
Reversed / shadow: Impatience derailing the wait, or giving up just before things bear fruit.
Anonymized (no identity tells): A figure often appears here tending seeds already sown, simply waiting for them to bear fruit. A
disciplined energy brings hard work and reflection that only pays off after patience, while a grounded sign knows how to wait for
the right moment before enjoying what's been cultivated. This card asks whether you're truly willing to be patient for the reward,
since now is the time to let things run their course.
Original: In the Seven of Pentacles we often meet a figure who has sown the seeds and is now waiting for the plant, which she
has taken care of, to bloom and bear fruit. Indeed, here Saturn instills a tendency to hard work, reflection, and reward, but only at
the end of a demanding process. Likewise, Taurus represents the ability to wait, to do things at the right time, and to enjoy, finally,
what we have sown. The card often emphasizes waiting: are we really willing to be patient to enjoy the fruits of our labor? Now is
the time to do so; we must let things take their course.
Eight of Pentacles [minor_pentacles_08] — SUN IN VIRGO, FIRST DECAN
Upright, condensed (65w): Virgo shows up here in its fullest form, embodying daily practice, careful attention to detail, and
skilled handiwork. This card favors getting to work, focusing on craft, and repeating small actions until mastery follows naturally.
It's the card of the apprentice, someone who keeps the bigger picture in view while patiently refining their skill. This is a moment
to devote yourself fully to your craft.
Reversed / shadow: Focus scattered into sloppy work, or perfectionism that never lets the work be done.
Anonymized (no identity tells): A grounded sign shows up here in its fullest form, embodying daily practice, careful attention to
detail, and skilled handiwork. This card favors getting to work, focusing on craft, and repeating small actions until mastery follows
naturally. It's the card of the apprentice, someone who keeps the bigger picture in view while patiently refining their skill. This is a
moment to devote yourself fully to your craft.
Original: In the Eight of Pentacles, we find the figure of the sign of Virgo in its full essence. The card shows us the importance of
daily work, attention to detail, and manual skills; and the ability to observe and repeat. In addition to this, the card suggests the
healthy disposition of getting to work, taking care of material action, and craft. It is the card of the apprentice, who—with study,
application, and the ability to focus on detail without losing the big picture—becomes a master of the art day after day. This is the
time to devote ourselves to our skills and to maintain focus.
Nine of Pentacles [minor_pentacles_09] — VENUS IN VIRGO, SECOND DECAN
Upright, condensed (61w): Venus, strongly tied to the Empress, meets Virgo's careful, daily devotion here, blending harmony
and beauty with patient cultivation. A woman rests in her own garden, finally enjoying what she's long tended. This is a card of
independence: savoring what you've achieved without needing anyone else's support, Venus giving Virgo the rare permission to
simply enjoy the fruit of sustained effort.
Reversed / shadow: Reward earned but never enjoyed, or independence traded for relying on others.
Anonymized (no identity tells): A loving planetary energy, tied elsewhere in this deck to nurturing and abundance, meets a
grounded sign's careful, daily devotion here, blending harmony and beauty with patient cultivation. A figure rests in their own
garden, finally enjoying what they've long tended. This is a card of independence: savoring what you've achieved without needing
anyone else's support, a rare permission to simply enjoy the fruit of sustained effort.
Original: In this card, we meet Venus, which is strongly connected to the Major Arcana card of the Empress. Harmony, beauty
and pleasure are intertwined here with the message of Virgo, related to care, daily work, and attention to small things. In the card,
a woman is in her garden. It seems that she is enjoying a moment of rest. The card suggests that we can finally enjoy what we
have long cultivated, because it is now bearing fruit. A card of independence, the ability to savor what we have achieved, without
relying on the support of anything, Venus gives the Virgo sign the ability to fully savor the fruits of our labor.
Ten of Pentacles [minor_pentacles_10] — MERCURY IN VIRGO, THIRD DECAN
Upright, condensed (62w): Mercury is at home in Virgo here, letting its gift for communication flourish through Virgo's organized,
rational nature. This card holds wealth and generosity as both inner and outer qualities, bringing security and serenity to home,
family, and work. It's closely tied to gratitude, the satisfaction that draws in further blessings, and to the inherited joy passed down
through generations of belonging.
Reversed / shadow: Stability shaken, or abundance taken for granted instead of appreciated.
Anonymized (no identity tells): A communicative energy is at home in a grounded sign here, letting its gift for communication
flourish through that sign's organized, rational nature. This card holds wealth and generosity as both inner and outer qualities,
bringing security and serenity to home, family, and work. It's closely tied to gratitude, the satisfaction that draws in further

---

## Page 64

Zodiac Tarot App — Card Data Model Reference Page 64
blessings, and to the inherited joy passed down through generations of belonging.
Original: In the Ten of Pentacles, we encounter abundance, wealth, and generosity, both as inner and outer qualities. Mercury in
Virgo is in its home position. This means that it is an excellent position for the planet, and that the organizational, essential, and
rational capacity of Virgo can make the talents of Mercury, related to communication and interconnection, flourish. The card
expresses security, stability, and serenity toward our home, our family, and our work. It pushes us to recognize the riches we
already possess. It is closely linked to gratitude, that feeling of well-being and satisfaction that attracts new blessings like a
magnet to the family, a tribe of belonging. It also represents the legacy of joy and wonder that we can receive from our ancestors,
in a continuum of abundance.
Page of Pentacles [minor_pentacles_page] — AIR OF EARTH
Upright, condensed (61w): Air's intellectual curiosity interweaves with Earth's slow, careful pace in the Page of Pentacles, the
apprentice card above all others. This figure studies something new with genuine dedication, moving at a measured speed that
honors every detail along the way. In his grounded, earthy form, he reminds us that enjoying the process itself matters more than
rushing toward any particular outcome.
Reversed / shadow: Curiosity without follow-through, or procrastination instead of steady practice.
Anonymized (no identity tells): Air's intellectual curiosity interweaves with Earth's slow, careful pace in this character, the
apprentice figure above all others. This figure studies something new with genuine dedication, moving at a measured speed that
honors every detail along the way. In their grounded, earthy form, they remind us that enjoying the process itself matters more
than rushing toward any particular outcome.
Original: The Page of Pentacles has within him the characteristics of the Air element, which are interwoven with those of the
Earth element. Intellectual capacity, mental speed, and the desire to learn are mixed with the need to move slowly and
accurately, applying great importance to every detail. For this reason, the card of the Page of Pentacles is the card of the
apprentice par excellence. The apprentice is studying a new subject, learning a new art, and is firmly dedicated to their work. The
Page of Pentacles, in its earthly state, reminds us that the pleasure of the process is more important than the result itself.
Knight of Pentacles [minor_pentacles_knight] — FIRE OF EARTH
Upright, condensed (62w): The most careful of the four Knights, this figure lets Fire meet Earth, producing a measured pace
attuned to the natural rhythm of things. Fully dedicated to his mission, he favors hard work and steady study over leisure,
sometimes narrowing his focus to just one direction. What defines him is genuine willpower and constancy, exactly what's needed
to accomplish something genuinely complex.
Reversed / shadow: Dedication tipping into stubborn stagnation, effort with no forward motion.
Anonymized (no identity tells): The most careful of the four figures at this rank, this character lets Fire meet Earth, producing a
measured pace attuned to the natural rhythm of things. Fully dedicated to their mission, they favor hard work and steady study
over leisure, sometimes narrowing their focus to just one direction. What defines them is genuine willpower and constancy,
exactly what's needed to accomplish something genuinely complex.
Original: The Knight of Pentacles is the most attentive of the four knights of the Minor Arcana. This Fire here meets Earth and
gives this knight a more measured movement, more connected to the natural pace of things. Here, we find a person totally
dedicated to their mission. The attitude of this knight is linked to hard work and to study, which leaves little room for leisure. Here,
the passionate fire is revealed, which can lead to focusing only in one direction. Of course, this knight has great willpower and
constancy, which is necessary to accomplish complex goals.
Queen of Pentacles [minor_pentacles_queen] — WATER OF EARTH
Upright, condensed (65w): An embodiment of Mother Nature, the Queen of Pentacles blends Earth with Water into fertile
ground, practical and responsive to whatever's needed. She feeds, nourishes, and finds real solutions within everyday life, her
creativity showing wherever she can offer sustenance. She also practices real self-care, treating her body as sacred. Rooted and
present, she experiences the world fully through the senses, just like the Empress.
Reversed / shadow: Self-care neglected while caring for everyone else, or nurturing that smothers.
Anonymized (no identity tells): An embodiment of Mother Nature, this character blends Earth with Water into fertile ground,
practical and responsive to whatever's needed. She feeds, nourishes, and finds real solutions within everyday life, her creativity
showing wherever she can offer sustenance. She also practices real self-care, treating her body as sacred. Rooted and present,
she experiences the world fully through the senses, just like a nurturing figure found elsewhere in this deck.
Original: The Queen of Pentacles is an embodiment of Mother Nature. Her Earth mixes with Water, becoming fertile clay, soil for
the seed, the ability to listen and respond practically to everyone's needs. She is the one who feeds, nourishes, and finds an
immediate solution to the problems that arise, and she finds them in everyday life. Her creative ability shines when she can find

---

## Page 65

Zodiac Tarot App — Card Data Model Reference Page 65
something in any field to feed others. She is also the queen of self-care: she knows that her body is her temple, and she knows
how to take care of it. Rooted, present, she radiates an earthly, centered strength. Just like the Empress, the Queen of Pentacles
experiences the world through all the senses, and she is deeply in touch with them.
King of Pentacles [minor_pentacles_king] — EARTH OF EARTH
Upright, condensed (61w): The generous leader of the Minor Arcana, this King has reached real personal fulfillment through
strong leadership. His wealth flows from a natural ability to share rather than hoard. Rooted fully in Earth, his wellbeing reflects
real work and dedication rather than luck alone, giving him a stability that feels earned. He gives freely precisely because he
already possesses genuine abundance.
Reversed / shadow: Generosity curdled into greed, or wealth valued over the people around it.
Anonymized (no identity tells): The generous leader among these court figures, this character has reached real personal
fulfillment through strong leadership. His wealth flows from a natural ability to share rather than hoard. Rooted fully in Earth, his
wellbeing reflects real work and dedication rather than luck alone, giving him a stability that feels earned. He gives freely precisely
because he already possesses genuine abundance.
Original: Here is the generous leader of the Minor Arcana: the King of Pentacles, a person who has great leadership skills and
has achieved an important position in life in terms of personal fulfillment. At the same time, he is also capable of great generosity.
His abundance and wealth come from his innate ability to share and give. Precisely because we are in the sphere of the Earth
element, we must remember that the well-being achieved by the King of Pentacles is the result of great work and great
dedication, which have brought him to this position today. Satisfaction, well-being, and great wealth are the characteristics of the
card, linked to a strong sense of stability and being rooted. The King of Pentacles knows how to give, precisely because he
possesses great wealth.

---

## Page 66

Zodiac Tarot App — Card Data Model Reference Page 66
Appendix H: Symbol Images — full data
symbol_type symbol_name image_file
Planet Mercury Planet_mercury_MASTER.png
Planet Moon Planet_moon_MASTER.png
Planet Venus Planet_venus_MASTER.png
Planet Jupiter Planet_jupiter_MASTER.png
Planet Mars Planet_mars_MASTER.png
Planet Sun Planet_sun_MASTER.png
Planet Saturn Planet_saturn_MASTER.png
Planet Uranus Planet_uranus_MASTER.png
Planet Pluto Planet_pluto_MASTER.png
Planet Neptune Planet_neptune_MASTER.png
Zodiac Sign Aries Zodiac_aries_MASTER.png
Zodiac Sign Taurus Zodiac_taurus_MASTER.png
Zodiac Sign Gemini Zodiac_gemini_MASTER.png
Zodiac Sign Cancer Zodiac_cancer_MASTER.png
Zodiac Sign Leo Zodiac_leo_MASTER.png
Zodiac Sign Virgo Zodiac_virgo_MASTER.png
Zodiac Sign Libra Zodiac_libra_MASTER.png
Zodiac Sign Scorpio Zodiac_scorpio_MASTER.png
Zodiac Sign Sagittarius Zodiac_sagittarius_MASTER.png
Zodiac Sign Capricorn Zodiac_capricorn_MASTER.png
Zodiac Sign Aquarius Zodiac_aquarius_MASTER.png
Zodiac Sign Pisces Zodiac_pisces_MASTER.png
Element Fire Element_fire_MASTER.png
Element Water Element_water_MASTER.png
Element Air Element_air_MASTER.png
Element Earth Element_earth_MASTER.png
Suit Wands Suit_wands_MASTER.png
Suit Cups Suit_cups_MASTER.png
Suit Swords Suit_swords_MASTER.png
Suit Pentacles Suit_pentacles_MASTER.png

---

## Page 67

Zodiac Tarot App — Card Data Model Reference Page 67
Appendix I: Birth Card Lookup — full data
birth_number card_key card_name
1 major_01_magician The Magician
2 major_02_high_priestess The High Priestess
3 major_03_empress The Empress
4 major_04_emperor The Emperor
5 major_05_hierophant The Hierophant
6 major_06_lovers The Lovers
7 major_07_chariot The Chariot
8 major_08_strength Strength
9 major_09_hermit The Hermit
10 major_10_wheel_of_fortune The Wheel of Fortune
11 major_11_justice Justice
12 major_12_hanged_man The Hanged Man
13 major_13_death Death
14 major_14_temperance Temperance
15 major_15_devil The Devil
16 major_16_tower The Tower
17 major_17_star The Star
18 major_18_moon The Moon
19 major_19_sun The Sun
20 major_20_judgment Judgment
21 major_21_world The World

---

## Page 68

Zodiac Tarot App — Card Data Model Reference Page 68
Appendix J: Teaching Order — full data
# card_key card_name arcana_type
1 major_00_fool The Fool major
2 minor_cups_ace Ace of Cups minor
3 major_01_magician The Magician major
4 minor_wands_ace Ace of Wands minor
5 major_03_empress The Empress major
6 major_04_emperor The Emperor major
7 minor_pentacles_ace Ace of Pentacles minor
8 major_06_lovers The Lovers major
9 minor_swords_ace Ace of Swords minor
10 major_08_strength Strength major
11 major_11_justice Justice major
12 major_19_sun The Sun major
13 minor_cups_page Page of Cups minor
14 minor_cups_knight Knight of Cups minor
15 minor_cups_queen Queen of Cups minor
16 minor_cups_king King of Cups minor
17 minor_wands_page Page of Wands minor
18 minor_wands_knight Knight of Wands minor
19 minor_wands_queen Queen of Wands minor
20 minor_wands_king King of Wands minor
21 minor_pentacles_page Page of Pentacles minor
22 minor_pentacles_knight Knight of Pentacles minor
23 minor_pentacles_queen Queen of Pentacles minor
24 minor_pentacles_king King of Pentacles minor
25 minor_swords_page Page of Swords minor
26 minor_swords_knight Knight of Swords minor
27 minor_swords_queen Queen of Swords minor
28 minor_swords_king King of Swords minor
29 major_07_chariot The Chariot major
30 major_09_hermit The Hermit major
31 major_10_wheel_of_fortune The Wheel of Fortune major
32 major_13_death Death major
33 major_15_devil The Devil major
34 major_16_tower The Tower major
35 major_17_star The Star major
36 major_21_world The World major
37 minor_swords_03 Three of Swords minor
38 minor_cups_10 Ten of Cups minor
39 minor_swords_10 Ten of Swords minor

---

## Page 69

Zodiac Tarot App — Card Data Model Reference Page 69
# card_key card_name arcana_type
40 minor_pentacles_10 Ten of Pentacles minor
41 minor_cups_02 Two of Cups minor
42 minor_cups_03 Three of Cups minor
43 minor_cups_04 Four of Cups minor
44 minor_cups_05 Five of Cups minor
45 minor_cups_06 Six of Cups minor
46 minor_cups_07 Seven of Cups minor
47 minor_cups_08 Eight of Cups minor
48 minor_cups_09 Nine of Cups minor
49 major_02_high_priestess The High Priestess major
50 minor_wands_02 Two of Wands minor
51 minor_wands_03 Three of Wands minor
52 minor_wands_04 Four of Wands minor
53 minor_wands_05 Five of Wands minor
54 minor_wands_06 Six of Wands minor
55 minor_wands_07 Seven of Wands minor
56 minor_wands_08 Eight of Wands minor
57 minor_wands_09 Nine of Wands minor
58 minor_wands_10 Ten of Wands minor
59 minor_pentacles_02 Two of Pentacles minor
60 minor_pentacles_03 Three of Pentacles minor
61 minor_pentacles_04 Four of Pentacles minor
62 minor_pentacles_05 Five of Pentacles minor
63 minor_pentacles_06 Six of Pentacles minor
64 minor_pentacles_07 Seven of Pentacles minor
65 minor_pentacles_08 Eight of Pentacles minor
66 minor_pentacles_09 Nine of Pentacles minor
67 major_05_hierophant The Hierophant major
68 minor_swords_02 Two of Swords minor
69 minor_swords_04 Four of Swords minor
70 minor_swords_05 Five of Swords minor
71 minor_swords_06 Six of Swords minor
72 minor_swords_07 Seven of Swords minor
73 minor_swords_08 Eight of Swords minor
74 minor_swords_09 Nine of Swords minor
75 major_12_hanged_man The Hanged Man major
76 major_14_temperance Temperance major
77 major_18_moon The Moon major
78 major_20_judgment Judgment major

---

## Page 70

Zodiac Tarot App — Card Data Model Reference Page 70
Appendix K: Image Gallery
Every card and symbol icon in the deck, embedded directly in this document so it stands alone without needing
separate access to the project's image files.
Major Arcana (22)
The Fool
[major_00_fool]
The Magician
[major_01_magician]
The High Priestess
[major_02_high_pries
tess]
The Empress
[major_03_empress]
The Emperor
[major_04_emperor]
The Hierophant
[major_05_hierophant
]
The Lovers
[major_06_lovers]
The Chariot
[major_07_chariot]
Strength
[major_08_strength]
The Hermit
[major_09_hermit]
The Wheel of Fortune
[major_10_wheel_of_f
ortune]
Justice
[major_11_justice]
The Hanged Man
[major_12_hanged_m
an]
Death
[major_13_death]
Temperance
[major_14_temperanc
e]

---

## Page 71

Zodiac Tarot App — Card Data Model Reference Page 71
The Devil
[major_15_devil]
The Tower
[major_16_tower]
The Star
[major_17_star]
The Moon
[major_18_moon]
The Sun
[major_19_sun]
Judgment
[major_20_judgment]
The World
[major_21_world]

---

## Page 72

Zodiac Tarot App — Card Data Model Reference Page 72
Minor Arcana — Wands (14)
Ace of Wands
[minor_wands_ace]
Two of Wands
[minor_wands_02]
Three of Wands
[minor_wands_03]
Four of Wands
[minor_wands_04]
Five of Wands
[minor_wands_05]
Six of Wands
[minor_wands_06]
Seven of Wands
[minor_wands_07]
Eight of Wands
[minor_wands_08]
Nine of Wands
[minor_wands_09]
Ten of Wands
[minor_wands_10]
Page of Wands
[minor_wands_page]
Knight of Wands
[minor_wands_knight]
Queen of Wands
[minor_wands_queen]
King of Wands
[minor_wands_king]

---

## Page 73

Zodiac Tarot App — Card Data Model Reference Page 73
Minor Arcana — Cups (14)
Ace of Cups
[minor_cups_ace]
Two of Cups
[minor_cups_02]
Three of Cups
[minor_cups_03]
Four of Cups
[minor_cups_04]
Five of Cups
[minor_cups_05]
Six of Cups
[minor_cups_06]
Seven of Cups
[minor_cups_07]
Eight of Cups
[minor_cups_08]
Nine of Cups
[minor_cups_09]
Ten of Cups
[minor_cups_10]
Page of Cups
[minor_cups_page]
Knight of Cups
[minor_cups_knight]
Queen of Cups
[minor_cups_queen]
King of Cups
[minor_cups_king]

---

## Page 74

Zodiac Tarot App — Card Data Model Reference Page 74
Minor Arcana — Swords (14)
Ace of Swords
[minor_swords_ace]
Two of Swords
[minor_swords_02]
Three of Swords
[minor_swords_03]
Four of Swords
[minor_swords_04]
Five of Swords
[minor_swords_05]
Six of Swords
[minor_swords_06]
Seven of Swords
[minor_swords_07]
Eight of Swords
[minor_swords_08]
Nine of Swords
[minor_swords_09]
Ten of Swords
[minor_swords_10]
Page of Swords
[minor_swords_page]
Knight of Swords
[minor_swords_knight
]
Queen of Swords
[minor_swords_queen
]
King of Swords
[minor_swords_king]

---

## Page 75

Zodiac Tarot App — Card Data Model Reference Page 75
Minor Arcana — Pentacles (14)
Ace of Pentacles
[minor_pentacles_ace
]
Two of Pentacles
[minor_pentacles_02]
Three of Pentacles
[minor_pentacles_03]
Four of Pentacles
[minor_pentacles_04]
Five of Pentacles
[minor_pentacles_05]
Six of Pentacles
[minor_pentacles_06]
Seven of Pentacles
[minor_pentacles_07]
Eight of Pentacles
[minor_pentacles_08]
Nine of Pentacles
[minor_pentacles_09]
Ten of Pentacles
[minor_pentacles_10]
Page of Pentacles
[minor_pentacles_pag
e]
Knight of Pentacles
[minor_pentacles_kni
ght]
Queen of Pentacles
[minor_pentacles_que
en]
King of Pentacles
[minor_pentacles_kin
g]

---

## Page 76

Zodiac Tarot App — Card Data Model Reference Page 76
Symbol Icons — Planet (10)
Mercury
Planet_mercury_
MASTER.png
Moon
Planet_moon_MA
STER.png
Venus
Planet_venus_MA
STER.png
Jupiter
Planet_jupiter_MA
STER.png
Mars
Planet_mars_MA
STER.png
Sun
Planet_sun_MAS
TER.png
Saturn
Planet_saturn_M
ASTER.png
Uranus
Planet_uranus_M
ASTER.png
Pluto
Planet_pluto_MA
STER.png
Neptune
Planet_neptune_
MASTER.png

---

## Page 77

Zodiac Tarot App — Card Data Model Reference Page 77
Symbol Icons — Zodiac Sign (12)
Aries
Zodiac_aries_MA
STER.png
Taurus
Zodiac_taurus_M
ASTER.png
Gemini
Zodiac_gemini_M
ASTER.png
Cancer
Zodiac_cancer_M
ASTER.png
Leo
Zodiac_leo_MAS
TER.png
Virgo
Zodiac_virgo_MA
STER.png
Libra
Zodiac_libra_MAS
TER.png
Scorpio
Zodiac_scorpio_M
ASTER.png
Sagittarius
Zodiac_sagittarius
_MASTER.png
Capricorn
Zodiac_capricorn
_MASTER.png
Aquarius
Zodiac_aquarius_
MASTER.png
Pisces
Zodiac_pisces_M
ASTER.png

---

## Page 78

Zodiac Tarot App — Card Data Model Reference Page 78
Symbol Icons — Element (4)
Fire
Element_fire_MA
STER.png
Water
Element_water_M
ASTER.png
Air
Element_air_MAS
TER.png
Earth
Element_earth_M
ASTER.png

---

## Page 79

Zodiac Tarot App — Card Data Model Reference Page 79
Symbol Icons — Suit (4)
Wands
Suit_wands_MAS
TER.png
Cups
Suit_cups_MAST
ER.png
Swords
Suit_swords_MAS
TER.png
Pentacles
Suit_pentacles_M
ASTER.png
