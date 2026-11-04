// Asks for a license key, validates it, then keeps the session alive.
//   SHIELDAUTH_APP_ID=... SHIELDAUTH_API_URL=http://localhost:3000/api/v1 \
//   SHIELDAUTH_PUBLIC_KEY="$(cat signing-key.pem)" node examples/basic.js
const readline = require("readline/promises");
const { ShieldAuth } = require("shieldauth");

async function main() {
  const shield = new ShieldAuth(process.env.SHIELDAUTH_APP_ID, {
    apiUrl: process.env.SHIELDAUTH_API_URL,
    publicKey: process.env.SHIELDAUTH_PUBLIC_KEY,
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const licenseKey = await rl.question("License key: ");
  rl.close();

  if (!(await shield.validate(licenseKey.trim()))) {
    console.error(`Not licensed: ${shield.lastMessage}`);
    process.exit(1);
  }

  console.log("Licensed. Running...");
  shield.startHeartbeat({
    onInvalid: (reason) => {
      console.error(`License ended: ${reason}`);
      process.exit(1);
    },
  });
  setInterval(() => {}, 60 * 1000); // stand-in for the real application
}

main();
