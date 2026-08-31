// v3 is the default curriculum now (Simon's call, 31 Aug) - v2's own five
// sections, resequenced for variety (docs/decisions/0046). v1 and v2 both
// live on at /v1 and /v2, reachable from the dev console. Re-exporting
// rather than duplicating: this and /v3 are the exact same page, not two
// copies that can drift apart.
export { default } from "./v3/page";
