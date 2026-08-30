import Anthropic from "@anthropic-ai/sdk";
import { getReaderDeck } from "@/lib/data";
import { pullSpread, userPromptFor, SYSTEM_PROMPT, MAX_QUESTION } from "@/lib/reading";

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
      "The reader has no API key. Set ANTHROPIC_API_KEY in .env.local and restart the dev server.",
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Could not read that request.");
  }

  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return bad("Ask the reader something first.");
  if (question.length > MAX_QUESTION) {
    return bad(`Keep it under ${MAX_QUESTION} characters.`);
  }

  const cards = await getReaderDeck();
  const spread = pullSpread({ cards });
  if (spread.length === 0) return bad("The deck failed to load.", 500);

  const client = new Anthropic();

  let message;
  try {
    message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      // A reading is a short grounded synthesis, not a hard reasoning
      // problem, and someone is watching a spinner while it runs.
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPromptFor({ question, spread }) }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return bad("The reader's API key was rejected. Check ANTHROPIC_API_KEY in .env.local.", 502);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return bad("The reader is being asked too much at once. Try again shortly.", 429);
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
        return bad(`The reader's account is out of credit. ${detail}`, 502);
      }
      return bad(
        `The reader couldn't answer (${error.status}). Check the dev server log for the reason.`,
        502
      );
    }
    throw error;
  }

  if (message.stop_reason === "refusal") {
    return bad("The reader won't answer that one. Try asking it another way.", 422);
  }

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) return bad("The reader had nothing to say. Try again.", 502);

  return Response.json({
    question,
    reading: text,
    // The client renders the cards itself, so it needs the art and the
    // orientation — not the guidebook rows, which were only ever grounding.
    cards: spread.map(({ card, reversed, position }) => ({
      key: card.key,
      name: card.name,
      master: card.master,
      reversed,
      position: position.name,
      brief: position.brief,
    })),
  });
}
