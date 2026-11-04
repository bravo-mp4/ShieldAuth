import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/database";
import { api, createApplication, createLicense, resetDb, signUp, validate } from "./helpers";

beforeEach(resetDb);
afterAll(() => pool.end());

async function setup(options: { max_hwid_slots?: number; days?: number } = {}) {
  const dev = await signUp();
  const appId = await createApplication(dev.token);
  const licenseKey = await createLicense(dev.token, appId, options);
  return { dev, appId, licenseKey };
}

describe("POST /validate", () => {
  it("accepts a valid license, binds the device and opens a session", async () => {
    const { appId, licenseKey } = await setup();
    const res = await validate(appId, licenseKey, "machine-1");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ valid: true, session_id: expect.stringMatching(/^[0-9a-f]{64}$/) });

    const slots = await pool.query("SELECT hwid_hash FROM hwid_slots WHERE license_key = $1", [licenseKey]);
    expect(slots.rows).toEqual([{ hwid_hash: "machine-1" }]);
  });

  it("lets an already-bound device back in", async () => {
    const { appId, licenseKey } = await setup();
    await validate(appId, licenseKey, "machine-1");
    const again = await validate(appId, licenseKey, "machine-1");
    expect(again.body.valid).toBe(true);
  });

  it("refuses a new device once every HWID slot is taken", async () => {
    const { appId, licenseKey } = await setup({ max_hwid_slots: 1 });
    await validate(appId, licenseKey, "machine-1");
    const second = await validate(appId, licenseKey, "machine-2");
    expect(second.body).toEqual({ valid: false, message: "HWID limit reached" });
  });

  it("never over-fills HWID slots under concurrent requests", async () => {
    const { appId, licenseKey } = await setup({ max_hwid_slots: 2 });
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) => validate(appId, licenseKey, `machine-${i}`))
    );

    expect(results.filter((res) => res.body.valid)).toHaveLength(2);
    const slots = await pool.query("SELECT COUNT(*) FROM hwid_slots WHERE license_key = $1", [licenseKey]);
    expect(Number(slots.rows[0].count)).toBe(2);
  });

  it("only accepts a key for the application it was issued for", async () => {
    const { dev, licenseKey } = await setup();
    const otherApp = await createApplication(dev.token, "Other App");
    const res = await validate(otherApp, licenseKey, "machine-1");
    expect(res.body.valid).toBe(false);
  });

  it("answers an unknown application without a server error", async () => {
    const res = await validate("0".repeat(32), "NOPE", "machine-1");
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it("rejects banned and expired licenses", async () => {
    const { appId, licenseKey } = await setup();
    await pool.query("UPDATE licenses SET is_banned = true WHERE license_key = $1", [licenseKey]);
    expect((await validate(appId, licenseKey, "m")).body.valid).toBe(false);

    await pool.query("UPDATE licenses SET is_banned = false, expires_at = NOW() - INTERVAL '1 minute' WHERE license_key = $1", [
      licenseKey,
    ]);
    expect((await validate(appId, licenseKey, "m")).body.valid).toBe(false);
  });

  it("rejects blacklisted hardware", async () => {
    const { appId, licenseKey } = await setup();
    await pool.query("INSERT INTO hwid_blacklist (hwid, reason) VALUES ('stolen-pc', 'chargeback')");
    expect((await validate(appId, licenseKey, "stolen-pc")).body.valid).toBe(false);
  });

  it("validates input types and sizes", async () => {
    const res = await api()
      .post("/api/v1/validate")
      .send({ app_id: { $ne: "" }, license_key: "x", hwid: "y" });
    expect(res.status).toBe(400);

    const long = await api()
      .post("/api/v1/validate")
      .send({ app_id: "a", license_key: "b", hwid: "h".repeat(500) });
    expect(long.status).toBe(400);
  });

  it("logs every attempt for the app's owner", async () => {
    const { appId, licenseKey } = await setup({ max_hwid_slots: 1 });
    await validate(appId, licenseKey, "machine-1");
    await validate(appId, licenseKey, "machine-2");
    const logs = await pool.query("SELECT result FROM validation_logs ORDER BY id");
    expect(logs.rows.map((row) => row.result)).toEqual(["success", "hwid_limit"]);
  });
});

describe("POST /heartbeat", () => {
  it("keeps a live session going", async () => {
    const { appId, licenseKey } = await setup();
    const { session_id } = (await validate(appId, licenseKey, "m")).body;
    const res = await api().post("/api/v1/heartbeat").send({ session_id });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it("ends the session once the license is banned", async () => {
    const { dev, appId, licenseKey } = await setup();
    const { session_id } = (await validate(appId, licenseKey, "m")).body;

    await api()
      .post("/api/v1/admin/license/ban")
      .set("Authorization", `Bearer ${dev.token}`)
      .send({ license_key: licenseKey });

    const res = await api().post("/api/v1/heartbeat").send({ session_id });
    expect(res.status).toBe(401);
    expect(res.body.valid).toBe(false);
  });

  it("expires sessions that stop sending heartbeats", async () => {
    const { appId, licenseKey } = await setup();
    const { session_id } = (await validate(appId, licenseKey, "m")).body;
    await pool.query("UPDATE sessions SET last_heartbeat = NOW() - INTERVAL '2 hours' WHERE session_id = $1", [session_id]);

    const res = await api().post("/api/v1/heartbeat").send({ session_id });
    expect(res.body).toMatchObject({ valid: false, message: "Session expired" });
  });

  it("rejects unknown sessions", async () => {
    const res = await api().post("/api/v1/heartbeat").send({ session_id: "f".repeat(64) });
    expect(res.status).toBe(401);
  });
});

describe("customer portal", () => {
  it("limits self-service unbinding to once a week", async () => {
    const { appId, licenseKey } = await setup({ max_hwid_slots: 3 });
    await validate(appId, licenseKey, "m1");
    await validate(appId, licenseKey, "m2");

    const portal = await api().get(`/api/v1/public/portal/${licenseKey}`);
    const [first, second] = portal.body.hwid_bindings;

    const unbind = await api().post(`/api/v1/public/portal/${licenseKey}/unbind/${first.id}`);
    expect(unbind.status).toBe(200);

    const again = await api().post(`/api/v1/public/portal/${licenseKey}/unbind/${second.id}`);
    expect(again.status).toBe(429);
  });

  it("only shows a shortened device fingerprint", async () => {
    const { appId, licenseKey } = await setup();
    await validate(appId, licenseKey, "a".repeat(64));
    const portal = await api().get(`/api/v1/public/portal/${licenseKey}`);
    expect(portal.body.hwid_bindings[0].hwid_hash).toBe(`${"a".repeat(16)}...`);
  });
});
