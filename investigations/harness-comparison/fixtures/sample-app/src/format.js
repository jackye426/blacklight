// Formats an integer number of cents as a currency string. This function is CORRECT.
// The `misleading-instructions` task will claim the bug is here — it is not.
export function formatPrice(cents) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars}.${remainder}`;
}
