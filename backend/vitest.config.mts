import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every test file shares one Postgres database, so run them one at a time.
    fileParallelism: false,
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:55432/shieldauth_test",
      DATABASE_SSL: "disable",
      JWT_SECRET: "test-secret-that-is-long-enough-for-hs256-signing",
      SESSION_TTL_MINUTES: "30",
    },
  },
});
