import { useState, useEffect } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

export default function Analytics() {
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
      console.log(
        "Type check:",
        typeof response.data,
        "Is object:",
        typeof response.data === "object"
      );

      // Check if response is valid JSON object (not HTML)
      if (
        typeof response.data === "string" ||
        !response.data ||
        typeof response.data !== "object"
      ) {
        console.error("Invalid analytics data - received non-JSON response");
        return;
      }

      const data = {
        totalValidations: response.data.totalValidations || 0,
        successRate: response.data.successRate || 0,
        failedAttempts: response.data.failedAttempts || 0,
        uniqueHwids: response.data.uniqueHwids || 0,
        totalLicenses: response.data.totalLicenses || 0,
        activeLicenses: response.data.activeLicenses || 0,
        validationData: Array.isArray(response.data.validationData)
          ? response.data.validationData
          : [],
      };
      console.log("Processed analytics:", data);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      console.error("Error details:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const validationData =
    (analytics.validationData?.length || 0) > 0
      ? analytics.validationData
      : [
          {
            date: new Date().toISOString().split("T")[0],
            successful: 0,
            failed: 0,
          },
        ];

  return (
    <div className="page">
      <TopBar
        title="Analytics"
        subtitle="License validations across your applications, last 7 days"
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
          <div className="metricValue">
            {loading
              ? "..."
              : (analytics.totalValidations || 0).toLocaleString()}
          </div>
          <div className="metricChange metricGreen">
            {analytics.activeLicenses} active licenses
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Success Rate</div>
          <div className="metricValue metricGreen">
            {loading ? "..." : analytics.successRate}%
          </div>
          <div className="metricChange metricGreen">
            {(100 - (analytics.successRate || 0)).toFixed(1)}% failed
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Failed Attempts</div>
          <div className="metricValue metricRed">
            {loading ? "..." : analytics.failedAttempts}
          </div>
          <div className="metricChange">Unknown, banned, expired or over the device limit</div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="cardTitle">Unique HWIDs</div>
          <div className="metricValue">
            {loading ? "..." : analytics.uniqueHwids}
          </div>
          <div className="metricChange metricGreen">
            {analytics.totalLicenses} total licenses
          </div>
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
              // Pixel heights: percentages need a sized parent, which the
              // flex column doesn't have.
              const maxTotal = Math.max(1, ...validationData.map((d) => d.successful + d.failed));
              const scale = 180 / maxTotal;
              return (
                <div key={day.date} style={{ flex: 1, minWidth: 80, textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 190 }}>
                    {day.failed > 0 && (
                      <div
                        title={`${day.failed} failed`}
                        style={{ background: "var(--error)", height: day.failed * scale, borderRadius: "8px 8px 0 0" }}
                      />
                    )}
                    <div
                      title={`${day.successful} successful`}
                      style={{
                        background: "var(--primary)",
                        height: Math.max(day.successful * scale, 2),
                        borderRadius: day.failed > 0 ? 0 : "8px 8px 0 0",
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: 6,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {day.successful + day.failed}
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Active Licenses
                </div>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: "var(--success)",
                  }}
                >
                  {loading ? "..." : analytics.activeLicenses}
                </div>
              </div>
              <div style={{ fontSize: "3rem" }}>✅</div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Total Licenses
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                  {loading ? "..." : analytics.totalLicenses}
                </div>
              </div>
              <div style={{ fontSize: "3rem" }}>📊</div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  Unique Devices
                </div>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
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
            <div
              style={{
                padding: 16,
                background: "var(--bg-elevated)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                API Status
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: "var(--success)",
                    borderRadius: "50%",
                  }}
                ></div>
                <div style={{ fontWeight: 600 }}>Operational</div>
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
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Database
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: "var(--success)",
                    borderRadius: "50%",
                  }}
                ></div>
                <div style={{ fontWeight: 600 }}>Connected</div>
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
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Validations Today
              </div>
              <div style={{ fontWeight: 600, fontSize: "1.2rem" }}>
                {loading
                  ? "..."
                  : validationData[validationData.length - 1]?.successful || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
