import { defineConfig } from "vitest/config";

// Blacklight analyses other repos into vendor/ and investigations/fixtures — neither should be
// picked up as our own tests. Restrict discovery to first-party workspace source.
export default defineConfig({
  test: {
    include: ["{packages,adapters,apps}/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "vendor/**", "investigations/**"],
  },
});
