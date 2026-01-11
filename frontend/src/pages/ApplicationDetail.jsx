import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
// @ts-expect-error - JS module
import { applications } from "../services/api";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";

export default function ApplicationDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadApp();
  }, [id]);

  const loadApp = async () => {
    try {
      setLoading(true);
      // const response = await applications.get(id);
      // Mock data for now
      setApp({
        id,
        name: "GameCheat Pro",
        version: "2.1.0",
        status: "active",
        users: 1247,
        validations: 45231,
        created: "2025-11-15",
        secret: "sk_live_abc123def456ghi789jkl012mno345pqr678",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <div className="muted">Loading application...</div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <Package size={48} className="text-gray-600" />
          </div>
          <div className="cardTitle" style={{ marginBottom: 16 }}>
            Application not found
          </div>
          <Link to="/apps" className="btn btnPrimary">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <TopBar
        title={app.name}
        subtitle={`App ID: ${app.id}`}
        actions={
          <>
            <button className="btn btnGhost">Edit</button>
            <button
              className="btn btnSecondary"
              style={{ color: "var(--error)" }}
            >
              Delete
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {["overview", "licenses", "analytics", "sdk", "settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
              color:
                activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div>
          {/* SDK Integration */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              SDK Integration
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  className="muted"
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  App ID
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={app.id}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btnGhost"
                    onClick={() => copyToClipboard(app.id)}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="muted"
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  App Secret
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type={showSecret ? "text" : "password"}
                    value={app.secret}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btnGhost"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? "👁️ Hide" : "👁️ Show"}
                  </button>
                  <button
                    className="btn btnGhost"
                    onClick={() => copyToClipboard(app.secret)}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: "var(--bg-elevated)",
                borderRadius: 8,
              }}
            >
              <div
                className="muted"
                style={{ fontSize: "0.85rem", marginBottom: 12 }}
              >
                Quick Start:
              </div>
              <pre
                style={{
                  background: "var(--bg)",
                  padding: 16,
                  borderRadius: 8,
                  overflow: "auto",
                  fontSize: "0.9rem",
                }}
              >
                {`#include "shieldauth.h"

ShieldAuth::Initialize("${app.id}");
if (!ShieldAuth::Validate(license_key)) {
    exit(1);
}`}
              </pre>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <Link to="/downloads" className="btn btnPrimary">
                Download SDK
              </Link>
              <Link to="/docs" className="btn btnSecondary">
                View Full Docs
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 24,
            }}
          >
            <div className="card" style={{ padding: 24 }}>
              <div className="cardTitle">Total Users</div>
              <div className="metricValue">{app.users.toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="cardTitle">Validations</div>
              <div className="metricValue metricGreen">
                {app.validations.toLocaleString()}
              </div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="cardTitle">Status</div>
              <div
                className="metricValue"
                style={{ fontSize: "1.5rem", color: "var(--success)" }}
              >
                {app.status === "active" ? "✓ Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "licenses" && (
        <div className="card" style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Licenses</h3>
            <button className="btn btnPrimary">+ Generate License</button>
          </div>
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎫</div>
            <div className="muted">License management coming soon</div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            Analytics
          </h3>
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <BarChart3 size={48} className="text-gray-600" />
            </div>
            <div className="muted">Analytics dashboard coming soon</div>
          </div>
        </div>
      )}

      {activeTab === "sdk" && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            SDK Integration
          </h3>
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            {["C++", "C#", "Python", "Node.js"].map((lang) => (
              <button key={lang} className="btn btnSecondary">
                {lang}
              </button>
            ))}
          </div>
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>💻</div>
            <div className="muted">SDK documentation coming soon</div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            Application Settings
          </h3>
          <form className="form">
            <div className="field">
              <label>Application Name</label>
              <input type="text" defaultValue={app.name} />
            </div>
            <div className="field">
              <label>Max HWID Slots per License</label>
              <select>
                <option>1</option>
                <option selected>2</option>
                <option>3</option>
                <option>5</option>
                <option>10</option>
              </select>
            </div>
            <div className="field">
              <label>Webhook URL</label>
              <input type="url" placeholder="https://your-site.com/webhook" />
            </div>
            <button type="submit" className="btn btnPrimary">
              Save Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
