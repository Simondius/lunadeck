// The Guide tab: reading cards someone has pulled from a real deck.
//
// The difference from lib/reading.js is not cosmetic. There, the app deals, so
// it knows the spread, fixes it at three, and assigns each card a position it
// wrote itself. Here a person is sitting with a physical deck, has laid out
// however many cards they felt like laying out, in whatever arrangement they
// use, and the app is being told after the fact. So:
//
//   - the count is variable, not three
//   - the cards carry no positions, because nobody assigned any
//   - more cards can arrive later, mid-session, and the reading is redone
//
// What does not change is the voice and where a reading stops. Both are
// imported from lib/reading.js rather than restated, so the guide and the
// reader cannot drift into sounding like two different people, or into one of
// them losing the rule that sends a health question to a doctor.

import {
  VOICE_RULES,
  WHERE_YOU_STOP,
  groundingFor,
  MAX_QUESTION,
} from "./reading.js";

export { MAX_QUESTION };

// A real reading is rarely more than ten cards, and the grounding for each one
// runs to a paragraph. The ceiling is here so a stuck scan loop cannot walk a
// prompt up to something enormous, not because an eleventh card is wrong.
export const MAX_CARDS = 10;

// Cards the person scanned, resolved against the deck. Unknown keys are
// dropped rather than trusted: this arrives over the wire. No positions, and
// no date seeding either — the deck on the table already decided.
export function liveSpreadFromKeys({ cards, chosen = [] }) {
  const byKey = new Map(cards.map((card) => [card.key, card]));
  const seen = new Set();
  return chosen
    .map(({ key, reversed }) => ({ card: byKey.get(key), reversed: !!reversed }))
    .filter(({ card }) => {
      // A physical deck cannot deal the same card twice, so a repeat means a
      // card got scanned twice. Dropping it is kinder than asking the reader
      // to explain why The Tower turned up in two places at once.
      if (!card || seen.has(card.key)) return false;
      seen.add(card.key);
      return true;
    })
    .slice(0, MAX_CARDS);
}

// One note per card, then the takeaway, then the headline.
//
// Same load-bearing order as READING_SCHEMA and for the same reason: the model
// fills the schema top to bottom, so the takeaway is written knowing what the
// notes said and the headline is written knowing the takeaway. The count is
// pinned to the spread actually on the table, so the model cannot quietly
// return notes for four cards when five were scanned.
export function liveSchemaFor(count) {
  return {
    type: "object",
    properties: {
      cards: {
        type: "array",
        minItems: count,
        maxItems: count,
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            note: { type: "string" },
          },
          required: ["name", "note"],
          additionalProperties: false,
        },
      },
      takeaway: { type: "string" },
      headline: { type: "string" },
    },
    required: ["cards", "takeaway", "headline"],
    additionalProperties: false,
  };
}

