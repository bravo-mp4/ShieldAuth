import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.9rem",
        }}
      >
        <div className="muted">ShieldAuth: a portfolio project by MF.</div>
        <div style={{ display: "flex", gap: 24 }}>
          <Link to="/docs" className="muted">Docs</Link>
          <Link to="/security" className="muted">Security</Link>
          <a href="https://github.com/bravo-mp4/ShieldAuth" className="muted" target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
