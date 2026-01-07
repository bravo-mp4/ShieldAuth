import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// @ts-expect-error - JS module
import { users as usersApi } from "../services/api";
// @ts-expect-error - JSX component
import TopBar from "../components/TopBar";
// @ts-expect-error - JSX component
import StatCard from "../components/StatCard";
// @ts-expect-error - JSX component
import OnboardingWizard from "../components/OnboardingWizard";

interface User {
  id: string;
  username: string;
  email: string;
  expires_at: string;
  created_at: string;
  hwid: string;
  status: "active" | "expired" | "banned";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  

  useEffect(() => {
    loadUsers();
    
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersApi.list();
      setUsers(response.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const active = users.filter((u) => new Date(u.expires_at) > now).length;
    const today = users.filter((u) => {
      const created = new Date(u.created_at);
      return created.toDateString() === now.toDateString();
    }).length;

    return { total: users.length, active, newToday: today };
  }, [users]);

  return (
    <div className="page">
      <TopBar title="Dashboard" subtitle="Overview of your licensing system" />

      {error && (
        <div className="alertError">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)' }}>
        <div style={{ marginBottom: 16, fontWeight: 600, fontSize: '1.1rem' }}>⚡ Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <button 
            className="btn btnPrimary" 
            style={{ padding: '12px 20px', justifyContent: 'flex-start' }}
            onClick={() => navigate('/users')}
          >
            🔑 Create License
          </button>
          <button 
            className="btn btnGhost" 
            style={{ padding: '12px 20px', justifyContent: 'flex-start' }}
            onClick={() => window.open('/api-demo', '_blank')}
          >
            ✓ Test Validation
          </button>
          <button 
            className="btn btnGhost" 
            style={{ padding: '12px 20px', justifyContent: 'flex-start' }}
            onClick={() => navigate('/analytics')}
          >
            📊 View Analytics
          </button>
          <button 
            className="btn btnGhost" 
            style={{ padding: '12px 20px', justifyContent: 'flex-start' }}
            onClick={() => navigate('/docs')}
          >
            📚 SDK Docs
          </button>
        </div>
      </div>

      <div className="grid4" style={{ marginBottom: 24 }}>
        <StatCard
          title="Total Users"
          value={stats.total}
          subtitle="All registered licenses"
        />
        <StatCard
          title="Active Licenses"
          value={stats.active}
          subtitle="Currently valid"
        />
        <StatCard
          title="New Today"
          value={stats.newToday}
          subtitle="Registrations"
          trend={
            stats.newToday > 0
              ? { value: stats.newToday, isPositive: true }
              : undefined
          }
        />
        <div className="card">
          <div className="cardTitle">System Status</div>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "var(--success)",
              marginTop: 8,
            }}
          >
            ● Operational
          </div>
          <div className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
            All systems running
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Recent Activity</h3>
            <button className="btn btnGhost" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { type: 'success', icon: '✓', title: 'License validated', desc: 'user_8473 • GameApp_Pro', time: '2 min ago' },
              { type: 'success', icon: '✓', title: 'License validated', desc: 'user_2941 • DesktopTool', time: '5 min ago' },
              { type: 'warning', icon: '⚠', title: 'Failed validation attempt', desc: 'Invalid HWID • GameApp_Pro', time: '12 min ago' },
              { type: 'info', icon: '🔑', title: 'New license created', desc: 'Premium tier • 30 days', time: '28 min ago' },
              { type: 'success', icon: '✓', title: 'License validated', desc: 'user_5612 • DesktopTool', time: '35 min ago' },
            ].map((activity, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: idx < 4 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: activity.type === 'success' ? 'var(--success-bg)' : 
                               activity.type === 'warning' ? 'var(--warning-bg)' : 'var(--info-bg)',
                  color: activity.type === 'success' ? 'var(--success)' : 
                         activity.type === 'warning' ? 'var(--warning)' : 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0
                }}>
                  {activity.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{activity.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activity.desc}</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>Today's Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Validations</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>1,247</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>↑ 12% from yesterday</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Failed Attempts</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>23</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>↓ 8% from yesterday</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>$847</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>↑ 23% from yesterday</div>
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
            localStorage.setItem('onboarding_completed', 'true');
            setShowOnboarding(false);
          }} 
        />
      )}
    </div>
  );
}
