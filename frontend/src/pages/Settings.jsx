import { useState } from "react";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    company: "ShieldLabs",
    timezone: "UTC-5",
    twoFactorEnabled: false,
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="page">
      <TopBar title="Settings" subtitle="Manage your account and preferences" />

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          overflowX: "auto",
        }}
      >
        {["account", "billing", "team", "security", "notifications"].map(
          (tab) => (
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
                  activeTab === tab
                    ? "var(--primary)"
                    : "var(--text-secondary)",
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer",
                textTransform: "capitalize",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            Account Information
          </h3>
          <form className="form">
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
              >
                <option value="UTC-8">Pacific Time (UTC-8)</option>
                <option value="UTC-5">Eastern Time (UTC-5)</option>
                <option value="UTC+0">GMT (UTC+0)</option>
                <option value="UTC+1">Central European Time (UTC+1)</option>
                <option value="UTC+8">Singapore Time (UTC+8)</option>
              </select>
            </div>
            <button type="submit" className="btn btnPrimary">
              Save Changes
            </button>
          </form>

          <hr
            style={{
              margin: "32px 0",
              border: "none",
              borderTop: "1px solid var(--border)",
            }}
          />

          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            Change Password
          </h3>
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
            <button type="submit" className="btn btnPrimary">
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div>
          {/* Current Plan */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              Current Plan
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Pro Plan
                </div>
                <div className="muted">
                  $40/month • Billed monthly • Renews on Feb 15, 2025
                </div>
              </div>
              <button className="btn btnPrimary">Upgrade Plan</button>
            </div>

            {/* Usage Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                }}
              >
                <div
                  className="muted"
                  style={{ fontSize: "0.85rem", marginBottom: 4 }}
                >
                  Applications
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                  3 / 10
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                }}
              >
                <div
                  className="muted"
                  style={{ fontSize: "0.85rem", marginBottom: 4 }}
                >
                  Licenses
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                  1,247 / 5,000
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                }}
              >
                <div
                  className="muted"
                  style={{ fontSize: "0.85rem", marginBottom: 4 }}
                >
                  API Calls (This Month)
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                  45,231 / 100,000
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              Payment Method
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 20,
                background: "var(--bg-elevated)",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: "2rem" }}>💳</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Visa ending in 4242
                  </div>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    Expires 12/2025
                  </div>
                </div>
              </div>
              <button className="btn btnSecondary">Update</button>
            </div>
          </div>

          {/* Billing History */}
          <div className="card" style={{ padding: 32 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              Billing History
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "right",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    date: "2025-01-15",
                    desc: "Pro Plan - Monthly",
                    amount: "$40.00",
                  },
                  {
                    date: "2024-12-15",
                    desc: "Pro Plan - Monthly",
                    amount: "$40.00",
                  },
                  {
                    date: "2024-11-15",
                    desc: "Pro Plan - Monthly",
                    amount: "$40.00",
                  },
                ].map((item, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: 12 }}>{item.date}</td>
                    <td style={{ padding: 12 }}>{item.desc}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>
                      {item.amount}
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <button className="btn btnGhost">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="card" style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              Team Members
            </h3>
            <button className="btn btnPrimary">+ Invite Member</button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "right",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "John Doe", email: "john@example.com", role: "Owner" },
                {
                  name: "Jane Smith",
                  email: "jane@example.com",
                  role: "Admin",
                },
                {
                  name: "Bob Johnson",
                  email: "bob@example.com",
                  role: "Developer",
                },
              ].map((member, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {member.name}
                  </td>
                  <td style={{ padding: 12 }}>{member.email}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        background:
                          member.role === "Owner"
                            ? "var(--primary-bg)"
                            : "var(--bg-elevated)",
                        color:
                          member.role === "Owner"
                            ? "var(--primary)"
                            : "var(--text-secondary)",
                        borderRadius: 6,
                        fontSize: "0.85rem",
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    {member.role !== "Owner" && (
                      <button
                        className="btn btnSecondary"
                        style={{ color: "var(--error)" }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div>
          {/* Two-Factor Authentication */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              Two-Factor Authentication
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {formData.twoFactorEnabled ? "Enabled" : "Disabled"}
                </div>
                <div className="muted">
                  Add an extra layer of security to your account
                </div>
              </div>
              <button
                className={
                  formData.twoFactorEnabled
                    ? "btn btnSecondary"
                    : "btn btnPrimary"
                }
                onClick={() =>
                  handleChange("twoFactorEnabled", !formData.twoFactorEnabled)
                }
              >
                {formData.twoFactorEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              Active Sessions
            </h3>
            {[
              {
                device: "Windows PC - Chrome",
                location: "New York, US",
                current: true,
                time: "Active now",
              },
              {
                device: "iPhone 14 - Safari",
                location: "New York, US",
                current: false,
                time: "2 hours ago",
              },
            ].map((session, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  background: session.current
                    ? "var(--primary-bg)"
                    : "var(--bg-elevated)",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {session.device}
                    {session.current && (
                      <span
                        style={{
                          marginLeft: 12,
                          padding: "2px 8px",
                          background: "var(--success-bg)",
                          color: "var(--success)",
                          borderRadius: 4,
                          fontSize: "0.75rem",
                        }}
                      >
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {session.location} • {session.time}
                  </div>
                </div>
                {!session.current && (
                  <button className="btn btnSecondary">Revoke</button>
                )}
              </div>
            ))}
          </div>

          {/* API Rate Limits */}
          <div className="card" style={{ padding: 32 }}>
            <h3
              style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}
            >
              Security Settings
            </h3>
            <form className="form">
              <div className="field">
                <label>IP Whitelist</label>
                <textarea
                  rows={4}
                  placeholder="Enter IP addresses (one per line)&#10;192.168.1.1&#10;10.0.0.0/24"
                />
                <div
                  className="muted"
                  style={{ fontSize: "0.85rem", marginTop: 4 }}
                >
                  Only allow API access from these IP addresses
                </div>
              </div>
              <button type="submit" className="btn btnPrimary">
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            Email Notifications
          </h3>
          <form className="form">
            {[
              {
                id: "license_created",
                label: "License Created",
                desc: "When a new license is created",
              },
              {
                id: "license_expired",
                label: "License Expired",
                desc: "When a license expires",
              },
              {
                id: "failed_validation",
                label: "Failed Validation Attempts",
                desc: "When there are multiple failed validation attempts",
              },
              {
                id: "api_limit",
                label: "API Rate Limit",
                desc: "When you're approaching your API rate limit",
              },
              {
                id: "billing",
                label: "Billing Updates",
                desc: "Payment receipts and billing notifications",
              },
              {
                id: "security",
                label: "Security Alerts",
                desc: "Suspicious activity and security warnings",
              },
            ].map((notif) => (
              <div
                key={notif.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {notif.label}
                  </div>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {notif.desc}
                  </div>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{ cursor: "pointer" }}
                  />
                </label>
              </div>
            ))}
            <button
              type="submit"
              className="btn btnPrimary"
              style={{ marginTop: 16 }}
            >
              Save Preferences
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
