// Starts an Express API only if this deployment is licensed, and shuts it
// down if the license is revoked later.
const express = require("express");
const { ShieldAuth } = require("shieldauth");

const shield = new ShieldAuth(process.env.SHIELDAUTH_APP_ID, {
  apiUrl: process.env.SHIELDAUTH_API_URL,
  publicKey: process.env.SHIELDAUTH_PUBLIC_KEY,
});

(async () => {
  if (!(await shield.validate(process.env.LICENSE_KEY))) {
    console.error(`Not licensed: ${shield.lastMessage}`);
    process.exit(1);
  }

  const app = express();
  app.get("/", (_req, res) => res.json({ ok: true }));
  const server = app.listen(8080, () => console.log("Licensed API on :8080"));

  shield.startHeartbeat({
    onInvalid: (reason) => {
      console.error(`License ended (${reason}); shutting down`);
      server.close(() => process.exit(1));
    },
  });
})();
