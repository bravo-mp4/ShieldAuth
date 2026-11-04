import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/database";
import { api, createApplication, createLicense, makeAdmin, resetDb, signUp } from "./helpers";

beforeEach(resetDb);
afterAll(() => pool.end());

async function adminAndLicense() {
  const admin = await signUp("root@example.com");
  await makeAdmin(admin.email);
  const appId = await createApplication(admin.token);
  const licenseKey = await createLicense(admin.token, appId, { days: 10 });
  return { admin, licenseKey };
}

describe("platform admin", () => {
  it("can list every user", async () => {
    const { admin } = await adminAndLicense();
    await signUp("someone@example.com");
    const res = await api().get("/api/v1/platform/users").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.map((u: any) => u.email).sort()).toEqual(["root@example.com", "someone@example.com"]);
  });

  it("extends a license by a whole number of days", async () => {
    const { admin, licenseKey } = await adminAndLicense();
    const before = (await pool.query("SELECT expires_at FROM licenses WHERE license_key = $1", [licenseKey])).rows[0];

    const res = await api()
      .put(`/api/v1/platform/licenses/${licenseKey}/extend`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ days: 5 });
    expect(res.status).toBe(200);

    const after = (await pool.query("SELECT expires_at FROM licenses WHERE license_key = $1", [licenseKey])).rows[0];
    const addedDays = (after.expires_at.getTime() - before.expires_at.getTime()) / 86400000;
    expect(Math.round(addedDays)).toBe(5);
  });

  it("treats a SQL fragment in 'days' as bad input, not as SQL", async () => {
    const { admin, licenseKey } = await adminAndLicense();
    const res = await api()
      .put(`/api/v1/platform/licenses/${licenseKey}/extend`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ days: "1 day'; DROP TABLE users; --" });

    // parseInt reads the leading 1; the rest never reaches the database.
    expect(res.status).toBe(200);
    const users = await pool.query("SELECT COUNT(*) FROM users");
    expect(Number(users.rows[0].count)).toBe(1);
  });

  it("can't demote or ban itself", async () => {
    const { admin } = await adminAndLicense();
    const demote = await api()
      .put(`/api/v1/platform/users/${admin.user.id}/role`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ role: "user" });
    expect(demote.status).toBe(400);

    const ban = await api()
      .put(`/api/v1/platform/users/${admin.user.id}/ban`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ is_banned: true });
    expect(ban.status).toBe(400);
  });

  it("only assigns known roles", async () => {
    const { admin } = await adminAndLicense();
    const other = await signUp();
    const res = await api()
      .put(`/api/v1/platform/users/${other.user.id}/role`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ role: "superuser" });
    expect(res.status).toBe(400);
  });
});

describe("error handling", () => {
  it("returns JSON 404s for unknown API routes", async () => {
    const res = await api().get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Not found" });
  });

  it("doesn't leak database errors on health checks", async () => {
    const res = await api().get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "healthy" });
  });

  it("escapes spreadsheet formulas in the CSV export", async () => {
    const { admin, licenseKey } = await adminAndLicense();
    await api()
      .put(`/api/v1/admin/license/${licenseKey}/notes`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ notes: '=HYPERLINK("http://evil")' });

    const csv = await api().get("/api/v1/admin/licenses/export").set("Authorization", `Bearer ${admin.token}`);
    expect(csv.status).toBe(200);
    expect(csv.text).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });
});
