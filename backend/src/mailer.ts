import { config, isTest } from "./config";
import logger from "./logger";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

// Tests read what would have been sent from here.
export const sentMail: Mail[] = [];

/**
 * Sends through Resend when RESEND_API_KEY is set. Without it (local dev,
 * the demo) the message is logged instead, so the links still work.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (isTest) {
    sentMail.push(mail);
    return;
  }

  if (!config.resendApiKey) {
    logger.info("Email (not sent: RESEND_API_KEY unset)", { to: mail.to, subject: mail.subject, text: mail.text });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: config.mailFrom, to: mail.to, subject: mail.subject, text: mail.text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    logger.error("Email delivery failed", { status: response.status, to: mail.to });
  }
}
