import request from "supertest";
import { createApp } from "../src/app";
import { pool } from "../src/database";

export const app = createApp();
export const api = () => request(app);

const TABLES = [
  "webhook_deliveries",
  "webhooks",
  "portal_actions",
  "validation_logs",
  "sessions",
  "hwid_slots",
  "hwid_blacklist",
  "licenses",
  "applications",
  "users",
];

export async function resetDb() {
  await pool.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
}

let counter = 0;

export async function signUp(email = `dev${++counter}@example.com`, password = "correct-horse-battery") {
  const res = await api().post("/api/v1/auth/register").send({ email, password, name: "Test Dev" });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.token as string, user: res.body.user, email, password };
}

export async function makeAdmin(email: string) {
  await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
}

export async function createApplication(token: string, name = "Test App") {
  const res = await api()
    .post("/api/v1/admin/app/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ name, version: "1.0.0" });
  if (res.status !== 201) throw new Error(`create app failed: ${res.status}`);
  return res.body.app_id as string;
}

export async function createLicense(token: string, appId: string, options: { days?: number; max_hwid_slots?: number } = {}) {
  const res = await api()
    .post("/api/v1/admin/license/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ app_id: appId, ...options });
  if (res.status !== 201) throw new Error(`create license failed: ${res.status}`);
  return res.body.license_key as string;
}

export function validate(appId: string, licenseKey: string, hwid: string) {
  return api().post("/api/v1/validate").send({ app_id: appId, license_key: licenseKey, hwid });
}
