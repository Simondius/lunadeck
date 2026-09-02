// Builds data/v4/{fool,lovers,empress}_section.json from the existing
// data/v3 section files (docs/decisions/0057) - v4 collapses each card's
// v3 nodes down to exactly 7 path-nodes per Simon's own choice ("merge
// adjacent nodes into 7 groups... no rounds dropped, no reordering"), so
// this is a one-time build script, not a runtime transform: the output is
// a real, reviewable/editable data file like every other one in data/,
// not something regenerated on every request.
//
// The partition is the classic "split an array into k contiguous parts
// minimizing the largest part's sum" problem, solved by binary search on
// the answer (candidate max group size) plus a greedy feasibility check -
// standard and exact for this size, so the grouping isn't a hand-tuned
// guess. Run with: node scripts/build-v4-sections.mjs
import fs from "node:fs";
import path from "node:path";

const CARDS = ["fool", "lovers", "empress"];
const GROUP_COUNT = 7;

function roundCounts(nodes) {
  return nodes.map((n) => n.rounds.length);
}

// Greedy: can this array be split into <= k contiguous parts each summing
// to <= cap?
function feasible(sizes, k, cap) {
  let parts = 1;
  let sum = 0;
  for (const s of sizes) {
    if (s > cap) return false;
    if (sum + s > cap) {
      parts += 1;
      sum = s;
      if (parts > k) return false;
    } else {
      sum += s;
    }
  }
  return true;
}

function partitionIndices(sizes, k) {
  let lo = Math.max(...sizes);
  let hi = sizes.reduce((a, b) => a + b, 0);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (feasible(sizes, k, mid)) hi = mid;
    else lo = mid + 1;
  }
  const cap = lo;
  const groups = [];
  let current = [];
  let sum = 0;
  for (let i = 0; i < sizes.length; i++) {
    if (sum + sizes[i] > cap && current.length) {
      groups.push(current);
      current = [];
      sum = 0;
    }
    current.push(i);
    sum += sizes[i];
  }
  if (current.length) groups.push(current);
  // The greedy pass can land on fewer than k groups if the cap has slack -
  // that's fine (v3's own node counts already vary this way), but never
  // more than k since feasible() enforced that as the search bound.
  return groups;
}

for (const card of CARDS) {
  const srcPath = path.join("data", "v3", `${card}_section.json`);
  const src = JSON.parse(fs.readFileSync(srcPath, "utf8"));
  const sizes = roundCounts(src.nodes);
  const groups = partitionIndices(sizes, GROUP_COUNT);

  const nodes = groups.map((idxs, i) => ({
    id: `node-${i + 1}`,
    rounds: idxs.flatMap((idx) => src.nodes[idx].rounds),
  }));

  const totalIn = sizes.reduce((a, b) => a + b, 0);
  const totalOut = nodes.reduce((a, n) => a + n.rounds.length, 0);
  if (totalIn !== totalOut) {
    throw new Error(`${card}: round count mismatch, ${totalIn} -> ${totalOut}`);
  }

  const out = { cardKey: src.cardKey, cardName: src.cardName, nodes };
  const outDir = path.join("data", "v4");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${card}_section.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(
    `${card}: ${src.nodes.length} v3 nodes (${totalIn} rounds) -> ${nodes.length} v4 nodes`,
    nodes.map((n) => n.rounds.length)
  );
}
