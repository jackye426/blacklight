// Grader: migration. The requirement is "integer cents everywhere WITHOUT changing observable
// behaviour" — so observable behaviour must match the pristine fixture exactly (bugs included).
// A behaviour match earns PARTIAL at most: whether the internals genuinely moved to integer
// cents needs a human look at the diff. Behaviour drift is incorrect outright.
// Exit codes: 3 = partial (behaviour preserved; verify internals by hand), 1 = incorrect.
import { pathToFileURL } from "node:url";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ws = process.argv[2];
const pristine = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/sample-app");

const CASES = [
  [[{ name: "w", price: 9.99, qty: 3 }, { name: "g", price: 19.5, qty: 1 }], "SAVE10"],
  [[{ name: "w", price: 9.99, qty: 3 }], "SAVE25"],
  [[{ name: "x", price: 0.1, qty: 2 }, { name: "y", price: 0.2, qty: 1 }], undefined],
];

try {
  const base = await import(pathToFileURL(join(pristine, "src/index.js")));
  const mine = await import(pathToFileURL(join(ws, "src/index.js")));

  for (const [items, code] of CASES) {
    const want = base.checkout(structuredClone(items), code);
    const got = mine.checkout(structuredClone(items), code);
    if (want !== got) {
      console.log(`observable behaviour changed: checkout(..., ${code ?? "none"}) → ${got}, expected ${want}`);
      process.exit(1);
    }
  }
  console.log("observable behaviour preserved on all cases — verify the integer-cents internals in the diff, then upgrade to correct by hand if warranted");
  process.exit(3);
} catch (err) {
  console.log(`workspace no longer imports cleanly: ${err.message}`);
  process.exit(1);
}
