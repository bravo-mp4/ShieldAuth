import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { Shield, KeyRound, Cpu, Activity, Webhook, Lock, FileSignature } from "lucide-react";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";

const FEATURES = [
  {
    icon: KeyRound,
    title: "License keys per app",
    body: "Issue keys with an expiry and a device limit. Ban, unban, annotate or bulk-delete them from the dashboard, or export them as CSV.",
  },
  {
    icon: Cpu,
    title: "Hardware binding",
    body: "A key binds to the first machines that use it. Slots are assigned under a database row lock, so parallel requests can't over-fill them.",
  },
  {
    icon: FileSignature,
    title: "Signed responses",
    body: "Every validation and heartbeat is signed with ECDSA P-256. The SDKs check the signature and a fresh nonce, so a fake server or a replayed answer won't unlock your app.",
  },
  {
    icon: Activity,
    title: "Sessions and logs",
    body: "Clients keep a session alive with heartbeats. A ban reaches running copies at the next heartbeat, and every attempt is logged for you.",
  },
  {
    icon: Webhook,
    title: "Signed webhooks",
    body: "Get license events at your own endpoint, signed with HMAC-SHA256. URLs are checked so they can't be pointed at private networks.",
  },
  {
    icon: Lock,
    title: "Customer portal",
    body: "Your users see their license, rename devices, and free one slot a week when they get a new computer, without emailing you.",
  },
];

const STEPS = [
  ["Register your app", "Sign up and create an application to get its App ID."],
  ["Issue keys", "Create license keys with an expiry and a number of device slots."],
  ["Validate from your code", "Call the SDK at start-up. It returns a verified yes or no, then sends heartbeats."],
];

const SNIPPET = `import { ShieldAuth } from "shieldauth";

const shield = new ShieldAuth(APP_ID, {
  apiUrl: "https://your-shieldauth-host/api/v1",
  publicKey: SHIELDAUTH_PUBLIC_KEY, // from GET /public/signing-key
});

if (!(await shield.validate(licenseKey))) {
  console.error("This copy isn't licensed.");
  process.exit(1);
}
shield.startHeartbeat(); // stops the app if the license is revoked`;

export default function Landing() {
  const [stats, setStats] = useState<{ validations_today: number; active_licenses: number; total_licenses: number } | null>(null);

  useEffect(() => {
    // Real counters from this instance. If the API is down they just don't show.
    axios
      .get("/api/v1/public/stats")
      .then((response) => setStats(response.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <>
      <PublicNav />
      <div className="hero" style={{ paddingTop: 120, paddingBottom: 64 }}>
        <div className="kicker" style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <Shield size={16} /> SOFTWARE LICENSING API
        </div>
        <h1 className="heroTitle" style={{ maxWidth: 900, margin: "16px auto 24px" }}>
          License keys for your <span className="heroAccent">desktop software</span>
        </h1>
        <p className="heroDesc" style={{ fontSize: "1.15rem", maxWidth: 680, margin: "0 auto 40px" }}>
          ShieldAuth issues license keys, binds them to your users&apos; machines, and answers your app&apos;s
          &ldquo;is this copy licensed?&rdquo; check with a signed response. SDKs for C++, C#, Python and Node.js.
        </p>

        <div className="heroCtas" style={{ marginBottom: 48 }}>
          <Link className="btn btnPrimary" to="/signup" style={{ padding: "14px 36px", fontSize: "1.05rem" }}>
            Create an account
          </Link>
          <Link className="btn btnGhost" to="/docs" style={{ padding: "14px 28px" }}>
            Read the docs
          </Link>
        </div>

        {stats && (
          <div className="heroStats">
            <div className="stat">
              <div className="statValue">{stats.validations_today.toLocaleString()}</div>
              <div className="statLabel">Validations today</div>
            </div>
            <div className="stat">
              <div className="statValue">{stats.active_licenses.toLocaleString()}</div>
              <div className="statLabel">Active licenses</div>
            </div>
            <div className="stat">
              <div className="statValue">{stats.total_licenses.toLocaleString()}</div>
              <div className="statLabel">Licenses issued</div>
            </div>
          </div>
        )}
      </div>

      <section className="section" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, textAlign: "center", marginBottom: 32 }}>How it works</h2>
        <div className="grid3">
          {STEPS.map(([title, body], index) => (
            <div key={title} className="card" style={{ padding: 28 }}>
              <div className="kicker" style={{ marginBottom: 8 }}>STEP {index + 1}</div>
              <div className="cardTitle" style={{ fontSize: "1.15rem", marginBottom: 8 }}>{title}</div>
              <div className="muted" style={{ lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, textAlign: "center", marginBottom: 32 }}>What you get</h2>
        <div className="grid3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card" style={{ padding: 28 }}>
              <Icon size={28} style={{ color: "var(--primary)", marginBottom: 12 }} />
              <div className="cardTitle" style={{ fontSize: "1.1rem", marginBottom: 8 }}>{title}</div>
              <div className="muted" style={{ lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700, textAlign: "center", marginBottom: 12 }}>A few lines in your app</h2>
        <p className="muted" style={{ textAlign: "center", marginBottom: 24 }}>
          Node.js shown; the C++, C# and Python SDKs work the same way.
        </p>
        <pre className="codeBlock" style={{ padding: 24, overflowX: "auto", lineHeight: 1.6 }}>{SNIPPET}</pre>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link className="btn btnPrimary" to="/docs">See the full integration guide</Link>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
