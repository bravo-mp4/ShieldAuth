import fs from "fs";
import path from "path";
import type { Pool } from "pg";

// When compiled, this file runs from dist/migrations/ but the .sql files stay
// in the source migrations/ folder.
const MIGRATIONS_DIR = fs.existsSync(path.join(__dirname, "001_init.sql"))
  ? __dirname
  : path.resolve(__dirname, "../../migrations");

/**
 * Applies every NNN_*.sql file in this folder that hasn't run yet, in order,
 * each inside its own transaction, and records it in schema_migrations.
 */
export async function runMigrations(pool: Pool, log: (message: string) => void = console.log) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const applied = new Set(
    (await pool.query("SELECT name FROM schema_migrations")).rows.map((row) => row.name)
  );
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d{3}_.*\.sql$/.test(file))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Schema changes can outlast the API's 10-second query limits.
      await client.query("SET LOCAL statement_timeout = 0");
      await client.query({ text: sql, query_timeout: 10 * 60 * 1000 } as any);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      log(`applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`, { cause: error });
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  // Imported lazily so this file can be used from tests without a .env.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pool } = require("../src/database");
  runMigrations(pool)
    .then(() => {
      console.log("Migrations up to date");
      return pool.end();
    })
    .catch(async (error: Error) => {
      console.error(error.message);
      await pool.end();
      process.exit(1);
    });
}
