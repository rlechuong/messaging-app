import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

if (existsSync(".env.test")) process.loadEnvFile(".env.test");

export default defineConfig({
  test: {
    globalSetup: ["./src/test/global-setup.ts"],
    setupFiles: ["./src/test/setup.ts"],
    fileParallelism: false,
  },
});
