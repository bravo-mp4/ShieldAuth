import { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";

const REPO = "https://github.com/bravo-mp4/ShieldAuth/tree/master";

const SDKS = {
  "Node.js": {
    install: "cd sdk/nodejs && npm install && npm run build",
    code: `const { ShieldAuth } = require("shieldauth");

const shield = new ShieldAuth(APP_ID, {
  apiUrl: "https://your-host/api/v1",
  publicKey: SHIELDAUTH_PUBLIC_KEY,
});

if (!(await shield.validate(licenseKey))) {
  console.error(shield.lastMessage);
  process.exit(1);
}
shield.startHeartbeat({ onInvalid: () => process.exit(1) });`,
  },
  Python: {
    install: "pip install ./sdk/python",
    code: `from shieldauth import ShieldAuth

shield = ShieldAuth(APP_ID, api_url="https://your-host/api/v1",
                    public_key=SHIELDAUTH_PUBLIC_KEY)

if not shield.validate(license_key):
    raise SystemExit(shield.last_message)
shield.start_heartbeat()  # exits if the license is revoked`,
  },
  "C#": {
    install: "dotnet add reference sdk/csharp/ShieldAuth/ShieldAuth.csproj",
    code: `using var shield = new ShieldAuthClient(appId, new ShieldAuthOptions
{
    ApiUrl = "https://your-host/api/v1",
    PublicKeyPem = ShieldAuthPublicKey,
});

if (!await shield.ValidateAsync(licenseKey)) Environment.Exit(1);
shield.StartHeartbeat(TimeSpan.FromMinutes(5), reason => Environment.Exit(1));`,
  },
  "C++": {
    install: "add_subdirectory(sdk/cpp) then target_link_libraries(app PRIVATE shieldauth)",
    code: `ShieldAuth::Config config;
config.app_id = APP_ID;
config.api_url = "https://your-host/api/v1";
config.public_key_pem = kShieldAuthPublicKey;

if (!ShieldAuth::Initialize(config) || !ShieldAuth::Validate(licenseKey)) return 1;

// every few minutes:
ShieldAuth::Heartbeat();
if (!ShieldAuth::IsValid()) return 1;`,
  },
};

const VALIDATE_REQUEST = `POST /api/v1/validate
{ "app_id": "...", "license_key": "...", "hwid": "...", "nonce": "random 16-64 chars" }`;

const VALIDATE_RESPONSE = `{
  "valid": true,
  "message": "License validated",
  "session_id": "64 hex characters",
  "expires_at": 1893456000,
  "nonce": "echoed back",
  "signed_at": 1767225600,
  "signature": "base64 ECDSA P-256 (r || s)"
}`;

const SIGNED_TEXT = `shieldauth-v1
validate
{app_id}
{license_key}
{hwid}
{nonce}
{1 or 0}
{session_id}
{expires_at}
{signed_at}`;

const WEBHOOK_VERIFY = `// X-ShieldAuth-Signature: t=1767225600,v1=<hex>
const [t, v1] = header.split(",").map((part) => part.split("=")[1]);
const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(\`\${t}.\${rawBody}\`).digest("hex");
const ok = crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
  && Math.abs(Date.now() / 1000 - Number(t)) < 300;`;

function Code({ children }) {
  return (
    <pre className="codeBlock" style={{ padding: 20, overflowX: "auto", lineHeight: 1.6, fontSize: "0.9rem" }}>
      {children}
    </pre>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 100 }}>
      <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 16 }}>{title}</h2>
      {children}
    </section>
  );
}

export default function Documentation() {
  const [sdk, setSdk] = useState("Node.js");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "120px 24px 80px" }}>
        <h1 className="heroTitle" style={{ fontSize: "2.4rem", marginBottom: 12 }}>Integration guide</h1>
        <p className="muted" style={{ marginBottom: 40, lineHeight: 1.7 }}>
          Everything here matches the code in the repository. The wire format is specified in{" "}
          <a href={`${REPO}/sdk/PROTOCOL.md`} style={{ color: "var(--primary)" }}>sdk/PROTOCOL.md</a>.
        </p>

        <Section id="start" title="Quick start">
          <ol className="muted" style={{ paddingLeft: 20, lineHeight: 1.9 }}>
            <li><Link to="/signup" style={{ color: "var(--primary)" }}>Create an account</Link> and an application. Copy its App ID.</li>
            <li>Issue a license key from the Licenses page, with an expiry and a number of device slots.</li>
            <li>Copy the signing public key from the application page and embed it in your app.</li>
            <li>Call the SDK at start-up, then let it send heartbeats.</li>
          </ol>
        </Section>

        <Section id="sdks" title="SDKs">
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {Object.keys(SDKS).map((name) => (
              <button key={name} className={`btn ${sdk === name ? "btnPrimary" : "btnGhost"}`} onClick={() => setSdk(name)}>
                {name}
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginBottom: 8 }}>Install from the repository:</p>
          <Code>{SDKS[sdk].install}</Code>
          <Code>{SDKS[sdk].code}</Code>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Every SDK hashes a machine identifier into the HWID, sends a fresh nonce, and accepts an answer only if
            its signature verifies with your pinned key, the nonce matches and the timestamp is fresh. Network
            errors count as &ldquo;not valid&rdquo; at start-up; during heartbeats a short outage is tolerated.
            Source and examples: <a href={`${REPO}/sdk`} style={{ color: "var(--primary)" }}>sdk/</a>.
          </p>
        </Section>

        <Section id="api" title="Validation API">
          <Code>{VALIDATE_REQUEST}</Code>
          <Code>{VALIDATE_RESPONSE}</Code>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            A key validates only for the application it was issued to. New devices take a free slot; once all are
            taken the answer is <code className="codeInline">HWID limit reached</code>. Send{" "}
            <code className="codeInline">POST /api/v1/heartbeat</code> with the session ID and a new nonce every few
            minutes: it returns 401 once the license is banned or expired, or the session went 30 minutes without a
            heartbeat.
          </p>
        </Section>

        <Section id="signatures" title="Signed answers">
          <p className="muted" style={{ lineHeight: 1.7, marginBottom: 12 }}>
            Validate and heartbeat answers are signed with ECDSA P-256 / SHA-256. The signed text is these fields
            joined by newlines (heartbeats use session_id, nonce, valid and signed_at):
          </p>
          <Code>{SIGNED_TEXT}</Code>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Fetch the key once from <code className="codeInline">GET /api/v1/public/signing-key</code> and ship it
            with your app. Don&apos;t fetch it at run time, or a fake server can supply its own.
          </p>
        </Section>

        <Section id="webhooks" title="Webhooks">
          <p className="muted" style={{ lineHeight: 1.7, marginBottom: 12 }}>
            Register an https URL for <code className="codeInline">license.created</code> and other events. Each
            delivery carries an <code className="codeInline">X-ShieldAuth-Signature</code> header; check it against
            the secret shown when you created the webhook:
          </p>
          <Code>{WEBHOOK_VERIFY}</Code>
        </Section>

        <Section id="portal" title="Customer portal">
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Send your users to <code className="codeInline">/portal/&lt;license key&gt;</code>. They can see the
            license status and devices, rename a device, and free one device slot a week.
          </p>
        </Section>
      </div>
      <PublicFooter />
    </div>
  );
}
