# 0009 — Desktop frames the mobile app, and the serpentine keeps to its sides

**Date:** 2026-08-29
**Status:** Accepted

## Context

Two things looked wrong the first time the app was opened in a desktop
browser rather than a phone-sized viewport.

**The spine ran through every line of text.** The path's dotted spine is at
`left: 50%` of `.path`, and each `.stop` is a flex row of art then body with
`gap: 14px`. The body therefore starts immediately after the art and takes all
remaining width, so on a 376px path the body spans roughly 98px to 330px and
crosses the centre at 188px. Measured on the running app: six stops out of six
had both their title and their tagline crossing the spine. Mirroring the even
rows changes which side the art is on but not that the text crosses.

**A 420px column sat stranded in a 1280px window.** That is what a mobile
design does on a desktop, but it reads as broken rather than deliberate, and
it makes the app awkward to check without opening device emulation every time.

## Decision

**The stop's art and body take opposite edges.** `justify-content:
space-between`, the side padding dropped, and `.stop-body` fixed at 46% of the
path. Each stop now keeps to its own half and the spine runs down the gap
between them, which is what a serpentine with a centre spine has to mean.
Measured after the change: zero crossings, at both 375px and 1280px.

**Above 900px the app renders inside a device frame** — 428px wide, centred on
a darker page, rounded, with the scrollbar hidden. Below 900px the wrapper is
inert and the app is full-bleed exactly as designed; nothing about the mobile
layout changes.

The frame carries `transform: translateZ(0)`, which makes it the containing
block for `position: fixed` descendants. Without that the tab bar, the lesson
footer, the unit page's resume button, the starfield and the inspector overlay
would all pin to the window while the content sat in the middle — the frame
would look like a frame but preview nothing correctly. With it, every fixed
element pins to the frame, so what you see on desktop is what a phone gets.

`.session` and `.complete` get `min-height: 0` inside the frame, since `100dvh`
measures the window and would otherwise overflow it.

## Consequences

This is a preview affordance, not a desktop design. The app is still mobile —
every spec is drawn at a 375-420pt phone frame and the App Store is the stated
destination. A real desktop layout, if lunadeck.app ever wants one, is its own
design pass and would not look like a phone in the middle of the screen.

The 900px breakpoint is a guess at "big enough that a stranded column looks
wrong". Tablets in portrait stay full-bleed.
