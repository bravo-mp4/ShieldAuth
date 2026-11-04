import { Pool } from "pg";
import { runMigrations } from "../migrations/run";

// Start every run from an empty schema so migrations are exercised too.
export default async function setup() {
  const pool = new Pool({
    connectionString:
      process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:55432/shieldauth_test",
  });
  try {
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await runMigrations(pool, () => undefined);
  } finally {
    await pool.end();
  }
}
