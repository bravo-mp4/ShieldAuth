import { Pool, PoolConfig } from "pg";
import bcrypt from "bcryptjs";
import { config } from "./config";
import logger from "./logger";

function sslOption(): PoolConfig["ssl"] {
  const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(config.databaseUrl);
  if (config.databaseSsl === "disable" || (local && config.databaseSsl === "verify")) {
    return false;
  }
  // "no-verify" encrypts the connection but skips certificate checks. Only
  // use it for providers that sign with a private CA (e.g. Supabase pooler).
  return {
    rejectUnauthorized: config.databaseSsl !== "no-verify",
    minVersion: "TLSv1.2",
  };
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: sslOption(),
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 20000,
  query_timeout: 10000,
  statement_timeout: 10000,
});

pool.on("error", (err) => {
  logger.error("Database pool error", { error: err.message });
});

// --- User Authentication Functions ---

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only looks at the first 72 bytes; longer input would be silently
// truncated, so reject it instead of pretending it all counts.
export const PASSWORD_MAX_BYTES = 72;

export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role, token_version, email_verified_at, created_at",
      [email.toLowerCase().trim(), passwordHash, name?.trim() || null]
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error("User with this email already exists", { cause: error });
    }
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    "SELECT id, email, password_hash, name, role, is_banned, token_version, email_verified_at, created_at FROM users WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
}

export async function getUserById(id: number) {
  const result = await pool.query(
    "SELECT id, email, password_hash, name, role, is_banned, token_version, email_verified_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

// A real bcrypt hash of a random string, used so that a login for an unknown
// email costs the same as one for a known email (no timing-based enumeration).
const DUMMY_HASH = bcrypt.hashSync("shieldauth-timing-equaliser", config.bcryptRounds);

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  const matches = await bcrypt.compare(password, hash || DUMMY_HASH);
  return Boolean(hash) && matches;
}
