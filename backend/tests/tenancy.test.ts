import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/database";
import { api, createApplication, createLicense, resetDb, signUp, validate } from "./helpers";

beforeEach(resetDb);
afterAll(() => pool.end());

// Two developers share the platform. Nothing one does should reach the other.
async function twoTenants() {
  const alice = await signUp("alice@example.com");
  const bob = await signUp("bob@example.com");
  const aliceApp = await createApplication(alice.token, "Alice's App");
  const aliceLicense = await createLicense(alice.token, aliceApp);
  await validate(aliceApp, aliceLicense, "alice-machine");
  return { alice, bob, aliceApp, aliceLicense };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("tenant isolation", () => {
  it("lists only your own applications, licenses and logs", async () => {
    const { bob } = await twoTenants();

    for (const path of ["/api/v1/admin/applications", "/api/v1/admin/licenses", "/api/v1/users"]) {
      const res = await api().get(path).set(auth(bob.token));
      expect(res.status, path).toBe(200);
      expect(res.body, path).toEqual([]);
    }

    const logs = await api().get("/api/v1/admin/logs").set(auth(bob.token));
    expect(logs.body.logs).toEqual([]);

    const analytics = await api().get("/api/v1/admin/analytics").set(auth(bob.token));
    expect(analytics.body).toMatchObject({ totalValidations: 0, totalLicenses: 0, uniqueHwids: 0 });
  });

  it("won't show another developer's application or its secret", async () => {
    const { bob, aliceApp } = await twoTenants();
    const res = await api().get(`/api/v1/admin/app/${aliceApp}`).set(auth(bob.token));
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain("secret");
  });

  it("won't issue licenses for another developer's application", async () => {
    const { bob, aliceApp } = await twoTenants();
    const res = await api().post("/api/v1/admin/license/create").set(auth(bob.token)).send({ app_id: aliceApp });
    expect(res.status).toBe(403);
  });

  it.each([
    ["delete via /users", (key: string) => api().delete(`/api/v1/users/${key}`)],
    ["delete via /admin/license", (key: string) => api().delete(`/api/v1/admin/license/${key}`)],
    ["ban", (key: string) => api().post("/api/v1/admin/license/ban").send({ license_key: key })],
    ["edit notes", (key: string) => api().put(`/api/v1/admin/license/${key}/notes`).send({ notes: "pwned" })],
    ["list devices", (key: string) => api().get(`/api/v1/admin/license/${key}/hwids`)],
  ])("won't let another developer %s", async (_name, call) => {
    const { bob, aliceLicense } = await twoTenants();
    const res = await call(aliceLicense).set(auth(bob.token));
    expect(res.status).toBe(404);

    const license = await pool.query("SELECT is_banned, notes FROM licenses WHERE license_key = $1", [aliceLicense]);
    expect(license.rows[0]).toEqual({ is_banned: false, notes: null });
  });

  it("rejects bulk actions that include someone else's license", async () => {
    const { bob, aliceLicense } = await twoTenants();
    const bobApp = await createApplication(bob.token);
    const bobLicense = await createLicense(bob.token, bobApp);

    const res = await api()
      .post("/api/v1/admin/licenses/bulk-action")
      .set(auth(bob.token))
      .send({ action: "delete", license_keys: [bobLicense, aliceLicense] });

    expect(res.status).toBe(403);
    const remaining = await pool.query("SELECT COUNT(*) FROM licenses");
    expect(Number(remaining.rows[0].count)).toBe(2);
  });

  it("lets the owner delete a license that has bound devices", async () => {
    const { alice, aliceLicense } = await twoTenants();
    const res = await api().delete(`/api/v1/admin/license/${aliceLicense}`).set(auth(alice.token));
    expect(res.status).toBe(200);
    const left = await pool.query("SELECT COUNT(*) FROM hwid_slots");
    expect(Number(left.rows[0].count)).toBe(0);
  });
});

describe("platform admin routes", () => {
  it("are closed to ordinary developers", async () => {
    const { bob, aliceLicense } = await twoTenants();
    const calls = [
      api().get("/api/v1/platform/users"),
      api().get("/api/v1/platform/stats"),
      api().put(`/api/v1/platform/licenses/${aliceLicense}/extend`).send({ days: 30 }),
      api().put(`/api/v1/platform/licenses/${aliceLicense}/expire`),
      api().post("/api/v1/platform/hwid/blacklist").send({ hwid: "someone" }),
    ];
    for (const call of calls) {
      const res = await call.set(auth(bob.token));
      expect(res.status).toBe(403);
    }
  });

  it("are closed without a token", async () => {
    const res = await api().get("/api/v1/platform/users");
    expect(res.status).toBe(401);
  });
});
