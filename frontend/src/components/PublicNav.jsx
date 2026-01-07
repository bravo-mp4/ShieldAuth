import { Link, NavLink } from "react-router-dom";

export default function PublicNav() {
  return (
    <header className="topBar">
      <div className="topBarContent">
        <Link to="/" className="brandLogo">
          <div className="brandName">ShieldLabs</div>
        </Link>
        <nav className="floatingNav">
          <NavLink
            className={({ isActive }) => `navTab ${isActive ? "active" : ""}`}
            to="/features"
          >
            Features
          </NavLink>
          <NavLink
            className={({ isActive }) => `navTab ${isActive ? "active" : ""}`}
            to="/pricing"
          >
            Pricing
          </NavLink>
          <NavLink
            className={({ isActive }) => `navTab ${isActive ? "active" : ""}`}
            to="/use-cases"
          >
            Use Cases
          </NavLink>
          <NavLink
            className={({ isActive }) => `navTab ${isActive ? "active" : ""}`}
            to="/security"
          >
            Security
          </NavLink>
          <NavLink
            className={({ isActive }) => `navTab ${isActive ? "active" : ""}`}
            to="/docs"
          >
            Docs
          </NavLink>
          <NavLink
            className={({ isActive }) => `navTab ${isActive ? "active" : ""}`}
            to="/status"
          >
            Status
          </NavLink>
          <NavLink
            className={({ isActive }) => `navTab ${isActive ? "active" : ""}`}
            to="/blog"
          >
            Blog
          </NavLink>
        </nav>
        <div className="topBarActions">
          <Link to="/login" className="btn btnGhost">
            Login
          </Link>
          <Link to="/signup" className="btn btnPrimary">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
