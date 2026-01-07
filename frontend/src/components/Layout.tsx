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
    { to: "/dashboard", label: "Dashboard" },
    { to: "/analytics", label: "Analytics" },
    { to: "/apps", label: "Applications" },
    { to: "/api-keys", label: "API Keys" },
    { to: "/webhooks", label: "Webhooks" },
    { to: "/support", label: "Support" },
    { to: "/users", label: "Users" },
    { to: "/logs", label: "Logs" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <div className="appWrapper">
      <header className="topBar">
        <div className="topBarContent">
          <div className="brandLogo">
            <div className="brandName">ShieldLabs</div>
          </div>

          <nav className="floatingNav">
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/dashboard"
            >
              Dashboard
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/analytics"
            >
              Analytics
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/apps"
            >
              Applications
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/api-keys"
            >
              API Keys
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/webhooks"
            >
              Webhooks
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/support"
            >
              Support
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/users"
            >
              Users
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/logs"
            >
              Logs
            </NavLink>
            <NavLink
              className={({ isActive }: { isActive: boolean }) =>
                `navTab ${isActive ? "active" : ""}`
              }
              to="/settings"
            >
              Settings
            </NavLink>
          </nav>

          <div className="topBarActions">
            <MobileMenu links={navLinks} onLogout={handleLogout} />
            <div className="userMenu">
              <span className="userName">Admin</span>
              <button
                className="btn btnGhost"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mainContent">
        <Outlet />
      </main>
    </div>
  );
}
