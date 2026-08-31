// Turning an Anthropic SDK failure into something a person can act on.
//
// Extracted from app/api/reading/route.js when the Guide tab needed the same
// handling. The reason it is shared rather than copied is the credit-balance
// case: the very first live call the reader ever made failed on an empty
// balance, the route flattened it to "couldn't answer (400)", and we spent a
// while looking at the request instead of the account. That fix is worth
// exactly once, and a second route with its own slightly different version of
// it would lose the lesson without anyone noticing.

import Anthropic from "@anthropic-ai/sdk";

export function bad(message, status = 400) {
  return Response.json({ error: message }, { status });
}

// The one setup failure that is not the API's fault, checked before any call
// is attempted. Said plainly rather than as a 500: on this project the cause
// is almost always a missing .env.local, and the fix belongs in the message.
export function missingKeyResponse() {
  return bad(
    "No API key. Set ANTHROPIC_API_KEY in .env.local and restart the dev server.",
    503
  );
}

// `tag` only labels the server log, so a line in the terminal says which
// feature was talking. Returns null for anything that is not an API error, so
// the caller can rethrow: a bug in our own code should crash loudly rather
// than be reported to the user as a failed reading.
export function anthropicErrorResponse(error, tag) {
  if (error instanceof Anthropic.AuthenticationError) {
    return bad("The API key was rejected. Check ANTHROPIC_API_KEY in .env.local.", 502);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return bad("Too many readings at once. Try again shortly.", 429);
  }
  if (error instanceof Anthropic.APIError) {
    // The API's own message is the useful part and a bare status code is not.
    // Log it whole, and pass the setup-shaped ones through — they name a thing
    // the person running the app can actually go and fix.
    console.error(`[${tag}] Anthropic API error`, error.status, error.message);

    const detail = error.error?.error?.message ?? "";
    if (/credit balance|billing|quota/i.test(detail)) {
      return bad(`The account is out of credit. ${detail}`, 502);
    }
    return bad(
      `The reading failed (${error.status}). Check the dev server log for the reason.`,
      502
    );
  }
  return null;
}
