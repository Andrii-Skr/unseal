import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { requireTestDatabaseUrl } from "./test/database-url";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const e2eDatabaseUrl = requireTestDatabaseUrl(
  process.env.E2E_DATABASE_URL ?? process.env.TEST_DATABASE_URL,
);

if (externalBaseUrl && !process.env.E2E_DATABASE_URL) {
  throw new Error(
    "E2E_DATABASE_URL is required with PLAYWRIGHT_BASE_URL so cleanup cannot target the wrong database.",
  );
}

process.env.DATABASE_URL = e2eDatabaseUrl;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/database-setup.ts",
  timeout: 40_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "pnpm exec next dev -p 3100",
        env: {
          DATABASE_URL: e2eDatabaseUrl,
          NEXT_DIST_DIR: ".next-e2e",
          RATE_LIMIT_SECRET: "unseal-e2e-rate-limit-secret",
        },
        url: "http://localhost:3100/create",
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
      },
    },
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
      },
    },
    {
      name: "desktop-webkit",
      use: {
        ...devices["Desktop Safari"],
        browserName: "webkit",
      },
    },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "tablet-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
});
