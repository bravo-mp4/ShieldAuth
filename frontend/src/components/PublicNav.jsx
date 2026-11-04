import { Link, NavLink } from "react-router-dom";

const navClass = ({ isActive }) => `navTab ${isActive ? "active" : ""}`;

export default function PublicNav() {
  return (
    <header className="topBar">
      <div className="topBarContent">
        <Link to="/" className="brandLogo">
          <div className="brandName">ShieldAuth</div>
        </Link>
        <nav className="floatingNav">
          <NavLink className={navClass} to="/docs">
            Docs
          </NavLink>
          <NavLink className={navClass} to="/security">
            Security
          </NavLink>
          <a className="navTab" href="https://github.com/bravo-mp4/ShieldAuth" target="_blank" rel="noreferrer">
            GitHub
          </a>
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
