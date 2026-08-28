# 0001 — Record decisions in this folder

**Date:** 2026-08-28
**Status:** Accepted

## Context

Work on Lunadeck happens across separate Claude accounts and separate chat
sessions. Chat history does not transfer between collaborators, so reasoning
that lives only in a conversation is lost to everyone else.

## Decision

Non-obvious decisions get a short numbered file in `docs/decisions/`. Number
them sequentially. Keep them to context, decision, and consequences — a few
paragraphs, not a document.

Worth recording: curriculum sequencing choices, distractor tuning, changes to
the data model, anything a future contributor would otherwise have to
reverse-engineer.

Not worth recording: routine content edits, typo fixes.

## Consequences

Slight overhead per decision. In exchange, both the humans and their Claude
sessions can read the same history.
