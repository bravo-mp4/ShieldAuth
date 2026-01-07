import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function MobileMenu({ links, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="btn btnGhost mobileMenuBtn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "none",
          padding: "8px 12px",
          fontSize: "1.2rem",
        }}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            zIndex: 999,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "280px",
              height: "100vh",
              background: "var(--bg-card)",
              borderLeft: "1px solid var(--border)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              animation: "slideInRight 0.3s ease",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              style={{
                alignSelf: "flex-end",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "8px",
                marginBottom: "16px",
              }}
            >
              ✕
            </button>

            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `navTab ${isActive ? "active" : ""}`
                }
                onClick={() => setIsOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </NavLink>
            ))}

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="btn btnDanger"
              style={{ marginTop: "24px", width: "100%" }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