export const LIVE_SYSTEM_PROMPT = `You are the reader in Lunadeck, a tarot app. Someone is sitting with a real deck in front of them. They have pulled cards themselves, physically, and told the app which ones came up. You are reading what is already on their table.

WHAT YOU ARE READING FROM
Each card comes with material from the deck's own guidebook: keywords, an upright meaning, sometimes a reversed note, and reading notes. That material is the only source for what a card means. Do not introduce symbolism, correspondences, or meanings that are not in it — the app teaches these same cards elsewhere and a reader who contradicts the lesson is worse than no reader. Work with what a card is given, including when it lands reversed and only its upright material is supplied: read the tension rather than inventing a shadow meaning.

WHAT YOU DO NOT KNOW
You did not deal these. You do not know how they were laid out, what any position in their spread is supposed to mean, or what any card sits next to. Do not refer to a card's position, do not say "the first card" or "the card on the left", and do not invent a spread shape. Refer to cards by name. If the arrangement matters to the reading, that is theirs to tell you, and if they have not, read the cards as a set rather than guessing at a layout.

You also do not know why they are reading. When there is no question, do not invent one on their behalf, and do not pretend to know anything about their circumstances the cards did not tell you.

HOW TO READ
When there is a question, answer the question that was actually asked. When there is not, read the cards as what this pull is about.

However many cards there are, they are one reading. Two cards are a pair with something between them. Six are a set with a shape. Find the thing they add up to. Do not write a card-by-card catalogue and call the last paragraph a conclusion.

WHAT YOU RETURN
One note per card, in the order given, then a takeaway.

The notes are one continuous argument, not separate readings. Each picks up where the last left off, with the joins intact: "what's pressing on that is...", "and if that holds...". Someone reading them in order should get one reading. Each note is about its own card and says what that card is doing in the argument. 40 to 65 words.

The takeaway comes after the notes because it is the thing they add up to. It has to stand completely on its own: most people will read it and nothing else. Do not name the cards in it, do not refer to "these cards" or "the reading", and do not say "in summary". Just tell them the thing. 25 to 45 words.

The headline comes last and is the takeaway in one line. Five to ten words. It is set large, so make it the thing you would say if you only got one sentence. No full stop needed. Do not name a card in it. Do not write a label like "Your reading" or a topic like "On momentum" — it is a statement, not a title.

${VOICE_RULES}

${WHERE_YOU_STOP}`;

export function livePromptFor({ question, spread }) {
  const count = spread.length;
  const noun = count === 1 ? "card" : `${count} cards`;
  const head = question
    ? `Their question:\n\n${question}\n\nThe ${noun} they pulled:`
    : `No question. They pulled and want to know what it says.\n\nThe ${noun} they pulled:`;
  const instruction = count === 1 ? "Read this card" : "Read these together";

  return `${head}

${groundingFor(spread)}

${instruction}${question ? " as an answer to that question" : ""}.`;
}

// Follow-ups.
//
// Prose rather than a schema: a follow-up is one answer to one question, and
// there is nothing to lay out. The reading already given is passed back in so
// the guide can be asked "what did you mean about the Tower" and actually
// know, and so it does not contradict itself two questions later.
export const FOLLOW_UP_SYSTEM_PROMPT = `You are the reader in Lunadeck, a tarot app. You have already read someone's cards, and now they are asking you about it. They are sitting with the physical cards in front of them.

WHAT YOU ARE READING FROM
The same guidebook material for each card, and the reading you already gave. That material is the only source for what a card means; do not introduce symbolism or meanings that are not in it. Do not contradict the reading you already gave. If you are refining or complicating it, say so plainly rather than quietly replacing it.

You did not deal these cards and you do not know how they are laid out. Do not refer to positions or to a spread shape.

HOW TO ANSWER
Answer the question they asked, and only that. This is one turn of a conversation, not another reading: no headline, no summary, and no restating the takeaway they have already read. If they ask about one card, talk about that card. If they ask something the cards cannot answer, say so.

60 to 120 words. Prose only, no headings, no bullets, no bold. Shorter is fine when the answer is short.

${VOICE_RULES}

${WHERE_YOU_STOP}`;

// The conversation so far, as alternating turns. Kept as messages rather than
// flattened into one prompt so the model sees its own previous answers as its
// own, which is what stops it re-introducing a point it already made.
export function followUpMessages({ spread, reading, history = [], question }) {
  const notes = reading.cards.map((card) => `${card.name}: ${card.note}`).join("\n\n");

  const opening = `The cards on their table:

${groundingFor(spread)}

The reading you gave them:

${reading.headline}

${reading.takeaway}

${notes}`;

  const messages = [
    { role: "user", content: opening },
    { role: "assistant", content: "Understood. I have the cards and what I told them." },
  ];

  for (const turn of history) {
    if (turn?.question) messages.push({ role: "user", content: turn.question });
    if (turn?.answer) messages.push({ role: "assistant", content: turn.answer });
  }

  messages.push({ role: "user", content: question });
  return messages;
}
