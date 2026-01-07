import { useState } from "react";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedApp, setSelectedApp] = useState("all");

  const validationData = [
    { date: "2025-01-25", successful: 1234, failed: 45 },
    { date: "2025-01-26", successful: 1456, failed: 32 },
    { date: "2025-01-27", successful: 1689, failed: 28 },
    { date: "2025-01-28", successful: 1523, failed: 51 },
    { date: "2025-01-29", successful: 1789, failed: 37 },
    { date: "2025-01-30", successful: 1912, failed: 29 },
    { date: "2025-01-31", successful: 2045, failed: 42 },
  ];

  const topCountries = [
    { country: "United States", count: 4521, flag: "🇺🇸" },
    { country: "Germany", count: 3124, flag: "🇩🇪" },
    { country: "United Kingdom", count: 2890, flag: "🇬🇧" },
    { country: "France", count: 2345, flag: "🇫🇷" },
    { country: "Canada", count: 1987, flag: "🇨🇦" },
  ];

  const topApplications = [
    {
      name: "GameCheat Pro",
      validations: 5432,
      color: "var(--primary)",
      bg: "var(--primary-bg)",
    },
    {
      name: "ProTools",
      validations: 3210,
      color: "var(--info)",
      bg: "var(--info-bg)",
    },
    {
      name: "CodeProtect",
      validations: 2891,
      color: "var(--warning)",
      bg: "var(--warning-bg)",
    },
    {
      name: "SafeGuard",
      validations: 1015,
      color: "var(--success)",
      bg: "var(--success-bg)",
    },
  ];

  const recentFailed = [
    {
      time: "2025-01-31 14:32:15",
      reason: "Invalid key",
      ip: "192.168.1.1",
      app: "GameCheat Pro",
    },
    {
      time: "2025-01-31 14:28:42",
      reason: "Expired",
      ip: "10.0.0.15",
      app: "ProTools",
    },
    {
      time: "2025-01-31 14:25:01",
      reason: "HWID mismatch",
      ip: "172.16.0.5",
      app: "GameCheat Pro",
    },
    {
      time: "2025-01-31 14:19:33",
      reason: "Invalid key",
      ip: "192.168.100.50",
      app: "CodeProtect",
    },
  ];

  return (
    <div className="page">
      <TopBar
        title="Analytics"
        subtitle="Comprehensive license validation analytics"
        actions={
          <>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ marginRight: 12 }}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button className="btn btnPrimary">📊 Export Report</button>
          </>
        }
      />

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
          marginBottom: 32,
        }}
      >
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Total Validations</div>
          <div className="metricValue">12,548</div>
          <div className="metricChange metricGreen">
            +12.5% from last period
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Success Rate</div>
          <div className="metricValue metricGreen">97.2%</div>
          <div className="metricChange metricGreen">+1.2% from last period</div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Failed Attempts</div>
          <div className="metricValue metricRed">264</div>
          <div className="metricChange metricRed">+8.3% from last period</div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Unique HWIDs</div>
          <div className="metricValue">3,421</div>
          <div className="metricChange metricGreen">+5.7% from last period</div>
        </div>
      </div>

      {/* Validation Over Time */}
      <div className="card" style={{ padding: 32, marginBottom: 32 }}>
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
          Validations Over Time
        </h3>
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              height: 240,
              padding: "0 0 24px 0",
            }}
          >
            {validationData.map((day) => {
              const maxVal = Math.max(
                ...validationData.map((d) => d.successful)
              );
              const height = (day.successful / maxVal) * 100;
              return (
                <div
                  key={day.date}
                  style={{ flex: 1, minWidth: 80, textAlign: "center" }}
                >
                  <div
                    style={{
                      background: "var(--primary)",
                      height: `${height}%`,
                      borderRadius: "8px 8px 0 0",
                      position: "relative",
                      minHeight: 20,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      paddingTop: 8,
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {day.successful}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 16,
            fontSize: "0.9rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: "var(--primary)",
                borderRadius: 2,
              }}
            ></div>
            <span>Successful</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: "var(--error)",
                borderRadius: 2,
              }}
            ></div>
            <span>Failed</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* Top Countries */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            Top Countries
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {topCountries.map((item, idx) => (
              <div
                key={idx}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div style={{ fontSize: "1.5rem" }}>{item.flag}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {item.country}
                  </div>
                  <div
                    style={{
                      background: "var(--bg-elevated)",
                      height: 8,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--primary)",
                        height: "100%",
                        width: `${(item.count / topCountries[0].count) * 100}%`,
                        borderRadius: 4,
                      }}
                    ></div>
                  </div>
                </div>
                <div
                  style={{ fontWeight: 600, minWidth: 60, textAlign: "right" }}
                >
                  {item.count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Applications */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            Top Applications
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topApplications.map((item, idx) => (
              <div
                key={idx}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                      background: item.bg,
                      border: `1px solid var(--border)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                  }}
                >
                  📦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {item.name}
                  </div>
                  <div
                    style={{
                      background: "var(--bg-elevated)",
                      height: 8,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: item.color,
                        height: "100%",
                        width: `${(item.validations / 5432) * 100}%`,
                        borderRadius: 4,
                      }}
                    ></div>
                  </div>
                </div>
                <div
                  style={{ fontWeight: 600, minWidth: 60, textAlign: "right" }}
                >
                  {item.validations.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Failed Validations */}
      <div className="card" style={{ padding: 32 }}>
        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
          Recent Failed Validations
        </h3>
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
                  Timestamp
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Application
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Reason
                </th>
                <th
                  style={{
                    padding: 12,
                    textAlign: "left",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {recentFailed.map((item, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td
                    style={{
                      padding: 12,
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  >
                    {item.time}
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{item.app}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        background: "var(--error-bg)",
                        color: "var(--error)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.reason}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: 12,
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  >
                    {item.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
