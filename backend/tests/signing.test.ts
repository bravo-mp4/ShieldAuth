import crypto from "crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/database";
import { api, createApplication, createLicense, resetDb, signUp } from "./helpers";

let publicKey: crypto.KeyObject;

beforeAll(async () => {
  const res = await api().get("/api/v1/public/signing-key");
  publicKey = crypto.createPublicKey(res.body.public_key_pem);
});
beforeEach(resetDb);
afterAll(() => pool.end());

const NONCE = "test-nonce-0123456789";

function verify(message: string, signature: string) {
  return crypto.verify("sha256", Buffer.from(message), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(signature, "base64"));
}

function validateMessage(appId: string, key: string, hwid: string, body: any) {
  return [
    "shieldauth-v1",
    "validate",
    appId,
    key,
    hwid,
    body.nonce,
    body.valid ? "1" : "0",
    body.session_id ?? "",
    body.expires_at ?? "",
    body.signed_at,
  ].join("\n");
}

async function setup() {
  const dev = await signUp();
  const appId = await createApplication(dev.token);
  const licenseKey = await createLicense(dev.token, appId, { max_hwid_slots: 1 });
  return { appId, licenseKey };
}

describe("signed answers", () => {
  it("publishes a P-256 public key", async () => {
    const res = await api().get("/api/v1/public/signing-key");
    expect(res.body.algorithm).toBe("ECDSA-P256-SHA256");
    expect(publicKey.asymmetricKeyDetails?.namedCurve).toBe("prime256v1");
  });

  it("signs a successful validation over every field the SDK relies on", async () => {
    const { appId, licenseKey } = await setup();
    const res = await api().post("/api/v1/validate").send({ app_id: appId, license_key: licenseKey, hwid: "m1", nonce: NONCE });

    expect(res.body).toMatchObject({ valid: true, nonce: NONCE, signed_at: expect.any(Number) });
    expect(verify(validateMessage(appId, licenseKey, "m1", res.body), res.body.signature)).toBe(true);
  });

  it("signs refusals too, so a fake server can't flip them", async () => {
    const { appId, licenseKey } = await setup();
    await api().post("/api/v1/validate").send({ app_id: appId, license_key: licenseKey, hwid: "m1", nonce: NONCE });
    const refused = await api()
      .post("/api/v1/validate")
      .send({ app_id: appId, license_key: licenseKey, hwid: "m2", nonce: NONCE });

    expect(refused.body.valid).toBe(false);
    const message = validateMessage(appId, licenseKey, "m2", refused.body);
    expect(verify(message, refused.body.signature)).toBe(true);
    // Flipping the verdict breaks the signature.
    expect(verify(message.replace("\n0\n", "\n1\n"), refused.body.signature)).toBe(false);
  });

  it("binds the signature to the nonce, so old answers can't be replayed", async () => {
    const { appId, licenseKey } = await setup();
    const res = await api().post("/api/v1/validate").send({ app_id: appId, license_key: licenseKey, hwid: "m1", nonce: NONCE });
    const replayed = { ...res.body, nonce: "a-different-nonce-123" };
    expect(verify(validateMessage(appId, licenseKey, "m1", replayed), res.body.signature)).toBe(false);
  });

  it("signs heartbeats", async () => {
    const { appId, licenseKey } = await setup();
    const { session_id } = (
      await api().post("/api/v1/validate").send({ app_id: appId, license_key: licenseKey, hwid: "m1" })
    ).body;
    const res = await api().post("/api/v1/heartbeat").send({ session_id, nonce: NONCE });

    const message = ["shieldauth-v1", "heartbeat", session_id, NONCE, "1", res.body.signed_at].join("\n");
    expect(verify(message, res.body.signature)).toBe(true);
  });

  it("rejects malformed nonces and control characters", async () => {
    const { appId, licenseKey } = await setup();
    const shortNonce = await api()
      .post("/api/v1/validate")
      .send({ app_id: appId, license_key: licenseKey, hwid: "m1", nonce: "short" });
    expect(shortNonce.status).toBe(400);

    const newline = await api()
      .post("/api/v1/validate")
      .send({ app_id: appId, license_key: licenseKey, hwid: "m1\n1", nonce: NONCE });
    expect(newline.status).toBe(400);
  });
});
