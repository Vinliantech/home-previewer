import { defineConfig } from "vitest/config";
import path from "node:path";

// Deliberately separate from the app's Vite config: tests exercise pure
// modules only and must not pull in the TanStack Start / Lovable plugins.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
