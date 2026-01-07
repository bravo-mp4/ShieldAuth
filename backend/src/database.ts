import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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