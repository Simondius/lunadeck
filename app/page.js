// v4 is the default path now (Simon's call, 2 Sep) - narrative and v3's
// lessons merged into one path (docs/decisions/0057). v1, v2, and v3 all
// live on at their own routes, reachable from the dev console. Re-
// exporting rather than duplicating: this and /v4 are the exact same
// page, not two copies that can drift apart.
export { default } from "./v4/page";
