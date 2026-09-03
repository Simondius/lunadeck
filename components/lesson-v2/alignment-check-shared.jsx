// Shared between alignment-check-intro.jsx and alignment-check-outro.jsx -
// the outro's own three stars have to land in the exact same settled line
// the intro ends on, so both read from one definition rather than two
// copies of the same coordinates quietly drifting apart over time.
// finalY clears the card's own bottom edge (the card wrap is 176px wide,
// ~315px tall at the deck's card-ratio, so half-height is ~157px) - the
// line sits just beneath the card, not layered over the art itself.
export const ALIGNMENT_STARS = [
  { id: "s1", finalX: -78, finalY: 195, scale: 0.7, opacity: 0.55, delay: 0 },
  { id: "s2", finalX: 0, finalY: 195, scale: 1, opacity: 0.8, delay: 180 },
  { id: "s3", finalX: 78, finalY: 195, scale: 1.3, opacity: 1, delay: 360 },
];

export function AlignmentSparkle({ style, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className} style={style}>
      <path
        d="M12 2 L14.2 9.4 L21.5 12 L14.2 14.6 L12 22 L9.8 14.6 L2.5 12 L9.8 9.4 Z"
        fill="currentColor"
      />
    </svg>
  );
}
