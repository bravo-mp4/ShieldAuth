import { useState } from "react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"general" | "security" | "api">(
    "general"
  );

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">Settings</div>
          <div className="pageSub">Configure your application settings</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <button
          className={`btn ${
            activeTab === "general" ? "btnPrimary" : "btnGhost"
          }`}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          className={`btn ${
            activeTab === "security" ? "btnPrimary" : "btnGhost"
          }`}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
        <button
          className={`btn ${activeTab === "api" ? "btnPrimary" : "btnGhost"}`}
          onClick={() => setActiveTab("api")}
        >
          API Keys
        </button>
      </div>

      {activeTab === "general" && (
        <div className="grid2">
          <div className="card">
            <div className="cardTitle">Account Information</div>
            <form className="form">
              <div className="field">
                <label>Email Address</label>
                <input type="email" defaultValue="admin@shieldlabs.com" />
              </div>
              <div className="field">
                <label>Username</label>
                <input type="text" defaultValue="admin" />
              </div>
              <button className="btn btnPrimary">Save Changes</button>
            </form>
          </div>

          <div className="card">
            <div className="cardTitle">Notifications</div>
            <form className="form">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    Email Notifications
                  </div>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    Receive email alerts for important events
                  </div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    Failed Auth Alerts
                  </div>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    Get notified of failed login attempts
                  </div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    Weekly Reports
                  </div>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    Receive weekly usage summaries
                  </div>
                </div>
                <input type="checkbox" />
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="grid2">
          <div className="card">
            <div className="cardTitle">Change Password</div>
            <form className="form">
              <div className="field">
                <label>Current Password</label>
                <input type="password" />
              </div>
              <div className="field">
                <label>New Password</label>
                <input type="password" />
              </div>
              <div className="field">
                <label>Confirm New Password</label>
                <input type="password" />
              </div>
              <button className="btn btnPrimary">Update Password</button>
            </form>
          </div>

          <div className="card">
            <div className="cardTitle">Two-Factor Authentication</div>
            <div className="muted" style={{ marginBottom: 20 }}>
              Add an extra layer of security to your account
            </div>
            <button className="btn btnPrimary">Enable 2FA</button>
          </div>

          <div className="card">
            <div className="cardTitle">Active Sessions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  padding: 12,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  Current Session
                </div>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  Windows • Chrome • 192.168.1.100
                </div>
              </div>
            </div>
            <button className="btn btnDanger" style={{ marginTop: 16 }}>
              Revoke All Sessions
            </button>
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="grid2">
          <div className="card">
            <div className="cardTitle">API Keys</div>
            <div className="muted" style={{ marginBottom: 20 }}>
              Use these keys to integrate with your applications
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                className="muted"
                style={{ fontSize: "0.85rem", marginBottom: 8 }}
              >
                Production Key
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  background: "var(--bg-elevated)",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontSize: "0.9rem",
                    color: "var(--primary-light)",
                    fontFamily: "monospace",
                  }}
                >
                  sk_live_abc123def456ghi789jkl012mno345
                </code>
                <button
                  className="btn btnGhost"
                  style={{ padding: "4px 12px" }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <div
                className="muted"
                style={{ fontSize: "0.85rem", marginBottom: 8 }}
              >
                Test Key
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  background: "var(--bg-elevated)",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontSize: "0.9rem",
                    color: "var(--primary-light)",
                    fontFamily: "monospace",
                  }}
                >
                  sk_test_xyz987uvw654rst321opq098lmn765
                </code>
                <button
                  className="btn btnGhost"
                  style={{ padding: "4px 12px" }}
                >
                  Copy
                </button>
              </div>
            </div>

            <button className="btn btnSecondary" style={{ marginTop: 20 }}>
              Generate New Key
            </button>
          </div>

          <div className="card">
            <div className="cardTitle">Webhooks</div>
            <div className="muted" style={{ marginBottom: 20 }}>
              Configure webhook endpoints for real-time notifications
            </div>

            <form className="form">
              <div className="field">
                <label>Webhook URL</label>
                <input type="url" placeholder="https://yoursite.com/webhook" />
              </div>
              <div className="field">
                <label>Secret Key</label>
                <input
                  type="text"
                  placeholder="Optional signature verification"
                />
              </div>
              <button className="btn btnPrimary">Add Webhook</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
