import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import sharp from "sharp";
import { getDrawDeck } from "@/lib/data";
import { bad, missingKeyResponse, anthropicErrorResponse } from "@/lib/api-errors";
import {
  RECOGNITION_MODEL,
  RECOGNITION_PROMPT,
  recognitionSchemaFor,
  recognitionMessages,
  parseDataUrl,
} from "@/lib/card-recognition";

// Identifying a photographed card. See docs/decisions/0043.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Small: the output is four short fields. The headroom is for thinking, and
// nothing here should approach it.
const MAX_TOKENS = 1500;

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) return missingKeyResponse();

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Could not read that request.");
  }

  const image = parseDataUrl(body?.image);
  if (image.error) return bad(image.error);

  const cards = await getDrawDeck();
  if (cards.length === 0) return bad("The deck failed to load.", 500);

  // Both views of the frame. A reversed card is the same picture turned
  // through 180 degrees, so showing both guarantees one of them has the
  // card's printed name the right way up — which is the only reliable way to
  // identify it. Measured: identity on upside-down cards was 3/6 from a single
  // view and the wrong answers came back at high confidence. See 0043.
  let asShot;
  let rotated;
  try {
    const source = Buffer.from(image.base64, "base64");
    // Normalised to one size and format so the two views cost the same and the
    // model is not comparing a big picture with a small one.
    //
    // 768 rather than something smaller because of what has to stay legible:
    // not the wide name banner, which is easy, but the small numeral banner at
    // the top of a numbered minor. That numeral is the entire difference
    // between the Two and the Ten of Pentacles.
    const base = sharp(source).resize({ width: 768, withoutEnlargement: true });
    [asShot, rotated] = await Promise.all([
      base.clone().jpeg({ quality: 82 }).toBuffer(),
      base.clone().rotate(180).jpeg({ quality: 82 }).toBuffer(),
    ]);
  } catch (error) {
    console.error("[scan] could not decode the image", error.message);
    return bad("That image could not be read. Choose the card by hand.");
  }

  const client = new Anthropic();

  let message;
  try {
    message = await client.messages.parse({
      model: RECOGNITION_MODEL,
      max_tokens: MAX_TOKENS,
      system: RECOGNITION_PROMPT,
      output_config: {
        // No `effort` here, unlike the reading routes: Haiku rejects the
        // parameter outright with "This model does not support the effort
        // parameter". Nothing is lost, since low is what would have been asked
        // for anyway.
        format: jsonSchemaOutputFormat(recognitionSchemaFor(cards)),
      },
      messages: recognitionMessages({
        cards,
        mediaType: "image/jpeg",
        asShot: asShot.toString("base64"),
        rotated: rotated.toString("base64"),
      }),
    });
  } catch (error) {
    const response = anthropicErrorResponse(error, "scan");
    if (response) return response;
    throw error;
  }

  if (message.stop_reason === "refusal") {
    return bad("That image can't be read. Choose the card by hand.", 422);
  }

  const parsed = message.parsed_output;
  if (!parsed?.card_key) {
    console.error("[scan] structured output did not validate", message.stop_reason);
    return bad("The scan came back unreadable. Try again.", 502);
  }

  // The enum should make this impossible. Checked anyway, because the failure
  // it prevents is silent: an unknown key would sail through the scanner, get
  // added to the session, and then be dropped by liveSpreadFromKeys, so the
  // card would vanish between scanning it and the reading.
  const card = cards.find((entry) => entry.key === parsed.card_key);
  if (!card) {
    console.error("[scan] model returned a key outside the deck", parsed.card_key);
    return bad("That card isn't in this deck. Choose it by hand.", 502);
  }

  if (parsed.bottom_banner && parsed.confidence === "high") {
    // Worth a line in the log: a high-confidence answer whose read name does
    // not match the key it chose means the prompt is drifting, and the enum
    // would hide it by making the answer look valid.
    const read = parsed.bottom_banner.trim().toLowerCase();
    const actual = card.name.toLowerCase();
    if (read && !actual.includes(read) && !read.includes(actual)) {
      console.warn(
        `[scan] banners "${parsed.bottom_banner}" / "${parsed.top_banner}" but chose ${card.key}`
      );
    }
  }

  // "second" means the rotated view is the one that read correctly, so the card
  // as it lay on the table was upside down. That is what reversed means.
  const reversed = parsed.upright_view === "second";

  return Response.json({
    key: card.key,
    name: card.name,
    master: card.master,
    reversed,
    confidence: parsed.confidence === "high" ? "high" : "low",
    read: [parsed.top_banner, parsed.bottom_banner].filter(Boolean).join(" "),
  });
}
