// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

export default function Status() {
  const services = [
    { name: "API Service", status: "operational", uptime: "99.98%" },
    { name: "Dashboard", status: "operational", uptime: "99.99%" },
    { name: "License Validation", status: "operational", uptime: "99.97%" },
    { name: "SDK Downloads", status: "operational", uptime: "100%" },
    { name: "Webhooks", status: "operational", uptime: "99.95%" },
  ];

  const incidents = [
    {
      date: "Jan 2, 2026",
      title: "API Slowdown",
      duration: "15 minutes",
      status: "Resolved",
    },
    {
      date: "Dec 28, 2025",
      title: "Scheduled Maintenance",
      duration: "2 hours",
      status: "Completed",
    },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
        {/* Overall Status */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 32px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: "2rem" }}>✓</span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--success)",
              }}
            >
              All Systems Operational
            </span>
          </div>
          <p className="muted">Last updated: {new Date().toLocaleString()}</p>
        </div>

        {/* Services Status */}
        <div className="card" style={{ padding: 32, marginBottom: 40 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
            Service Status
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {services.map((service, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                  background: "var(--bg-elevated)",
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "var(--success)",
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>{service.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <span className="muted" style={{ fontSize: "0.9rem" }}>
                    {service.uptime} uptime
                  </span>
                  <span
                    style={{
                      color: "var(--success)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    Operational
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card" style={{ padding: 32, marginBottom: 40 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
            Performance Metrics (Last 24h)
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 24,
            }}
          >
            <div>
              <div
                className="muted"
                style={{ fontSize: "0.9rem", marginBottom: 8 }}
              >
                API Response Time
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>87ms</div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                Average
              </div>
            </div>
            <div>
              <div
                className="muted"
                style={{ fontSize: "0.9rem", marginBottom: 8 }}
              >
                Uptime
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--success)",
                }}
              >
                99.98%
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                Last 30 days
              </div>
            </div>
            <div>
              <div
                className="muted"
                style={{ fontSize: "0.9rem", marginBottom: 8 }}
              >
                Success Rate
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--success)",
                }}
              >
                99.95%
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                Validations
              </div>
            </div>
          </div>
        </div>

        {/* Incident History */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
            Incident History
          </h2>
          {incidents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {incidents.map((incident, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    background: "var(--bg-elevated)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{incident.title}</span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        padding: "2px 8px",
                        background: "var(--success)",
                        color: "white",
                        borderRadius: 4,
                      }}
                    >
                      {incident.status}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: "0.9rem" }}>
                    {incident.date} • Duration: {incident.duration}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No incidents in the last 30 days</p>
          )}
        </div>

        {/* Subscribe */}
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <button className="btn btnPrimary">Subscribe to Updates</button>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
