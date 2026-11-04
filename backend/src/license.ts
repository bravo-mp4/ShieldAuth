import crypto from "crypto";
import { config } from "./config";
import { pool } from "./database";
import { ValidateResponse } from "./types";

export type ValidationResult = "success" | "invalid" | "banned" | "expired" | "hwid_limit";

interface ValidateInput {
  app_id: unknown;
  license_key: unknown;
  hwid: unknown;
  ip: string;
  userAgent: string;
}

const GENERIC_FAILURE = "Invalid or expired license";

// Control characters are refused: signed answers join fields with "\n",
// so a field must never contain one.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export function isBoundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && !CONTROL_CHARS.test(value);
}

// SDKs send a random nonce that comes back inside the signed answer, which
// stops an old "valid" response from being replayed.
export const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export function validateInputError(
  input: Pick<ValidateInput, "app_id" | "license_key" | "hwid"> & { nonce?: unknown }
): string | null {
  if (!isBoundedString(input.app_id, 32)) return "app_id is required";
  if (!isBoundedString(input.license_key, 64)) return "license_key is required";
  if (!isBoundedString(input.hwid, 128)) return "hwid is required";
  if (input.nonce !== undefined && (typeof input.nonce !== "string" || !NONCE_PATTERN.test(input.nonce))) {
    return "nonce must be 16-64 characters of A-Z, a-z, 0-9, _ or -";
  }
  return null;
}

async function logValidation(
  input: ValidateInput,
  result: ValidationResult,
  errorMessage: string
) {
  await pool.query(
    `INSERT INTO validation_logs (license_key, app_id, hwid_hash, ip_address, result, error_message, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.license_key, input.app_id, input.hwid, input.ip, result, errorMessage, input.userAgent.slice(0, 500)]
  );
}

/**
 * Checks a license for an application and binds the caller's hardware ID.
 *
 * The license row is locked (SELECT ... FOR UPDATE) for the whole check, so
 * two machines validating the same key at the same moment can't both take
 * the last free HWID slot.
 */
export async function validateLicense(input: ValidateInput): Promise<ValidateResponse> {
  const appId = input.app_id as string;
  const licenseKey = input.license_key as string;
  const hwid = input.hwid as string;

  // Unknown application: nothing to log against (validation_logs.app_id is
  // a foreign key), and nothing to say beyond "no".
  const app = await pool.query("SELECT app_id FROM applications WHERE app_id = $1", [appId]);
  if (app.rows.length === 0) {
    return { valid: false, message: GENERIC_FAILURE };
  }

  const client = await pool.connect();
  let outcome: { result: ValidationResult; error: string; response: ValidateResponse };

  try {
    await client.query("BEGIN");

    // Scoped to the app: a key issued for one product doesn't unlock another.
    const licenseResult = await client.query(
      "SELECT license_key, expires_at, max_hwid_slots, is_banned FROM licenses WHERE license_key = $1 AND app_id = $2 FOR UPDATE",
      [licenseKey, appId]
    );
    const license = licenseResult.rows[0];

    const blacklisted = await client.query("SELECT 1 FROM hwid_blacklist WHERE hwid = $1", [hwid]);

    if (!license) {
      outcome = { result: "invalid", error: "License not found", response: { valid: false, message: GENERIC_FAILURE } };
    } else if (license.is_banned || blacklisted.rows.length > 0) {
      outcome = {
        result: "banned",
        error: license.is_banned ? "License is banned" : "HWID is blacklisted",
        response: { valid: false, message: GENERIC_FAILURE },
      };
    } else if (license.expires_at && new Date(license.expires_at) <= new Date()) {
      outcome = { result: "expired", error: "License has expired", response: { valid: false, message: GENERIC_FAILURE } };
    } else {
      const slots = await client.query("SELECT hwid_hash FROM hwid_slots WHERE license_key = $1", [licenseKey]);
      const bound: string[] = slots.rows.map((row) => row.hwid_hash);

      if (bound.includes(hwid)) {
        await client.query(
          "UPDATE hwid_slots SET last_seen = NOW(), last_ip_address = ip_address, ip_address = $1 WHERE license_key = $2 AND hwid_hash = $3",
          [input.ip, licenseKey, hwid]
        );
      } else if (bound.length >= license.max_hwid_slots) {
        await client.query("ROLLBACK");
        await logValidation(input, "hwid_limit", "HWID limit reached");
        return { valid: false, message: "HWID limit reached" };
      } else {
        await client.query(
          "INSERT INTO hwid_slots (license_key, hwid_hash, ip_address) VALUES ($1, $2, $3)",
          [licenseKey, hwid, input.ip]
        );
      }

      const sessionId = crypto.randomBytes(32).toString("hex");
      await client.query(
        "INSERT INTO sessions (session_id, license_key, hwid_hash) VALUES ($1, $2, $3)",
        [sessionId, licenseKey, hwid]
      );

      outcome = {
        result: "success",
        error: "",
        response: {
          valid: true,
          message: "License validated",
          expires_at: license.expires_at ? Math.floor(new Date(license.expires_at).getTime() / 1000) : undefined,
          session_id: sessionId,
        },
      };
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  await logValidation(input, outcome.result, outcome.error);
  return outcome.response;
}

/**
 * Keeps a validated session alive. Sessions lapse after SESSION_TTL_MINUTES
 * without a heartbeat, and end straight away once the license is banned or
 * expires, so a ban reaches clients that are already running.
 */
export async function heartbeat(sessionId: unknown): Promise<{ valid: boolean; message: string; expires_in?: number }> {
  if (!isBoundedString(sessionId, 64)) {
    return { valid: false, message: "session_id is required" };
  }

  const result = await pool.query(
    `SELECT s.session_id, s.last_heartbeat, l.is_banned, l.expires_at
     FROM sessions s JOIN licenses l ON l.license_key = s.license_key
     WHERE s.session_id = $1`,
    [sessionId]
  );
  const session = result.rows[0];
  if (!session) {
    return { valid: false, message: "Session not found" };
  }

  const ttlMs = config.sessionTtlMinutes * 60 * 1000;
  const lapsed = new Date(session.last_heartbeat).getTime() < Date.now() - ttlMs;
  const licenseExpired = session.expires_at && new Date(session.expires_at) <= new Date();

  if (lapsed || session.is_banned || licenseExpired) {
    await pool.query("DELETE FROM sessions WHERE session_id = $1", [sessionId]);
    return { valid: false, message: lapsed ? "Session expired" : GENERIC_FAILURE };
  }

  await pool.query("UPDATE sessions SET last_heartbeat = NOW() WHERE session_id = $1", [sessionId]);
  return { valid: true, message: "Session active", expires_in: config.sessionTtlMinutes * 60 };
}
