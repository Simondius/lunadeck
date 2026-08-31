import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { getReaderDeck } from "@/lib/data";
import { bad, missingKeyResponse, anthropicErrorResponse } from "@/lib/api-errors";
import { stripEmDashes } from "@/lib/reading";
import {
  MAX_CARDS,
  MAX_QUESTION,
  LIVE_SYSTEM_PROMPT,
  FOLLOW_UP_SYSTEM_PROMPT,
  liveSpreadFromKeys,
  liveSchemaFor,
  livePromptFor,
  followUpMessages,
} from "@/lib/live-reading";

// The Guide tab's server half. Two intents on one route because they share the
// deck load, the error handling and the em-dash guarantee, and splitting them
// would mean maintaining that three times over.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ten cards of grounding plus a reading is comfortably inside this; the
// ceiling is headroom for adaptive thinking, not a target.
const MAX_TOKENS = 8000;
const MAX_HISTORY = 12;

// The prompts forbid em dashes; this makes it true. A budget in a prompt is a
// request, and asking for "at most one" returned two, twice — see 0027. The
// reader having none of them is a thing Tia asked for outright, so it is
// enforced rather than hoped for.
function cleaner() {
  let stripped = false;
  const clean = (value) => {
    const text = String(value ?? "");
    const out = stripEmDashes(text);
    if (out !== text) stripped = true;
    return out;
  };
  return { clean, didStrip: () => stripped };
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) return missingKeyResponse();

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Could not read that request.");
  }

  const intent = body?.intent === "question" ? "question" : "interpret";
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const chosen = Array.isArray(body?.cards) ? body.cards : null;

  if (!chosen || chosen.length === 0) {
    return bad("Scan at least one card first.");
  }
  if (chosen.length > MAX_CARDS) {
    return bad(`That is more than ${MAX_CARDS} cards. End the session and start again.`);
  }
  if (question.length > MAX_QUESTION) {
    return bad(`Keep it under ${MAX_QUESTION} characters.`);
  }
  if (intent === "question" && !question) {
    return bad("Ask something about the cards.");
  }

  const deck = await getReaderDeck();
  const spread = liveSpreadFromKeys({ cards: deck, chosen });

  if (spread.length === 0) {
    return bad("None of those cards are in the deck.");
  }

  const client = new Anthropic();

  return intent === "question"
    ? followUp({ client, body, spread, question })
    : interpret({ client, spread, question });
}

async function interpret({ client, spread, question }) {
  let message;
  try {
    message = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: LIVE_SYSTEM_PROMPT,
      output_config: {
        // A reading is a short grounded synthesis, not a hard reasoning
        // problem, and someone is watching a spinner while it runs.
        effort: "medium",
        // The count is pinned to what is actually on the table, so the model
        // cannot return four notes for five cards and leave the UI to guess
        // which card went unread.
        format: jsonSchemaOutputFormat(liveSchemaFor(spread.length)),
      },
      messages: [{ role: "user", content: livePromptFor({ question, spread }) }],
    });
  } catch (error) {
    const response = anthropicErrorResponse(error, "guide");
    if (response) return response;
    throw error;
  }

  if (message.stop_reason === "refusal") {
    return bad("That one can't be read. Try asking it another way.", 422);
  }

  const parsed = message.parsed_output;
  if (!parsed?.takeaway || !parsed?.headline || !Array.isArray(parsed.cards)) {
    console.error("[guide] structured output did not validate", message.stop_reason);
    return bad("The reading came back malformed. Try again.", 502);
  }

  // Each note is matched back to its card by position rather than by trusting
  // the name the model echoed. A mismatch is logged, not repaired: silently
  // reordering would hide a prompt that had stopped working.
  const notes = parsed.cards;
  spread.forEach(({ card }, i) => {
    if (notes[i]?.name && notes[i].name !== card.name) {
      console.warn(`[guide] note ${i} says "${notes[i].name}" but slot ${i} is "${card.name}"`);
    }
  });

  const { clean, didStrip } = cleaner();
  const headline = clean(parsed.headline);
  const takeaway = clean(parsed.takeaway);

  // The client renders the cards itself, so it needs the art and the
  // orientation, not the guidebook rows, which were only ever grounding.
  const cards = spread.map(({ card, reversed }, i) => ({
    key: card.key,
    name: card.name,
    master: card.master,
    reversed,
    note: clean(notes[i]?.note),
  }));

  if (didStrip()) {
    console.warn("[guide] stripped em dashes the prompt should have prevented");
  }

  return Response.json({ question, headline, takeaway, cards });
}

async function followUp({ client, body, spread, question }) {
  const reading = body?.reading;
  if (!reading?.takeaway || !Array.isArray(reading?.cards)) {
    return bad("Get an interpretation before asking about it.");
  }

  // Trimmed to the most recent turns. A long session should not be able to
  // walk the prompt up without limit, and the reading itself is always
  // included, so what falls off the front is the least load-bearing part.
  const history = Array.isArray(body?.history) ? body.history.slice(-MAX_HISTORY) : [];

  let message;
  try {
    message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: FOLLOW_UP_SYSTEM_PROMPT,
      // No output_config: a follow-up is one answer to one question and has
      // nothing to lay out, so prose is the right shape and a schema would
      // only add a way for it to fail validation.
      messages: followUpMessages({ spread, reading, history, question }),
    });
  } catch (error) {
    const response = anthropicErrorResponse(error, "guide");
    if (response) return response;
    throw error;
  }

  if (message.stop_reason === "refusal") {
    return bad("That one can't be answered. Try asking it another way.", 422);
  }

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n\n")
    .trim();

  if (!text) {
    console.error("[guide] follow-up came back empty", message.stop_reason);
    return bad("The answer came back empty. Try again.", 502);
  }

  const { clean, didStrip } = cleaner();
  const answer = clean(text);
  if (didStrip()) {
    console.warn("[guide] stripped em dashes the prompt should have prevented");
  }

  return Response.json({ question, answer });
}
