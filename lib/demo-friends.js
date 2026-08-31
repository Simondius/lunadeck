// PLACEHOLDER DATA. These people do not exist.
//
// This is not a data layer and nothing reads it but the Social feed. It exists
// so the feed can be looked at and judged before there is an account system to
// fill it, which Tia asked for having already heard the argument against
// inventing social content. Delete this file the moment real activity arrives;
// `friendActivity()` is the only thing the screen imports, so replacing it with
// a real fetch is a one-line change at the call site.
//
// **Only daily draws appear here, and that is a rule rather than a gap.** A
// question is something a person typed about their own life — the job, the
// relationship, the thing they have not told anyone — and it has no business
// on someone else's screen. The daily draw is the only part of this tab that
// is not private: nobody chose its cards and nobody said why they wanted them.
// If the feed ever grows a second event type, it is not that one.
//
// Three rules were kept while writing it, and are worth keeping if it is edited:
//
// 1. **Real card keys only.** The art and names resolve from the deck, so a
//    made-up key would render a broken image rather than fail loudly.
//
// 2. **The takeaways do not contradict the cards.** Each one was written
//    against that card's actual keywords and reversed notes from the CSVs. A
//    feed that says something about The Hermit the curriculum disagrees with is
//    the same fault as a reader that does, just somewhere less expected —
//    `0025`'s "generated prose, sourced substance" applies here too.
//
// Usernames are the ones `Spec_Meta_Hygiene_Systems` Figure 3 uses in its own
// example, so the placeholder at least matches the documented design.

const FRIENDS = [
  {
    id: "moonchild22",
    name: "moonchild22",
    avatar: "/assets/cards/avatar/major_18_moon_avatar.png",
    when: "this morning",
    progress: 61,
    streak: 9,
    // The Star: community, hope. Four of Wands: stability, celebration.
    // Eight of Cups: leaving certainty behind, entering unknown territory.
    cards: [
      { key: "major_17_star", reversed: false },
      { key: "minor_wands_04", reversed: false },
      { key: "minor_cups_08", reversed: false },
    ],
    takeaway:
      "Something steady is worth marking before you leave it. Keep the people close, and be honest that the next thing is a step into the unknown rather than a tidier version of this one.",
  },
  {
    id: "hermit_hollow",
    name: "hermit_hollow",
    avatar: "/assets/cards/avatar/major_09_hermit_avatar.png",
    when: "2 hours ago",
    progress: 82,
    streak: 14,
    // Hermit reversed: solitude tipping into isolation, avoiding reflection.
    // Two of Pentacles: daily balance, juggling. Ace of Swords: clarity, truth.
    cards: [
      { key: "major_09_hermit", reversed: true },
      { key: "minor_pentacles_02", reversed: false },
      { key: "minor_swords_ace", reversed: false },
    ],
    takeaway:
      "You have been calling it focus, but it has gone quiet in a way that costs you. The juggling gets lighter the moment you say plainly what you are actually carrying.",
  },
  {
    id: "cups_and_stars",
    name: "cups_and_stars",
    avatar: "/assets/cards/avatar/major_03_empress_avatar.png",
    when: "yesterday",
    progress: 47,
    streak: 5,
    // Empress: creation, nourishment. Knight of Cups reversed: charm without
    // follow-through. Ten of Pentacles: abundance, wonder in everyday life.
    cards: [
      { key: "major_03_empress", reversed: false },
      { key: "minor_cups_knight", reversed: true },
      { key: "minor_pentacles_10", reversed: false },
    ],
    takeaway:
      "There is more here than you are crediting it for. Someone's warmth has been running hot and cold; do not measure the whole of it by that, and look at what has actually been built.",
  },
];

// The same people as a list rather than a feed. Spec_Meta_Hygiene_Systems
// §5.1 gives each row an avatar, a username, a progress bar and a streak, and
// that part of the spec is followed as written — the departures in 0034 are
// about search and profiles, not about how a row looks.
export function demoFriends() {
  return FRIENDS.map(({ id, name, avatar, progress, streak }) => ({
    id,
    name,
    avatar,
    progress,
    streak,
  }));
}

// Resolved against the real deck so names and art come from the CSVs rather
// than being duplicated here. A key that is not in the deck drops out, which
// keeps a typo from rendering a broken card.
export function friendActivity(deck = []) {
  const byKey = new Map(deck.map((card) => [card.key, card]));

  return FRIENDS.map((friend) => ({
    ...friend,
    cards: friend.cards
      .map(({ key, reversed }) => {
        const card = byKey.get(key);
        return card ? { key, reversed, name: card.name, master: card.master } : null;
      })
      .filter(Boolean),
  })).filter((friend) => friend.cards.length > 0);
}
