import { NavLink, Outlet, useNavigate } from "react-router-dom";
// @ts-expect-error - JSX component
import MobileMenu from "./MobileMenu";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear token
    localStorage.removeItem("token");
    // Redirect to login
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/users", label: "Users", icon: "👥" },
    { to: "/applications", label: "Applications", icon: "📱" },
    { to: "/licenses", label: "Licenses", icon: "🎫" },
    { to: "/analytics", label: "Analytics", icon: "📈" },
    { to: "/logs", label: "Logs", icon: "📋" },
    { to: "/api-keys", label: "API Keys", icon: "🔑" },
    { to: "/webhooks", label: "Webhooks", icon: "🔗" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
    { to: "/support", label: "Support", icon: "💬" },
  ];

  return (
    <div
      className="appWrapper"
      style={{ display: "flex", height: "100vh", overflow: "hidden" }}
    >
      {/* Left Sidebar */}
      <aside
        style={{
          width: "260px",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          overflowY: "auto",
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: "32px", paddingLeft: "12px" }}>
          <div className="brandName" style={{ fontSize: "1.3rem" }}>
            ShieldLabs
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            Admin Dashboard
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "sidebarLink sidebarLinkActive" : "sidebarLink"
              }
            >
              <span style={{ fontSize: "1.2rem", marginRight: "12px" }}>
                {link.icon}
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User Menu */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "var(--bg-elevated)",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "2px" }}>Admin</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              admin@shieldlabs.com
            </div>
          </div>
          <button
            className="btn btnGhost"
            onClick={handleLogout}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Bar */}
        <header
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Welcome back, Admin
          </div>
          <MobileMenu links={navLinks} onLogout={handleLogout} />
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            overflow: "auto",
            background: "var(--bg)",
            padding: "32px",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
