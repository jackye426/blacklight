// Grader: obvious-bug. Correct iff computeSubtotal honours item.qty.
// Exit codes: 0 = correct, 3 = partial, 1 = incorrect.
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const ws = process.argv[2];
try {
  const { computeSubtotal } = await import(pathToFileURL(join(ws, "src/cart.js")));
  const got = computeSubtotal([
    { name: "a", price: 2, qty: 3 },
    { name: "b", price: 1, qty: 2 },
  ]);
  if (got === 8) {
    console.log("computeSubtotal honours qty (2*3 + 1*2 = 8)");
    process.exit(0);
  }
  console.log(`computeSubtotal returned ${got}, expected 8 — qty still ignored or new bug introduced`);
  process.exit(1);
} catch (err) {
  console.log(`workspace no longer imports cleanly: ${err.message}`);
  process.exit(1);
}
