// Grader: broad-exploration-bug. The real defect is checkout()'s composition in index.js
// (discount applied to subtotal, tax computed on the undiscounted total). Correct iff the
// final price equals tax applied AFTER discount, using the workspace's own subtotal/discount
// functions — so this stays valid whether or not the unrelated qty bug was also fixed.
// Exit codes: 0 = correct, 3 = partial, 1 = incorrect.
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const ws = process.argv[2];
const TAX_RATE = 0.08; // fixture constant (src/cart.js)

const parseCents = (s) => Math.round(parseFloat(String(s).replace(/[^0-9.\-]/g, "")) * 100);

try {
  const { computeSubtotal } = await import(pathToFileURL(join(ws, "src/cart.js")));
  const { applyDiscount } = await import(pathToFileURL(join(ws, "src/discount.js")));
  const { checkout } = await import(pathToFileURL(join(ws, "src/index.js")));

  const items = [
    { name: "a", price: 10, qty: 1 },
    { name: "b", price: 5, qty: 2 },
  ];
  const sub = computeSubtotal(items);
  const expected = Math.round(applyDiscount(sub, "SAVE10") * (1 + TAX_RATE) * 100);
  const undiscounted = Math.round(sub * (1 + TAX_RATE) * 100);
  const got = parseCents(checkout(items, "SAVE10"));

  if (got === expected) {
    console.log("discount is applied before tax; SAVE10 lowers the total correctly");
    process.exit(0);
  }
  if (got <= undiscounted) {
    console.log(`total no longer increases with a discount, but composition is still off (got ${got}c, expected ${expected}c)`);
    process.exit(3);
  }
  console.log(`SAVE10 still raises the total (got ${got}c vs undiscounted ${undiscounted}c)`);
  process.exit(1);
} catch (err) {
  console.log(`workspace no longer imports cleanly: ${err.message}`);
  process.exit(1);
}
