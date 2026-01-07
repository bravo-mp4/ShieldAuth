import { useState, useEffect } from "react";
// @ts-expect-error - JS module
import { logs as logsApi } from "../services/api";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";
// @ts-expect-error - JSX component
import StatCard from "../components/StatCard";
// @ts-expect-error - JSX component
import Loader from "../components/Loader";
// @ts-expect-error - JSX component
import EmptyState from "../components/EmptyState";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "auth" | "error" | "warning" | "info";
  message: string;
  username?: string;
  ip?: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Load logs from backend
  const loadLogs = async () => {
    try {
      setLoading(true);
      const filters = filterType !== "all" ? { type: filterType } : {};
      const response = await logsApi.list(filters);
      setLogs(response.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  // Reload when filter changes
  useEffect(() => {
    loadLogs();
  }, [filterType]);

  const filteredLogs =
    filterType === "all" ? logs : logs.filter((log) => log.type === filterType);

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "auth":
        return "var(--success)";
      case "error":
        return "var(--error)";
      case "warning":
        return "var(--warning)";
      default:
        return "var(--text-secondary)";
    }
  };

  const getLogTypeBg = (type: string) => {
    switch (type) {
      case "auth":
        return "rgba(16, 185, 129, 0.1)";
      case "error":
        return "rgba(239, 68, 68, 0.1)";
      case "warning":
        return "rgba(245, 158, 11, 0.1)";
      default:
        return "rgba(161, 161, 170, 0.1)";
    }
  };

  // Calculate stats
  const authCount = logs.filter((l) => l.type === "auth").length;
  const errorCount = logs.filter((l) => l.type === "error").length;
  const warningCount = logs.filter((l) => l.type === "warning").length;

  return (
    <div className="page">
      <TopBar
        title="Activity Logs"
        subtitle="Monitor all system events"
        actions={
          <button className="btn btnGhost" onClick={() => logsApi.export()}>
            Export Logs
          </button>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="alertError" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid4" style={{ marginBottom: 24 }}>
        <StatCard title="Total Events" value={logs.length} />
        <StatCard
          title="Auth Success"
          value={authCount}
          subtitle="Authentication events"
        />
        <StatCard
          title="Errors"
          value={errorCount}
          subtitle="Failed attempts"
        />
        <StatCard
          title="Warnings"
          value={warningCount}
          subtitle="Warning events"
        />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn ${
              filterType === "all" ? "btnPrimary" : "btnGhost"
            }`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            className={`btn ${
              filterType === "auth" ? "btnPrimary" : "btnGhost"
            }`}
            onClick={() => setFilterType("auth")}
          >
            Authentication
          </button>
          <button
            className={`btn ${
              filterType === "error" ? "btnPrimary" : "btnGhost"
            }`}
            onClick={() => setFilterType("error")}
          >
            Errors
          </button>
          <button
            className={`btn ${
              filterType === "warning" ? "btnPrimary" : "btnGhost"
            }`}
            onClick={() => setFilterType("warning")}
          >
            Warnings
          </button>
          <button
            className={`btn ${
              filterType === "info" ? "btnPrimary" : "btnGhost"
            }`}
            onClick={() => setFilterType("info")}
          >
            Info
          </button>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <Loader />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No logs found"
          description={
            filterType !== "all"
              ? "Try changing the filter"
              : "No activity recorded yet"
          }
        />
      ) : (
        <div className="card">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: "16px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "start",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: getLogTypeBg(log.type),
                    color: getLogTypeColor(log.type),
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    minWidth: 80,
                    textAlign: "center",
                  }}
                >
                  {log.type}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: "var(--text)",
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    {log.message}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    {log.username && <span>User: {log.username}</span>}
                    {log.ip && <span>IP: {log.ip}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
