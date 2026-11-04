import { Link } from "react-router-dom";
import { Shield, Lock, KeyRound, FileSignature, Gauge, Webhook, Users, AlertTriangle } from "lucide-react";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";

// Everything listed here is implemented and covered by the API test suite.
const CONTROLS = [
  {
    icon: Lock,
    title: "Passwords",
    points: [
      "bcrypt with cost 12; 8 to 72 bytes",
      "Unknown emails still run a bcrypt compare, so timing doesn't reveal accounts",
      "Reset links are single-use, expire after 30 minutes and sign out every other session",
    ],
  },
  {
    icon: KeyRound,
    title: "Sessions",
    points: [
      "HS256 JWTs with the algorithm pinned and a 12-hour expiry",
      "Each request re-reads the account, so bans and role changes apply at once",
      "Changing or resetting a password invalidates existing tokens",
    ],
  },
  {
    icon: Users,
    title: "Tenant isolation",
    points: [
      "Every dashboard query is scoped to your own applications",
      "Platform-admin routes need a role stored in the database, not in the token",
      "Tests try cross-tenant reads, deletes, bans and bulk actions",
    ],
  },
  {
    icon: FileSignature,
    title: "License checks",
    points: [
      "Validation and heartbeat responses are signed with ECDSA P-256",
      "SDKs verify the signature and a client nonce, so answers can't be forged or replayed",
      "Device slots are assigned under a row lock; sessions end when a license is banned",
    ],
  },
  {
    icon: Webhook,
    title: "Webhooks",
    points: [
      "Payloads signed with HMAC-SHA256 over timestamp and body",
      "https only; private, loopback and link-local addresses refused",
      "Redirects aren't followed, and the address is re-checked at send time",
    ],
  },
  {
    icon: Gauge,
    title: "Abuse limits",
    points: [
      "Separate rate limits for sign-in, validation and public write endpoints",
      "Proxy trust is explicit, so X-Forwarded-For can't be spoofed",
      "Parameterised SQL, 100 kB body limit, typed and length-checked input",
    ],
  },
];

export default function SecurityPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="kicker" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Shield size={16} /> SECURITY
          </div>
          <h1 className="heroTitle" style={{ fontSize: "2.6rem", margin: "16px 0" }}>
            How ShieldAuth protects your keys
          </h1>
          <p className="muted" style={{ maxWidth: 680, margin: "0 auto", lineHeight: 1.7 }}>
            The controls below are the ones in the code today. The source and the tests that exercise them are on{" "}
            <a href="https://github.com/bravo-mp4/ShieldAuth" style={{ color: "var(--primary)" }}>GitHub</a>.
          </p>
        </div>

        <div className="grid3" style={{ marginBottom: 48 }}>
          {CONTROLS.map(({ icon: Icon, title, points }) => (
            <div key={title} className="card" style={{ padding: 28 }}>
              <Icon size={26} style={{ color: "var(--primary)", marginBottom: 12 }} />
              <div className="cardTitle" style={{ fontSize: "1.1rem", marginBottom: 12 }}>{title}</div>
              <ul className="muted" style={{ paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div className="cardTitle" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={20} style={{ color: "var(--warning)" }} /> Limits worth knowing
          </div>
          <ul className="muted" style={{ paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
            <li>
              Client-side licensing raises the cost of piracy; it can&apos;t stop someone who patches the check out of
              your binary. Pair it with server-side features where you can.
            </li>
            <li>Dashboard tokens are kept in the browser&apos;s localStorage.</li>
            <li>Hardware IDs come from the client, so a determined user can fake one. Device limits still cap sharing.</li>
          </ul>
        </div>

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link to="/docs" className="btn btnPrimary">Read the integration docs</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
