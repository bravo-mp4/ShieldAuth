import { Link } from "react-router-dom";
import { useState } from "react";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Features() {
  const [activeTab, setActiveTab] = useState("license");

  const tabs = [
    { id: "license", label: "License Management", icon: "🔑" },
    { id: "security", label: "Binary Protection", icon: "🛡️" },
    { id: "developer", label: "Developer Tools", icon: "⚡" },
    { id: "analytics", label: "Analytics", icon: "📊" },
  ];

  const featureContent = {
    license: {
      title: "Advanced License Management",
      description:
        "Complete control over your software licensing with HWID locking, expiration management, and real-time revocation.",
      features: [
        {
          name: "HWID Locking",
          desc: "Lock licenses to specific hardware (1-10 slots per key)",
        },
        {
          name: "Expiration Control",
          desc: "Set days, months, or lifetime licenses",
        },
        {
          name: "Remote Revocation",
          desc: "Instantly revoke licenses from dashboard",
        },
        {
          name: "Usage Tracking",
          desc: "Monitor when and where licenses are used",
        },
        { name: "Session Limits", desc: "Control concurrent user sessions" },
        { name: "Unlimited Keys", desc: "Generate as many keys as you need" },
      ],
      codeExample: `// Validate license with C++ SDK
#include "shieldlabs.h"

ShieldLabs::Client client("your_api_key");

auto result = client.validate({
    .license_key = "XXXX-XXXX-XXXX-XXXX",
    .hwid = ShieldLabs::getHWID()
});

if (result.valid) {
    // License is valid, proceed
    std::cout << "Welcome " << result.username << std::endl;
} else {
    std::cout << "Invalid license" << std::endl;
    exit(1);
}`,
      demo: "License validation happens in under 50ms globally",
    },
    security: {
      title: "Military-Grade Binary Protection",
      description:
        "Protect your compiled binaries from reverse engineering, tampering, and unauthorized modifications.",
      features: [
        {
          name: "Code Obfuscation",
          desc: "Control flow flattening and virtualization",
        },
        { name: "String Encryption", desc: "Encrypt all hardcoded strings" },
        { name: "Anti-Debug", desc: "10+ detection techniques" },
        { name: "Anti-Tamper", desc: "Detect binary modifications" },
        { name: "VM Execution", desc: "Run critical code in virtual machine" },
        { name: "Import Hiding", desc: "Obfuscate API calls" },
      ],
      codeExample: `// Protect your binary
shieldlabs protect \\
  --input myapp.exe \\
  --output myapp_protected.exe \\
  --obfuscation high \\
  --anti-debug \\
  --vm-critical-functions

✓ Binary protected successfully
✓ Added anti-debug checks
✓ Encrypted 247 strings
✓ Virtualized 12 critical functions`,
      demo: "Protection adds only 2-5% performance overhead",
    },
    developer: {
      title: "Developer-Friendly Integration",
      description:
        "Simple REST API with SDKs for all major languages. Get integrated in minutes, not hours.",
      features: [
        { name: "RESTful API", desc: "Clean, well-documented endpoints" },
        { name: "C++ SDK", desc: "Native performance, header-only" },
        { name: "C# SDK", desc: "Unity and .NET support" },
        { name: "Python SDK", desc: "For automation and tools" },
        { name: "Webhooks", desc: "Real-time event notifications" },
        { name: "Node.js SDK", desc: "For Electron and web apps" },
      ],
      codeExample: `// Python SDK example
from shieldlabs import Client

client = Client(api_key="your_key")

# Validate license
result = client.validate(
    license_key="XXXX-XXXX-XXXX-XXXX",
    hwid=client.get_hwid()
)

if result.valid:
    print(f"Welcome {result.username}")
else:
    print(f"Error: {result.message}")
    sys.exit(1)`,
      demo: "5-minute integration time on average",
    },
    analytics: {
      title: "Real-Time Analytics & Insights",
      description:
        "Monitor your licensing system with detailed analytics, geographic data, and usage patterns.",
      features: [
        { name: "Live Dashboard", desc: "Real-time validation monitoring" },
        { name: "Geographic Data", desc: "See where your users are" },
        { name: "Usage Patterns", desc: "Peak hours and trends" },
        { name: "Event Logs", desc: "Every validation tracked" },
        { name: "Export Reports", desc: "CSV/JSON data exports" },
        { name: "API Metrics", desc: "Response times and uptime" },
      ],
      codeExample: `// Webhook payload example
{
  "event": "license.validated",
  "timestamp": "2026-01-06T14:32:15Z",
  "data": {
    "license_key": "XXXX-XXXX-XXXX-XXXX",
    "username": "user_1234",
    "hwid": "ABC123...",
    "ip": "203.0.113.42",
    "location": "San Francisco, US",
    "success": true
  }
}`,
      demo: "Real-time webhooks deliver in <200ms",
    },
  };

  const features = [
    {
      category: "License Management",
      icon: "🔑",
      items: [
        "Unlimited license key generation",
        "HWID locking (1-10 slots per key)",
        "Expiration dates (days/months/lifetime)",
        "Remote license revocation",
        "Usage tracking",
        "Concurrent session limits",
      ],
    },
    {
      category: "Binary Protection",
      icon: "🛡️",
      items: [
        "Code obfuscation (control flow flattening)",
        "String encryption",
        "Import hiding",
        "Anti-debug (10+ techniques)",
        "Anti-tamper checks",
        "VM execution (optional)",
      ],
    },
    {
      category: "Developer Tools",
      icon: "⚡",
      items: [
        "RESTful API",
        "Webhooks",
        "C++ SDK",
        "C# SDK",
        "Python SDK",
        "Node.js SDK",
      ],
    },
    {
      category: "Dashboard & Analytics",
      icon: "📊",
      items: [
        "Real-time usage monitoring",
        "License analytics",
        "Geographic data",
        "User management",
        "Event logs",
        "Export reports",
      ],
    },
    {
      category: "Security",
      icon: "🔒",
      items: [
        "Encrypted API communication",
        "Rate limiting",
        "IP whitelisting",
        "Two-factor authentication",
        "Audit logs",
        "Session management",
      ],
    },
    {
      category: "Integration",
      icon: "🔌",
      items: [
        "5-minute integration",
        "Example projects",
        "Comprehensive documentation",
        "Video tutorials",
        "Discord support",
        "Active community",
      ],
    },
  ];

  return (
    <>
      <PublicNav />
      <div
        className="page"
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 40px" }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
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
            Everything You Need to Protect Your Software
          </h1>
          <p
            className="muted"
            style={{ fontSize: "1.2rem", maxWidth: 600, margin: "0 auto" }}
          >
            Comprehensive license management and binary protection tools
            designed for serious developers
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 40,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${
                activeTab === tab.id ? "btnPrimary" : "btnGhost"
              }`}
              style={{ padding: "12px 24px" }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Feature Content */}
        <div className="card" style={{ padding: 48, marginBottom: 40 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "start",
            }}
          >
            {/* Left: Description and Features */}
            <div>
              <h2
                style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}
              >
                {featureContent[activeTab].title}
              </h2>
              <p
                className="muted"
                style={{
                  fontSize: "1.05rem",
                  marginBottom: 32,
                  lineHeight: 1.7,
                }}
              >
                {featureContent[activeTab].description}
              </p>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {featureContent[activeTab].features.map((feature, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 12 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--primary-bg)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {feature.name}
                      </div>
                      <div className="muted" style={{ fontSize: "0.9rem" }}>
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 32,
                  padding: "16px 20px",
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}
              >
                ⚡ {featureContent[activeTab].demo}
              </div>
            </div>

            {/* Right: Code Example */}
            <div
              style={{
                background: "#0a0a0f",
                borderRadius: 12,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--bg-elevated)",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#ef4444",
                  }}
                ></div>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#f59e0b",
                  }}
                ></div>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#10b981",
                  }}
                ></div>
                <div
                  style={{
                    marginLeft: 12,
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {activeTab === "license"
                    ? "main.cpp"
                    : activeTab === "security"
                    ? "terminal"
                    : activeTab === "developer"
                    ? "main.py"
                    : "webhook.json"}
                </div>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 24,
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  color: "#e4e4e7",
                  overflowX: "auto",
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                }}
              >
                {featureContent[activeTab].codeExample}
              </pre>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div style={{ marginBottom: 60 }}>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            How We Compare
          </h2>
          <div className="card" style={{ padding: 0, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "var(--bg-elevated)",
                    borderBottom: "2px solid var(--border)",
                  }}
                >
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "left",
                      fontWeight: 600,
                    }}
                  >
                    Feature
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "center",
                      fontWeight: 600,
                      color: "var(--primary)",
                    }}
                  >
                    ShieldLabs
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    Auth0
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    KeyAuth
                  </th>
                  <th
                    style={{
                      padding: "16px 24px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    Build In-House
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["HWID Locking", true, false, true, true],
                  ["Binary Protection", true, false, false, false],
                  ["Sub-100ms Response", true, false, true, false],
                  ["Real-time Analytics", true, true, true, false],
                  ["99.9% SLA", true, true, false, false],
                  ["Setup Time", "5 min", "2 hours", "30 min", "2 weeks"],
                  ["Pricing", "$20/mo", "$240/mo", "$15/mo", "$$$"],
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "16px 24px", fontWeight: 500 }}>
                      {row[0]}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      {typeof row[1] === "boolean" ? (
                        row[1] ? (
                          <span
                            style={{
                              color: "var(--success)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✗
                          </span>
                        )
                      ) : (
                        <strong style={{ color: "var(--primary)" }}>
                          {row[1]}
                        </strong>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      {typeof row[2] === "boolean" ? (
                        row[2] ? (
                          <span
                            style={{
                              color: "var(--success)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✗
                          </span>
                        )
                      ) : (
                        row[2]
                      )}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      {typeof row[3] === "boolean" ? (
                        row[3] ? (
                          <span
                            style={{
                              color: "var(--success)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✗
                          </span>
                        )
                      ) : (
                        row[3]
                      )}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}>
                      {typeof row[4] === "boolean" ? (
                        row[4] ? (
                          <span
                            style={{
                              color: "var(--success)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "1.3rem",
                            }}
                          >
                            ✗
                          </span>
                        )
                      ) : (
                        row[4]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div
          className="card"
          style={{
            padding: "60px 40px",
            textAlign: "center",
            background: "var(--bg-elevated)",
          }}
        >
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 16 }}>
            Ready to protect your software?
          </h2>
          <p className="muted" style={{ fontSize: "1.1rem", marginBottom: 32 }}>
            Join 2,500+ developers. Start free - no credit card required.
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/signup"
              className="btn btnPrimary"
              style={{ padding: "14px 36px", fontSize: "1.05rem" }}
            >
              Protect Your App in 5 Minutes →
            </Link>
            <Link
              to="/api-demo"
              className="btn btnGhost"
              style={{ padding: "14px 36px", fontSize: "1.05rem" }}
            >
              🎮 Try Live Demo
            </Link>
            <Link
              to="/pricing"
              className="btn btnGhost"
              style={{ padding: "14px 36px", fontSize: "1.05rem" }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
