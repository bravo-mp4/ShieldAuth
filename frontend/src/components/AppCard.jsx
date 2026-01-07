import { Link } from "react-router-dom";

export default function AppCard({ app }) {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: 16,
        }}
      >
        <div>
          <div className="cardTitle">{app.name}</div>
          <div
            className="muted"
            style={{
              fontSize: "0.8rem",
              fontFamily: "monospace",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
            onClick={() => copyToClipboard(app.app_id || app.id)}
          >
            {app.app_id || app.id}
            <span style={{ fontSize: "0.7rem" }}>📋</span>
          </div>
        </div>

        <div
          style={{
            padding: "4px 12px",
            background:
              app.status === "active"
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            color: app.status === "active" ? "var(--success)" : "var(--error)",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          {(app.status || "active").toUpperCase()}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
          padding: "16px 0",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Users
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            {app.users || app.license_count || 0}
          </div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Validations
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            {app.validation_count || 0}
          </div>
        </div>
      </div>

      <Link
        to={`/apps/${app.app_id || app.id}`}
        className="btn btnPrimary"
        style={{ width: "100%", textDecoration: "none", textAlign: "center" }}
      >
        Manage Application
      </Link>
    </div>
  );
}
