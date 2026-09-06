// Unit 1: The Fool. Adapted directly from Tia's 27-screen mock walkthrough
// ("06.09.26 Onboarding Mocks" / assets/Journey Fool prototype images/ in
// this repo - screen 1 of that set is a Guide-screen preview of the
// unlocked outcome, not a beat, so it isn't reproduced here; screens 2-27
// map to the 26 beats below in order). Captions are copied verbatim from
// the mocks. Art is extracted from the same screens - see
// docs/decisions/0100-journey-mode-scaffold.md for the extraction approach
// (each background is the mock's own illustration with its baked caption
// cropped off, since the caption itself is rendered live by JourneyText;
// the card art is cropped once, from screen 10, and reused via `cardArt`
// everywhere the card appears).
//
// beat.textStyle: Simon's own brief draws the line on MEANING, not on
// punctuation - "text that describes something that is happening" is
// action (straight, swipes left-to-right with the gold/silver dust band
// then sparkles), "eg thud" was one example of that, not the whole rule.
// "text that is narrative" (spoken lines, and reflective/expository
// narration) swipes in from the right, italic. An earlier pass here
// narrowed "action" to only asterisk-marked lines and reclassified every
// other line - including "Oops, dropped them.." itself, an event
// happening in plain words - as narrative; that was a misreading Simon
// corrected (0906), not a deliberate exception. So: quoted dialogue and
// reflective/expository narration stay "narrative"; a line that
// describes an in-scene event happening (Thud, dropping the cards) is
// "action".

const BG = "/assets/journey/fool/backgrounds";
const CARD = "/assets/journey/fool/card-face.png";
// Shared, unit-agnostic asset: the tarot deck's own card-back design glowing
// in a starfield, used by every unit's reveal beat. Simon dropped Magician's
// raw mocks in 0906 and its own "screen 6" (card-back glow) turned out to be
// pixel-identical to this file - it's the deck's card back, not art specific
// to any one card - so it moved here (out of assets/journey/fool/) rather
// than shipping two copies of the same 191KB image.
const SHARED = "/assets/journey/shared";

export const fool = {
  slug: "fool",
  cardKey: "major_00_fool",
  cardName: "The Fool",
  // The two images the new Journey home screen (components/journey/
  // journey-home-screen.jsx) stacks as its "two cards" preview, per
  // Simon's 0906 spec: `cardFace` is the card being taught (same art
  // every in-player beat uses via `cardArt`), `previewBg` is "a single
  // visual from the current stage of the story" - for now that's just
  // this unit's own scene, since there's no beat-level progress tracking
  // yet (lib/journey-progress.js only knows whole-unit completion) - once
  // that exists, this is where "which scene the reader last saw" logic
  // replaces the flat pick.
  cardFace: CARD,
  previewBg: `${BG}/neighbour-daughter.jpg`,
  beats: [
    { kind: "line", bg: "void", textStyle: "action", text: "*Thud*" },
    {
      kind: "line",
      bg: `${BG}/dropped-cards.jpg`,
      textStyle: "action",
      text: "Oops, dropped them..",
    },
    {
      kind: "line",
      bg: `${BG}/dropped-cards.jpg`,
      textStyle: "narrative",
      text: "“Hey! Are those Tarot cards?”",
    },
    {
      kind: "line",
      bg: `${BG}/neighbour-daughter.jpg`,
      textStyle: "narrative",
      text: "Oh, it's my neighbour and his nosy daughter.",
    },
    {
      kind: "line",
      bg: `${BG}/give-me-a-reading.jpg`,
      textStyle: "narrative",
      text: "“Can you give me a reading?”",
    },
    {
      kind: "line",
      bg: `${BG}/might-be-busy.jpg`,
      textStyle: "narrative",
      text: "“Meadow! They might be busy.. and you didn't even say hello..”",
    },
    {
      kind: "line",
      bg: `${BG}/sigh.jpg`,
      textStyle: "narrative",
      text: "“Sigh...”",
    },
    {
      kind: "line",
      bg: `${BG}/dropped-cards.jpg`,
      textStyle: "narrative",
      text: "“Well, can I?”",
    },
    {
      kind: "line",
      bg: "void",
      cardArt: CARD,
      textStyle: "narrative",
      text: "Take a good long look at this card..",
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      text: "Which of these could apply?",
      options: [
        { key: "adventure", label: "adventure", correct: true },
        { key: "pain", label: "pain", correct: false },
        { key: "fortune", label: "fortune", correct: false },
      ],
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      text: "Which of these could apply?",
      options: [
        { key: "strategy", label: "strategy", correct: false },
        { key: "freedom", label: "freedom", correct: true },
        { key: "confusion", label: "confusion", correct: false },
      ],
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      text: "Which of these could apply?",
      options: [
        { key: "pride", label: "pride", correct: false },
        { key: "fury", label: "fury", correct: false },
        { key: "leap-of-faith", label: "leap of faith", correct: true },
      ],
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      textStyle: "narrative",
      text: "The Fool represents..",
      options: [
        { key: "adventure-2", label: "adventure", correct: false },
        { key: "freedom-2", label: "freedom", correct: false },
        { key: "leap-of-faith-2", label: "leap of faith", correct: true },
      ],
    },
    // Simon (0906): "after this step it should animate to reveal the
    // fool" - the mock's own reveal-glow screen is a static illustration
    // (the glowing card is baked into the background art, not a live
    // element), so there's no isolated "card back" asset to flip between
    // faces of. journey-player.jsx's revealCard handling instead lets
    // this beat's glow play out as normal, then flashes and dims the
    // background to reveal an actual, live CARD (the same card-face.png
    // every other beat uses) scaling/fading in on top - see
    // .journey-reveal* in app/globals.css for the timed sequence.
    { kind: "line", bg: `${SHARED}/card-back-reveal.jpg`, cardArt: CARD, revealCard: true },
    {
      kind: "line",
      bg: `${BG}/calling-me-stupid.jpg`,
      textStyle: "narrative",
      text: "“The Fool.. are you calling me stupid?”",
    },
    {
      kind: "line",
      bg: `${BG}/thinking-about-freedom.jpg`,
      textStyle: "narrative",
      text: "You have been thinking about freedom lately..",
    },
    {
      kind: "line",
      bg: `${BG}/grand-adventure.jpg`,
      textStyle: "narrative",
      text: "The idea of a grand adventure..",
    },
    {
      kind: "line",
      bg: `${BG}/leap-of-faith-encouraged.jpg`,
      textStyle: "narrative",
      text: "You're being encouraged to take a leap of faith!",
    },
    { kind: "line", bg: `${BG}/shocked-reaction.jpg` },
    {
      kind: "line",
      bg: `${BG}/worried-but.jpg`,
      textStyle: "narrative",
      text: "“Meadow.. I know you're worried but..”",
    },
    {
      kind: "line",
      bg: `${BG}/i-believe-in-you.jpg`,
      textStyle: "narrative",
      text: "“I believe in you.”",
    },
    {
      kind: "line",
      bg: `${BG}/ok-dad.jpg`,
      textStyle: "narrative",
      text: "“Ok Dad..”",
    },
    {
      kind: "line",
      bg: `${BG}/grand-adventure.jpg`,
      textStyle: "narrative",
      text: "“I'll sign up for that school trip tomorrow.”",
    },
    {
      kind: "line",
      bg: `${BG}/thanks-neighbour.jpg`,
      textStyle: "narrative",
      text: "“Thanks neighbour, I owe you one!”",
    },
    {
      kind: "unlock",
      bg: "void",
      cardArt: CARD,
      text: "The Fool embarks on a great journey..",
    },
  ],
};
