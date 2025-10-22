import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use happy-dom for DOM simulation
    environment: "happy-dom",

    // Test file patterns
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],

    // Global test timeout
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "tests/**/*.test.ts",
        "tests/**/*.spec.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Global setup
    globals: true,
  },
});
