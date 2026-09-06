// Unit 2: The Magician. Adapted directly from Simon's 20-screen raw mock
// dump (assets/journey/magician/ in this repo, dropped straight into that
// folder rather than inside a "prototype images" holding subfolder like the
// Fool batch was - the raw 1-20.png files themselves are NOT committed, only
// what's extracted below; see docs/decisions/0100-journey-mode-scaffold.md
// for the extraction approach). Screen 1 of that set is a Guide-screen
// preview of the unlocked outcome (same role as the Fool set's own screen 1),
// not a beat. Screen 7 (the full card settled in the starfield, no black
// backdrop) is also not its own beat - it's simply what journey-player.jsx's
// existing revealCard flash/card-in animation already produces on top of
// screen 6's glow background, the same way Fool's single revealCard beat
// works. That leaves screens 2-6, 8-20 mapping to the 18 beats below, in
// order. Captions are copied verbatim from the mocks, including Tia's own
// lowercase "i'm" (0906 fool.js sets the precedent: verbatim, not corrected).
//
// Unlike Fool, this story's card-teaching interlude (the reveal + "Not every
// card has obvious visual clues.." aside + the 4 guess-the-word rounds) sits
// BEFORE the framing story resolves, not after - the mocks are unambiguous
// about this ordering (screens 6-12 sit between the setup at 2-5 and the
// resolution at 13-19), so the beat order below follows the screens exactly
// rather than mirroring Fool's own screen order.
//
// Word-choice correctness (beats 7-10 below): the mocks show four neutral
// pill-button rounds with no visual "this one's right" marker baked in - the
// same is true of Fool's equivalent rounds, so this isn't a Magician-specific
// gap. Nothing in data/data_card_keywords.csv or data_card_descriptions.csv
// for major_01_magician uses the words "manifestation"/"resourcefulness"/
// "willpower" verbatim either (its guidebook keywords are shrewdness,
// intelligence, personal ability, skill, communication - Fool's own
// "adventure"/"freedom"/"leap of faith" don't literally match its keyword
// list any more than this does), so these are Tia's own thematic paraphrases
// same as Fool's, not something to reconcile against the CSV. Per-round
// correct answers (manifestation, resourcefulness, willpower - each read
// back in the farmer's own lines at beats 11-13, "resourceful"/"willpower"/
// "manifested") aren't in doubt. The one real judgment call is the summary
// round at beat 10 ("The Magician represents..", all three words as
// options): I picked manifestation, since it's this card's headline meaning
// industry-wide (the four tools laid on the table = turning intent into
// reality) and lines up with this app's own guidebook description ("personal
// resources... ability to use them to obtain what we need"). Flagging this
// explicitly - if Tia's source material says otherwise, swap which option
// carries `correct: true` on that one beat; nothing else here depends on it.
//
// beat.textStyle: same rule as fool.js - only literal asterisk-marked lines
// are "action". Every line in this unit is either quoted dialogue or plain
// narration, so nothing here is "action"; the three preliminary guess-the-
// word rounds omit textStyle entirely, matching how fool.js's own equivalent
// rounds (options: adventure/pain/fortune, etc.) leave it unset too.
//
// captionPosition: "high" on every road-scene beat (Simon, 0906 follow-up):
// unlike Fool's scenes, this unit's road backgrounds put their empty space
// at the TOP (open sky) rather than the bottom, and the mocks put the
// caption up there to match - see journey-player.jsx's own comment on this
// field for the measurement and why it's per-beat rather than a global CSS
// change.

const BG = "/assets/journey/magician/backgrounds";
const CARD = "/assets/journey/magician/card-face.png";
const SHARED = "/assets/journey/shared";

export const magician = {
  slug: "magician",
  cardKey: "major_01_magician",
  cardName: "The Magician",
  cardFace: CARD,
  previewBg: `${BG}/road-scene.jpg`,
  beats: [
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“Guys, come on..”",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“Ah! hey stranger, you heading into town?”",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“Sorry about the blockage, Milly here saw a butterfly..”",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“Honestly, i'm at a loss for what to do..”",
    },
    // Same timed flash -> dim -> card-in sequence as fool.js's own
    // revealCard beat, played over the shared card-back glow background.
    { kind: "line", bg: `${SHARED}/card-back-reveal.jpg`, cardArt: CARD, revealCard: true },
    {
      kind: "line",
      bg: "void",
      cardArt: CARD,
      textStyle: "narrative",
      text: "Not every card has obvious visual clues..",
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      text: "Try your best to guess the right word..",
      options: [
        { key: "manifestation", label: "manifestation", correct: true },
        { key: "greed", label: "greed", correct: false },
        { key: "pain", label: "pain", correct: false },
      ],
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      text: "Try your best to guess the right word..",
      options: [
        { key: "adventure", label: "adventure", correct: false },
        { key: "joy", label: "joy", correct: false },
        { key: "resourcefulness", label: "resourcefulness", correct: true },
      ],
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      text: "Try your best to guess the right word..",
      options: [
        { key: "destruction", label: "destruction", correct: false },
        { key: "willpower", label: "willpower", correct: true },
        { key: "freedom", label: "freedom", correct: false },
      ],
    },
    {
      kind: "choice",
      bg: "void",
      cardArt: CARD,
      textStyle: "narrative",
      text: "The Magician represents..",
      options: [
        { key: "manifestation-2", label: "manifestation", correct: true },
        { key: "resourcefulness-2", label: "resourcefulness", correct: false },
        { key: "willpower-2", label: "willpower", correct: false },
      ],
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "I get the feeling you're a resourceful person..",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "With a lot of willpower..",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "You must have manifested this meeting!",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“Haha, comforted by a stranger..”",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“Well, if its all the same to you..”",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“Take Molly and grab a sack..”",
    },
    {
      kind: "line",
      bg: `${BG}/road-scene.jpg`,
      captionPosition: "high",
      textStyle: "narrative",
      text: "“We'll ditch the cart and ride into town.”",
    },
    {
      kind: "unlock",
      bg: "void",
      cardArt: CARD,
      text: "The Magician manifested a way out of his predicament..",
    },
  ],
};
