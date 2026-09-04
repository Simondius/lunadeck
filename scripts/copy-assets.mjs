// Next.js only serves static files from public/, but the repo keeps art in
// assets/ so it sits alongside the data it belongs to. This mirrors assets/
// into public/assets/ before dev and build. public/assets is gitignored —
// assets/ stays the single source of truth.
//
// Removes the old mirror first rather than copying over it (0096): plain
// cp() only ever adds/overwrites, so a file present in an old public/assets/
// but since removed from assets/ - never committed in the first place, say -
// lingers there forever. That's exactly how this repo shipped 11 story-art
// references with no file backing them for two days: the author's own
// public/assets/ still had art whose source under assets/ had never actually
// been committed, so the gap only ever showed up on someone else's machine
// (0068's own diagnosis) or, as this time, in a fresh checkout on the same
// machine. A clean rm+copy makes public/assets/ always exactly answer "what
// does the repo actually have," on every machine, every run.
import { cp, mkdir, rm } from "node:fs/promises";

await rm("public/assets", { recursive: true, force: true });
await mkdir("public/assets", { recursive: true });
await cp("assets", "public/assets", { recursive: true });
console.log("assets/ -> public/assets/ (clean)");
