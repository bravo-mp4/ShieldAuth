import { createPublicKey, KeyObject, randomBytes, verify } from "crypto";
import { getHWID } from "./hwid";
import { HeartbeatOptions, HeartbeatResponse, ShieldAuthOptions, ValidateResponse } from "./types";

const SIGNATURE_VERSION = "shieldauth-v1";

/** Builds the text the server signs; see sdk/PROTOCOL.md. */
export function canonicalMessage(type: "validate" | "heartbeat", fields: (string | number | undefined)[]): string {
  return [SIGNATURE_VERSION, type, ...fields.map((field) => (field === undefined ? "" : String(field)))].join("\n");
}

export function verifySignature(publicKey: KeyObject | string, message: string, signature: string): boolean {
  try {
    const key = typeof publicKey === "string" ? createPublicKey(publicKey) : publicKey;
    return verify("sha256", Buffer.from(message, "utf8"), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

export class ShieldAuth {
  private readonly appId: string;
  private readonly options: ShieldAuthOptions;
  private readonly publicKey?: KeyObject;
  private readonly hwid: string;
  private sessionId: string | null = null;
  private licenseKey: string | null = null;
  private validFlag = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  lastMessage = "";

  constructor(appId: string, options: ShieldAuthOptions) {
    if (!appId) throw new Error("appId is required");
    if (!options?.apiUrl) throw new Error("options.apiUrl is required");
    if (!options.publicKey && !options.allowUnsigned) {
      throw new Error("options.publicKey is required (or set allowUnsigned for local testing)");
    }
    this.appId = appId;
    this.options = options;
    this.publicKey = options.publicKey ? createPublicKey(options.publicKey) : undefined;
    this.hwid = options.hwid ?? getHWID();
  }

  /** True if the license is valid. Never throws; network errors count as not valid. */
  async validate(licenseKey: string): Promise<boolean> {
    this.licenseKey = licenseKey;
    const nonce = randomBytes(18).toString("base64url");
    const body = await this.post<ValidateResponse>("/validate", {
      app_id: this.appId,
      license_key: licenseKey,
      hwid: this.hwid,
      nonce,
    });
    if (!body) return this.fail("Couldn't reach the license server");

    const message = canonicalMessage("validate", [
      this.appId,
      licenseKey,
      this.hwid,
      nonce,
      body.valid ? 1 : 0,
      body.session_id,
      body.expires_at,
      body.signed_at,
    ]);
    if (!this.trusted(body, nonce, message)) return this.fail("License server answer failed verification");

    this.validFlag = body.valid === true;
    this.sessionId = this.validFlag ? body.session_id ?? null : null;
    this.lastMessage = body.message;
    return this.validFlag;
  }

  /** Renews the session. False once the license was revoked, expired or the session lapsed. */
  async heartbeat(): Promise<boolean> {
    if (!this.sessionId) return false;
    const sessionId = this.sessionId;
    const nonce = randomBytes(18).toString("base64url");
    const body = await this.post<HeartbeatResponse>("/heartbeat", { session_id: sessionId, nonce });
    if (!body) return false; // offline: keep the session, try again next time

    const message = canonicalMessage("heartbeat", [sessionId, nonce, body.valid ? 1 : 0, body.signed_at]);
    if (!this.trusted(body, nonce, message)) return false;

    if (!body.valid) {
      this.validFlag = false;
      this.sessionId = null;
    }
    this.lastMessage = body.message;
    return body.valid;
  }

  /**
   * Sends heartbeats on a timer and calls onInvalid (default: exit) once the
   * server says the license is no longer good. Network failures alone don't
   * trigger it, so a brief outage doesn't kill the app.
   */
  startHeartbeat({ intervalMs = 5 * 60 * 1000, onInvalid }: HeartbeatOptions = {}): void {
    this.stopHeartbeat();
    const handleInvalid =
      onInvalid ??
      ((reason: string) => {
        console.error(`ShieldAuth: ${reason}`);
        process.exit(1);
      });
    this.heartbeatTimer = setInterval(async () => {
      await this.heartbeat();
      // A session that lapsed (say, after the laptop slept) gets one fresh
      // validation before the app is told the license is gone.
      if (!this.validFlag && this.licenseKey) await this.validate(this.licenseKey);
      if (!this.validFlag) {
        this.stopHeartbeat();
        handleInvalid(this.lastMessage || "License is no longer valid");
      }
    }, intervalMs);
    this.heartbeatTimer.unref?.();
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  isValid(): boolean {
    return this.validFlag;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getHWID(): string {
    return this.hwid;
  }

  private fail(message: string): false {
    this.validFlag = false;
    this.sessionId = null;
    this.lastMessage = message;
    return false;
  }

  private trusted(body: { nonce?: string; signed_at?: number; signature?: string }, nonce: string, message: string): boolean {
    if (this.options.allowUnsigned && !this.publicKey) return true;
    if (!this.publicKey || !body.signature || body.nonce !== nonce || typeof body.signed_at !== "number") return false;
    const skew = this.options.maxClockSkewSeconds ?? 300;
    if (Math.abs(Date.now() / 1000 - body.signed_at) > skew) return false;
    return verifySignature(this.publicKey, message, body.signature);
  }

  private async post<T>(path: string, payload: unknown): Promise<T | null> {
    try {
      const response = await fetch(this.options.apiUrl.replace(/\/$/, "") + path, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "shieldauth-node/2.0" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.options.timeout ?? 10000),
      });
      // 401 from /heartbeat still carries a signed verdict.
      if (!response.ok && response.status !== 401) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }
}
