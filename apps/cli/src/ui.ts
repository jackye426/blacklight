/** Minimal console output helpers. Colour is used only on a TTY and honours NO_COLOR. */

const useColor = Boolean(process.stdout.isTTY) && !process.env["NO_COLOR"];

function paint(code: string, s: string): string {
  return useColor ? `\x1b[${code}m${s}\x1b[0m` : s;
}

export const bold = (s: string): string => paint("1", s);
export const dim = (s: string): string => paint("2", s);
export const green = (s: string): string => paint("32", s);
export const red = (s: string): string => paint("31", s);
export const cyan = (s: string): string => paint("36", s);
export const yellow = (s: string): string => paint("33", s);

export function heading(s: string): void {
  console.log("\n" + bold(s));
}
export function step(s: string): void {
  console.log(cyan("→ ") + s);
}
export function ok(s: string): void {
  console.log(green("✓ ") + s);
}
export function warn(s: string): void {
  console.log(yellow("! ") + s);
}
export function fail(s: string): void {
  console.error(red("✗ ") + s);
}
