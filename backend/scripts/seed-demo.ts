/**
 * Fills a local database with a demo account and realistic-looking activity
 * so the dashboard has something to show. Refuses to run in production.
 *
 *   npm run seed
 *
 * Sign in with DEMO_EMAIL / DEMO_PASSWORD (defaults below).
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { isProduction } from "../src/config";
import { pool } from "../src/database";
import { runMigrations } from "../migrations/run";

const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@example.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo-password";

const hex = (bytes: number) => crypto.randomBytes(bytes).toString("hex");
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function main() {
  if (isProduction) {
    throw new Error("Refusing to seed demo data with NODE_ENV=production");
  }

  await runMigrations(pool, () => undefined);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, 'Demo Developer', 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', is_banned = false`,
    [DEMO_EMAIL, passwordHash]
  );

  const existing = await pool.query("SELECT COUNT(*) FROM applications WHERE owner_email = $1", [DEMO_EMAIL]);
  if (Number(existing.rows[0].count) > 0) {
    console.log(`Demo data already present. Sign in as ${DEMO_EMAIL}`);
    return;
  }

  const apps = [
    { name: "Pixel Studio", version: "2.4.1", licenses: 14 },
    { name: "Route Planner CLI", version: "1.0.3", licenses: 6 },
  ];

  for (const app of apps) {
    const appId = hex(16);
    await pool.query(
      "INSERT INTO applications (app_id, app_secret, owner_email, name, version, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [appId, hex(32), DEMO_EMAIL, app.name, app.version, daysFromNow(-40)]
    );

    for (let i = 0; i < app.licenses; i++) {
      const key = hex(16).toUpperCase();
      const expires = i % 7 === 3 ? daysFromNow(-2) : i % 5 === 1 ? daysFromNow(4) : daysFromNow(30 + i * 9);
      const slots = i % 4 === 0 ? 3 : 1;
      await pool.query(
        `INSERT INTO licenses (license_key, app_id, expires_at, max_hwid_slots, is_banned, created_at, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [key, appId, expires, slots, i === 5, daysFromNow(-30 + i), i === 0 ? "Press review copy" : null]
      );

      if (i % 3 !== 2) {
        const hwid = crypto.createHash("sha256").update(`device-${appId}-${i}`).digest("hex");
        await pool.query(
          "INSERT INTO hwid_slots (license_key, hwid_hash, device_name, ip_address, last_seen) VALUES ($1, $2, $3, $4, $5)",
          [key, hwid, ["Desktop", "Laptop", "Studio PC"][i % 3], `203.0.113.${10 + i}`, daysFromNow(-(i % 6))]
        );

        // A week of validation history, mostly successful.
        for (let day = 0; day < 7; day++) {
          const attempts = 1 + ((i + day) % 4);
          for (let n = 0; n < attempts; n++) {
            const failed = (i + day + n) % 9 === 0;
            const at = new Date(daysFromNow(-day).getTime() - n * 37 * 60 * 1000);
            await pool.query(
              `INSERT INTO validation_logs (license_key, app_id, hwid_hash, ip_address, result, error_message, user_agent, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, 'shieldauth-sdk/1.5', $7)`,
              [
                key,
                appId,
                hwid,
                `203.0.113.${10 + i}`,
                failed ? "hwid_limit" : "success",
                failed ? "HWID limit reached" : "",
                at,
              ]
            );
          }
        }
      }
    }
  }

  console.log(`Seeded demo data. Sign in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
