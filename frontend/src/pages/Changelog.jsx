// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Changelog() {
  const versions = [
    {
      version: "1.5.0",
      date: "January 5, 2026",
      changes: {
        new: [
          "Added VM protection option for advanced binary obfuscation",
          "Team management for Business plan users",
          "Webhook event filtering",
        ],
        improved: [
          "License validation speed improved by 20%",
          "Dashboard loading performance optimized",
          "Better error messages in SDK",
        ],
        fixed: [
          "Fixed HWID detection on certain Windows systems",
          "Resolved API timeout issues during peak hours",
          "Fixed dashboard timezone display bug",
        ],
      },
    },
    {
      version: "1.4.2",
      date: "December 28, 2025",
      changes: {
        new: ["Export analytics reports as CSV/PDF"],
        improved: [
          "Updated C++ SDK with better error handling",
          "Improved documentation search",
          "Enhanced mobile dashboard experience",
        ],
        fixed: [
          "Fixed license key generation race condition",
          "Corrected billing cycle calculations",
        ],
      },
    },
    {
      version: "1.4.0",
      date: "December 15, 2025",
      changes: {
        new: [
          "Python SDK released",
          "Node.js SDK released",
          "Geographic analytics dashboard",
          "IP whitelisting feature",
        ],
        improved: [
          "Faster API response times",
          "Better webhook reliability",
          "Updated pricing page design",
        ],
        fixed: [
          "Fixed C# SDK memory leak",
          "Corrected HWID slot count display",
        ],
      },
    },
    {
      version: "1.3.0",
      date: "November 20, 2025",
      changes: {
        new: [
          "Webhooks system launched",
          "Two-factor authentication",
          "API key management",
          "Audit logs",
        ],
        improved: [
          "Dashboard UI refresh",
          "Better mobile responsiveness",
          "Improved documentation",
        ],
        fixed: ["Various bug fixes and stability improvements"],
      },
    },
  ];

  const getBadgeColor = (type) => {
    switch (type) {
      case "new":
        return "var(--success)";
      case "improved":
        return "var(--primary)";
      case "fixed":
        return "var(--error)";
      default:
        return "var(--text-secondary)";
    }
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Changelog
        </h1>
        <p
          className="muted"
          style={{ fontSize: "1.1rem", textAlign: "center", marginBottom: 60 }}
        >
          Track new features, improvements, and bug fixes
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {versions.map((release, idx) => (
            <div key={idx} className="card" style={{ padding: 32 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <h2 style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                  Version {release.version}
                </h2>
                <span className="muted">{release.date}</span>
              </div>

              {release.changes.new && release.changes.new.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "var(--success)",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    ✨ NEW FEATURES
                  </div>
                  <ul
                    style={{
                      paddingLeft: 24,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {release.changes.new.map((item, i) => (
                      <li key={i} style={{ color: "var(--text-secondary)" }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {release.changes.improved &&
                release.changes.improved.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        background: "rgba(139, 92, 246, 0.1)",
                        color: "var(--primary)",
                        borderRadius: 4,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        marginBottom: 12,
                      }}
                    >
                      🔧 IMPROVEMENTS
                    </div>
                    <ul
                      style={{
                        paddingLeft: 24,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {release.changes.improved.map((item, i) => (
                        <li key={i} style={{ color: "var(--text-secondary)" }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {release.changes.fixed && release.changes.fixed.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--error)",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    🐛 BUG FIXES
                  </div>
                  <ul
                    style={{
                      paddingLeft: 24,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {release.changes.fixed.map((item, i) => (
                      <li key={i} style={{ color: "var(--text-secondary)" }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
