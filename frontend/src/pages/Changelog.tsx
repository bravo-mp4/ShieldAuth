import { useState, useEffect } from "react";
import axios from "axios";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    new: string[];
    improved: string[];
    fixed: string[];
    deprecated: string[];
    security: string[];
  };
}

export default function Changelog() {
  const [versions, setVersions] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChangelog();
  }, []);

  const loadChangelog = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/public/changelog`
      );
      setVersions(response.data);
    } catch (error) {
      console.error("Failed to load changelog:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "new":
        return "var(--success)";
      case "improved":
        return "var(--primary)";
      case "fixed":
        return "var(--error)";
      case "security":
        return "var(--warning)";
      case "deprecated":
        return "var(--text-muted)";
      default:
        return "var(--text-secondary)";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
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
          All updates, improvements, and bug fixes in one place
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: "2rem", color: "var(--text-muted)" }}>
              Loading...
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📋</div>
            <div
              style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 8 }}
            >
              No changelog entries yet
            </div>
            <div className="muted">Check back soon for updates!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {versions.map((version, idx) => (
              <div key={idx} className="card" style={{ padding: 32 }}>
                {/* Version Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 24,
                    paddingBottom: 16,
                    borderBottom: "2px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 16px",
                      background: "var(--primary)",
                      color: "white",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: "1.2rem",
                    }}
                  >
                    v{version.version}
                  </div>
                  <div className="muted">{formatDate(version.date)}</div>
                </div>

                {/* Changes */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  {(
                    [
                      "new",
                      "improved",
                      "fixed",
                      "security",
                      "deprecated",
                    ] as const
                  ).map((type) => {
                    const changes = version.changes[type];
                    if (!changes || changes.length === 0) return null;

                    return (
                      <div key={type}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              padding: "4px 12px",
                              background: getBadgeColor(type),
                              color: "white",
                              borderRadius: 4,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {type}
                          </div>
                        </div>
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {changes.map((change, changeIdx) => (
                            <li
                              key={changeIdx}
                              style={{
                                paddingLeft: 24,
                                position: "relative",
                                color: "var(--text-secondary)",
                                fontSize: "0.95rem",
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  color: getBadgeColor(type),
                                }}
                              >
                                •
                              </span>
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
