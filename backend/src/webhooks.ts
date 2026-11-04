import crypto from "crypto";
import dns from "dns/promises";
import net from "net";
import { config } from "./config";
import { pool } from "./database";
import logger from "./logger";

/**
 * Webhook URLs are user-supplied and the server fetches them, so without
 * checks a user could point one at 169.254.169.254 (cloud metadata),
 * localhost or the private network and read the response back through the
 * "test webhook" endpoint. This blocks those destinations.
 */
function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local, cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast and reserved
    );
  }
  const lower = address.toLowerCase();
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped IPv6. The URL parser rewrites ::ffff:127.0.0.1 into the
    // hex form ::ffff:7f00:1, so decode that back to dotted IPv4.
    const tail = lower.slice(7);
    if (net.isIPv4(tail)) return isPrivateAddress(tail);
    const [high, low] = tail.split(":").map((group) => Number.parseInt(group, 16));
    if (Number.isNaN(high) || Number.isNaN(low)) return true;
    return isPrivateAddress([high >> 8, high & 255, low >> 8, low & 255].join("."));
  }
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") || // unique local
    lower.startsWith("fe80") // link-local
  );
}

export async function validateWebhookUrl(raw: unknown): Promise<string | null> {
  if (typeof raw !== "string" || raw.length > 500) {
    return "URL must be a string of at most 500 characters";
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "URL is not valid";
  }

  if (config.allowPrivateWebhookUrls) {
    return url.protocol === "https:" || url.protocol === "http:" ? null : "URL must use http or https";
  }

  if (url.protocol !== "https:") {
    return "Webhook URLs must use https";
  }
  if (url.username || url.password) {
    return "Webhook URLs must not contain credentials";
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  let addresses: string[];
  try {
    addresses = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((r) => r.address);
  } catch {
    return "Webhook host could not be resolved";
  }

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    return "Webhook URLs must point to a public address";
  }
  return null;
}

/**
 * Receivers verify a delivery by recomputing
 * HMAC-SHA256(secret, `${timestamp}.${body}`) and comparing it with the
 * X-ShieldAuth-Signature header. The secret itself never goes over the wire,
 * and the timestamp lets receivers reject replays.
 */
export function signPayload(secret: string, body: string, timestamp: number): string {
  const digest = crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

export async function sendWebhook(
  webhookId: string,
  url: string,
  secret: string,
  payload: unknown
): Promise<{ status: number; body: string }> {
  // Re-check at send time: DNS for an approved host may have changed since.
  const problem = await validateWebhookUrl(url);
  if (problem) {
    throw new Error(problem);
  }

  const body = JSON.stringify(payload);
  const response = await fetch(url, {
    method: "POST",
    redirect: "manual", // a redirect could otherwise lead to a private address
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "ShieldAuth-Webhooks/1.0",
      "X-ShieldAuth-Webhook-Id": webhookId,
      "X-ShieldAuth-Signature": signPayload(secret, body, Math.floor(Date.now() / 1000)),
    },
    body,
    signal: AbortSignal.timeout(10000),
  });

  const text = (await response.text()).slice(0, 1000);
  return { status: response.status, body: text };
}

export async function triggerWebhook(ownerEmail: string, eventType: string, data: unknown) {
  const webhooks = await pool.query(
    `SELECT webhook_id, url, secret FROM webhooks
     WHERE owner_email = $1 AND is_active = TRUE AND $2 = ANY(events)`,
    [ownerEmail, eventType]
  );

  for (const webhook of webhooks.rows) {
    const payload = {
      event: eventType,
      webhook_id: webhook.webhook_id,
      timestamp: new Date().toISOString(),
      data,
    };

    const delivery = await pool.query(
      `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, next_retry_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [webhook.webhook_id, eventType, payload]
    );
    const deliveryId = delivery.rows[0].id;

    sendWebhook(webhook.webhook_id, webhook.url, webhook.secret, payload)
      .then(({ status, body }) =>
        pool.query(
          "UPDATE webhook_deliveries SET status_code = $1, response_body = $2, delivered_at = NOW() WHERE id = $3",
          [status, body, deliveryId]
        )
      )
      .catch((err) =>
        pool
          .query("UPDATE webhook_deliveries SET failed_at = NOW(), response_body = $1 WHERE id = $2", [
            String(err.message).slice(0, 1000),
            deliveryId,
          ])
          .catch(() => undefined)
      )
      .catch((err) => logger.warn("Webhook delivery bookkeeping failed", { error: err.message }));
  }
}
