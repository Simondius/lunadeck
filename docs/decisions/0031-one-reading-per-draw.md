# 0031 — One reading per draw

**Date:** 2026-08-30
**Status:** Accepted

## Context

Tia, on the results screen:

> *"when I get to this screen, the text I see changes within the first second.
> Like it's loading or it's cached something and updating it."*

Instrumenting `fetch` found it immediately, and it was worse than a flicker.
**Two requests, 2ms apart, for a single draw.** Two readings were generated and
the second overwrote the first, so the takeaway visibly changed under her. It
also billed twice.

The cause is the guard in `DailyReading`:

```js
useEffect(() => {
  if (!dealt.takeaway && !dealt.reading && !error) fetchReading();
}, [dealt.takeaway]);
```

React's StrictMode invokes effects twice on mount in development. Both
invocations ran *before either response had landed*, so `dealt.takeaway` was
still empty both times and the guard passed twice. Checking stored state cannot
deduplicate a request that takes 8.5 seconds to change that state.

## Decision

Guard on a ref holding the draw already sent, set synchronously at the point of
sending rather than a render later.

```js
const requested = useRef(null);
useEffect(() => {
  if (dealt.takeaway || dealt.reading || error) return;
  if (requested.current === dealt.date) return;
  requested.current = dealt.date;
  fetchReading();
}, [dealt.takeaway, dealt.date, error]);
```

Keyed on `dealt.date` so tomorrow's draw fetches again on the same instance.
Refs survive StrictMode's remount, which is exactly the property needed.

The *Try again* button calls `fetchReading` directly and deliberately bypasses
the guard: after a failure, a repeat is the point.

## Consequences

**Verified: one call, one headline, no change on screen.** Down from two.

**This was development-only, and it still mattered.** StrictMode does not
double-invoke in a production build, so the doubled spend was not going to ship.
But the guard was wrong regardless: any re-render before the response lands
would have refired it, and a second copy of a paid, slow, non-idempotent request
is the kind of bug that is invisible until someone reads their bill.

**A cheap rule that would have caught it:** a request that changes state only
when it returns cannot be deduplicated by checking that state. The guard has to
be set at the point of sending.

**Two instrumentation mistakes are worth recording**, because both produced
confident wrong answers before the real one.

Stacking `fetch` wrappers without reloading double-counted every request:
each wrapper pushed to the same global array and then called the previous
wrapper, which pushed again. That reported two calls *after* the fix and nearly
sent me chasing a bug that was no longer there.

Comparing a truncated string against a full one made a watcher report the
headline changing on every poll. That reported `textChangedUnderYou: true` on a
screen where nothing was changing.

Reload between instrumented runs, and compare like for like.
