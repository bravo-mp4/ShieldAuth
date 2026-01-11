import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";
import APIPlayground from "../components/APIPlayground";

export default function APIDemo() {
  return (
    <>
      <PublicNav />
      <div className="publicPage">
        {/* Hero */}
        <section
          style={{
            padding: "80px 20px",
            textAlign: "center",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "var(--primary-bg)",
              borderRadius: 20,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--primary)",
              marginBottom: 24,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={24} />
              Interactive Demo
            </span>
          </div>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              marginBottom: 24,
              lineHeight: 1.1,
            }}
          >
            Try Our API
            <br />
            <span style={{ color: "var(--primary)" }}>Live & Free</span>
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              marginBottom: 48,
              maxWidth: 700,
              margin: "0 auto 48px",
            }}
          >
            Test license validation in real-time. No signup required. See
            exactly how fast and reliable our API is.
          </p>
        </section>

        {/* Playground */}
        <section
          style={{ padding: "0 20px 80px", maxWidth: 1200, margin: "0 auto" }}
        >
          <APIPlayground />
        </section>

        {/* Features Grid */}
        <section
          style={{ padding: "80px 20px", background: "var(--bg-elevated)" }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 48,
              }}
            >
              Why Developers Love Our API
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {[
                {
                  icon: "⚡",
                  title: "Lightning Fast",
                  description:
                    "Global CDN ensures <50ms response times worldwide",
                },
                {
                  icon: "🔒",
                  title: "Secure by Default",
                  description:
                    "TLS 1.3, HMAC signatures, and encrypted payloads",
                },
                {
                  icon: "📊",
                  title: "Real-time Analytics",
                  description: "See every validation request as it happens",
                },
                {
                  icon: "🛠️",
                  title: "Easy Integration",
                  description:
                    "One function call. Works in C++, C#, Python, Node.js",
                },
                {
                  icon: "📚",
                  title: "Great Docs",
                  description:
                    "Clear examples, error codes, and support channels",
                },
                {
                  icon: "♾️",
                  title: "No Rate Limits",
                  description: "Unlimited validations on all plans",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 32,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>
                    {feature.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section
          style={{ padding: "80px 20px", maxWidth: 1200, margin: "0 auto" }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            Get Started in Minutes
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: 32,
            }}
          >
            {[
              {
                lang: "C++",
                code: `#include "shieldlabs.h"

bool validate = ShieldLabs::Validate(
  "YOUR-LICENSE-KEY",
  GetHWID()
);

if (validate) {
  // License valid
}`,
              },
              {
                lang: "Python",
                code: `from shieldlabs import validate

result = validate(
  license_key="YOUR-LICENSE-KEY",
  hwid=get_hwid()
)

if result.valid:
  # License valid`,
              },
            ].map((example, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-card)",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    padding: "12px 20px",
                    background: "#0a0a0f",
                    borderBottom: "1px solid var(--border)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  {example.lang}
                </div>
                <pre
                  style={{
                    padding: 24,
                    margin: 0,
                    background: "#0a0a0f",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "#e4e4e7",
                    fontFamily: "'Fira Code', monospace",
                    overflowX: "auto",
                  }}
                >
                  {example.code}
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            padding: "80px 20px",
            textAlign: "center",
            background: "var(--bg-elevated)",
          }}
        >
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>
            Ready to Protect Your Software?
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              marginBottom: 32,
              maxWidth: 600,
              margin: "0 auto 32px",
            }}
          >
            Join thousands of developers using ShieldLabs to secure their
            applications.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/signup"
              className="btn btnPrimary"
              style={{
                padding: "14px 32px",
                fontSize: "1.1rem",
                textDecoration: "none",
              }}
            >
              Get Started Free →
            </a>
            <a
              href="/docs"
              className="btn btnGhost"
              style={{
                padding: "14px 32px",
                fontSize: "1.1rem",
                textDecoration: "none",
              }}
            >
              Read Documentation
            </a>
          </div>
        </section>
      </div>
      <PublicFooter />
    </>
  );
}
