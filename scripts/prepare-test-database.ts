import "dotenv/config";

import { spawnSync } from "node:child_process";
import {
  DEFAULT_TEST_DATABASE_URL,
  requireTestDatabaseUrl,
} from "../test/database-url";

const prepareE2eDatabase = process.argv.includes("--e2e");
const connectionString = requireTestDatabaseUrl(
  prepareE2eDatabase
    ? process.env.E2E_DATABASE_URL ?? process.env.TEST_DATABASE_URL
    : process.env.TEST_DATABASE_URL,
);
const databaseUrl = new URL(connectionString);
const usesBundledTestDatabase =
  databaseUrl.hostname === "localhost" &&
  databaseUrl.port === "5434" &&
  databaseUrl.pathname === "/unseal_test";

function run(command: string, args: string[], environment = process.env) {
  const result = spawnSync(command, args, {
    env: environment,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (usesBundledTestDatabase) {
  run("docker", ["compose", "up", "-d", "--wait", "postgres-test"]);
}

run(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "prisma", "migrate", "deploy"],
  {
    ...process.env,
    DATABASE_URL: connectionString || DEFAULT_TEST_DATABASE_URL,
  },
);
