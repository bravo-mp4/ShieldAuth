import assert from "node:assert/strict";
import { generateKeyPairSync, KeyObject, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { canonicalMessage, ShieldAuth, verifySignature } from "../src";

const vectors = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "..", "test-vectors.json"), "utf8"));

describe("shared test vectors", () => {
  it("rebuilds the signed text exactly like the server", () => {
    const v = vectors.validate;
    const text = canonicalMessage("validate", [
      v.app_id, v.license_key, v.hwid, v.nonce, v.valid ? 1 : 0, v.session_id, v.expires_at, v.signed_at,
    ]);
    assert.equal(text, v.message);
  });

  it("verifies the server's signatures and rejects tampering", () => {
    for (const v of [vectors.validate, vectors.heartbeat]) {
      assert.equal(verifySignature(vectors.public_key_pem, v.message, v.signature), true);
      assert.equal(verifySignature(vectors.public_key_pem, v.message + "x", v.signature), false);
    }
  });
});

// A stand-in license server that signs like the real one, with knobs for
// misbehaving in the ways an attacker's server would.
type Mode = "honest" | "forged-key" | "wrong-nonce" | "stale" | "unsigned";

function startServer(key: KeyObject, otherKey: KeyObject) {
  const state = { mode: "honest" as Mode, valid: true, heartbeatValid: true };
  const signWith = (k: KeyObject, text: string) =>
    sign("sha256", Buffer.from(text), { key: k, dsaEncoding: "ieee-p1363" }).toString("base64");

  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = JSON.parse(raw);
      const signedAt = Math.floor(Date.now() / 1000) - (state.mode === "stale" ? 3600 : 0);
      const nonce = state.mode === "wrong-nonce" ? "some-other-nonce-value" : body.nonce;
      const signingKey = state.mode === "forged-key" ? otherKey : key;
      let answer: Record<string, unknown>;

      if (req.url === "/validate") {
        const sessionId = state.valid ? "s".repeat(64) : undefined;
        const text = canonicalMessage("validate", [
          body.app_id, body.license_key, body.hwid, body.nonce, state.valid ? 1 : 0, sessionId, undefined, signedAt,
        ]);
        answer = { valid: state.valid, message: "ok", session_id: sessionId, nonce, signed_at: signedAt, signature: signWith(signingKey, text) };
      } else {
        const text = canonicalMessage("heartbeat", [body.session_id, body.nonce, state.heartbeatValid ? 1 : 0, signedAt]);
        answer = { valid: state.heartbeatValid, message: "hb", nonce, signed_at: signedAt, signature: signWith(signingKey, text) };
      }
      if (state.mode === "unsigned") delete answer.signature;

      res.writeHead(req.url === "/heartbeat" && !state.heartbeatValid ? 401 : 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(answer));
    });
  });
  return { server, state };
}

describe("ShieldAuth client", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const attacker = generateKeyPairSync("ec", { namedCurve: "prime256v1" }).privateKey;
  const { server, state } = startServer(privateKey, attacker);
  let apiUrl = "";
  let client: ShieldAuth;

  before(async () => {
    await new Promise<void>((resolve) => (server as Server).listen(0, "127.0.0.1", resolve));
    apiUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    client = new ShieldAuth("app", { apiUrl, publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(), hwid: "machine" });
  });
  after(() => server.close());

  it("accepts a genuine signed answer", async () => {
    state.mode = "honest";
    state.valid = true;
    assert.equal(await client.validate("KEY"), true);
    assert.equal(client.getSessionId(), "s".repeat(64));
  });

  for (const mode of ["forged-key", "wrong-nonce", "stale", "unsigned"] as Mode[]) {
    it(`rejects a "valid" answer that is ${mode}`, async () => {
      state.mode = mode;
      state.valid = true;
      assert.equal(await client.validate("KEY"), false);
    });
  }

  it("treats an unreachable server as not licensed, without throwing", async () => {
    const offline = new ShieldAuth("app", { apiUrl: "http://127.0.0.1:1", allowUnsigned: true, timeout: 500 });
    assert.equal(await offline.validate("KEY"), false);
  });

  it("calls onInvalid when a heartbeat reports the license gone", async () => {
    state.mode = "honest";
    state.valid = true;
    state.heartbeatValid = true;
    assert.equal(await client.validate("KEY"), true);
    assert.equal(await client.heartbeat(), true);

    state.heartbeatValid = false;
    state.valid = false; // the re-validation attempt fails too
    const reason = await new Promise<string>((resolve) => client.startHeartbeat({ intervalMs: 20, onInvalid: resolve }));
    assert.ok(reason.length > 0);
    assert.equal(client.isValid(), false);
  });

  it("requires a public key unless explicitly opted out", () => {
    assert.throws(() => new ShieldAuth("app", { apiUrl }));
  });
});
