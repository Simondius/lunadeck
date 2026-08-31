import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { getReaderDeck } from "@/lib/data";
import {
  pullSpread,
  spreadFromKeys,
  userPromptFor,
  dailyPromptFor,
  stripEmDashes,
  SYSTEM_PROMPT,
  READING_SCHEMA,
  MAX_QUESTION,
} from "@/lib/reading";

// The reader is the one part of this app that cannot be answered from the
// CSVs, so it is the one part that needs a server. Everything else still
// renders statically; this route is the exception, and it is why the Reader
// tab can no longer ship as a pure static export. See docs/decisions/0025.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A reading runs 150–220 words. The ceiling is headroom for adaptive
// thinking, not a target — nothing here should approach it.
const MAX_TOKENS = 4000;

function bad(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Said plainly rather than as a 500: on this project the cause is almost
    // always a missing .env.local, and the fix belongs in the message.
    return bad(
      "No API key. Set ANTHROPIC_API_KEY in .env.local and restart the dev server.",
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Could not read that request.");
  }

  // Two shapes of request. With a question, the reader answers it and pulls
  // its own three. Without one, this is the daily draw: the client has already
  // chosen the spread, because only it knows what the curriculum has taught,
  // and those three are seeded by the date so the day deals the same cards
  // however many times this route is asked.
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const chosen = Array.isArray(body?.cards) ? body.cards : null;

  if (!question && !chosen) {
    return bad("Ask a question, or deal the daily three first.");
  }
  if (question.length > MAX_QUESTION) {
    return bad(`Keep it under ${MAX_QUESTION} characters.`);
  }

  const cards = await getReaderDeck();
  const spread = chosen
    ? spreadFromKeys({ cards, chosen })
    : pullSpread({ cards });

  if (spread.length === 0) {
    return bad(
      chosen ? "None of those cards are in the deck." : "The deck failed to load.",
      chosen ? 400 : 500
    );
  }

  const client = new Anthropic();

  let message;
  try {
    message = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      output_config: {
        // A reading is a short grounded synthesis, not a hard reasoning
        // problem, and someone is watching a spinner while it runs.
        effort: "medium",
        // A takeaway that has to stand alone is asked for, not sliced off the
        // end of a prose blob. The last paragraph only sometimes worked as a
        // summary: one reading ended on a fragment of the third card's
        // argument, another on a question back to the person. See 0028.
        format: jsonSchemaOutputFormat(READING_SCHEMA),
      },
      messages: [
        {
          role: "user",
          content: question
            ? userPromptFor({ question, spread })
            : dailyPromptFor({ spread }),
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return bad("The API key was rejected. Check ANTHROPIC_API_KEY in .env.local.", 502);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return bad("Too many readings at once. Try again shortly.", 429);
    }
    if (error instanceof Anthropic.APIError) {
      // The API's own message is the useful part and a bare status code is
      // not: the first live call this route ever made failed on an empty
      // credit balance, and "couldn't answer (400)" sent us looking at the
      // request. Log it whole, and pass the setup-shaped ones through — they
      // name a thing the person running the app can actually go and fix.
      console.error("[reader] Anthropic API error", error.status, error.message);

      const detail = error.error?.error?.message ?? "";
      if (/credit balance|billing|quota/i.test(detail)) {
        return bad(`The account is out of credit. ${detail}`, 502);
      }
      return bad(
        `The reading failed (${error.status}). Check the dev server log for the reason.`,
        502
      );
    }
    throw error;
  }

  if (message.stop_reason === "refusal") {
    return bad("That one can't be read. Try asking it another way.", 422);
  }

  // parsed_output is null when the model's JSON did not validate.
  const parsed = message.parsed_output;
  if (!parsed?.takeaway || !parsed?.headline || !Array.isArray(parsed.cards)) {
    console.error("[reader] structured output did not validate", message.stop_reason);
    return bad("The reading came back malformed. Try again.", 502);
  }

  // The schema fixes the count at three and the prompt says "in the order
  // given", but each note is matched back to its card by position rather than
  // by trusting the name the model echoed. A mismatch is logged, not repaired:
  // silently reordering would hide a prompt that had stopped working.
  const notes = parsed.cards;
  spread.forEach(({ card }, i) => {
    if (notes[i]?.name && notes[i].name !== card.name) {
      console.warn(
        `[reader] note ${i} says "${notes[i].name}" but slot ${i} is "${card.name}"`
      );
    }
  });

  // The prompt forbids em dashes; this makes it true. A budget in a prompt is
  // a request, and asking for "at most one" returned two, twice. The reader
  // having none of them is a thing Tia asked for outright, so it is enforced
  // rather than hoped for. Logged when it fires, because a prompt that keeps
  // slipping is worth knowing about rather than silently patching over.
  let stripped = false;
  const clean = (value) => {
    const text = String(value ?? "");
    const out = stripEmDashes(text);
    if (out !== text) stripped = true;
    return out;
  };

  const takeaway = clean(parsed.takeaway);
  const headline = clean(parsed.headline);
  // The client renders the cards itself, so it needs the art and the
  // orientation, not the guidebook rows, which were only ever grounding.
  const read = spread.map(({ card, reversed, position }, i) => ({
    key: card.key,
    name: card.name,
    master: card.master,
    reversed,
    position: position.name,
    brief: position.brief,
    note: clean(notes[i]?.note),
  }));

  if (stripped) {
    console.warn("[reader] stripped em dashes the prompt should have prevented");
  }

  return Response.json({ question, headline, takeaway, cards: read });
}
