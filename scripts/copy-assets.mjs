// Next.js only serves static files from public/, but the repo keeps art in
// assets/ so it sits alongside the data it belongs to. This mirrors assets/
// into public/assets/ before dev and build. public/assets is gitignored —
// assets/ stays the single source of truth.
import { cp, mkdir } from "node:fs/promises";

await mkdir("public/assets", { recursive: true });
await cp("assets", "public/assets", { recursive: true });
console.log("assets/ -> public/assets/");
