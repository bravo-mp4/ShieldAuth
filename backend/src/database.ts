import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// User authentication functions
export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role, created_at',
    [email, passwordHash, name]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getLicense(licenseKey: string) {
  const result = await pool.query(
    'SELECT * FROM licenses WHERE license_key = $1',
    [licenseKey]
  );
  return result.rows[0];
}

export async function getHWIDs(licenseKey: string) {
  const result = await pool.query(
    'SELECT hwid_hash FROM hwid_slots WHERE license_key = $1',
    [licenseKey]
  );
  return result.rows.map(row => row.hwid_hash);
}

export async function bindHWID(licenseKey: string, hwid: string) {
  await pool.query(
    'INSERT INTO hwid_slots (license_key, hwid_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [licenseKey, hwid]
  );
}

export async function createSession(sessionId: string, licenseKey: string, hwid: string) {
  await pool.query(
    'INSERT INTO sessions (session_id, license_key, hwid_hash) VALUES ($1, $2, $3)',
    [sessionId, licenseKey, hwid]
  );
}