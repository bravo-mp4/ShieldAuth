import { useState } from "react";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";
// @ts-expect-error - JSX component
import EmptyState from "../components/EmptyState";

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([
    {
      id: "wh_1",
      url: "https://api.example.com/shield-webhook",
      events: ["license.validated", "license.created", "license.expired"],
      status: "active",
      created: "2025-01-15",
      lastTriggered: "2025-01-31 14:32:15",
    },
    {
      id: "wh_2",
      url: "https://discord.com/api/webhooks/123456789/abcdef",
      events: ["license.expired", "hwid.changed"],
      status: "active",
      created: "2025-01-20",
      lastTriggered: "2025-01-30 09:15:42",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState({
    "license.validated": false,
    "license.created": false,
    "license.expired": false,
    "license.deleted": false,
    "hwid.changed": false,
    "application.updated": false,
  });

  const allEvents = [
    {
      id: "license.validated",
      name: "License Validated",
      desc: "Triggered when a license is successfully validated",
    },
    {
      id: "license.created",
      name: "License Created",
      desc: "Triggered when a new license is created",
    },
    {
      id: "license.expired",
      name: "License Expired",
      desc: "Triggered when a license expires",
    },
    {
      id: "license.deleted",
      name: "License Deleted",
      desc: "Triggered when a license is deleted",
    },
    {
      id: "hwid.changed",
      name: "HWID Changed",
      desc: "Triggered when a license's HWID is changed",
    },
    {
      id: "application.updated",
      name: "Application Updated",
      desc: "Triggered when application settings are updated",
    },
  ];

  const handleCreateWebhook = () => {
    const events = Object.keys(selectedEvents).filter((e) => selectedEvents[e]);

    if (!newWebhookUrl || events.length === 0) {
      alert("Please provide a URL and select at least one event");
      return;
    }

    const newWebhook = {
      id: `wh_${webhooks.length + 1}`,
      url: newWebhookUrl,
      events,
      status: "active",
      created: new Date().toISOString().split("T")[0],
      lastTriggered: "Never",
    };

    setWebhooks([...webhooks, newWebhook]);
    setShowCreateModal(false);
    setNewWebhookUrl("");
    setSelectedEvents({
      "license.validated": false,
      "license.created": false,
      "license.expired": false,
      "license.deleted": false,
      "hwid.changed": false,
      "application.updated": false,
    });
  };

  const handleDeleteWebhook = (webhookId) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      setWebhooks(webhooks.filter((w) => w.id !== webhookId));
    }
  };

  const handleTestWebhook = (webhookId) => {
    // In real app, send test payload to webhook URL
    alert("Test webhook event sent! Check your endpoint logs.");
  };

  return (
    <div className="page">
      <TopBar
        title="Webhooks"
        subtitle="Configure real-time event notifications"
        actions={
          <button
            className="btn btnPrimary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Webhook
          </button>
        }
      />

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              padding: 32,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
            >
              ×
            </button>

            <h3
              style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}
            >
              Create Webhook
            </h3>

            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateWebhook();
              }}
            >
              <div className="field">
                <label>Webhook URL</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://your-site.com/webhook"
                  required
                />
                <div
                  className="muted"
                  style={{ fontSize: "0.85rem", marginTop: 4 }}
                >
                  The URL where webhook events will be sent
                </div>
              </div>

              <div className="field">
                <label>Events to Subscribe</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    marginTop: 12,
                  }}
                >
                  {allEvents.map((event) => (
                    <label
                      key={event.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        cursor: "pointer",
                        padding: 12,
                        background: selectedEvents[event.id]
                          ? "var(--bg-elevated)"
                          : "transparent",
                        borderRadius: 8,
                        border: selectedEvents[event.id]
                          ? "1px solid var(--border)"
                          : "1px solid transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents[event.id]}
                        onChange={(e) =>
                          setSelectedEvents({
                            ...selectedEvents,
                            [event.id]: e.target.checked,
                          })
                        }
                        style={{ cursor: "pointer", marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {event.name}
                        </div>
                        <div className="muted" style={{ fontSize: "0.85rem" }}>
                          {event.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Webhook Payload Example:
                </div>
                <pre
                  style={{
                    background: "var(--bg)",
                    padding: 12,
                    borderRadius: 8,
                    overflow: "auto",
                    fontSize: "0.8rem",
                  }}
                >
                  {`{
  "event": "license.validated",
  "timestamp": "2025-01-31T14:32:15Z",
  "data": {
    "license_key": "XXXX-XXXX-XXXX-XXXX",
    "hwid": "ABC123...",
    "application_id": "app_123"
  }
}`}
                </pre>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btnPrimary"
                  style={{ flex: 1 }}
                >
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="card" style={{ padding: 32 }}>
        {webhooks.length === 0 ? (
          <EmptyState
            icon="🪝"
            title="No Webhooks"
            description="Create your first webhook to receive real-time event notifications"
            action={
              <button
                className="btn btnPrimary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Webhook
              </button>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                style={{
                  padding: 24,
                  background: "var(--bg-elevated)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <code
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.95rem",
                          fontWeight: 600,
                        }}
                      >
                        {webhook.url}
                      </code>
                      <span
                        style={{
                          padding: "2px 8px",
                          background:
                            webhook.status === "active"
                              ? "var(--success-bg)"
                              : "var(--error-bg)",
                          color:
                            webhook.status === "active"
                              ? "var(--success)"
                              : "var(--error)",
                          borderRadius: 4,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {webhook.status}
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: "0.85rem" }}>
                      Created {new Date(webhook.created).toLocaleDateString()} •
                      Last triggered:{" "}
                      {webhook.lastTriggered === "Never"
                        ? webhook.lastTriggered
                        : new Date(webhook.lastTriggered).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btnGhost"
                      onClick={() => handleTestWebhook(webhook.id)}
                    >
                      Test
                    </button>
                    <button
                      className="btn btnSecondary"
                      style={{ color: "var(--error)" }}
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div>
                  <div
                    className="muted"
                    style={{ fontSize: "0.85rem", marginBottom: 8 }}
                  >
                    Subscribed Events:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        style={{
                          padding: "4px 12px",
                          background: "var(--primary-bg)",
                          color: "var(--primary)",
                          borderRadius: 6,
                          fontSize: "0.85rem",
                          fontWeight: 500,
                        }}
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook Documentation */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: "2rem" }}>📚</div>
          <div style={{ flex: 1 }}>
            <div className="cardTitle" style={{ marginBottom: 4 }}>
              Webhook Documentation
            </div>
            <div className="muted">
              Learn how to handle webhook events and secure your endpoint
            </div>
          </div>
          <a href="/docs/webhooks" className="btn btnPrimary">
            View Docs
          </a>
        </div>
      </div>
    </div>
  );
}
