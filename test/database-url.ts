export const DEFAULT_TEST_DATABASE_URL =
  "postgresql://unseal:unseal@localhost:5434/unseal_test?schema=public";

export function requireTestDatabaseUrl(value?: string) {
  const connectionString = value || DEFAULT_TEST_DATABASE_URL;
  let databaseName: string;

  try {
    const url = new URL(connectionString);
    databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    throw new Error("Test database URL is invalid");
  }

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to run destructive tests against database "${databaseName}". ` +
        "The database name must end with _test.",
    );
  }

  return connectionString;
}
