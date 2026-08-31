// Working out which card is in a photograph.
//
// The answer space is the deck, not the world. Every card key comes from
// data_tarot_cards_base.csv via the schema's enum, so the model cannot return
// a card that is not in the 78, cannot invent a name, and cannot hand back a
// key that lib/live-reading.js will silently drop. Constraining the output to
// the repo's own card list is what makes this reliable enough to act on.
//
// Two things make the job easier than "recognise a tarof card" sounds. These
// cards carry their name printed on them, so most of the work is reading a
// short piece of text. And the deck is fixed and known, so a partial read
// still narrows to one candidate.
//
// Orientation comes back too. A card photographed upside down is a reversed
// card, and asking for it here is free, where asking the person is another tap.

// Haiku rather than Opus. This is reading a name off a picture against a closed
// list, not a judgement, and it runs once per card scanned: a six card reading
// would otherwise be six Opus calls before the reading itself. Escalate only if
// it turns out to struggle.
export const RECOGNITION_MODEL = "claude-haiku-4-5-20251001";

// The captured frame is already downscaled client-side. This is a backstop
// against a caller posting something enormous, checked before the base64 is
// handed to the API.
export const MAX_IMAGE_BYTES = 4_000_000;

export function recognitionSchemaFor(cards) {
  return {
    type: "object",
    properties: {
      // Which of the two views is the right way up, asked first because
      // everything else depends on it: the name can only be read off the
      // upright one, and the card can only be named once the name is read.
      upright_view: {
        type: "string",
        enum: ["first", "second"],
        description: "Which view has the card the right way up.",
      },
      // The two banners get a field each, and both come before the key.
      //
      // This is the same trick as READING_SCHEMA's ordering (0028): the model
      // fills the schema top to bottom, so asking for each banner separately
      // forces it to actually look at both before it commits to an identity.
      // Measured: with one combined "visible_name" field it read the bottom
      // banner, stopped, and returned "SWORDS" at high confidence, having
      // never examined the numeral that distinguishes the fourteen cards that
      // answer to it.
      bottom_banner: {
        type: "string",
        description:
          "Exactly what is written in the wide banner across the bottom, read from the upright view. Empty string if unreadable.",
      },
      top_banner: {
        type: "string",
        description:
          "Exactly what is in the small banner at the top: a roman numeral on a major, a number on a numbered minor. Empty string if there is none or it is unreadable. Do not guess it.",
      },
      card_key: {
        type: "string",
        enum: cards.map((card) => card.key),
      },
      confidence: { type: "string", enum: ["high", "low"] },
    },
    required: ["upright_view", "bottom_banner", "top_banner", "card_key", "confidence"],
    additionalProperties: false,
  };
}

export const RECOGNITION_PROMPT = `You identify tarot cards in photographs. The deck is fixed: every photograph is of a card from the list you are given, so the answer is always one of them.

YOU GET TWO VIEWS OF THE SAME PHOTOGRAPH
The second is the first turned through 180 degrees. Exactly one of them has the card the right way up, and you are not told which.

Work that out first. Whichever view lets you read the card's printed name as normal text, that is the upright one. Answer "first" or "second" in upright_view, then read the name from that view and identify the card from it.

This is the whole reason you get two views. A card photographed upside down has upside-down lettering, which is hard to read and easy to misidentify from imagery alone: a card read the wrong way up gets confidently mistaken for a different card. So do not identify the card from the inverted view. Turn it over, read the text, then answer.

WHERE THIS DECK PRINTS WHAT
Every card has a wide banner across the bottom, and most have a small banner at the top. What is in them depends on the kind of card, and knowing this is most of the job:

- Major arcana. Bottom banner: the name, like "THE TOWER". Top banner: a roman numeral, like "XVI". Either one identifies the card, and they check each other.
- Court cards, the pages, knights, queens and kings. Bottom banner: the full name, like "KNIGHT of SWORDS". That identifies the card on its own.
- Numbered minor arcana, ace through ten. Bottom banner: THE SUIT ONLY, like "PENTACLES". The number is NOT in the bottom banner. It is the numeral in the small banner at the top, like "2" or "10".

That last case is the one to be careful about, because the bottom banner is the easiest thing to read and on those cards it is not enough: "PENTACLES" narrows the answer to fourteen cards, not one. You must combine it with the numeral from the top banner.

Never write a number into visible_name that you did not actually see. The bottom banner does not contain one on a numbered minor, so if the top numeral is not legible, do not fill the gap from the imagery and present it as a reading. Count the suit objects instead, write what you counted, like "PENTACLES, counted 2 coins", and answer low.

Some of these cards are close to symmetrical, a wheel or a circle of figures, and their imagery will not tell you which way up they are. The lettering will. Check which way it runs.

CONFIDENCE
high only when what you read is enough to name one card: a major's name or numeral, a court card's full name, or a numbered minor's suit AND its top numeral together. low for everything else. In particular: low when you read the suit but counted the objects rather than reading the numeral, low when you inferred from partial imagery, and low when you could not tell which view was upright.

low is not a failure and it is not punished. It tells the app to ask the person which card it is rather than assume, which is the right outcome when you are not sure. A wrong answer given at high confidence is much worse than any answer given at low, because the app acts on it. If there is no card in the photograph at all, pick any key and answer low.

Return only the structured output.`;

// The deck as a list the model can match a name against. Names only: the
// guidebook meanings are irrelevant to identifying a picture, and sending 78
// cards' worth of them would be paying for the whole deck to read one banner.
export function deckListFor(cards) {
  return cards.map((card) => `${card.key} = ${card.name}`).join("\n");
}

// Both views, in order: as photographed, then turned through 180 degrees.
//
// The order is the contract the schema's `upright_view` depends on, so the
// caller must not swap them. "second" means the rotated view reads correctly,
// which means the card as it lay on the table was upside down, which is what
// reversed means.
export function recognitionMessages({ cards, mediaType, asShot, rotated }) {
  const image = (data) => ({
    type: "image",
    source: { type: "base64", media_type: mediaType, data },
  });

  return [
    {
      role: "user",
      content: [
        { type: "text", text: "First view, the photograph as taken:" },
        image(asShot),
        { type: "text", text: "Second view, the same photograph turned through 180 degrees:" },
        image(rotated),
        {
          type: "text",
          text: `Which card from this deck is it, and which view is the right way up?

${deckListFor(cards)}`,
        },
      ],
    },
  ];
}

// Data URLs arrive from the client's canvas. Parsed rather than trusted: the
// media type has to be one the API accepts, and the payload has to be base64
// that decodes to something of a sane size.
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function parseDataUrl(value) {
  if (typeof value !== "string") return { error: "No image was sent." };

  const match = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(value.trim());
  if (!match) return { error: "That image was not in a format the app could read." };

  const [, mediaType, base64] = match;
  if (!ALLOWED.has(mediaType.toLowerCase())) {
    return { error: `Images of type ${mediaType} are not supported.` };
  }

  // base64 is 4 characters per 3 bytes.
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    return { error: "That image is too large to send." };
  }
  if (bytes < 1024) {
    return { error: "That image is too small to be a card." };
  }

  return { mediaType: mediaType.toLowerCase(), base64, bytes };
}
