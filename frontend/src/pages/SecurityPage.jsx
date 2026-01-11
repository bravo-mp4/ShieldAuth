import { Link } from "react-router-dom";
import { Shield, Lock, Zap, Server, CheckCircle2, AlertTriangle } from "lucide-react";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Security() {
  return (
    <>
      <PublicNav />
      <div
        className="page"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 40px" }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <Lock size={64} className="text-primary-500" />
          </div>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              marginBottom: 24,
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Enterprise-Grade Security
          </h1>
          <p
            className="muted"
            style={{ fontSize: "1.2rem", maxWidth: 700, margin: "0 auto" }}
          >
            Your security and privacy are our top priorities. Here's how we
            protect your data and keep your systems safe.
          </p>
        </div>

        {/* Infrastructure */}
        <div className="card" style={{ padding: 48, marginBottom: 40 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <Server size={32} className="text-primary-500" />
            Infrastructure & Architecture
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 24,
            }}
          >
            {[
              {
                title: "99.9% Uptime SLA",
                desc: "Multi-region redundancy with automatic failover",
                icon: <Zap size={24} className="text-primary-500" />,
              },
              {
                title: "Global CDN",
                desc: "Sub-100ms response times worldwide",
                icon: "🌍",
              },
              {
                title: "DDoS Protection",
                desc: "Enterprise-grade CloudFlare protection",
                icon: "🛡️",
              },
              {
                title: "Auto-Scaling",
                desc: "Handle traffic spikes seamlessly",
                icon: "📈",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: 20,
                  background: "var(--bg-elevated)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>
                  {item.icon}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 8,
                    fontSize: "1.05rem",
                  }}
                >
                  {item.title}
                </div>
                <div className="muted" style={{ fontSize: "0.9rem" }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Encryption */}
        <div className="card" style={{ padding: 48, marginBottom: 40 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={32} className="text-primary-500" />
            Encryption & Data Protection
          </h2>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "var(--primary)",
                }}
              >
                In Transit
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>TLS 1.3 encryption for all API calls</span>
                </li>
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>Certificate pinning for SDK connections</span>
                </li>
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>End-to-end encryption for sensitive data</span>
                </li>
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>Perfect Forward Secrecy (PFS)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "var(--primary)",
                }}
              >
                At Rest
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>AES-256 encryption for all stored data</span>
                </li>
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>Encrypted database backups (daily)</span>
                </li>
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>Secure key management (AWS KMS)</span>
                </li>
                <li style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--success)" }}>✓</span>
                  <span>Hashed & salted passwords (bcrypt)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="card" style={{ padding: 48, marginBottom: 40 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 32 }}>
            📋 Compliance & Certifications
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {[
              { name: "GDPR Compliant", icon: "🇪🇺", status: "Certified" },
              { name: "SOC 2 Type II", icon: "📜", status: "In Progress" },
              { name: "ISO 27001", icon: "🔒", status: "Planned 2026" },
              { name: "CCPA Compliant", icon: "🇺🇸", status: "Certified" },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: 24,
                  background: "var(--bg-elevated)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>
                  {item.icon}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    padding: "4px 8px",
                    background:
                      item.status === "Certified"
                        ? "var(--success-bg)"
                        : "var(--warning-bg)",
                    color:
                      item.status === "Certified"
                        ? "var(--success)"
                        : "var(--warning)",
                    borderRadius: 4,
                    display: "inline-block",
                  }}
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Practices */}
        <div className="card" style={{ padding: 48, marginBottom: 40 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={32} className="text-primary-500" />
            Security Practices
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              {
                title: "Penetration Testing",
                desc: "Annual third-party security audits and continuous vulnerability scanning",
                features: [
                  "Annual pen tests",
                  "Bug bounty program",
                  "Automated scanning",
                  "Responsible disclosure",
                ],
              },
              {
                title: "Access Controls",
                desc: "Strict access management with least privilege principle and audit logging",
                features: [
                  "Role-based access",
                  "2FA required",
                  "IP whitelisting",
                  "Session management",
                ],
              },
              {
                title: "Monitoring & Response",
                desc: "24/7 security monitoring with automated threat detection and incident response",
                features: [
                  "Real-time alerts",
                  "Automated blocking",
                  "Incident response team",
                  "Security logs",
                ],
              },
              {
                title: "Data Privacy",
                desc: "Your data is yours. We never sell or share customer data with third parties",
                features: [
                  "No data selling",
                  "Right to deletion",
                  "Data portability",
                  "Transparent policies",
                ],
              },
            ].map((practice, idx) => (
              <div
                key={idx}
                style={{
                  padding: 24,
                  background: "var(--bg-elevated)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {practice.title}
                </h3>
                <p className="muted" style={{ marginBottom: 16 }}>
                  {practice.desc}
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {practice.features.map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "6px 12px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: "0.85rem",
                      }}
                    >
                      ✓ {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transparency */}
        <div
          className="card"
          style={{
            padding: 48,
            marginBottom: 40,
            background: "var(--bg-elevated)",
          }}
        >
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            🔍 Transparency & Trust
          </h2>
          <p
            className="muted"
            style={{ fontSize: "1.05rem", marginBottom: 32, lineHeight: 1.7 }}
          >
            We believe in being open about our security practices. All incidents
            are disclosed on our status page, and we maintain detailed security
            documentation for enterprise customers.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link
              to="/status"
              className="btn btnPrimary"
              style={{ padding: "12px 24px" }}
            >
              View Status Page →
            </Link>
            <Link
              to="/docs"
              className="btn btnGhost"
              style={{ padding: "12px 24px" }}
            >
              Security Documentation
            </Link>
            <a
              href="mailto:security@shieldlabs.io"
              className="btn btnGhost"
              style={{ padding: "12px 24px" }}
            >
              Report Vulnerability
            </a>
          </div>
        </div>

        {/* Contact */}
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>
            Questions About Security?
          </h2>
          <p
            className="muted"
            style={{ fontSize: "1.05rem", marginBottom: 24 }}
          >
            Our security team is here to help enterprise customers with
            compliance requirements
          </p>
          <Link
            to="/contact"
            className="btn btnPrimary"
            style={{ padding: "14px 32px", fontSize: "1.05rem" }}
          >
            Contact Security Team
          </Link>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
