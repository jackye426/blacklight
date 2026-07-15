// Applies a discount code to a total (in dollars). The function itself is correct — the
// `broad-exploration-bug` task's real cause is upstream, in how index.js orders operations.
const CODES = {
  SAVE10: 0.1,
  SAVE25: 0.25,
};

export function applyDiscount(total, code) {
  const rate = CODES[code] ?? 0;
  return total * (1 - rate);
}
