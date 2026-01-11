import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, BarChart3 } from "lucide-react";
import axios from "axios";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";
// @ts-expect-error - JSX component
import StatCard from "../components/StatCard";
// @ts-expect-error - JSX component
import OnboardingWizard from "../components/OnboardingWizard";

interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  totalHwidBindings: number;
  expiringThisWeek: number;
  totalApplications: number;
  recentActivity: Array<{
    license_key: string;
    created_at: string;
    app_id: string;
    expires_at: string;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadStats();

    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load stats");
      setStats({
        totalLicenses: 0,
        activeLicenses: 0,
        totalHwidBindings: 0,
        expiringThisWeek: 0,
        totalApplications: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <TopBar title="Dashboard" subtitle="Overview of your licensing system" />

      {error && (
        <div className="alertError">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 24,
          background:
            "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)",
        }}
      >
        <div style={{ marginBottom: 16, fontWeight: 600, fontSize: "1.1rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={20} />
            Quick Actions
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <button
            className="btn btnPrimary"
            style={{ padding: "12px 20px", justifyContent: "flex-start" }}
            onClick={() => navigate("/users")}
          >
            👤 Create User
          </button>
          <button
            className="btn btnPrimary"
            style={{ padding: "12px 20px", justifyContent: "flex-start" }}
            onClick={() => navigate("/licenses")}
          >
            🔑 Create License
          </button>
          <button
            className="btn btnGhost"
            style={{ padding: "12px 20px", justifyContent: "flex-start" }}
            onClick={() => navigate("/applications")}
          >
            📱 Manage Apps
          </button>
          <button
            className="btn btnGhost"
            style={{ padding: "12px 20px", justifyContent: "flex-start" }}
            onClick={() => navigate("/analytics")}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={16} />
              View Analytics
            </span>
          </button>
          <button
            className="btn btnGhost"
            style={{ padding: "12px 20px", justifyContent: "flex-start" }}
            onClick={() => navigate("/docs")}
          >
            📚 SDK Docs
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          Loading statistics...
        </div>
      ) : (
        <>
          <div className="grid4" style={{ marginBottom: 24 }}>
            <StatCard
              title="Total Licenses"
              value={stats?.totalLicenses || 0}
              subtitle="All created licenses"
            />
            <StatCard
              title="Active Licenses"
              value={stats?.activeLicenses || 0}
              subtitle="Currently valid"
            />
            <StatCard
              title="HWID Bindings"
              value={stats?.totalHwidBindings || 0}
              subtitle="Devices protected"
            />
            <div className="card">
              <div className="cardTitle">Expiring Soon</div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: stats?.expiringThisWeek ? (stats.expiringThisWeek > 0 ? "var(--warning)" : "var(--success)") : "var(--text)",
                  marginTop: 8,
                }}
              >
                {stats?.expiringThisWeek || 0}
              </div>
              <div className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
                Next 7 days
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                  Recent Licenses
                </h3>
                <button
                  className="btn btnGhost"
                  style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                  onClick={() => navigate("/licenses")}
                >
                  View All
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: 12,
                        background: "var(--bg-elevated)",
                        borderRadius: 8,
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "var(--primary-bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                        }}
                      >
                        ✓
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: "0.9rem", fontFamily: "monospace" }}>
                          {activity.license_key.substring(0, 16)}...
                        </div>
                        <div className="muted" style={{ fontSize: "0.8rem" }}>
                          App: {activity.app_id.substring(0, 8)}... • Expires: {new Date(activity.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    No licenses created yet
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 20 }}>
                Quick Stats
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                    Applications
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                    {stats?.totalApplications || 0}
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                    Active Rate
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
                    {stats?.totalLicenses ? Math.round((stats.activeLicenses / stats.totalLicenses) * 100) : 0}%
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 4 }}>
                    Avg HWID/License
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                    {stats?.totalLicenses ? (stats.totalHwidBindings / stats.totalLicenses).toFixed(1) : "0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 16 }}>
            Recent Activity
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[
              {
                type: "success",
                icon: "✓",
                title: "License validated",
                desc: "user_2941 • DesktopTool",
                time: "5 min ago",
              },
              {
                type: "warning",
                icon: "⚠",
                title: "Failed validation attempt",
                desc: "Invalid HWID • GameApp_Pro",
                time: "12 min ago",
              },
              {
                type: "info",
                icon: "🔑",
                title: "New license created",
                desc: "Premium tier • 30 days",
                time: "28 min ago",
              },
              {
                type: "success",
                icon: "✓",
                title: "License validated",
                desc: "user_5612 • DesktopTool",
                time: "35 min ago",
              },
            ].map((activity, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: idx < 4 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      activity.type === "success"
                        ? "var(--success-bg)"
                        : activity.type === "warning"
                        ? "var(--warning-bg)"
                        : "var(--info-bg)",
                    color:
                      activity.type === "success"
                        ? "var(--success)"
                        : activity.type === "warning"
                        ? "var(--warning)"
                        : "var(--info)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {activity.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>
                    {activity.title}
                  </div>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  >
                    {activity.desc}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 20 }}>
            Today's Stats
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Validations
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                1,247
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--success)" }}>
                ↑ 12% from yesterday
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Failed Attempts
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700 }}>23</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                ↓ 8% from yesterday
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Revenue
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--success)",
                }}
              >
                $847
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--success)" }}>
                ↑ 23% from yesterday
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Quick Links</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 16,
          }}
        >
          <a
            href="/apps"
            className="btn btnPrimary"
            style={{ textDecoration: "none" }}
          >
            Create New Application
          </a>
          <a
            href="/users"
            className="btn btnGhost"
            style={{ textDecoration: "none" }}
          >
            Manage Users
          </a>
          <a
            href="/logs"
            className="btn btnGhost"
            style={{ textDecoration: "none" }}
          >
            View Activity Logs
          </a>
          <a
            href="/settings"
            className="btn btnGhost"
            style={{ textDecoration: "none" }}
          >
            Configure Settings
          </a>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            localStorage.setItem("onboarding_completed", "true");
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
