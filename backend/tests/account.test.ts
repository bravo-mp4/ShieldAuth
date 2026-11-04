import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/database";
import { sentMail } from "../src/mailer";
import { api, resetDb, signUp } from "./helpers";

beforeEach(async () => {
  await resetDb();
  sentMail.length = 0;
});
afterAll(() => pool.end());

function linkToken(path: string): string {
  const mail = sentMail.at(-1);
  const match = mail?.text.match(new RegExp(`${path}\\?token=([A-Za-z0-9_-]+)`));
  if (!match) throw new Error(`no ${path} link in ${JSON.stringify(mail)}`);
  return match[1];
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("password reset", () => {
  it("answers the same for known and unknown emails, and only mails real accounts", async () => {
    await signUp("known@example.com");
    sentMail.length = 0;

    const known = await api().post("/api/v1/auth/forgot-password").send({ email: "known@example.com" });
    const unknown = await api().post("/api/v1/auth/forgot-password").send({ email: "nobody@example.com" });

    expect(known.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
    expect(sentMail.map((m) => m.to)).toEqual(["known@example.com"]);
  });

  it("sets a new password, signs out old sessions, and works only once", async () => {
    const { token: oldSession, email } = await signUp("reset@example.com", "original-password");
    await api().post("/api/v1/auth/forgot-password").send({ email });
    const resetToken = linkToken("/reset-password");

    const reset = await api()
      .post("/api/v1/auth/reset-password")
      .send({ token: resetToken, password: "brand-new-password" });
    expect(reset.status).toBe(200);

    const oldLogin = await api().post("/api/v1/auth/login").send({ email, password: "original-password" });
    expect(oldLogin.status).toBe(401);
    const newLogin = await api().post("/api/v1/auth/login").send({ email, password: "brand-new-password" });
    expect(newLogin.status).toBe(200);

    const stale = await api().get("/api/v1/admin/licenses").set(auth(oldSession));
    expect(stale.status).toBe(401);

    const reuse = await api()
      .post("/api/v1/auth/reset-password")
      .send({ token: resetToken, password: "another-password" });
    expect(reuse.status).toBe(400);
  });

  it("stores only a hash of the token", async () => {
    const { email } = await signUp();
    await api().post("/api/v1/auth/forgot-password").send({ email });
    const token = linkToken("/reset-password");
    const rows = await pool.query("SELECT token_hash FROM auth_tokens WHERE purpose = 'password_reset'");
    expect(rows.rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows.rows[0].token_hash).not.toBe(token);
  });

  it("rejects expired links", async () => {
    const { email } = await signUp();
    await api().post("/api/v1/auth/forgot-password").send({ email });
    const token = linkToken("/reset-password");
    await pool.query("UPDATE auth_tokens SET expires_at = NOW() - INTERVAL '1 minute'");

    const res = await api().post("/api/v1/auth/reset-password").send({ token, password: "brand-new-password" });
    expect(res.status).toBe(400);
  });

  it("only honours the newest link", async () => {
    const { email } = await signUp();
    await api().post("/api/v1/auth/forgot-password").send({ email });
    const first = linkToken("/reset-password");
    await api().post("/api/v1/auth/forgot-password").send({ email });

    const res = await api().post("/api/v1/auth/reset-password").send({ token: first, password: "brand-new-password" });
    expect(res.status).toBe(400);
  });

  it("applies the password rules", async () => {
    const { email } = await signUp();
    await api().post("/api/v1/auth/forgot-password").send({ email });
    const res = await api()
      .post("/api/v1/auth/reset-password")
      .send({ token: linkToken("/reset-password"), password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("change password", () => {
  it("needs the current password", async () => {
    const { token } = await signUp();
    const res = await api()
      .post("/api/v1/auth/change-password")
      .set(auth(token))
      .send({ current_password: "wrong-password", new_password: "brand-new-password" });
    expect(res.status).toBe(400);
  });

  it("returns a fresh token and revokes the old one", async () => {
    const { token, password } = await signUp();
    const res = await api()
      .post("/api/v1/auth/change-password")
      .set(auth(token))
      .send({ current_password: password, new_password: "brand-new-password" });
    expect(res.status).toBe(200);

    expect((await api().get("/api/v1/auth/me").set(auth(token))).status).toBe(401);
    expect((await api().get("/api/v1/auth/me").set(auth(res.body.token))).status).toBe(200);
  });
});

describe("email verification", () => {
  it("emails a link at sign-up that confirms the address once", async () => {
    const { token, email } = await signUp("verify@example.com");
    expect(sentMail[0].to).toBe(email);

    const before = await api().get("/api/v1/auth/me").set(auth(token));
    expect(before.body.user.email_verified).toBe(false);

    const verifyToken = linkToken("/verify-email");
    expect((await api().post("/api/v1/auth/verify-email").send({ token: verifyToken })).status).toBe(200);
    expect((await api().post("/api/v1/auth/verify-email").send({ token: verifyToken })).status).toBe(400);

    const after = await api().get("/api/v1/auth/me").set(auth(token));
    expect(after.body.user.email_verified).toBe(true);
  });

  it("can resend the link, which replaces the old one", async () => {
    const { token } = await signUp();
    const first = linkToken("/verify-email");
    await api().post("/api/v1/auth/resend-verification").set(auth(token));
    const second = linkToken("/verify-email");

    expect(second).not.toBe(first);
    expect((await api().post("/api/v1/auth/verify-email").send({ token: first })).status).toBe(400);
    expect((await api().post("/api/v1/auth/verify-email").send({ token: second })).status).toBe(200);
  });
});
