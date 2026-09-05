// v4 is the default path now (Simon's call, 2 Sep) - narrative and v3's
// lessons merged into one path (docs/decisions/0057). It is the only path:
// v1, v2, and v3 were removed on 3 Sep (docs/decisions/0082), so there is
// nothing else to reach from the dev console. Re-exporting rather than
// duplicating: this and /v4 are the exact same page, not two copies that
// can drift apart.
export { default } from "./v4/page";
