import "dotenv/config";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { requireTestDatabaseUrl } from "./test/database-url";

process.env.DATABASE_URL = requireTestDatabaseUrl(
  process.env.TEST_DATABASE_URL,
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": new URL("./test/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
