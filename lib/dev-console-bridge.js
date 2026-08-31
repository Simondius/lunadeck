// A minimal pub/sub connecting NodeSession (mounted per /v2/play route) to
// DevConsole (mounted once, at the root layout, alongside every route). They
// don't share a React tree, so there's no prop or context path between them
// - this is the smallest thing that lets DevConsole show "skip without
// completing" controls only while a node is actually on screen, and forward
// clicks back to whichever node that is.
let current = null;
const listeners = new Set();

// Called by NodeSession on mount with { onNext, onPrev }, and by its cleanup
// with nothing (clearing back to null) - a plain function-ref registry, not
// a stack, since only one node session is ever mounted at a time.
export function registerNodeSkip(handlers) {
  current = handlers;
  listeners.forEach((fn) => fn(current));
  return () => {
    if (current === handlers) {
      current = null;
      listeners.forEach((fn) => fn(current));
    }
  };
}

export function subscribeNodeSkip(fn) {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}
