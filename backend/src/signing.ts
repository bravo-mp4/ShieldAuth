import crypto from "crypto";
import { isProduction } from "./config";
import logger from "./logger";

/**
 * Validation and heartbeat answers are signed so the SDKs can tell a real
 * ShieldAuth response from one made up by a fake server or replayed from
 * an earlier run. ECDSA P-256 with SHA-256 is used because every SDK
 * platform verifies it natively (Node, Python `cryptography`, .NET,
 * Windows CNG), and signatures use the 64-byte IEEE P1363 (r || s) form.
 *
 * The signed text is a fixed list of fields joined by "\n". The field
 * lists are in sdk/PROTOCOL.md; inputs that contain control characters
 * are rejected before they get here, so a field can't spill into the next.
 */

export const SIGNATURE_VERSION = "shieldauth-v1";

function loadPrivateKey(): crypto.KeyObject {
  const pem = process.env.SIGNING_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (pem) {
    const key = crypto.createPrivateKey(pem);
    if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
      throw new Error("SIGNING_PRIVATE_KEY must be an EC P-256 private key");
    }
    return key;
  }
  if (isProduction) {
    throw new Error("SIGNING_PRIVATE_KEY is required in production (generate one with `npm run keygen`)");
  }
  logger.warn("SIGNING_PRIVATE_KEY not set; using a throwaway key that changes on every restart");
  return crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" }).privateKey;
}

const privateKey = loadPrivateKey();
const publicKey = crypto.createPublicKey(privateKey);

export const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

export function canonicalMessage(type: "validate" | "heartbeat", fields: (string | number)[]): string {
  return [SIGNATURE_VERSION, type, ...fields.map(String)].join("\n");
}

export function sign(message: string): string {
  return crypto.sign("sha256", Buffer.from(message, "utf8"), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64");
}

export interface SignedValidateFields {
  app_id: string;
  license_key: string;
  hwid: string;
  nonce: string;
  valid: boolean;
  session_id?: string;
  expires_at?: number;
}

/** Adds signed_at and signature to a /validate answer. */
export function signValidate(fields: SignedValidateFields) {
  const signedAt = Math.floor(Date.now() / 1000);
  const message = canonicalMessage("validate", [
    fields.app_id,
    fields.license_key,
    fields.hwid,
    fields.nonce,
    fields.valid ? 1 : 0,
    fields.session_id ?? "",
    fields.expires_at ?? "",
    signedAt,
  ]);
  return { nonce: fields.nonce, signed_at: signedAt, signature: sign(message) };
}

/** Adds signed_at and signature to a /heartbeat answer. */
export function signHeartbeat(fields: { session_id: string; nonce: string; valid: boolean }) {
  const signedAt = Math.floor(Date.now() / 1000);
  const message = canonicalMessage("heartbeat", [fields.session_id, fields.nonce, fields.valid ? 1 : 0, signedAt]);
  return { nonce: fields.nonce, signed_at: signedAt, signature: sign(message) };
}
