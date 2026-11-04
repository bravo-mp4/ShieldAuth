export interface ShieldAuthOptions {
  /** Base URL of the API, ending in /api/v1. */
  apiUrl: string;
  /**
   * PEM public key from GET /api/v1/public/signing-key. Pin it in your app.
   * Without it, answers can't be authenticated and validate() refuses to
   * trust them unless allowUnsigned is set.
   */
  publicKey?: string;
  /** Only for local experiments: accept answers without checking signatures. */
  allowUnsigned?: boolean;
  /** Request timeout in milliseconds (default 10 000). */
  timeout?: number;
  /** Override the hardware ID (default: getHWID()). */
  hwid?: string;
  /** Allowed clock difference for signed_at, in seconds (default 300). */
  maxClockSkewSeconds?: number;
}

export interface ValidateResponse {
  valid: boolean;
  message: string;
  expires_at?: number;
  session_id?: string;
  nonce?: string;
  signed_at?: number;
  signature?: string;
}

export interface HeartbeatResponse {
  valid: boolean;
  message: string;
  expires_in?: number;
  nonce?: string;
  signed_at?: number;
  signature?: string;
}

export interface HeartbeatOptions {
  /** Milliseconds between heartbeats (default 5 minutes). */
  intervalMs?: number;
  /** Called once the license stops being valid. Default: exit the process. */
  onInvalid?: (reason: string) => void;
}
