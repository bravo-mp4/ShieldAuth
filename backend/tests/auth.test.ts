import { afterAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { pool } from "../src/database";
import { api, resetDb, signUp } from "./helpers";

beforeEach(resetDb);
afterAll(() => pool.end());

describe("registration", () => {
  it("creates an account and returns a token without the password hash", async () => {
    const res = await api()
      .post("/api/v1/auth/register")
      .send({ email: "New@Example.com", password: "long-enough-pw", name: "New" });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: "new@example.com", role: "user" });
    expect(JSON.stringify(res.body)).not.toContain("password");
  });

  it("stores a bcrypt hash, never the plain password", async () => {
    await signUp("hash@example.com", "plain-text-password");
    const row = await pool.query("SELECT password_hash FROM users WHERE email = 'hash@example.com'");
    expect(row.rows[0].password_hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(row.rows[0].password_hash).not.toContain("plain-text-password");
  });

  it.each([
    [{ email: "a@b.co", password: "short" }, "at least 8"],
    [{ email: "not-an-email", password: "long-enough-pw" }, "Invalid email"],
    [{ email: "a@b.co", password: "x".repeat(73) }, "at most 72"],
    [{ email: ["a@b.co"], password: "long-enough-pw" }, "required"],
  ])("rejects invalid input %#", async (body, message) => {
    const res = await api().post("/api/v1/auth/register").send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain(message);
  });

  it("refuses a duplicate email", async () => {
    await signUp("dupe@example.com");
    const res = await api()
      .post("/api/v1/auth/register")
      .send({ email: "DUPE@example.com", password: "long-enough-pw" });
    expect(res.status).toBe(409);
  });

  it("can't be used to make yourself an admin", async () => {
    const res = await api()
      .post("/api/v1/auth/register")
      .send({ email: "sneaky@example.com", password: "long-enough-pw", role: "admin" });
    expect(res.body.user.role).toBe("user");
  });
});

describe("login", () => {
  it("returns a token for the right password", async () => {
    const { email, password } = await signUp();
    const res = await api().post("/api/v1/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const { email } = await signUp();
    const wrongPassword = await api().post("/api/v1/auth/login").send({ email, password: "wrong-password" });
    const unknownEmail = await api()
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: "wrong-password" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it("rejects banned accounts", async () => {
    const { email, password } = await signUp();
    await pool.query("UPDATE users SET is_banned = true WHERE email = $1", [email]);
    const res = await api().post("/api/v1/auth/login").send({ email, password });
    expect(res.status).toBe(401);
  });
});

describe("token checks", () => {
  it("requires a bearer token on dashboard routes", async () => {
    const res = await api().get("/api/v1/admin/licenses");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with another secret", async () => {
    const { user } = await signUp();
    const forged = jwt.sign({ id: user.id, email: user.email, role: "admin" }, "not-the-server-secret");
    const res = await api().get("/api/v1/admin/licenses").set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it("rejects an unsigned (alg: none) token", async () => {
    const { user } = await signUp();
    const unsigned = jwt.sign({ id: user.id, email: user.email, role: "admin" }, "", { algorithm: "none" });
    const res = await api().get("/api/v1/admin/licenses").set("Authorization", `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const { user } = await signUp();
    const expired = jwt.sign(
      { id: user.id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET!
    );
    const res = await api().get("/api/v1/admin/licenses").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it("stops working as soon as the account is banned", async () => {
    const { token, email } = await signUp();
    await pool.query("UPDATE users SET is_banned = true WHERE email = $1", [email]);
    const res = await api().get("/api/v1/admin/licenses").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
