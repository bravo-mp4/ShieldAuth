import { useState, useEffect } from "react";
import { logs as logsApi } from "../services/api";
import TopBar from "../components/TopBar";
import StatCard from "../components/StatCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "auth" | "error" | "warning" | "info";
  message: string;
  username?: string;
  ip?: string;
}

// The API returns raw validation attempts; map each to a row for this page.
const RESULT_LABELS: Record<string, string> = {
  success: "License validated",
  invalid: "Unknown license key",
  banned: "Banned license or device",
  expired: "Expired license",
  hwid_limit: "Device limit reached",
};

function toLogEntry(row: any): LogEntry {
  return {
    id: String(row.id),
    timestamp: row.created_at,
    type: row.result === "success" ? "auth" : row.result === "hwid_limit" ? "warning" : "error",
    message: RESULT_LABELS[row.result] || row.error_message || row.result,
    username: row.license_key,
    ip: row.ip_address,
  };
}

function downloadCsv(entries: LogEntry[]) {
  const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = [["Time", "Type", "Event", "License", "IP"], ...entries.map((e) => [e.timestamp, e.type, e.message, e.username, e.ip])];
  const blob = new Blob([rows.map((r) => r.map(quote).join(",")).join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "validation-logs.csv";
  link.click();
  URL.revokeObjectURL(link.href);
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
      const response = await logsApi.list({ limit: 200 });
      setLogs((response.data.logs || []).map(toLogEntry));
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
  }, []);

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
          <button className="btn btnGhost" onClick={() => downloadCsv(filteredLogs)}>
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
