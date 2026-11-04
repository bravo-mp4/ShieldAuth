import crypto from "crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/database";
import { signPayload, validateWebhookUrl } from "../src/webhooks";
import { api, resetDb, signUp } from "./helpers";

beforeEach(resetDb);
afterAll(() => pool.end());

describe("webhook URL checks (SSRF)", () => {
  it.each([
    "http://example.com/hook", // plain http
    "https://127.0.0.1/hook",
    "https://localhost/hook",
    "https://169.254.169.254/latest/meta-data/", // cloud metadata
    "https://10.0.0.5/hook",
    "https://192.168.1.1/hook",
    "https://[::1]/hook",
    "https://[::ffff:127.0.0.1]/hook",
    "https://user:pass@example.com/hook",
    "ftp://example.com/hook",
    "not a url",
  ])("rejects %s", async (url) => {
    expect(await validateWebhookUrl(url)).not.toBeNull();
  });

  it("accepts a public https address", async () => {
    expect(await validateWebhookUrl("https://93.184.215.14/hook")).toBeNull();
  });

  it("is enforced when creating a webhook", async () => {
    const { token } = await signUp();
    const res = await api()
      .post("/api/v1/admin/webhooks")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://169.254.169.254/latest/meta-data/", events: ["license.created"] });
    expect(res.status).toBe(400);
  });

  it("only accepts known event names", async () => {
    const { token } = await signUp();
    const res = await api()
      .post("/api/v1/admin/webhooks")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://93.184.215.14/hook", events: ["everything"] });
    expect(res.status).toBe(400);
  });
});

describe("webhook signatures", () => {
  it("signs timestamp.body with HMAC-SHA256 so receivers can verify it", () => {
    const body = JSON.stringify({ event: "license.created" });
    const header = signPayload("s3cret", body, 1700000000);
    const expected = crypto.createHmac("sha256", "s3cret").update(`1700000000.${body}`).digest("hex");
    expect(header).toBe(`t=1700000000,v1=${expected}`);
  });

  it("never lists the signing secret after creation", async () => {
    const { token } = await signUp();
    const created = await api()
      .post("/api/v1/admin/webhooks")
      .set("Authorization", `Bearer ${token}`)
      .send({ url: "https://93.184.215.14/hook", events: ["license.created"] });
    expect(created.status).toBe(201);
    expect(created.body.secret).toMatch(/^[0-9a-f]{64}$/);

    const list = await api().get("/api/v1/admin/webhooks").set("Authorization", `Bearer ${token}`);
    expect(list.body[0]).not.toHaveProperty("secret");
  });
});
