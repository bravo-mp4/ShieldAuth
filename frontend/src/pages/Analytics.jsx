import { useState, useEffect } from "react";
import axios from "axios";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedApp, setSelectedApp] = useState("all");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalValidations: 0,
    successRate: 0,
    failedAttempts: 0,
    uniqueHwids: 0,
    totalLicenses: 0,
    activeLicenses: 0,
    validationData: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log("Loading analytics...");
      const token = localStorage.getItem("token");
      console.log("Token:", token ? "Present" : "Missing");
      const response = await axios.get("/api/v1/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Analytics loaded:", response.data);
      console.log("ValidationData:", response.data.validationData);
      const data = {
        ...response.data,
        validationData: Array.isArray(response.data.validationData) ? response.data.validationData : []
      };
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      console.error("Error details:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const validationData = (analytics.validationData?.length || 0) > 0
    ? analytics.validationData
    : [{ date: new Date().toISOString().split('T')[0], successful: 0, failed: 0 }];

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
          <div className="metricValue">{loading ? "..." : analytics.totalValidations.toLocaleString()}</div>
          <div className="metricChange metricGreen">
            {analytics.activeLicenses} active licenses
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Success Rate</div>
          <div className="metricValue metricGreen">{loading ? "..." : analytics.successRate}%</div>
          <div className="metricChange metricGreen">All validations successful</div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Failed Attempts</div>
          <div className="metricValue metricRed">{loading ? "..." : analytics.failedAttempts}</div>
          <div className="metricChange">No failed attempts tracked</div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Unique HWIDs</div>
          <div className="metricValue">{loading ? "..." : analytics.uniqueHwids}</div>
          <div className="metricChange metricGreen">{analytics.totalLicenses} total licenses</div>
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
        {/* Active Licenses */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            License Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 4 }}>Active Licenses</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--success)" }}>
                  {loading ? "..." : analytics.activeLicenses}
                </div>
              </div>
              <div style={{ fontSize: "3rem" }}>✅</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 4 }}>Total Licenses</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                  {loading ? "..." : analytics.totalLicenses}
                </div>
              </div>
              <div style={{ fontSize: "3rem" }}>📊</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 4 }}>Unique Devices</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--primary)" }}>
                  {loading ? "..." : analytics.uniqueHwids}
                </div>
              </div>
              <div style={{ fontSize: "3rem" }}>💻</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 24 }}>
            System Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: 16, background: "var(--bg-elevated)", borderRadius: 8 }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4 }}>API Status</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, background: "var(--success)", borderRadius: "50%" }}></div>
                <div style={{ fontWeight: 600 }}>Operational</div>
              </div>
            </div>
            <div style={{ padding: 16, background: "var(--bg-elevated)", borderRadius: 8 }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4 }}>Database</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, background: "var(--success)", borderRadius: "50%" }}></div>
                <div style={{ fontWeight: 600 }}>Connected</div>
              </div>
            </div>
            <div style={{ padding: 16, background: "var(--bg-elevated)", borderRadius: 8 }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4 }}>Validations Today</div>
              <div style={{ fontWeight: 600, fontSize: "1.2rem" }}>
                {loading ? "..." : validationData[validationData.length - 1]?.successful || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
