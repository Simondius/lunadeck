# 0022 — Units are chapter breaks, and they get names not labels

**Date:** 2026-08-29
**Status:** Accepted

> Renumbered from 0020: Simon's 0020 landed the same day and took the number
> first from his branch's point of view. Nothing about this decision changed.

## Context

Tia, on the unit banner: *"this is a bit jank. dont think it needs a
desciription, dont think instant classic is a good title, not mystical enough?
and the guidebook button floats awkwardly, idk."*

Three complaints, and the third was caused by the first. The banner was a
bordered panel doing four jobs — chapter marker, progress counter, fold
control, and a link out to the guidebook — with a three-line text block on the
left and a pill button vertically centred against it. Nothing lines up with a
three-line block, so the button floated.

## Decision

**The banner is a chapter break, not a card.** No panel, no border: an eyebrow
line, the unit's name, and a hairline rule under it, centred over the axis the
sections wind around. The panel implied the unit
was an object sitting on the path; it is a heading in a scroll.

The tagline is gone from the path. It still exists, on the unit's guidebook
page, which is where someone reads about a unit — `0012`'s rule again.

**The Guidebook is the third item in the eyebrow line**, in the same mono
accent as the unit number, so the right edge holds only the fold chevron. It
stays a sibling of the toggle rather than a child: one interactive element must
not nest in another.

Banner height goes from 96px to 47px.

**The units get names.** All ten read as a syllabus — "Completing the Court",
"Sharpening the Mind" — which is honest but flat, and the path is the one place
the app gets to sound like tarot rather than a course. Each new name is an
image drawn from what the unit actually holds, chosen by Tia from three
directions:

| unit | was | is | what it holds |
| --- | --- | --- | --- |
| 1 | Instant Classics | **First Light** | the Fool, Magician, Empress, Emperor, the aces |
| 2 | Completing the Court | **The Cup Bearers** | last obvious majors, then the Cups court |
| 3 | The Royal Court | **Thrones** | every remaining court card |
| 4 | Turning Points | **The Wheel Turns** | the Swords court, Chariot, Hermit, Wheel |
| 5 | Big Swings | **Storm and Star** | Devil, Tower, Star, World |
| 6 | The Cups Story | **Deep Water** | Two through Nine of Cups, in order |
| 7 | Wands in Motion | **Fire and Wonder** | the Wands run plus the High Priestess |
| 8 | Grounding Down | **Earth and Coin** | end of Wands, most of Pentacles |
| 9 | Sharpening the Mind | **The Edge** | last Pentacles, Hierophant, Swords turning hard |
| 10 | The Deep End | **The Far Shore** | Hanged Man, Temperance, Moon, Judgment |

Only the `unit_name` field changed; taglines and intro copy are untouched, and
`check_data.py` passes.

## The circles, closing 0021

`0021` said a CSS crop could not reach the derived circle art and left
re-exporting to later. Looking at the path made that untenable — every node
wore a white arc down its right side, on the screen the app opens to.

`scripts/script_make_path_circles.py` now crops 813px rather than the full
840px width, and its paths are repo-relative rather than pointing at the
sandbox it was first written in, so it runs from a clone. All 78 circles
regenerated: none has a white edge, verified by sampling the rightmost visible
pixels of each.

**Since superseded from the other direction.** The masters no longer carry the
bleed at all — 0019 trimmed it at the source hours later — so the circles here
were cut from art that has since been replaced, and have been regenerated again
from the trimmed files. The script no longer hardcodes a width either: 0019
left the masters at anything from 813 to 924 wide, so it crops a square of each
file's own width. The avatar crops carry it too — all 78 —
but nothing in the app renders an avatar yet, and that script's manual override
boxes are hand-tuned per card, so regenerating them blind would be churn
against art nobody is looking at.

## Amended, same day

Left-aligned, it still read wrong — a caption that had come loose from the
page, sitting above a path that is centred. It is now centred on the same axis
as the section nodes, and measures identical to them: name centre 720px against
node centre 720px at desktop, 195 against 195 on a phone.

The unit's number came out of the eyebrow at the same time. The masthead
already says which unit you are in, and repeating it 40px lower was the stutter
that made the whole block feel busy; the name is the unit's identity, and the
eyebrow now carries only progress and the guidebook. The first heading also
gained room under the overall progress bar, which is 2px of full-width rule and
stacked into a stripe with the heading's own.
