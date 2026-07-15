import { computeSubtotal, computeTotal } from "./cart.js";
import { applyDiscount } from "./discount.js";
import { formatPrice } from "./format.js";

// Checkout composes the pieces.
//
// INTENTIONAL BUG (broad-exploration-bug task): the discount is applied to the SUBTOTAL, but
// tax is then computed on the full (undiscounted) total via computeTotal(). Because the two
// numbers are combined in the wrong order, some discount codes make the final number go UP.
// The bug is here in the composition, not in discount.js.
export function checkout(items, code) {
  const discountedSubtotal = applyDiscount(computeSubtotal(items), code);
  const totalWithTax = computeTotal(items); // ignores the discount — wrong
  const finalCents = Math.round((discountedSubtotal + (totalWithTax - computeSubtotal(items))) * 100);
  return formatPrice(finalCents);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const items = [
    { name: "Widget", price: 9.99, qty: 3 },
    { name: "Gadget", price: 19.5, qty: 1 },
  ];
  console.log("Total:", checkout(items, "SAVE10"));
}
