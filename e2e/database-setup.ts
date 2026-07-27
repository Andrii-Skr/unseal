import { Client } from "pg";
import { requireTestDatabaseUrl } from "../test/database-url";

async function clearE2eDatabase() {
  const connectionString = requireTestDatabaseUrl(process.env.DATABASE_URL);
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query('DELETE FROM "Card"');
    await client.query('DELETE FROM "CardCreationQuota"');
    await client.query('DELETE FROM "ExpiredCardToken"');
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

export default async function prepareE2eDatabase() {
  await clearE2eDatabase();
  return clearE2eDatabase;
}
