// Placing a position:fixed element at a coordinate you measured with
// getBoundingClientRect.
//
// Those two things are not in the same coordinate space, and assuming they are
// has now caused four bugs in this repo: the dev console (0032, 0033), the
// reveal overlay (0030), and the three v2 drag overlays this module was
// written for. So it is worth stating the rule once, here.
//
// getBoundingClientRect returns viewport coordinates. `left` on a fixed
// element is measured from its containing block, which is the viewport ONLY if
// no ancestor establishes one. .app-frame does establish one at desktop widths
// (transform: translateZ(0), see the 900px block in globals.css), so above
// that breakpoint a fixed element told `left: 400px` lands 400px from the
// frame's left edge, not the window's. The frame sits 361px in at a 1150px
// window, so every such overlay was landing 361px right of its target and,
// for a 428px frame, usually off the edge entirely.
//
// Below 900px the frame is untransformed and flush to the corner, which is
// exactly why this class of bug survives review: it is invisible at the size
// the app is designed for and only appears in the desktop preview.

// The origin a fixed descendant of `el` measures from.
//
// Deliberately asks the real question — "does an ancestor establish a
// containing block?" — rather than special-casing .app-frame. The frame is
// today's answer; a filter or a contain on some future wrapper would be
// tomorrow's, and this returns the right number either way.
export function fixedOrigin(el) {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (
      style.transform !== "none" ||
      style.perspective !== "none" ||
      style.filter !== "none" ||
      style.backdropFilter !== "none" ||
      style.willChange.includes("transform") ||
      style.contain.includes("paint") ||
      style.contain.includes("layout") ||
      style.contain === "strict" ||
      style.contain === "content"
    ) {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    }
  }
  // No transformed ancestor: fixed resolves against the viewport, so the
  // measured coordinate is already correct and nothing is subtracted.
  return { left: 0, top: 0 };
}

// Put a fixed element at a viewport rect. Width and height are plain lengths
// and pass through untouched; only the origin needs translating.
export function placeFixed(el, { left, top, width, height }) {
  if (!el) return;
  const origin = fixedOrigin(el);
  el.style.left = `${left - origin.left}px`;
  el.style.top = `${top - origin.top}px`;
  if (width !== undefined) el.style.width = `${width}px`;
  if (height !== undefined) el.style.height = `${height}px`;
}
