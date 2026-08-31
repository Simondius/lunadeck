// v2 is the default curriculum now (Simon's call, 31 Aug) - the real one
// moved to /v1, reachable from the dev console. Re-exporting rather than
// duplicating: this and /v2 are the exact same page, not two copies that can
// drift apart.
export { default } from "./v2/page";
