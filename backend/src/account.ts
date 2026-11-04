import crypto from "crypto";
import bcrypt from "bcryptjs";
import { config } from "./config";
import { pool } from "./database";
import { sendMail } from "./mailer";

type TokenPurpose = "password_reset" | "email_verify";

const TOKEN_TTL_MINUTES: Record<TokenPurpose, number> = {
  password_reset: 30,
  email_verify: 24 * 60,
};

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Creates a one-time token, replacing any unused one for the same purpose. */
async function issueToken(userId: number, purpose: TokenPurpose): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  await pool.query("UPDATE auth_tokens SET used_at = NOW() WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL", [
    userId,
    purpose,
  ]);
  await pool.query(
    `INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + make_interval(mins => $4))`,
    [userId, purpose, hashToken(token), TOKEN_TTL_MINUTES[purpose]]
  );
  return token;
}

/**
 * Marks a token used and returns its user, or null if it's unknown,
 * expired or already used. The UPDATE ... WHERE used_at IS NULL makes two
 * simultaneous uses of one link impossible.
 */
async function consumeToken(token: unknown, purpose: TokenPurpose): Promise<number | null> {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const result = await pool.query(
    `UPDATE auth_tokens SET used_at = NOW()
     WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [hashToken(token), purpose]
  );
  return result.rows[0]?.user_id ?? null;
}

export async function sendVerificationEmail(user: { id: number; email: string }) {
  const token = await issueToken(user.id, "email_verify");
  await sendMail({
    to: user.email,
    subject: "Confirm your ShieldAuth email",
    text: `Confirm your email address by opening this link within 24 hours:\n\n${config.appUrl}/verify-email?token=${token}\n\nIf you didn't create a ShieldAuth account, you can ignore this email.`,
  });
}

export async function verifyEmail(token: unknown): Promise<boolean> {
  const userId = await consumeToken(token, "email_verify");
  if (!userId) return false;
  await pool.query("UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $1", [userId]);
  return true;
}

export async function requestPasswordReset(email: string) {
  const result = await pool.query("SELECT id, email, is_banned FROM users WHERE email = $1", [
    email.toLowerCase().trim(),
  ]);
  const user = result.rows[0];
  // Callers always answer the same way, so this can't be used to find accounts.
  if (!user || user.is_banned) return;

  const token = await issueToken(user.id, "password_reset");
  await sendMail({
    to: user.email,
    subject: "Reset your ShieldAuth password",
    text: `Someone asked to reset the password for this account. To choose a new one, open this link within 30 minutes:\n\n${config.appUrl}/reset-password?token=${token}\n\nIf it wasn't you, ignore this email; your password hasn't changed.`,
  });
}

/** Sets a new password and signs out every existing session for the user. */
export async function setPassword(userId: number, password: string) {
  const hash = await bcrypt.hash(password, config.bcryptRounds);
  const result = await pool.query(
    `UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = NOW()
     WHERE id = $2 RETURNING id, email, name, role, token_version`,
    [hash, userId]
  );
  await pool.query(
    "UPDATE auth_tokens SET used_at = NOW() WHERE user_id = $1 AND purpose = 'password_reset' AND used_at IS NULL",
    [userId]
  );
  return result.rows[0];
}

export async function resetPassword(token: unknown, password: string): Promise<boolean> {
  const userId = await consumeToken(token, "password_reset");
  if (!userId) return false;
  await setPassword(userId, password);
  return true;
}
