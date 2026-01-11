import { useState, useEffect } from "react";
import axios from "axios";
import { Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Activity } from "lucide-react";
// @ts-expect-error - JSX component
import PublicNav from "../components/PublicNav";
// @ts-expect-error - JSX component
import PublicFooter from "../components/PublicFooter";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface Service {
  name: string;
  description: string;
  status: string;
  uptime: string;
  response_time_ms: number;
}

interface Incident {
  incident_id: number;
  service_name: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  updates: Array<{
    message: string;
    status: string;
    posted_at: string;
  }>;
}

export default function Status() {
  const [overallStatus, setOverallStatus] = useState("operational");
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const [statusResponse, incidentsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/v1/public/status`),
        axios.get(`${API_BASE_URL}/api/v1/public/status/incidents?limit=10`),
      ]);

      setOverallStatus(statusResponse.data.overall_status);
      setServices(statusResponse.data.services);
      setIncidents(incidentsResponse.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "var(--success)";
      case "degraded":
        return "var(--warning)";
      case "outage":
        return "var(--error)";
      default:
        return "var(--text-muted)";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "var(--error)";
      case "major":
        return "var(--warning)";
      case "minor":
        return "var(--primary)";
      default:
        return "var(--text-muted)";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} minutes`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours`;
    return `${Math.floor(diffHours / 24)} days`;
  };

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
              background:
                overallStatus === "operational"
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(251, 146, 60, 0.1)",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: "2rem" }}>
              {overallStatus === "operational" ? "✓" : "⚠"}
            </span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: getStatusColor(overallStatus),
              }}
            >
              {overallStatus === "operational"
                ? "All Systems Operational"
                : "Service Disruption"}
            </span>
          </div>
          <p className="muted">Last updated: {lastUpdated.toLocaleString()}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: "2rem", color: "var(--text-muted)" }}>
              Loading status...
            </div>
          </div>
        ) : (
          <>
            {/* Services Status */}
            <div className="card" style={{ padding: 32, marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: 24,
                }}
              >
                Service Status
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
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
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: getStatusColor(service.status),
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>{service.name}</div>
                        <div
                          className="muted"
                          style={{ fontSize: "0.85rem", marginTop: 2 }}
                        >
                          {service.description}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 24 }}
                    >
                      <span className="muted" style={{ fontSize: "0.9rem" }}>
                        {service.uptime} uptime
                      </span>
                      {service.response_time_ms && (
                        <>
                          <span className="muted">•</span>
                          <span
                            className="muted"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {service.response_time_ms}ms
                          </span>
                        </>
                      )}
                      <span
                        style={{
                          color: getStatusColor(service.status),
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          textTransform: "capitalize",
                        }}
                      >
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="card" style={{ padding: 32 }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: 24,
                }}
              >
                Incident History
              </h2>

              {incidents.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                    <Sparkles size={40} className="text-primary-500" />
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    No Recent Incidents
                  </div>
                  <div className="muted">
                    All systems have been running smoothly
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  {incidents.map((incident) => (
                    <div
                      key={incident.incident_id}
                      style={{
                        padding: 24,
                        background: "var(--bg-elevated)",
                        borderRadius: 12,
                        borderLeft: `4px solid ${getSeverityColor(
                          incident.severity
                        )}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                padding: "4px 12px",
                                background: getSeverityColor(incident.severity),
                                color: "white",
                                borderRadius: 4,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                              }}
                            >
                              {incident.severity}
                            </div>
                            <div
                              style={{
                                padding: "4px 12px",
                                background: incident.resolved_at
                                  ? "var(--success-bg)"
                                  : "var(--warning-bg)",
                                color: incident.resolved_at
                                  ? "var(--success)"
                                  : "var(--warning)",
                                borderRadius: 4,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                textTransform: "capitalize",
                              }}
                            >
                              {incident.status}
                            </div>
                          </div>
                          <h3
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: 700,
                              marginBottom: 4,
                            }}
                          >
                            {incident.title}
                          </h3>
                          <div
                            className="muted"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {incident.service_name} •{" "}
                            {formatDate(incident.started_at)}
                            {incident.resolved_at && (
                              <span>
                                {" "}
                                • Duration:{" "}
                                {formatDuration(
                                  incident.started_at,
                                  incident.resolved_at
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {incident.description && (
                        <p
                          className="muted"
                          style={{ fontSize: "0.95rem", marginBottom: 16 }}
                        >
                          {incident.description}
                        </p>
                      )}

                      {incident.updates && incident.updates.length > 0 && (
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              marginBottom: 12,
                              color: "var(--text-muted)",
                            }}
                          >
                            Updates:
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            {incident.updates.map((update, idx) => (
                              <div
                                key={idx}
                                style={{
                                  fontSize: "0.9rem",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {update.status}
                                  </span>
                                  <span className="muted">
                                    {formatDate(update.posted_at)}
                                  </span>
                                </div>
                                <div>{update.message}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
