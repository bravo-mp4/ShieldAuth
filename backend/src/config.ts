import dotenv from "dotenv";

dotenv.config({ quiet: true });

const env = process.env;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

function intFromEnv(name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
}

function listFromEnv(name: string): string[] {
  return (env[name] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Express "trust proxy" setting. Behind Railway/Vercel/Cloudflare there is
 * one proxy hop, so production defaults to 1; locally there is none.
 * Without this, req.ip is the proxy's address and every client shares one
 * rate-limit bucket. With a blanket `true`, anyone can spoof X-Forwarded-For.
 */
function trustProxyFromEnv(): number | boolean | string {
  const raw = env.TRUST_PROXY;
  if (raw === undefined || raw === "") return isProduction ? 1 : false;
  if (raw === "true") return true;
  if (raw === "false") return false;
  const hops = Number.parseInt(raw, 10);
  return Number.isNaN(hops) ? raw : hops;
}

export function loadConfig() {
  const jwtSecret = env.JWT_SECRET || "";
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }
  if (isProduction && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const devOrigins = isProduction
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

  return {
    port: intFromEnv("PORT", 3000),
    databaseUrl: env.DATABASE_URL,
    // "disable" for local Postgres, "no-verify" for providers whose CA isn't
    // in Node's trust store, anything else verifies the server certificate.
    databaseSsl: env.DATABASE_SSL || "verify",
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || "12h",
    bcryptRounds: intFromEnv("BCRYPT_ROUNDS", isTest ? 4 : 12),
    sessionTtlMinutes: intFromEnv("SESSION_TTL_MINUTES", 30),
    corsOrigins: [...devOrigins, ...listFromEnv("FRONTEND_URL")],
    trustProxy: trustProxyFromEnv(),
    allowPrivateWebhookUrls: env.ALLOW_PRIVATE_WEBHOOK_URLS === "true",
    // Base URL of the dashboard, used in reset and verification links.
    appUrl: (env.APP_URL || "http://localhost:5173").replace(/\/$/, ""),
    resendApiKey: env.RESEND_API_KEY || "",
    mailFrom: env.MAIL_FROM || "ShieldAuth <onboarding@resend.dev>",
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;

export const config = loadConfig();
