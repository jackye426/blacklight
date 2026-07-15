// Cart math. Prices are in dollars (floating point) — the `migration` task moves them to
// integer cents.

// Subtotal of all line items.
//
// INTENTIONAL BUG (obvious-bug task): this multiplies by nothing — it ignores `item.qty`,
// so buying 3 of an item only charges for 1. The fix is `item.price * item.qty`.
export function computeSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const TAX_RATE = 0.08;

export function computeTotal(items) {
  const subtotal = computeSubtotal(items);
  return subtotal + subtotal * TAX_RATE;
}
