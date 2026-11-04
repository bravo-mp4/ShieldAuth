# ShieldAuth SDK protocol

What every SDK sends and checks. The server side lives in
[`backend/src/license.ts`](../backend/src/license.ts) and
[`backend/src/signing.ts`](../backend/src/signing.ts).

## Validate

`POST {apiUrl}/validate`

```json
{ "app_id": "...", "license_key": "...", "hwid": "...", "nonce": "..." }
```

- `hwid` is a SHA-256 hex digest of machine identifiers (each SDK's `hwid` module).
- `nonce` is 16 or more random bytes, base64url-encoded (16 to 64 characters of `A-Z a-z 0-9 _ -`), new for every call.

Response:

```json
{
  "valid": true,
  "message": "License validated",
  "session_id": "64 hex chars",
  "expires_at": 1893456000,
  "nonce": "echoed back",
  "signed_at": 1767225600,
  "signature": "base64"
}
```

## Heartbeat

`POST {apiUrl}/heartbeat` with `{ "session_id": "...", "nonce": "..." }`. Returns `200` with
`valid: true` while the license is good, or `401` with `valid: false` once the session lapsed,
the license was banned or expired, or the device was unbound. Both carry `nonce`, `signed_at`
and `signature`.

## Signatures

ECDSA over P-256 with SHA-256. The signature is base64 of the 64-byte IEEE P1363 form (`r || s`).
Get the public key from `GET /api/v1/public/signing-key` once and **pin it in your app**. Don't
fetch it at run time, or a fake server can hand over its own key.

The signed text is these fields joined with `\n` (no trailing newline). `valid` is `1` or `0`,
and missing values are empty strings:

| Answer | Fields |
| --- | --- |
| validate | `shieldauth-v1`, `validate`, app_id, license_key, hwid, nonce, valid, session_id, expires_at, signed_at |
| heartbeat | `shieldauth-v1`, `heartbeat`, session_id, nonce, valid, signed_at |

The client builds this text from **its own** request values (app_id, license_key, hwid, nonce,
session_id) plus the response's verdict fields. It accepts the answer only if:

1. the signature verifies with the pinned key,
2. the echoed `nonce` equals the one it sent, and
3. `signed_at` is within five minutes of the local clock.

The server rejects control characters in every field, so one field can't run into the next.

[`test-vectors.json`](test-vectors.json) holds a test key and signed examples that each SDK's
tests verify.
