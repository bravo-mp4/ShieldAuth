import { useState } from "react";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";

export default function Support() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tickets, setTickets] = useState([
    {
      id: "TKT-1234",
      subject: "License validation not working",
      status: "open",
      priority: "high",
      created: "2025-01-30",
      lastReply: "2025-01-31",
      messages: 3,
    },
    {
      id: "TKT-1233",
      subject: "Question about API rate limits",
      status: "answered",
      priority: "medium",
      created: "2025-01-28",
      lastReply: "2025-01-29",
      messages: 5,
    },
    {
      id: "TKT-1232",
      subject: "SDK installation issue",
      status: "closed",
      priority: "low",
      created: "2025-01-25",
      lastReply: "2025-01-26",
      messages: 2,
    },
  ]);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    priority: "medium",
    message: "",
  });

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.message) {
      alert("Please fill in all fields");
      return;
    }

    const ticket = {
      id: `TKT-${1235 + tickets.length}`,
      subject: newTicket.subject,
      status: "open",
      priority: newTicket.priority,
      created: new Date().toISOString().split("T")[0],
      lastReply: new Date().toISOString().split("T")[0],
      messages: 1,
    };

    setTickets([ticket, ...tickets]);
    setShowCreateModal(false);
    setNewTicket({ subject: "", priority: "medium", message: "" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return { bg: "var(--primary-bg)", color: "var(--primary)" };
      case "answered":
        return { bg: "var(--success-bg)", color: "var(--success)" };
      case "closed":
        return { bg: "var(--bg-elevated)", color: "var(--text-secondary)" };
      default:
        return { bg: "var(--bg-elevated)", color: "var(--text-secondary)" };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return { bg: "var(--error-bg)", color: "var(--error)" };
      case "medium":
        return { bg: "var(--warning-bg)", color: "var(--warning)" };
      case "low":
        return { bg: "var(--bg-elevated)", color: "var(--text-secondary)" };
      default:
        return { bg: "var(--bg-elevated)", color: "var(--text-secondary)" };
    }
  };

  return (
    <div className="page">
      <TopBar
        title="Support"
        subtitle="Get help with ShieldVM"
        actions={
          <button
            className="btn btnPrimary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Ticket
          </button>
        }
      />

      {/* Create Ticket Modal */}
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
              Create Support Ticket
            </h3>

            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTicket();
              }}
            >
              <div className="field">
                <label>Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="field">
                <label>Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, priority: e.target.value })
                  }
                >
                  <option value="low">Low - General question</option>
                  <option value="medium">Medium - Non-critical issue</option>
                  <option value="high">
                    High - Critical issue affecting production
                  </option>
                </select>
              </div>

              <div className="field">
                <label>Message</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, message: e.target.value })
                  }
                  rows={6}
                  placeholder="Describe your issue in detail..."
                  required
                />
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
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 24,
          marginBottom: 32,
        }}
      >
        <a
          href="/docs"
          className="card"
          style={{
            padding: 24,
            textDecoration: "none",
            transition: "transform 0.2s",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>📚</div>
          <div className="cardTitle" style={{ marginBottom: 8 }}>
            Documentation
          </div>
          <div className="muted">
            Browse our comprehensive guides and tutorials
          </div>
        </a>

        <a
          href="/docs/api"
          className="card"
          style={{
            padding: 24,
            textDecoration: "none",
            transition: "transform 0.2s",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🔧</div>
          <div className="cardTitle" style={{ marginBottom: 8 }}>
            API Reference
          </div>
          <div className="muted">Complete API documentation and examples</div>
        </a>

        <a
          href="/status"
          className="card"
          style={{
            padding: 24,
            textDecoration: "none",
            transition: "transform 0.2s",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>📊</div>
          <div className="cardTitle" style={{ marginBottom: 8 }}>
            System Status
          </div>
          <div className="muted">Check the current status of our services</div>
        </a>

        <a
          href="https://discord.gg/shieldvm"
          target="_blank"
          rel="noopener noreferrer"
          className="card"
          style={{
            padding: 24,
            textDecoration: "none",
            transition: "transform 0.2s",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>💬</div>
          <div className="cardTitle" style={{ marginBottom: 8 }}>
            Discord Community
          </div>
          <div className="muted">
            Join our Discord server for community support
          </div>
        </a>
      </div>

      {/* Support Tickets */}
      <div className="card" style={{ padding: 32 }}>
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
          Your Support Tickets
        </h3>

        {tickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎫</div>
            <div className="cardTitle" style={{ marginBottom: 8 }}>
              No Support Tickets
            </div>
            <div className="muted" style={{ marginBottom: 24 }}>
              You haven't created any support tickets yet
            </div>
            <button
              className="btn btnPrimary"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Ticket
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                    Ticket ID
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Subject
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Priority
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: 12,
                      textAlign: "left",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Last Reply
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
                {tickets.map((ticket) => {
                  const statusStyle = getStatusColor(ticket.status);
                  const priorityStyle = getPriorityColor(ticket.priority);

                  return (
                    <tr
                      key={ticket.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td style={{ padding: 12 }}>
                        <code
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          {ticket.id}
                        </code>
                      </td>
                      <td style={{ padding: 12, fontWeight: 600 }}>
                        {ticket.subject}
                        <div
                          className="muted"
                          style={{ fontSize: "0.85rem", marginTop: 4 }}
                        >
                          {ticket.messages} message
                          {ticket.messages !== 1 ? "s" : ""}
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            background: priorityStyle.bg,
                            color: priorityStyle.color,
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: 12,
                          color: "var(--text-secondary)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {new Date(ticket.created).toLocaleDateString()}
                      </td>
                      <td
                        style={{
                          padding: 12,
                          color: "var(--text-secondary)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {new Date(ticket.lastReply).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 12, textAlign: "right" }}>
                        <button className="btn btnPrimary">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="card" style={{ padding: 32, marginTop: 24 }}>
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
          Other Ways to Contact Us
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Email</div>
            <a
              href="mailto:support@shieldvm.com"
              style={{ color: "var(--primary)" }}
            >
              support@shieldvm.com
            </a>
            <div
              className="muted"
              style={{ fontSize: "0.85rem", marginTop: 4 }}
            >
              Response within 24 hours
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Discord</div>
            <a
              href="https://discord.gg/shieldvm"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)" }}
            >
              discord.gg/shieldvm
            </a>
            <div
              className="muted"
              style={{ fontSize: "0.85rem", marginTop: 4 }}
            >
              Community support 24/7
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Twitter</div>
            <a
              href="https://twitter.com/shieldvm"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)" }}
            >
              @shieldvm
            </a>
            <div
              className="muted"
              style={{ fontSize: "0.85rem", marginTop: 4 }}
            >
              Updates and announcements
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
