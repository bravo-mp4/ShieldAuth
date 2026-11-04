/**
 * Prints a new ECDSA P-256 key pair for signing license answers.
 *
 *   npm run keygen
 *
 * Put SIGNING_PRIVATE_KEY in the API's environment and give the public key
 * to the SDKs in your app.
 */
import crypto from "crypto";

const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();

console.log("# API environment (one line, newlines escaped):");
console.log(`SIGNING_PRIVATE_KEY="${privatePem.trim().replace(/\n/g, "\\n")}"`);
console.log("\n# Public key for your app's SDK configuration:");
console.log(publicPem);
